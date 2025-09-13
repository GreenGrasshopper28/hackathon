import os
import io
import json
import math
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller, grangercausalitytests

# Gemini SDK
import google.generativeai as genai

# === CONFIG ===
DATA_DIR = "data"
MODEL_DIR = "models"
PLOTS_DIR = "static/plots"
DATA_PATH = os.path.join(DATA_DIR, "data.xlsx")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if GEMINI_API_KEY is None:
    print("⚠️ Warning: GOOGLE_API_KEY not set. /chat endpoint will fail.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)

app = FastAPI(title="Excel Data Scientist Assistant (Gemini)")

# serve static plots
app.mount("/static", StaticFiles(directory="static"), name="static")

# cache
_df: Optional[pd.DataFrame] = None
_schema_info: Optional[Dict[str, Any]] = None


# ---------- UTILITIES ----------
def _load_df() -> pd.DataFrame:
    global _df, _schema_info
    if _df is None:
        if not os.path.exists(DATA_PATH):
            raise FileNotFoundError("No dataset found. Upload one via /upload.")
        _df = pd.read_excel(DATA_PATH)
        _schema_info = _infer_schema(_df)
    return _df


def _reset_cache():
    global _df, _schema_info
    _df = None
    _schema_info = None


def _infer_schema(df: pd.DataFrame) -> Dict[str, Any]:
    schema = {}
    for c in df.columns:
        col = df[c]
        dtype = str(col.dtype)
        missing = int(col.isna().sum())
        sample = col.dropna().astype(str).head(3).tolist()
        schema[c] = {"dtype": dtype, "missing": missing, "example": sample}
    return schema


def _save_plot(fig, name: str) -> str:
    path = os.path.join(PLOTS_DIR, name)
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return f"/static/plots/{name}"


def _safe_filename(prefix: str) -> str:
    import time, hashlib
    h = hashlib.sha1(str(time.time()).encode()).hexdigest()[:8]
    return f"{prefix}_{h}.png"


# ---------- EDA ----------
def run_basic_eda(df: pd.DataFrame, n_top=5) -> Dict[str, Any]:
    out = {}
    out["rows"] = len(df)
    out["columns"] = list(df.columns)
    out["schema"] = _infer_schema(df)

    numeric = df.select_dtypes(include=[np.number])
    if not numeric.empty:
        out["numeric_summary"] = numeric.describe().to_dict()
        corr = numeric.corr()
        out["top_correlations"] = []
        corr_unstack = corr.abs().where(~np.eye(corr.shape[0], dtype=bool)).unstack()
        corr_unstack = corr_unstack.dropna().sort_values(ascending=False)
        for (a, b), val in corr_unstack.head(n_top).items():
            out["top_correlations"].append(
                {"pair": (a, b), "abs_corr": float(val), "signed_corr": float(corr.loc[a, b])}
            )
    else:
        out["numeric_summary"] = {}

    cat = df.select_dtypes(include=["object", "category"])
    top_values = {}
    for c in cat.columns:
        top_values[c] = df[c].dropna().astype(str).value_counts().head(5).to_dict()
    out["top_values"] = top_values

    out["missing"] = df.isna().sum().to_dict()
    return out


def make_histograms(df: pd.DataFrame, max_cols=6) -> List[str]:
    imgs = []
    numeric = df.select_dtypes(include=[np.number])
    cols = numeric.columns.tolist()[:max_cols]
    for c in cols:
        fig = plt.figure(figsize=(6, 4))
        sns.histplot(df[c].dropna(), kde=True)
        plt.title(f"Distribution: {c}")
        filename = _safe_filename(f"hist_{c}")
        imgs.append(_save_plot(fig, filename))
    return imgs


def make_boxplots(df: pd.DataFrame, max_cols=6) -> List[str]:
    imgs = []
    numeric = df.select_dtypes(include=[np.number])
    cols = numeric.columns.tolist()[:max_cols]
    for c in cols:
        fig = plt.figure(figsize=(6, 4))
        sns.boxplot(x=df[c].dropna())
        plt.title(f"Boxplot: {c}")
        filename = _safe_filename(f"box_{c}")
        imgs.append(_save_plot(fig, filename))
    return imgs


def make_correlation_heatmap(df: pd.DataFrame) -> Optional[str]:
    numeric = df.select_dtypes(include=[np.number])
    if numeric.shape[1] < 2:
        return None
    corr = numeric.corr()
    fig = plt.figure(figsize=(8, 6))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="vlag")
    plt.title("Correlation matrix")
    filename = _safe_filename("corr")
    return _save_plot(fig, filename)


