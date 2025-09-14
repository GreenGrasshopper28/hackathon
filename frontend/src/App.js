// /* npm install framer-motion */
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// /*
//  Enhanced UI App.js
//  - Uses framer-motion for animations (page enter, buttons, toasts)
//  - Custom toasts and progress bars
//  - Royal blue & white theme with subtle shadows and rounded UI
//  - Self-contained helper components (Toast, Loader, ProgressBar)
// */

// const THEME = {
//   primary: "#1e40af", // royal-ish blue
//   primaryLight: "#3b82f6",
//   bg: "#ffffff",
//   surface: "#f8fafc",
//   accent: "#60a5fa",
//   text: "#0f172a",
// };

// function useToasts() {
//   const [toasts, setToasts] = useState([]);
//   function push(message, type = "info", ttl = 4000) {
//     const id = Math.random().toString(36).slice(2, 9);
//     setToasts((t) => [...t, { id, message, type }]);
//     setTimeout(() => dismiss(id), ttl);
//   }
//   function dismiss(id) {
//     setToasts((t) => t.filter((x) => x.id !== id));
//   }
//   return { toasts, push, dismiss };
// }

// function Toasts({ toasts, dismiss }) {
//   return (
//     <div style={{ position: "fixed", right: 20, top: 20, zIndex: 1200 }}>
//       <AnimatePresence initial={false}>
//         {toasts.map((t) => (
//           <motion.div
//             key={t.id}
//             initial={{ opacity: 0, x: 40, scale: 0.95 }}
//             animate={{ opacity: 1, x: 0, scale: 1 }}
//             exit={{ opacity: 0, x: 40, scale: 0.95 }}
//             transition={{ duration: 0.35 }}
//             style={{
//               marginBottom: 10,
//               background: THEME.bg,
//               color: THEME.text,
//               padding: "10px 14px",
//               borderRadius: 10,
//               boxShadow: "0 6px 18px rgba(16,24,40,0.08)",
//               minWidth: 220,
//               borderLeft: `4px solid ${t.type === "error" ? "#ef4444" : THEME.primary}`,
//               fontSize: 14,
//             }}
//             onClick={() => dismiss(t.id)}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.type === "error" ? "Error" : "Info"}</div>
//             <div style={{ fontSize: 13, color: "#475569" }}>{t.message}</div>
//           </motion.div>
//         ))}
//       </AnimatePresence>
//     </div>
//   );
// }

// function Loader({ text = "Loading", small = false }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//       <motion.div
//         animate={{ rotate: 360 }}
//         transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
//         style={{
//           width: small ? 18 : 26,
//           height: small ? 18 : 26,
//           borderRadius: 6,
//           border: `3px solid ${THEME.primary}`,
//           borderTopColor: "transparent",
//         }}
//       />
//       <div style={{ fontSize: small ? 13 : 15, color: "#475569" }}>{text}</div>
//     </div>
//   );
// }

// function ProgressBar({ progress = 0, label = "" }) {
//   return (
//     <div style={{ width: "100%", marginTop: 10 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
//         <div style={{ fontSize: 13, color: "#334155" }}>{label}</div>
//         <div style={{ fontSize: 13, color: "#334155" }}>{Math.round(progress)}%</div>
//       </div>
//       <div style={{ height: 10, background: "#e6eefc", borderRadius: 999 }}>
//         <motion.div
//           initial={{ width: 0 }}
//           animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
//           transition={{ duration: 0.8, ease: "easeOut" }}
//           style={{
//             height: 10,
//             borderRadius: 999,
//             background: `linear-gradient(90deg, ${THEME.primaryLight}, ${THEME.primary})`,
//             boxShadow: "0 6px 20px rgba(59,130,246,0.18)",
//           }}
//         />
//       </div>
//     </div>
//   );
// }

// function Btn({ children, onClick, variant = "primary", style = {}, disabled }) {
//   const base = {
//     padding: "10px 14px",
//     borderRadius: 10,
//     border: "none",
//     cursor: disabled ? "not-allowed" : "pointer",
//     fontWeight: 600,
//     boxShadow: "0 8px 24px rgba(16,24,40,0.06)",
//   };
//   if (variant === "primary") {
//     return (
//       <motion.button
//         whileHover={{ scale: disabled ? 1 : 1.03 }}
//         whileTap={{ scale: disabled ? 1 : 0.98 }}
//         onClick={onClick}
//         style={{
//           ...base,
//           background: `linear-gradient(180deg, ${THEME.primaryLight}, ${THEME.primary})`,
//           color: THEME.bg,
//           ...style,
//         }}
//         disabled={disabled}
//       >
//         {children}
//       </motion.button>
//     );
//   } else {
//     return (
//       <motion.button
//         whileHover={{ scale: disabled ? 1 : 1.02 }}
//         whileTap={{ scale: disabled ? 1 : 0.98 }}
//         onClick={onClick}
//         style={{
//           ...base,
//           background: "white",
//           color: THEME.primary,
//           border: `1px solid ${THEME.primary}`,
//           ...style,
//         }}
//         disabled={disabled}
//       >
//         {children}
//       </motion.button>
//     );
//   }
// }

