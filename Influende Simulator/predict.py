import pandas as pd
import numpy as np
import pickle
import json
import os

from karma_engine import (
    calculate_karma_score,
    adjust_probability,
    estimate_peak_year,
)

# ------------------------------------------------------------------
# PATHS
# ------------------------------------------------------------------
base_dir    = os.path.dirname(__file__)
model_path  = os.path.join(base_dir, "model", "revival_model.pkl")
scaler_path = os.path.join(base_dir, "model", "scaler.pkl")
data_path   = os.path.join(base_dir, "data",  "processed_features.csv")

# ------------------------------------------------------------------
# LOAD MODEL + DATA
# ------------------------------------------------------------------
with open(model_path, "rb") as f:
    MODEL = pickle.load(f)

with open(scaler_path, "rb") as f:
    SCALER = pickle.load(f)

DATA = pd.read_csv(data_path, parse_dates=["date"])

FEATURE_COLS = [
    "trend_score",
    "momentum",
    "growth_rate",
    "rolling_avg_3",
    "rolling_avg_6",
    "engagement_rate",
    "sentiment",
    "dormancy_flag",
    "revival_signal",
]

# ------------------------------------------------------------------
# FIXED STATE LOGIC (USES NORMALIZED VALUES)
# ------------------------------------------------------------------
def trend_to_state(trend, momentum):
    if trend > 0.75 and abs(momentum) < 0.01:
        return "Peak"
    elif momentum > 0 and trend < 0.4:
        return "Revival"
    elif momentum > 0:
        return "Growth"
    elif momentum < 0 and trend > 0.3:
        return "Decline"
    elif momentum > 0 and trend < 0.3:
        return "Revival"
    else:
        return "Dormancy"


# ------------------------------------------------------------------
# MAIN PREDICTION FUNCTION
# ------------------------------------------------------------------
def predict(
    idea_name,
    mental_health_index   = 0.80,
    economic_instability  = 0.70,
    productivity_culture  = 0.75,
    social_fragmentation  = 0.65,
    current_year          = 2025,
):

    # ── Step 1: Extract latest data
    idea_data = DATA[DATA["idea"] == idea_name]

    if idea_data.empty:
        raise ValueError(
            f"Idea '{idea_name}' not found. Available: {DATA['idea'].unique().tolist()}"
        )

    latest_row = idea_data.sort_values("date").iloc[-1]
    features   = pd.DataFrame([latest_row[FEATURE_COLS]])

    # ── Step 2: Model prediction
    features_scaled  = SCALER.transform(features)
    proba            = MODEL.predict_proba(features_scaled)[0]

    base_probability = float(proba[1])

    # ✅ FIXED CONFIDENCE (probability spread)
    confidence_score = float(max(base_probability, 1 - base_probability))

    # ── Step 3: Karma adjustment
    karma_score, karma_breakdown = calculate_karma_score(
        idea_name,
        mental_health_index,
        economic_instability,
        productivity_culture,
        social_fragmentation,
    )

    adjusted_probability = adjust_probability(base_probability, karma_score)

    # ── Step 4: Peak year
    peak_year = estimate_peak_year(adjusted_probability, current_year)

    # ── Step 5: State
    current_state = trend_to_state(
        latest_row["trend_score"],
        latest_row["momentum"]
    )

    # ── Step 6: Output JSON
    result = {
        "idea": idea_name,
        "current_state": current_state,
        "base_probability": round(base_probability, 4),
        "karma_score": round(karma_score, 4),
        "adjusted_probability": round(adjusted_probability, 4),
        "peak_year_estimate": peak_year,
        "confidence_score": round(confidence_score, 4),

        "feature_scores": {
            "trend_score": round(float(latest_row["trend_score"]), 3),
            "momentum": round(float(latest_row["momentum"]), 3),
            "growth_rate": round(float(latest_row["growth_rate"]), 3),
            "engagement_rate": round(float(latest_row["engagement_rate"]), 3),
            "sentiment": round(float(latest_row["sentiment"]), 3),
            "dormancy_flag": int(latest_row["dormancy_flag"]),
            "revival_signal": int(latest_row["revival_signal"]),
        },

        "karma_breakdown": karma_breakdown,

        # ✅ FIXED MARKOV INTERFACE
        "markov_modifier": {
            "revival_boost": round(adjusted_probability, 4),
            "decay_penalty": round(1 - adjusted_probability, 4)
        }
    }

    return result


# ------------------------------------------------------------------
# SELF TEST
# ------------------------------------------------------------------
if __name__ == "__main__":

    ideas = ["Stoicism", "Minimalism", "Nihilism"]

    print("\n=== ML Prediction Engine ===\n")

    for idea in ideas:
        result = predict(idea)

        print(f"\n--- {idea} ---")
        print(json.dumps(result, indent=2))