# ---------- TIME SERIES ----------
def run_time_series_analysis(
    df: pd.DataFrame, date_col: str, value_col: str, freq: Optional[str] = None, forecast_periods: int = 12
) -> Dict[str, Any]:
    """
    Robust time-series analysis helper.
    - Tries vectorized parsing with infer_datetime_format
    - If many NaT results, tries a list of common formats
    - If values are integers (epoch), converts accordingly
    - Falls back to per-value dateutil parse (slower)
    Returns: dict with forecast + 'parse_info' describing which parsing strategy succeeded.
    """
    if date_col not in df.columns or value_col not in df.columns:
        raise ValueError("Columns not found in dataset")

    ts = df[[date_col, value_col]].copy()
    # Drop rows where value_col is NaN early
    ts = ts.dropna(subset=[value_col]).copy()

    # 1) Try quick vectorized parse with infer_datetime_format=True
    parse_info = {"method": None, "details": None}
    try:
        parsed = pd.to_datetime(ts[date_col], errors="coerce", infer_datetime_format=True, utc=False)
        n_parsed = parsed.notna().sum()
        total = len(parsed)
        if n_parsed >= max(1, int(0.8 * total)):  # >=80% parsed successfully
            ts[date_col] = parsed
            parse_info["method"] = "pandas_infer"
            parse_info["details"] = f"parsed {n_parsed}/{total} rows with infer_datetime_format"
        else:
            # keep parsed but attempt targeted formats next
            ts["_parsed_temp"] = parsed
            parse_info["method"] = "partial_infer"
            parse_info["details"] = f"only {n_parsed}/{total} parsed with infer; will try common formats"
    except Exception as e:
        parse_info["method"] = "pandas_infer_failed"
        parse_info["details"] = str(e)

    # 2) If too many NaT, try a list of common formats
    if parse_info["method"] in ("partial_infer", "pandas_infer_failed"):
        common_formats = [
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%Y/%m/%d",
            "%Y-%m-%d %H:%M:%S",
            "%d-%m-%Y %H:%M:%S",
            "%m/%d/%Y %H:%M:%S",
        ]
        success = False
        original = ts[date_col].astype(str).fillna("").tolist()
        for fmt in common_formats:
            try:
                parsed = pd.to_datetime(ts[date_col], format=fmt, errors="coerce")
                n_parsed = parsed.notna().sum()
                if n_parsed >= max(1, int(0.8 * len(parsed))):
                    ts[date_col] = parsed
                    parse_info["method"] = "pandas_format"
                    parse_info["details"] = f"format '{fmt}' parsed {n_parsed}/{len(parsed)} rows"
                    success = True
                    break
            except Exception:
                continue
        if not success:
            # 3) try epoch integers (seconds or ms)
            # detect if most values are numeric-like
            numeric_like = pd.to_numeric(ts[date_col], errors="coerce")
            n_numeric = numeric_like.notna().sum()
            if n_numeric >= max(1, int(0.8 * len(numeric_like))):
                # assume epoch seconds if values look like ~10-digits, ms if 13 digits
                sample = numeric_like.dropna().astype(int).astype(str)
                if not sample.empty:
                    median_len = int(sample.str.len().median())
                    try:
                        if median_len >= 13:
                            ts[date_col] = pd.to_datetime(numeric_like, unit="ms", errors="coerce")
                            parse_info["method"] = "epoch_ms"
                            parse_info["details"] = f"interpreted as epoch ms ({n_numeric}/{len(numeric_like)} numeric)"
                        else:
                            ts[date_col] = pd.to_datetime(numeric_like, unit="s", errors="coerce")
                            parse_info["method"] = "epoch_s"
                            parse_info["details"] = f"interpreted as epoch s ({n_numeric}/{len(numeric_like)} numeric)"
                    except Exception:
                        pass

        # 4) If still many NaT, fall back to per-value dateutil parsing (slow)
        if parse_info["method"] in ("partial_infer", "pandas_infer_failed") or ts[date_col].isna().sum() > 0:
            parsed_list = []
            from dateutil import parser as _parser

            parsed_count = 0
            for val in ts[date_col].astype(str).tolist():
                try:
                    p = _parser.parse(val)
                    parsed_list.append(p)
                    parsed_count += 1
                except Exception:
                    parsed_list.append(pd.NaT)
            parsed_series = pd.to_datetime(pd.Series(parsed_list), errors="coerce")
            if parsed_series.notna().sum() > 0:
                ts[date_col] = parsed_series
                parse_info["method"] = "dateutil_per_value"
                parse_info["details"] = f"dateutil parsed {parsed_series.notna().sum()}/{len(parsed_series)} rows"
            else:
                # nothing worked reliably
                parse_info["method"] = parse_info.get("method", "failed_all")
                parse_info["details"] = parse_info.get("details", "No reliable parsing succeeded; parsed values will be coerced and some rows dropped")

    # Final: drop rows with NaT dates
    ts = ts.dropna(subset=[date_col]).copy()
    if ts.empty:
        raise ValueError("After parsing, no valid dates available. Please supply a date column with parseable dates or provide a date format.")

    # Continue with original logic: sort, set index, infer freq if needed
    ts = ts.sort_values(date_col).set_index(date_col)

    if freq is None:
        try:
            inferred = pd.infer_freq(ts.index)
            freq = inferred if inferred is not None else "D"
        except Exception:
            freq = "D"

    ts_resampled = ts[value_col].resample(freq).mean().interpolate()

    # Stationarity (ADF)
    adf_res = {}
    try:
        res_adf = adfuller(ts_resampled.dropna())
        adf_res = {"statistic": float(res_adf[0]), "pvalue": float(res_adf[1])}
    except Exception as e:
        adf_res = {"error": str(e)}

    # Decomposition (try-except)
    decomposition_plot_url = None
    try:
        decomp = sm.tsa.seasonal_decompose(ts_resampled, model="additive", period=max(2, int(len(ts_resampled) / 6)))
        fig = decomp.plot()
        fig.set_size_inches(10, 8)
        filename = _safe_filename("decomp")
        decomposition_plot_url = _save_plot(fig, filename)
    except Exception:
        decomposition_plot_url = None

    # Forecast (try pmdarima, else statsmodels ARIMA)
    forecast = None
    forecast_plot_url = None
    try:
        import pmdarima as pm

        model = pm.auto_arima(ts_resampled.dropna(), seasonal=False, suppress_warnings=True, error_action="ignore")
        n = int(forecast_periods)
        fcast, conf = model.predict(n_periods=n, return_conf_int=True)
        idx = pd.date_range(start=ts_resampled.index[-1], periods=n + 1, freq=freq)[1:]
        forecast_df = pd.DataFrame({"ds": idx, "yhat": fcast, "yhat_lower": conf[:, 0], "yhat_upper": conf[:, 1]}).set_index("ds")
        forecast = forecast_df.reset_index().to_dict(orient="records")
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.plot(ts_resampled.index, ts_resampled.values, label="history")
        ax.plot(forecast_df.index, forecast_df["yhat"], label="forecast")
        ax.fill_between(forecast_df.index, forecast_df["yhat_lower"], forecast_df["yhat_upper"], alpha=0.2)
        ax.legend()
        plt.title(f"Forecast for {value_col}")
        filename = _safe_filename("forecast")
        forecast_plot_url = _save_plot(fig, filename)
    except Exception:
        try:
            mod = sm.tsa.ARIMA(ts_resampled.dropna(), order=(1, 1, 1))
            res = mod.fit()
            n = int(forecast_periods)
            pred = res.get_forecast(steps=n)
            pred_df = pred.summary_frame()
            idx = pd.date_range(start=ts_resampled.index[-1], periods=n + 1, freq=freq)[1:]
            forecast_df = pd.DataFrame({"ds": idx, "yhat": pred_df["mean"].values, "yhat_lower": pred_df["mean_ci_lower"].values, "yhat_upper": pred_df["mean_ci_upper"].values}).set_index("ds")
            forecast = forecast_df.reset_index().to_dict(orient="records")
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.plot(ts_resampled.index, ts_resampled.values, label="history")
            ax.plot(forecast_df.index, forecast_df["yhat"], label="forecast")
            ax.fill_between(forecast_df.index, forecast_df["yhat_lower"], forecast_df["yhat_upper"], alpha=0.2)
            ax.legend()
            plt.title(f"Forecast for {value_col}")
            filename = _safe_filename("forecast")
            forecast_plot_url = _save_plot(fig, filename)
        except Exception as ee:
            forecast = {"error": str(ee)}
            forecast_plot_url = None

    return {
        "n_obs": int(len(ts_resampled)),
        "freq": freq,
        "adf": adf_res,
        "decomposition_plot": decomposition_plot_url,
        "forecast_plot": forecast_plot_url,
        "forecast": forecast,
        "parse_info": parse_info,
    }