// export default function App() {
//   // core states
//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [schema, setSchema] = useState(null);

//   // EDA/Plots
//   const [edaLoading, setEdaLoading] = useState(false);
//   const [plots, setPlots] = useState({ histograms: [], boxplots: [], correlation: null });
//   const [edaProgress, setEdaProgress] = useState(0);

//   // TS
//   const [tsCols, setTsCols] = useState({ date: "", value: "" });
//   const [tsResult, setTsResult] = useState(null);
//   const [tsRunning, setTsRunning] = useState(false);
//   const [tsProgress, setTsProgress] = useState(0);

//   // Chat
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatInput, setChatInput] = useState("");
//   const [chatLoading, setChatLoading] = useState(false);
//   const [chatProgress, setChatProgress] = useState(0);

//   // Agent
//   const [agentRunning, setAgentRunning] = useState(false);
//   const [agentLog, setAgentLog] = useState([]);
//   const [agentArtifacts, setAgentArtifacts] = useState(null);

//   // toasts
//   const { toasts, push, dismiss } = (() => {
//     // custom hook wrapper to use inside component
//     const [toasts, setToasts] = React.useState([]);
//     function push(message, type = "info", ttl = 4200) {
//       const id = Math.random().toString(36).slice(2, 9);
//       setToasts((t) => [...t, { id, message, type }]);
//       setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
//     }
//     function dismiss(id) {
//       setToasts((t) => t.filter((x) => x.id !== id));
//     }
//     return { toasts, push, dismiss };
//   })();

//   const chatBoxRef = useRef();

//   useEffect(() => {
//     fetchSchema();
//     // page enter animation (scroll to top)
//     window.scrollTo({ top: 0, behavior: "smooth" });
//     // eslint-disable-next-line
//   }, []);

//   async function fetchSchema() {
//     try {
//       const res = await fetch("/schema");
//       if (!res.ok) {
//         setSchema(null);
//         return;
//       }
//       const j = await res.json();
//       setSchema(j);
//     } catch (e) {
//       setSchema(null);
//     }
//   }

//   async function handleUpload(e) {
//     e.preventDefault();
//     if (!file) {
//       push("Select an Excel file first.", "error");
//       return;
//     }
//     setUploading(true);
//     push("Uploading file...", "info");
//     try {
//       const fd = new FormData();
//       fd.append("file", file);
//       const res = await fetch("/upload", { method: "POST", body: fd });
//       // robust parsing
//       let j;
//       try {
//         j = await res.json();
//       } catch (err) {
//         const txt = await res.text();
//         throw new Error(txt || "Upload failed");
//       }
//       if (!res.ok) throw new Error(j.detail || "Upload error");
//       setSchema({ rows: j.rows, columns: j.columns });
//       push("File uploaded successfully!", "info");
//     } catch (err) {
//       console.error(err);
//       push("Upload failed: " + (err.message || err), "error");
//     } finally {
//       setUploading(false);
//     }
//   }

//   // Simulate progress for EDA to make UX feel responsive (backend still does work)
//   function simulateProgress(setter, duration = 2000) {
//     let start = Date.now();
//     const int = setInterval(() => {
//       const pct = Math.min(98, ((Date.now() - start) / duration) * 100);
//       setter(pct);
//       if (pct >= 98) {
//         clearInterval(int);
//       }
//     }, 120);
//     return int;
//   }

//   async function runEda() {
//     setEdaLoading(true);
//     setEdaProgress(0);
//     push("Starting EDA...", "info");
//     const progInt = simulateProgress(setEdaProgress, 2000);
//     try {
//       const res = await fetch("/eda", { method: "POST" });
//       let j;
//       try {
//         j = await res.json();
//       } catch (err) {
//         const txt = await res.text();
//         throw new Error(txt || "EDA failed");
//       }
//       if (!res.ok) throw new Error(j.detail || "EDA error");
//       // done
//       clearInterval(progInt);
//       setEdaProgress(100);
//       setTimeout(() => setEdaProgress(0), 700);
//       setPlots(j.plots || { histograms: [], boxplots: [], correlation: null });
//       setEdaLoading(false);
//       push("EDA completed", "info");
//     } catch (err) {
//       clearInterval(progInt);
//       setEdaLoading(false);
//       setEdaProgress(0);
//       push("EDA failed: " + (err.message || err), "error");
//     }
//   }

