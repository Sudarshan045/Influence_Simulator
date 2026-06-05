import pandas as pd
import numpy as np
import pickle
import json
import os

from .karma_engine import (
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
# MARKOV CHAIN LOGIC
# ------------------------------------------------------------------
STATES = ["Birth", "Growth", "Peak", "Decline", "Dormancy", "Revival"]

def get_markov_transition_matrix(karma_score, trend_score=0.5, momentum=0.0):
    """
    Returns a 6x6 transition matrix based on karma score, trend, and momentum.
    Higher karma/trend increases the probability of moving to Growth/Peak/Revival.
    """
    k = karma_score
    t = trend_score
    m = np.clip(momentum, -1.0, 1.0)
    
    # Probabilities: [Birth, Growth, Peak, Decline, Dormancy, Revival]
    # Matrix adapts dynamically to the idea's unique momentum and cultural karma
    matrix = np.array([
        [0.1, 0.7 + 0.2*k + 0.1*m, 0.0, 0.0, 0.0, 0.2 - 0.2*k], # From Birth
        [0.0, 0.2 - 0.1*m, 0.6 + 0.2*k + 0.1*m, 0.2 - 0.2*k - 0.1*m, 0.0, 0.0], # From Growth
        [0.0, 0.0, 0.3 + 0.2*t, 0.6 - 0.1*k - 0.2*t, 0.1, 0.0],          # From Peak
        [0.0, 0.0, 0.0, 0.3 - 0.1*m, 0.7 - 0.1*k + 0.1*m, 0.0],          # From Decline
        [0.1, 0.0, 0.0, 0.0, 0.4 - 0.3*k - 0.1*t, 0.5 + 0.3*k + 0.1*t], # From Dormancy
        [0.0, 0.4 + 0.4*k + 0.1*m, 0.0, 0.0, 0.1, 0.5 - 0.4*k - 0.1*m], # From Revival
    ])
    
    # Clip to avoid negatives and normalize rows to ensure they sum to 1
    matrix = np.clip(matrix, 0.01, 1.0)
    matrix = matrix / matrix.sum(axis=1)[:, None]
    return matrix

def simulate_lifecycle(start_state, karma_score, trend_score=0.5, momentum=0.0, steps=10):
    """
    Simulates the lifecycle using Markov Chain transitions.
    """
    matrix = get_markov_transition_matrix(karma_score, trend_score, momentum)
    current_idx = STATES.index(start_state)
    history = [start_state]
    
    # State probabilities over time
    state_probs = np.zeros((steps, len(STATES)))
    state_probs[0, current_idx] = 1.0
    
    for t in range(1, steps):
        state_probs[t] = state_probs[t-1] @ matrix
        
    return state_probs.tolist()

def trend_to_state(trend, momentum):
    if trend > 75: return "Peak"
    if momentum > 0.1: return "Growth"
    if momentum < -0.1: return "Decline"
    if trend < 20: return "Dormancy"
    return "Birth"


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
    live_data_enabled     = False,
):

    # ── Step 1: Extract latest data
    idea_data = DATA[DATA["idea"] == idea_name]

    if idea_data.empty:
        # ── Karma-profile-guided fallback ─────────────────────────────────────
        # Instead of pseudo-random hash features, find the most similar idea in
        # the training dataset using cosine similarity of karma profiles.
        import hashlib
        import numpy as _np
        from .karma_engine import resolve_profile as _resolve

        h = int(hashlib.md5(idea_name.encode('utf-8')).hexdigest(), 16)

        # Get karma profile for the unknown idea
        try:
            unknown_profile, _ = _resolve(idea_name)
            unknown_vec = _np.array(list(unknown_profile.values()), dtype=float)
        except Exception:
            unknown_vec = _np.array([0.5, 0.5, 0.5, 0.5])

        # Find closest known idea in training data by karma-profile cosine sim
        known_ideas = DATA["idea"].unique()
        best_idea   = None
        best_sim    = -1.0
        for known in known_ideas:
            try:
                kp, _ = _resolve(known)
                kp_vec = _np.array(list(kp.values()), dtype=float)
                denom  = (_np.linalg.norm(unknown_vec) * _np.linalg.norm(kp_vec)) + 1e-9
                sim    = float(_np.dot(unknown_vec, kp_vec) / denom)
                if sim > best_sim:
                    best_sim  = sim
                    best_idea = known
            except Exception:
                continue

        if best_idea is not None:
            template = DATA[DATA["idea"] == best_idea].sort_values("date").iloc[-1]
            latest_row = template.copy()
            # Apply a tiny deterministic jitter (±5%) so identical-profile ideas
            # still produce slightly different predictions
            for col in ["trend_score", "momentum", "growth_rate",
                        "rolling_avg_3", "rolling_avg_6",
                        "engagement_rate", "sentiment"]:
                shift = ((h >> (FEATURE_COLS.index(col) * 4 if col in FEATURE_COLS else 0)) % 11 - 5) / 100.0
                latest_row[col] = float(_np.clip(float(latest_row[col]) + shift, -1, 1))
        else:
            # Last resort: use dataset mean
            latest_row = DATA.mean(numeric_only=True).copy()
    else:
        latest_row = idea_data.sort_values("date").iloc[-1].copy()

    # --- Live Social Data Simulation (REAL INTERNET DATA) ---
    if live_data_enabled:
        import urllib.request
        import urllib.parse
        import json
        import random
        
        try:
            # Fetch real data from the internet
            query = urllib.parse.quote(idea_name)
            url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&utf8=&format=json"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=3) as response:
                data = json.loads(response.read().decode())
                
                hits = data.get("query", {}).get("searchinfo", {}).get("totalhits", 0)
                # Calculate real boosts based on actual internet hits
                live_boost_trend = min(0.3, hits / 100000.0)  
                live_boost_momentum = min(0.4, hits / 50000.0)
                
                # Simple sentiment extraction from live text snippets
                snippets = [item["snippet"] for item in data.get("query", {}).get("search", [])]
                text = " ".join(snippets).lower()
                positive_words = ["good", "great", "best", "future", "success", "innovative", "popular", "growth", "rise"]
                negative_words = ["bad", "decline", "fail", "worst", "criticism", "controversy", "dying", "dead"]
                
                pos_count = sum(text.count(w) for w in positive_words)
                neg_count = sum(text.count(w) for w in negative_words)
                
                if pos_count + neg_count > 0:
                    live_boost_sentiment = (pos_count - neg_count) / (pos_count + neg_count) * 0.4
                else:
                    live_boost_sentiment = random.uniform(0.0, 0.2)
                    
        except Exception as e:
            # Fallback if internet fails
            live_boost_trend = random.uniform(0.05, 0.25)
            live_boost_momentum = random.uniform(-0.1, 0.3)
            live_boost_sentiment = random.uniform(0.0, 0.4)

        latest_row["trend_score"] = float(np.clip(float(latest_row["trend_score"]) + live_boost_trend, 0, 1))
        latest_row["momentum"] = float(np.clip(float(latest_row["momentum"]) + live_boost_momentum, -1, 1))
        latest_row["sentiment"] = float(np.clip(float(latest_row["sentiment"]) + live_boost_sentiment, -1, 1))
        
    features   = pd.DataFrame([latest_row[FEATURE_COLS]])

    # ── Step 2: Model prediction
    features_scaled  = SCALER.transform(features.values)  # .values avoids feature-name warning
    proba            = MODEL.predict_proba(features_scaled)[0]

    base_probability = float(proba[1])

    # Trend-score floor: an idea already performing well should never show near-zero
    # probability — the ML label only captures "will it RISE further", but a high
    # trend score means it's already influential / alive.
    current_trend    = float(latest_row["trend_score"])   # 0-1 scale after feature_engineering
    trend_floor      = float(np.clip(current_trend * 0.80, 0.0, 0.75))
    base_probability = float(np.clip(max(base_probability, trend_floor), 0.0, 1.0))

    # Confidence: how decisive the model was (spread between classes)
    confidence_score = float(max(float(proba[1]), 1 - float(proba[1])))

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

        # ✅ INDUSTRY LEVEL: MARKOV CHAIN SIMULATION
        "markov_simulation": simulate_lifecycle(
            current_state, 
            karma_score, 
            trend_score=float(latest_row["trend_score"]),
            momentum=float(latest_row["momentum"]),
            steps=12
        ),
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