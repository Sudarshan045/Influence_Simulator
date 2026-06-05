"""
feature_engineering.py
=======================
Reads  : data/ideas_dataset.csv   (raw data from Phase 1)
Outputs: data/processed_features.csv  (ML-ready feature matrix)

Features computed per row (per idea per month):
  1. momentum          — how fast trend is changing right now
  2. growth_rate       — % change over last 6 months
  3. rolling_avg_3     — smoothed trend (3-month window)
  4. rolling_avg_6     — smoothed trend (6-month window)
  5. engagement_rate   — engagement per mention (quality signal)
  6. sentiment         — carried over from raw data
  7. dormancy_flag     — 1 if idea was low for 12+ months before this point
  8. revival_signal    — 1 if currently rising after a dormant period
  9. revival_label     — TARGET: 1 if idea enters revival within next 12 months
                         (this is what the ML model will predict)
"""

import pandas as pd
import numpy as np
import os

# ------------------------------------------------------------------
# LOAD RAW DATA
# ------------------------------------------------------------------
base_dir = os.path.dirname(__file__)
in_path  = os.path.join(base_dir, "data", "ideas_dataset.csv")
out_path = os.path.join(base_dir, "data", "processed_features.csv")

df = pd.read_csv(in_path, parse_dates=["date"])
df = df.sort_values(["idea", "date"]).reset_index(drop=True)

print(f"Loaded {len(df)} rows from {in_path}")
print(f"Ideas : {df['idea'].unique().tolist()}\n")


# ------------------------------------------------------------------
# FEATURE COMPUTATION (per idea group)
# ------------------------------------------------------------------

def compute_features(group):
    g = group.copy().reset_index(drop=True)
    idea_name = g["idea"].iloc[0]

    # 🔥 FIX 1 — Normalize trend score
    ts = g["trend_score"] / 100.0
    g["trend_score"] = ts

    # ── 1. Momentum ─────────────────────────────
    g["momentum"] = ts.diff(1)

    # ── 2. FIXED Growth Rate (bounded) ──────────
    g["growth_rate"] = ts.pct_change(6)
    g["growth_rate"] = g["growth_rate"].clip(-1, 1)

    # ── 3. Rolling averages ─────────────────────
    g["rolling_avg_3"] = ts.rolling(3, min_periods=1).mean()
    g["rolling_avg_6"] = ts.rolling(6, min_periods=1).mean()

    # ── 4. Engagement rate ──────────────────────
    g["engagement_rate"] = (
        g["engagement"] / g["mentions"].replace(0, 1)
    )

    # ── 5. FIXED Dormancy (realistic logic) ─────
    dormancy = []
    for i in range(len(g)):
        start = max(0, i - 12)
        window = ts.iloc[start:i]

        if len(window) < 6:
            dormancy.append(0)
        elif (window < 0.3).mean() > 0.7:   # 70% low = dormant
            dormancy.append(1)
        else:
            dormancy.append(0)

    g["dormancy_flag"] = dormancy

    # ── 6. FIXED Revival Signal ────────────────
    g["revival_signal"] = (
        (g["rolling_avg_6"] < 0.5) &   # low past
        (g["momentum"] > 0)           # rising now
    ).astype(int)

    # ── 7. FIXED Revival Label (scaled) ───────
    labels = []
    for i in range(len(g)):
        future = ts.iloc[i+1:i+13]
        current = ts.iloc[i]

        if len(future) == 0:
            labels.append(np.nan)
        elif (future.max() - current) >= 0.15:   # scaled threshold
            labels.append(1)
        else:
            labels.append(0)

    g["revival_label"] = labels
    g["idea"] = idea_name

    return g

# ------------------------------------------------------------------
# APPLY TO ALL IDEAS
# ------------------------------------------------------------------
print("Computing features per idea...\n")

all_groups = []
for idea_name, group in df.groupby("idea"):
    group = group.copy().reset_index(drop=True)
    result = compute_features(group)
    result["idea"] = idea_name
    all_groups.append(result)

processed = pd.concat(all_groups, ignore_index=True)
processed = processed.reset_index(drop=True)


# ------------------------------------------------------------------
# CLEAN UP
# ------------------------------------------------------------------
# Drop rows with NaN labels (last 12 months of each idea — no future to predict)
before = len(processed)
processed = processed.dropna(subset=["revival_label"])
after  = len(processed)
print(f"Rows before cleaning : {before}")
print(f"Rows after  cleaning : {after}  (dropped {before - after} — no future window)")

# Drop rows with NaN features (first few months — rolling windows not yet full)
processed = processed.dropna(subset=["momentum", "growth_rate"])
print(f"Rows after  dropping early NaN features: {len(processed)}")

# Convert label to integer
processed["revival_label"] = processed["revival_label"].astype(int)


# ------------------------------------------------------------------
# SAVE
# ------------------------------------------------------------------
processed.to_csv(out_path, index=False)
print(f"\nSaved -> {out_path}")


# ------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------
print("\n── Feature stats (mean per idea) ──────────────────────────\n")
feature_cols = [
    "trend_score", "momentum", "growth_rate",
    "rolling_avg_6", "engagement_rate", "sentiment",
    "dormancy_flag", "revival_signal"
]
print(processed.groupby("idea")[feature_cols].mean().round(3).to_string())

print("\n── Revival label distribution ─────────────────────────────\n")
print(processed.groupby(["idea", "revival_label"]).size().unstack(fill_value=0))

print("\n── Sample rows (Stoicism) ─────────────────────────────────\n")
sample = processed[processed["idea"] == "Stoicism"].head(8)
cols   = ["date", "trend_score", "momentum", "growth_rate",
          "rolling_avg_6", "engagement_rate", "dormancy_flag",
          "revival_signal", "revival_label"]
print(sample[cols].to_string(index=False))

print("\nPhase 2 complete. Run train_model.py next.")