//   async function runTimeSeries() {
//     if (!tsCols.date || !tsCols.value) {
//       push("Pick date and value columns for time series.", "error");
//       return;
//     }
//     setTsRunning(true);
//     setTsProgress(0);
//     push("Starting time-series analysis...", "info");
//     const intv = simulateProgress(setTsProgress, 2200);
//     try {
//       const body = { date_column: tsCols.date, value_column: tsCols.value, freq: null, forecast_periods: 12 };
//       const res = await fetch("/timeseries", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });
//       let j;
//       try {
//         j = await res.json();
//       } catch (err) {
//         const txt = await res.text();
//         throw new Error(txt || "TS failed");
//       }
//       if (!res.ok) throw new Error(j.detail || "TS error");
//       clearInterval(intv);
//       setTsProgress(100);
//       setTimeout(() => setTsProgress(0), 700);
//       setTsResult(j);
//       setTsRunning(false);
//       push("Time-series analysis complete", "info");
//     } catch (err) {
//       clearInterval(intv);
//       setTsProgress(0);
//       setTsRunning(false);
//       push("Time-series failed: " + (err.message || err), "error");
//     }
//   }

//   async function sendChat(withTools = ["eda"]) {
//     if (!chatInput || chatInput.trim() === "") {
//       push("Write a message to ask the assistant.", "error");
//       return;
//     }
//     const text = chatInput.trim();
//     setChatMessages((p) => [...p, { role: "user", text }]);
//     setChatInput("");
//     setChatLoading(true);
//     setChatProgress(0);
//     push("Asking the assistant...", "info");
//     const intv = simulateProgress(setChatProgress, 1800);
//     try {
//       const payload = { message: text };
//       if (withTools) payload.tools = withTools;
//       const res = await fetch("/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       let j;
//       try {
//         j = await res.json();
//       } catch (err) {
//         const txt = await res.text();
//         throw new Error(txt || "Chat failed");
//       }
//       if (!res.ok) throw new Error(j.detail || "Chat error");
//       clearInterval(intv);
//       setChatProgress(100);
//       setTimeout(() => setChatProgress(0), 300);
//       setChatMessages((p) => [...p, { role: "assistant", text: j.answer }]);
//       // if LLM included timeseries output, attach
//       if (j.tools && j.tools.timeseries) {
//         setTsResult(j.tools.timeseries);
//       }
//       push("Assistant replied", "info");
//     } catch (err) {
//       clearInterval(intv);
//       setChatProgress(0);
//       push("Chat failed: " + (err.message || err), "error");
//       setChatMessages((p) => [...p, { role: "assistant", text: "Error: " + (err.message || err) }]);
//     } finally {
//       setChatLoading(false);
//       if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
//     }
//   }

//   async function runAgentWorkflow() {
//     if (!schema) {
//       push("Upload dataset first.", "error");
//       return;
//     }
//     setAgentRunning(true);
//     setAgentLog([]);
//     setAgentArtifacts(null);
//     push("Agent workflow started", "info");
//     try {
//       const body = { workflow: ["eda", "detect_top_features", "propose_ab_test", "simulate_uplift"], params: { target: "sales", feature: "ad_spend" } };
//       const res = await fetch("/agent/run", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });
//       let j;
//       try {
//         j = await res.json();
//       } catch (err) {
//         const txt = await res.text();
//         throw new Error(txt || "Agent failed");
//       }
//       if (!res.ok) throw new Error(j.detail || "Agent error");
//       setAgentLog(j.log || []);
//       setAgentArtifacts(j.artifacts || null);
//       // If agent returns EDA, call EDA endpoint to produce plots; else show artifacts
//       if (j.artifacts && j.artifacts.eda) {
//         // refresh plots via EDA endpoint
//         await runEda();
//       }
//       push("Agent finished", "info");
//     } catch (err) {
//       push("Agent failed: " + (err.message || err), "error");
//     } finally {
//       setAgentRunning(false);
//     }
//   }

//   // small helper: safe display path
//   const PlotImage = ({ src, alt }) => {
//     if (!src) return null;
//     const url = src.startsWith("http") ? src : src;
//     return <img src={url} alt={alt || "plot"} style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 10, boxShadow: "0 10px 30px rgba(2,6,23,0.06)" }} />;
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6 }}
//       style={{ background: THEME.surface, minHeight: "100vh", padding: 24 }}
//     >
//       <div style={{ maxWidth: 1100, margin: "0 auto", background: THEME.bg, borderRadius: 12, padding: 22, boxShadow: "0 10px 30px rgba(2,6,23,0.04)" }}>
//         {/* Header */}
//         <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
//           <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.55 }}>
//             <h1 style={{ margin: 0, color: THEME.primary }}>Data Scientist Assistant</h1>
//             <div style={{ color: "#64748b", marginTop: 6 }}>Upload Excel → Ask insights → Run time-series & agent workflows</div>
//           </motion.div>

//           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.55 }}>
//             <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//               <div style={{ fontSize: 13, color: "#475569" }}>Theme</div>
//               <div style={{ width: 36, height: 36, borderRadius: 10, background: THEME.primary }} />
//             </div>
//           </motion.div>
//         </header>

//         {/* Upload area */}
//         <section style={{ marginBottom: 18 }}>
//           <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//             <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ flex: 1 }} />
//             <Btn variant="primary" onClick={handleUpload} disabled={uploading}>
//               {uploading ? <Loader text="Uploading..." small /> : "Upload"}
//             </Btn>
//             <Btn variant="secondary" onClick={fetchSchema}>Refresh Schema</Btn>
//           </div>
//           <div style={{ marginTop: 10, color: "#475569", fontSize: 14 }}>
//             {schema ? <>Rows: <strong>{schema.rows}</strong> — Columns: <strong>{schema.columns?.join(", ")}</strong></> : "No dataset loaded"}
//           </div>
//         </section>

