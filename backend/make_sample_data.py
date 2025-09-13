# backend/make_dummy_data.py
import pandas as pd
import numpy as np
import os

np.random.seed(42)

os.makedirs("data", exist_ok=True)
out_path = "data/data.xlsx"

# --- Generate dummy time series data ---
date_range = pd.date_range(start="2022-01-01", end="2023-12-31", freq="W")

n = len(date_range)

# Trend + seasonality + noise
trend = np.linspace(100, 500, n)
seasonality = 50 * np.sin(np.linspace(0, 12*np.pi, n))  # yearly seasonality
noise = np.random.normal(0, 30, n)
sales = trend + seasonality + noise

# Marketing spend (positively correlated with sales)
ad_spend = sales * 0.3 + np.random.normal(0, 20, n)

# Categories & regions
categories = np.random.choice(["Electronics", "Clothing", "Groceries"], size=n, p=[0.3,0.4,0.3])
regions = np.random.choice(["North", "South", "East", "West"], size=n)

# Add a binary event flag (e.g., promotion week)
promo = np.random.choice([0,1], size=n, p=[0.8,0.2])

# Build DataFrame
df = pd.DataFrame({
    "date": date_range,
    "sales": sales.round(2),
    "ad_spend": ad_spend.round(2),
    "category": categories,
    "region": regions,
    "promotion": promo
})

# Save
df.to_excel(out_path, index=False)
print(f"Dummy dataset saved to {out_path} with {len(df)} rows.")
print(df.head())