# ---------- CAUSAL ----------
def run_causal_checks(df: pd.DataFrame, x_col: str, y_col: str, maxlag=4) -> Dict[str, Any]:
    res = {}
    if x_col not in df.columns or y_col not in df.columns:
        raise ValueError("Columns not found")

    pair = df[[x_col, y_col]].dropna()
    pair[x_col] = pd.to_numeric(pair[x_col], errors="coerce")
    pair[y_col] = pd.to_numeric(pair[y_col], errors="coerce")
    pair = pair.dropna()

    if not pair.empty:
        corr = pair[x_col].corr(pair[y_col])
        res["correlation"] = float(corr) if not math.isnan(corr) else None
    else:
        res["correlation"] = None

    try:
        gc_res = grangercausalitytests(pair[[y_col, x_col]], maxlag=maxlag, verbose=False)
        res["granger_pvalues"] = {lag: float(gc_res[lag][0]["ssr_ftest"][1]) for lag in gc_res.keys()}
    except Exception as e:
        res["granger_error"] = str(e)

    return res


# ---------- LLM ----------
def call_llm_system(prompt: str, system_prompt: Optional[str] = None, model: Optional[str] = None, max_tokens: int = 700) -> str:
    if GEMINI_API_KEY is None:
        raise RuntimeError("GOOGLE_API_KEY not set in environment")

    model = model or GEMINI_MODEL
    gen_model = genai.GenerativeModel(model)
    full_prompt = ""
    if system_prompt:
        full_prompt += f"System: {system_prompt}\n\n"
    full_prompt += f"User: {prompt}"

    response = gen_model.generate_content(
        full_prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=0.2
        )
    )
    return response.text if hasattr(response, "text") else str(response)