//         {/* EDA */}
//         <section style={{ marginBottom: 18 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <h3 style={{ margin: 0 }}>Exploratory Data Analysis</h3>
//             <div style={{ display: "flex", gap: 8 }}>
//               <Btn onClick={runEda} disabled={edaLoading}>{edaLoading ? <Loader text="Running EDA..." small /> : "Run EDA"}</Btn>
//               <Btn variant="secondary" onClick={() => { setPlots({ histograms: [], boxplots: [], correlation: null }); }}>Clear</Btn>
//             </div>
//           </div>

//           <div style={{ marginTop: 10 }}>
//             <ProgressBar progress={edaProgress} label={edaLoading ? "EDA progress" : "Idle"} />
//           </div>

//           <div style={{ marginTop: 12 }}>
//             {plots.histograms && plots.histograms.length > 0 && (
//               <div>
//                 <h4 style={{ marginBottom: 8 }}>Histograms</h4>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
//                   {plots.histograms.map((p, idx) => <PlotImage key={idx} src={p} alt={`hist-${idx}`} />)}
//                 </div>
//               </div>
//             )}

//             {plots.boxplots && plots.boxplots.length > 0 && (
//               <div style={{ marginTop: 14 }}>
//                 <h4 style={{ marginBottom: 8 }}>Boxplots</h4>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
//                   {plots.boxplots.map((p, idx) => <PlotImage key={idx} src={p} alt={`box-${idx}`} />)}
//                 </div>
//               </div>
//             )}

//             {plots.correlation && (
//               <div style={{ marginTop: 14 }}>
//                 <h4 style={{ marginBottom: 8 }}>Correlation matrix</h4>
//                 <PlotImage src={plots.correlation} alt="correlation" />
//               </div>
//             )}
//           </div>
//         </section>

//         {/* Time series */}
//         <section style={{ marginBottom: 18 }}>
//           <h3 style={{ marginBottom: 8 }}>Time Series Analysis</h3>
//           <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
//             <select value={tsCols.date} onChange={(e) => setTsCols((p) => ({ ...p, date: e.target.value }))} style={{ padding: 10 }}>
//               <option value="">Select date column</option>
//               {schema?.columns?.map((c) => <option key={c} value={c}>{c}</option>)}
//             </select>
//             <select value={tsCols.value} onChange={(e) => setTsCols((p) => ({ ...p, value: e.target.value }))} style={{ padding: 10 }}>
//               <option value="">Select value column</option>
//               {schema?.columns?.map((c) => <option key={c} value={c}>{c}</option>)}
//             </select>
//             <Btn onClick={runTimeSeries} disabled={tsRunning}>{tsRunning ? <Loader text="Running TS..." small /> : "Run Time Series"}</Btn>
//           </div>

//           <ProgressBar progress={tsProgress} label={tsRunning ? "Time-series progress" : "Idle"} />

//           {tsResult && (
//             <div style={{ marginTop: 12 }}>
//               {tsResult.decomposition_plot && <PlotImage src={tsResult.decomposition_plot} alt="decomp" />}
//               {tsResult.forecast_plot && <PlotImage src={tsResult.forecast_plot} alt="forecast" />}
//               {Array.isArray(tsResult.forecast) && (
//                 <div style={{ marginTop: 12 }}>
//                   <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                     <thead style={{ background: "#f1f5f9" }}>
//                       <tr><th style={{ padding: 8 }}>ds</th><th style={{ padding: 8 }}>yhat</th><th style={{ padding: 8 }}>yhat_lower</th><th style={{ padding: 8 }}>yhat_upper</th></tr>
//                     </thead>
//                     <tbody>
//                       {tsResult.forecast.map((r, i) => (
//                         <tr key={i}><td style={{ padding: 8 }}>{r.ds}</td><td style={{ padding: 8 }}>{r.yhat?.toFixed?.(2)}</td><td style={{ padding: 8 }}>{r.yhat_lower?.toFixed?.(2)}</td><td style={{ padding: 8 }}>{r.yhat_upper?.toFixed?.(2)}</td></tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           )}
//         </section>

//         {/* Chat */}
//         <section style={{ marginBottom: 18 }}>
//           <h3 style={{ marginBottom: 8 }}>Chat with Data Scientist (LLM)</h3>

//           <div ref={chatBoxRef} style={{ borderRadius: 8, background: "#fff", padding: 12, minHeight: 220, maxHeight: 340, overflowY: "auto", border: "1px solid #eef2ff" }}>
//             {chatMessages.length === 0 ? <div style={{ color: "#64748b" }}>Ask something about the dataset (try: 'Summarize sales trends').</div> : chatMessages.map((m, idx) => (
//               <div key={idx} style={{ marginBottom: 10 }}>
//                 <div style={{ fontSize: 13, fontWeight: 700, color: m.role === "user" ? "#0f172a" : THEME.primary }}>{m.role === "user" ? "You" : "Assistant"}</div>
//                 <div style={{ marginTop: 6, color: "#334155" }}>{m.text}</div>
//               </div>
//             ))}
//           </div>

//           <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
//             <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="E.g., 'Give a short executive summary of sales trends'" style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e6eefc" }} />
//             <Btn onClick={() => sendChat(["eda"])} disabled={chatLoading}>{chatLoading ? <Loader text="Asking..." small /> : "Ask (EDA)"}</Btn>
//             <Btn variant="secondary" onClick={() => sendChat(null)} disabled={chatLoading}>Ask</Btn>
//           </div>

//           <div style={{ marginTop: 10 }}>
//             <ProgressBar progress={chatProgress} label={chatLoading ? "Assistant is thinking..." : "Idle"} />
//           </div>
//         </section>

//         {/* Agent */}
//         <section style={{ marginBottom: 6 }}>
//           <h3 style={{ marginBottom: 8 }}>Agent Workflows</h3>
//           <div style={{ display: "flex", gap: 8 }}>
//             <Btn onClick={runAgentWorkflow} disabled={agentRunning}>{agentRunning ? <Loader text="Agent..." small /> : "Run Agent Workflow"}</Btn>
//             <Btn variant="secondary" onClick={() => { setAgentLog([]); setAgentArtifacts(null); }}>Clear</Btn>
//           </div>

//           <div style={{ marginTop: 12 }}>
//             {agentLog.length > 0 && (
//               <div style={{ marginBottom: 10 }}>
//                 <strong>Log</strong>
//                 <ul>
//                   {agentLog.map((l, i) => <li key={i}>{l}</li>)}
//                 </ul>
//               </div>
//             )}
//             {agentArtifacts && (
//               <div>
//                 <strong>Artifacts</strong>
//                 <pre style={{ background: "#f8fafc", padding: 10, borderRadius: 8 }}>{JSON.stringify(agentArtifacts, null, 2)}</pre>
//               </div>
//             )}
//           </div>
//         </section>
//       </div>

//       {/* Toasts */}
//       <div style={{ position: "fixed", right: 20, top: 20, zIndex: 1400 }}>
//         <AnimatePresence>
//           {/* local toasts hook */}
//           {toasts.map((t) => (
//             <motion.div key={t.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.32 }} style={{ marginBottom: 10, background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 10px 30px rgba(2,6,23,0.06)", borderLeft: `4px solid ${THEME.primary}` }}>
//               <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{t.type === "error" ? "Error" : "Info"}</div>
//               <div style={{ color: "#475569", marginTop: 4 }}>{t.message}</div>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </div>
//     </motion.div>
//   );
// }

// frontend/src/App.js
import React, { useEffect, useState, useRef } from "react";
import "./style.css";
import { loadGoogleScript, renderGoogleButton } from "./auth";


/*
ChatGPT-like UI:
- Left: chats list + New Chat
- Center: chat area with messages, voice input, welcome message on new chat
- Right: tools pane (upload, EDA, TS, Agent)
- Google Sign-In integrated via google accounts client
- Chats stored in localStorage, uploaded file remains on backend
*/

// ---------- CONFIG ----------
const GOOGLE_CLIENT_ID = "245602562629-1clbmler1kev013m775orglc5pqof62s.apps.googleusercontent.com"; // <-- replace
// ---------- helpers ----------
function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

const defaultWelcome = `Welcome — I'm your Data Scientist assistant.
You can ask me to run EDA, create plots, perform time-series forecasts, or propose experiments.
Use the right pane to upload your dataset.`;

function nowISO() {
  return new Date().toISOString();
}