# ---------- MODELS ----------
class ChatRequest(BaseModel):
    message: str
    tools: Optional[List[str]] = None
    tools_args: Optional[Dict[str, Any]] = None


class TSRequest(BaseModel):
    date_column: str
    value_column: str
    freq: Optional[str] = None
    forecast_periods: Optional[int] = 12


class CausalRequest(BaseModel):
    x_col: str
    y_col: str
    maxlag: Optional[int] = 4


# ---------- ENDPOINTS ----------
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    contents = await file.read()
    with open(DATA_PATH, "wb") as f:
        f.write(contents)
    _reset_cache()
    df = _load_df()
    return {"status": "ok", "rows": len(df), "columns": list(df.columns)}


@app.get("/schema")
def schema():
    df = _load_df()
    return {"rows": len(df), "columns": list(df.columns), "schema": _schema_info}


@app.post("/eda")
def eda():
    df = _load_df()
    summary = run_basic_eda(df)
    summary["plots"] = {
        "histograms": make_histograms(df),
        "boxplots": make_boxplots(df),
        "correlation": make_correlation_heatmap(df),
    }
    return summary


@app.post("/timeseries")
def timeseries(req: TSRequest):
    df = _load_df()
    return run_time_series_analysis(df, req.date_column, req.value_column, freq=req.freq, forecast_periods=req.forecast_periods)