// ---------- Chat storage (localStorage) ----------
function loadChats() {
  try {
    const raw = localStorage.getItem("ds_chats_v1");
    if (!raw) {
      const firstId = uid("chat_");
      const chats = {
        current: firstId,
        items: {
          [firstId]: {
            id: firstId,
            title: "New chat",
            createdAt: nowISO(),
            messages: [
              { role: "assistant", text: defaultWelcome, ts: nowISO() }
            ],
          },
        },
      };
      localStorage.setItem("ds_chats_v1", JSON.stringify(chats));
      return chats;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadChats failed", e);
    return null;
  }
}

function saveChats(chats) {
  localStorage.setItem("ds_chats_v1", JSON.stringify(chats));
}

// ---------- Main App ----------
export default function App() {
  // Auth
  const [user, setUser] = useState(null);

  // Chat state
  const [chats, setChats] = useState(() => loadChats());
  const [currentChatId, setCurrentChatId] = useState(() => (chats ? chats.current : null));
  const [input, setInput] = useState("");
  const chatViewRef = useRef(null);

  // UI states for right pane
  const [schema, setSchema] = useState(null);
  const [plots, setPlots] = useState({ histograms: [], boxplots: [], correlation: null });
  const [tsCols, setTsCols] = useState({ date: "", value: "" });
  const [loading, setLoading] = useState({ eda: false, ts: false, chat: false, agent: false });
  const [progress, setProgress] = useState({ eda: 0, ts: 0, chat: 0 });
  const [agentLog, setAgentLog] = useState([]); 
  const [agentArtifacts, setAgentArtifacts] = useState(null);

  // Upload file handle
  const [file, setFile] = useState(null);

  // voice recognition
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  // simple heuristics to detect greetings vs data-requests
const GREETING_WORDS = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you", "yo"];


  useEffect(() => {
    // ensure chats loaded
    if (!chats) {
      const c = loadChats();
      setChats(c);
      setCurrentChatId(c.current);
    } else {
      setCurrentChatId(chats.current);
    }
    // init google identity if available
    initGoogleSignIn();
    // init speech recognition
    initSpeech();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  s.onload = () => {
    if (window.google && GOOGLE_CLIENT_ID) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      google.accounts.id.renderButton(document.getElementById("google-signin-button"), { theme: "outline", size: "large" });
    }
  };
  document.head.appendChild(s);
}, []);


  useEffect(() => {
    if (chats) saveChats(chats);
  }, [chats]);

  useEffect(() => {
    // scroll chat into view on messages change
    if (chatViewRef.current) {
      chatViewRef.current.scrollTop = chatViewRef.current.scrollHeight;
    }
  }, [chats, currentChatId]);

  // ---------- Google Sign-In (client) ----------
  function initGoogleSignIn() {
    if (window.google && GOOGLE_CLIENT_ID) {
      /* global google */
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      // render a hidden button container (you can place it somewhere)
      google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" } // customization
      );
    } else {
      // google client not loaded — load script dynamically
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => {
        if (window.google) {
          google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
          google.accounts.id.renderButton(document.getElementById("google-signin-button"), { theme: "outline", size: "large" });
        }
      };
      document.head.appendChild(s);
    }
  }

  async function handleCredentialResponse(response) {
    // response.credential is the ID token
    try {
      const id_token = response.credential;
      const res = await fetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.detail || "Auth failed");
      setUser(j.user);
    } catch (err) {
      console.error("Google auth failed", err);
      alert("Sign-in failed: " + (err.message || err));
    }
  }

  function isGreetingMessage(text) {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  if (t.length <= 12) { // short messages likely greetings
    return GREETING_WORDS.some(g => t === g || t.startsWith(g + " ") || t.includes(" " + g + " "));
  }
  // also treat very short single-word messages as greeting if they match
  if (t.split(/\s+/).length === 1 && GREETING_WORDS.includes(t)) return true;
  return false;
}