@app.post("/causal")
def causal(req: CausalRequest):
    df = _load_df()
    return run_causal_checks(df, req.x_col, req.y_col, maxlag=req.maxlag)


@app.post("/agent/run")
def agent_run(body: Dict[str, Any] = Body(...)):
    df = _load_df()
    workflow = body.get("workflow", [])
    params = body.get("params", {})
    log, artifacts = [], {}

    for step in workflow:
        if step == "eda":
            artifacts["eda"] = run_basic_eda(df)
            log.append("EDA complete")
        elif step == "detect_top_features":
            target = params.get("target")
            if target and target in df.columns:
                numeric = df.select_dtypes(include=[np.number])
                corrs = numeric.corr()[target].abs().sort_values(ascending=False).drop(target)
                artifacts["top_features"] = corrs.head(5).to_dict()
                log.append("Top features detected")
        elif step == "propose_ab_test":
            feature = params.get("feature")
            target = params.get("target")
            artifacts["ab_proposal"] = {
                "hypothesis": f"Increasing {feature} will increase {target}",
                "design": "Randomize into control/treatment groups",
            }
            log.append("AB test proposal created")
        elif step == "simulate_uplift":
            target = params.get("target")
            feature = params.get("feature")
            baseline = df[target].mean()
            uplift = baseline * 1.1
            artifacts["uplift"] = {"baseline": baseline, "treatment": uplift}
            log.append("Uplift simulated")

    return {"log": log, "artifacts": artifacts}


@app.post("/chat")
def chat(req: ChatRequest):
    df = _load_df()
    tool_outputs = {}

    if req.tools:
        for t in req.tools:
            if t == "eda":
                tool_outputs["eda"] = run_basic_eda(df)
            elif t == "timeseries" and req.tools_args:
                ts_args = req.tools_args.get("timeseries", {})
                tool_outputs["timeseries"] = run_time_series_analysis(df, ts_args["date_column"], ts_args["value_column"])
            elif t == "causal" and req.tools_args:
                c = req.tools_args.get("causal", {})
                tool_outputs["causal"] = run_causal_checks(df, c["x_col"], c["y_col"])

    context = {"columns": list(df.columns), "n_rows": len(df), "tools": list(tool_outputs.keys())}

    system_prompt = (
        "You are an expert data scientist. Use only the provided dataset context and tool outputs. "
        "Give business insights and suggest experiments (A/B tests) where relevant."
    )
    user_prompt = f"User: {req.message}\nContext: {json.dumps(context, indent=2)}\nTool outputs: {json.dumps(tool_outputs, indent=2)}"

    llm_answer = call_llm_system(user_prompt, system_prompt=system_prompt)
    return {"answer": llm_answer, "tools": tool_outputs, "context": context}