// derive short chat title from a user message
function suggestChatTitleFromMessage(text, maxWords = 6) {
  if (!text) return "New chat";
  // remove punctuation, take first N words
  const words = text.replace(/[^\w\s]/g, "").trim().split(/\s+/);
  if (words.length === 0) return "New chat";
  const title = words.slice(0, maxWords).join(" ");
  return title.length > 0 ? title : "New chat";
}


  function signOut() {
    setUser(null);
    // optional: revoke token server-side if you persist sessions
  }

  // ---------- Speech recognition ----------
  function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (ev) => {
      const t = ev.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + t : t));
    };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
  }

  function toggleListen() {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  // ---------- Chat management ----------
  function newChat() {
    const id = uid("chat_");
    const item = { id, title: "New chat", createdAt: nowISO(), messages: [{ role: "assistant", text: defaultWelcome, ts: nowISO() }] };
    const next = { ...chats, current: id, items: { ...chats.items, [id]: item } };
    setChats(next);
    setCurrentChatId(id);
  }

  function renameChat(id, title) {
    const next = { ...chats };
    next.items[id].title = title;
    setChats(next);
  }

  function selectChat(id) {
    const next = { ...chats, current: id };
    setChats(next);
    setCurrentChatId(id);
  }

  function appendMessage(role, text) {
    const cid = currentChatId;
    const next = { ...chats };
    next.items[cid].messages = [...next.items[cid].messages, { role, text, ts: nowISO() }];
    setChats(next);
  }

  // ---------- File upload & schema ----------
  async function uploadFile(ev) {
    const f = ev.target.files[0];
    if (!f) return;
    setFile(f);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await fetch("/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.detail || "Upload failed");
      setSchema({ rows: j.rows, columns: j.columns });
      appendMessage("assistant", `File ${f.name} uploaded. Columns: ${j.columns.join(", ")}`);
    } catch (err) {
      appendMessage("assistant", "Upload failed: " + (err.message || err));
    }
  }

  async function fetchSchema() {
    try {
      const res = await fetch("/schema");
      if (!res.ok) return;
      const j = await res.json();
      setSchema(j);
    } catch (e) {
      console.warn(e);
    }
  }

  // ---------- EDA / TS / Agent wrappers (right pane) ----------
  function simulateProgress(setter, duration = 1500) {
    let start = Date.now();
    const int = setInterval(() => {
      const pct = Math.min(95, Math.round(((Date.now() - start) / duration) * 100));
      setter(pct);
      if (pct >= 95) clearInterval(int);
    }, 120);
    return int;
  }

  async function runEda() {
    setLoading((s) => ({ ...s, eda: true }));
    const intv = simulateProgress((p) => setProgress((s) => ({ ...s, eda: p })), 2000);
    try {
      const res = await fetch("/eda", { method: "POST" });
      const j = await res.json();
      setPlots(j.plots || {});
      setSchema((s) => ({ ...s, schema: j.schema }));
      appendMessage("assistant", "EDA completed. Plots are available in the right pane.");
    } catch (err) {
      appendMessage("assistant", "EDA failed: " + (err.message || err));
    } finally {
      clearInterval(intv);
      setProgress((p) => ({ ...p, eda: 100 }));
      setLoading((s) => ({ ...s, eda: false }));
      setTimeout(() => setProgress((p) => ({ ...p, eda: 0 })), 700);
    }
  }

  async function runTimeSeries() {
    if (!tsCols.date || !tsCols.value) {
      appendMessage("assistant", "Choose date and value columns first.");
      return;
    }
    setLoading((s) => ({ ...s, ts: true }));
    const intv = simulateProgress((p) => setProgress((s) => ({ ...s, ts: p })), 2200);
    try {
      const body = { date_column: tsCols.date, value_column: tsCols.value, freq: null, forecast_periods: 12 };
      const res = await fetch("/timeseries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setPlots((p) => ({ ...p, forecast_plot: j.forecast_plot, decomposition_plot: j.decomposition_plot }));
      appendMessage("assistant", "Time series analysis complete.");
    } catch (err) {
      appendMessage("assistant", "Time-series failed: " + (err.message || err));
    } finally {
      clearInterval(intv);
      setProgress((p) => ({ ...p, ts: 100 }));
      setLoading((s) => ({ ...s, ts: false }));
      setTimeout(() => setProgress((p) => ({ ...p, ts: 0 })), 700);
    }
  }

  async function runAgent() {
    setLoading((s) => ({ ...s, agent: true }));
    try {
      const body = { workflow: ["eda", "detect_top_features", "propose_ab_test", "simulate_uplift"], params: { target: "sales", feature: "ad_spend" } };
      const res = await fetch("/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setAgentLog(j.log || []);
      appendMessage("assistant", "Agent workflow finished. Check right pane artifacts.");
      if (j.artifacts && j.artifacts.eda) {
        await runEda(); // refresh plots
      }
    } catch (err) {
      appendMessage("assistant", "Agent failed: " + (err.message || err));
    } finally {
      setLoading((s) => ({ ...s, agent: false }));
    }
  }

  // ---------- Chat send ----------
  async function sendMessage(useToolsDefault = ["eda"]) {
  if (!input.trim()) return;
  const text = input.trim();
  // append user message locally
  appendMessage("user", text);
  setInput("");

  // Auto-rename: if this chat only has the initial assistant welcome message,
  // use the user message to set a short chat title.
  const current = chats.items[currentChatId];
  const onlyWelcome =
    current.messages.length === 1 && current.messages[0].role === "assistant" && current.messages[0].text && current.messages[0].text.includes("Welcome");
  if (onlyWelcome) {
    const suggested = suggestChatTitleFromMessage(text, 5);
    renameChat(currentChatId, suggested);
  }

  // If greeting -> handle conversationally (no tools)
  if (isGreetingMessage(text)) {
    // simple friendly response — you can call LLM for richer conversation but without tools.
    // Here we produce a short canned message to avoid unnecessary LLM/tool calls:
    const reply = "Hello! 👋 I’m your Data Scientist assistant. If you'd like, upload a dataset using the right pane and ask me to run EDA, forecasting, or experiments.";
    appendMessage("assistant", reply);
    return;
  }

  // Otherwise treat as analytical or ambiguous; call LLM and include tools by default
  setLoading((s) => ({ ...s, chat: true }));
  const progInt = simulateProgress((p) => setProgress((s) => ({ ...s, chat: p })), 1600);

  try {
    const payload = { message: text, tools: useToolsDefault };
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let j;
    try {
      j = await res.json();
    } catch (err) {
      const txt = await res.text();
      throw new Error(txt || "Chat failed");
    }
    if (!res.ok) throw new Error(j.detail || "Chat error");
    appendMessage("assistant", j.answer || "No answer returned.");
    // If LLM returned tool outputs (e.g., timeseries or eda), update UI
    if (j.tools) {
      if (j.tools.eda) setPlots((p) => ({ ...p, ...j.tools.eda })); // adapt as necessary
      if (j.tools.timeseries) setPlots((p) => ({ ...p, forecast_plot: j.tools.timeseries.forecast_plot }));
    }
  } catch (err) {
    appendMessage("assistant", "Chat failed: " + (err.message || err));
  } finally {
    clearInterval(progInt);
    setProgress((p) => ({ ...p, chat: 100 }));
    setLoading((s) => ({ ...s, chat: false }));
    setTimeout(() => setProgress((p) => ({ ...p, chat: 0 })), 500);
  }
}


  // ---------- Render layout ----------
  const currentChat = chats?.items?.[currentChatId];

  return (
    <div className="app-shell">
      {/* LEFT: chat list */}
      <aside className="left-pane">
        <div className="left-top">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, color: "#0b3b8c" }}>Chats</div>
            <button className="small-button" onClick={newChat}>+ New</button>
          </div>
          <div className="profile-area">
            {user ? (
              <div className="profile-card">
                <img
                  src={user.picture || "/default-avatar.png"}
                  alt={user.name}
                  className="avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                />
                <div className="profile-info">
                  <div className="profile-name">{user.name}</div>
                </div>
                <button className="signout-btn" onClick={signOut}>
                  ⎋
                </button>
              </div>
            ) : (
              <div id="google-signin-button" />
            )}
          </div>
        </div>

        <div className="chat-list">
          {Object.values(chats.items).map((c) => (
            <div key={c.id} className={`chat-item ${c.id === currentChatId ? "active" : ""}`} onClick={() => selectChat(c.id)}>
              <div style={{ fontWeight: 600 }}>{c.title}</div>
              <div className="small muted">{new Date(c.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* CENTER: chat area */}
      <main className="center-pane">
        <div className="chat-header">
          <div>
            <strong>{currentChat?.title || "Chat"}</strong>
            <div className="small muted">Conversations are local — uploaded files persist</div>
          </div>
          <div>
            <button className="small-button" onClick={() => renameChat(currentChatId, prompt("New title:", currentChat.title) || currentChat.title)}>Rename</button>
          </div>
        </div>

        <div className="chat-view" ref={chatViewRef}>
          {currentChat?.messages?.map((m, i) => (
            <div key={i} className={`msg ${m.role === "assistant" ? "assistant" : "user"}`}>
              <div className="msg-role">{m.role === "assistant" ? "Assistant" : "You"}</div>
              <div className="msg-text">{m.text}</div>
              <div className="msg-ts small muted">{new Date(m.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="chat-controls">
          <button className={`mic ${listening ? "listening":""}`} onClick={toggleListen} title="Voice input">
            {listening ? "🎙️ Listening..." : "🎙️"}
          </button>
          <input className="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the dataset, e.g., 'Summarize sales trends'"/>
          <button className="send" onClick={() => sendMessage(["eda"])} disabled={loading.chat}>Send</button>
          <button className="send ghost" onClick={() => sendMessage(null)} disabled={loading.chat}>Send (no tools)</button>
        </div>

        <div className="progress-row">
          {!!progress.chat && <div className="progress small"><div style={{ width: `${progress.chat}%` }} /></div>}
        </div>
      </main>

      {/* RIGHT: tools pane */}
      <aside className="right-pane">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>Files & Tools</strong>
          <div className="small muted">Upload stays on server</div>
        </div>

        <div style={{ marginTop: 10 }}>
          <input type="file" accept=".xlsx,.xls" onChange={uploadFile} />
          <div style={{ marginTop: 8 }}>
            <button className="small-button" onClick={fetchSchema}>Refresh Schema</button>
            <button className="small-button" onClick={() => { setPlots({ histograms: [], boxplots: [], correlation: null }); }}>Clear Plots</button>
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>Columns: {schema ? schema.columns?.join(", ") : "—"}</div>
        </div>

        <hr />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Exploratory Data Analysis</strong>
            <button className="small-button" onClick={runEda} disabled={loading.eda}>Run</button>
          </div>
          <div className="small muted">Progress</div>
          <div className="mini-progress"><div style={{ width: `${progress.eda}%` }} /></div>
        </div>

        <hr />

        <div>
          <strong>Time Series</strong>
          <div style={{ marginTop: 8 }}>
            <select value={tsCols.date} onChange={(e) => setTsCols((p)=>({...p,date:e.target.value}))}>
              <option value="">date column</option>
              {schema?.columns?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={tsCols.value} onChange={(e) => setTsCols((p)=>({...p,value:e.target.value}))}>
              <option value="">value column</option>
              {schema?.columns?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="small-button" onClick={runTimeSeries} disabled={loading.ts}>Run TS</button>
          </div>
          <div className="small muted">Progress</div>
          <div className="mini-progress"><div style={{ width: `${progress.ts}%` }} /></div>
        </div>

        <hr />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Agent</strong>
            <button className="small-button" onClick={runAgent} disabled={loading.agent}>Run</button>
          </div>
          <div className="small muted">Check logs & artifacts below</div>
          {agentLog && agentLog.length > 0 && <div className="artifact-box"><pre>{JSON.stringify(agentLog, null, 2)}</pre></div>}
          {plots.forecast_plot && <img src={plots.forecast_plot} className="small-plot" alt="forecast" />}
          {plots.decomposition_plot && <img src={plots.decomposition_plot} className="small-plot" alt="decomp" />}
          {plots.correlation && <img src={plots.correlation} className="small-plot" alt="corr" />}
        </div>
      </aside>
    </div>
  );
}
