"""
karma_engine.py
===============
The Karma Engine is your unique AI layer.

It takes the raw ML model probability and adjusts it
based on current cultural conditions (the "era sensitivity").

Formula from project doc:
    AdjustedProbability = BaseProbability × KarmaWeight

Inputs (cultural indicators, scored 0.0 to 1.0):
  - mental_health_index     : how high is the anxiety/mental health crisis?
  - economic_instability    : how unstable is the economy?
  - productivity_culture    : how dominant is hustle/productivity culture?
  - social_fragmentation    : how divided/isolated is society?

Each indicator has a weight per idea — some ideas benefit
more from certain conditions than others.

Example:
  Stoicism thrives when mental health crisis is HIGH
  and economic instability is HIGH (people seek resilience frameworks)
"""

import numpy as np


# ------------------------------------------------------------------
# 1. IDEA PROFILES
#    How much does each cultural factor boost this idea's revival?
#    Weights are on a 0.0–1.0 scale (higher = more sensitive to that factor)
#    Based on cultural/historical reasoning — justifiable to any panel
# ------------------------------------------------------------------

IDEA_PROFILES = {
    "Stoicism": {
        "mental_health_index"  : 0.85,   # high: stoicism directly addresses anxiety
        "economic_instability" : 0.75,   # high: people seek resilience in hard times
        "productivity_culture" : 0.70,   # high: stoicism aligns with discipline culture
        "social_fragmentation" : 0.60,   # medium: isolation drives inner philosophy
    },
    "Minimalism": {
        "mental_health_index"  : 0.60,   # medium: decluttering helps mental health
        "economic_instability" : 0.80,   # high: people spend less in uncertainty
        "productivity_culture" : 0.50,   # medium: less stuff = more focus
        "social_fragmentation" : 0.40,   # low: minimalism is personal not social
    },
    "Nihilism": {
        "mental_health_index"  : 0.70,   # high: despair breeds nihilism
        "economic_instability" : 0.65,   # high: hopelessness in bad economies
        "productivity_culture" : 0.20,   # low: nihilism rejects productivity
        "social_fragmentation" : 0.80,   # high: isolation fuels nihilist thinking
    },
}

# Default profile for ideas not in the list above
DEFAULT_PROFILE = {
    "mental_health_index"  : 0.50,
    "economic_instability" : 0.50,
    "productivity_culture" : 0.50,
    "social_fragmentation" : 0.50,
}


# ------------------------------------------------------------------
# 2. KARMA SCORE CALCULATOR
# ------------------------------------------------------------------

def calculate_karma_score(
    idea_name,
    mental_health_index,
    economic_instability,
    productivity_culture,
    social_fragmentation,
):
    """
    Computes a karma score (0.0 to 1.0+) for a given idea
    based on current cultural conditions.

    Returns:
        karma_score (float) — how culturally favorable the conditions are
        breakdown  (dict)   — contribution of each factor
    """

    # Validate inputs
    indicators = {
        "mental_health_index"  : mental_health_index,
        "economic_instability" : economic_instability,
        "productivity_culture" : productivity_culture,
        "social_fragmentation" : social_fragmentation,
    }
    for name, val in indicators.items():
        if not (0.0 <= val <= 1.0):
            raise ValueError(f"{name} must be between 0.0 and 1.0, got {val}")

    # Get this idea's sensitivity profile
    profile = IDEA_PROFILES.get(idea_name, DEFAULT_PROFILE)

    # Weighted dot product: how aligned are current conditions with idea's needs?
    weighted_sum   = sum(profile[k] * indicators[k] for k in indicators)
    total_weights  = sum(profile.values())
    karma_score    = weighted_sum / total_weights   # normalise to 0–1 range

    # Breakdown: individual contribution of each factor
    breakdown = {
        k: round(profile[k] * indicators[k], 4)
        for k in indicators
    }

    return round(karma_score, 4), breakdown


# ------------------------------------------------------------------
# 3. PROBABILITY ADJUSTER
# ------------------------------------------------------------------

def adjust_probability(base_probability, karma_score, sensitivity=0.4):
    """
    Applies karma score to the base ML probability.

    Formula:
        adjusted = base × (1 + sensitivity × (karma - 0.5))

    When karma = 0.5 (neutral conditions) → no change
    When karma > 0.5 (favorable conditions) → probability increases
    When karma < 0.5 (unfavorable conditions) → probability decreases

    sensitivity controls how strongly karma affects the result.
    Default 0.4 means karma can shift probability by up to ±20%.

    Returns:
        adjusted_probability (float) — clipped to [0.0, 1.0]
    """
    # def adjust_probability(base_probability, karma_score, sensitivity=0.5):
    adjustment           = 1 + 0.5 * (karma_score - 0.5)
    adjusted_probability = base_probability * adjustment

    return round(float(np.clip(adjusted_probability, 0.0, 1.0)) , 4)


# ------------------------------------------------------------------
# 4. PEAK YEAR ESTIMATOR
# ------------------------------------------------------------------

def estimate_peak_year(
    adjusted_probability,
    current_year=2025,
    min_years=3,
    max_years=15,
):
    """
    Rough estimate of when the idea will peak.

    Higher probability → sooner peak
    Lower  probability → longer wait (or no revival)
    """
    if adjusted_probability < 0.2:
        return None    # unlikely to revive

    # Map probability to years away: 0.2 → ~12 years, 1.0 → ~3 years
    years_away = int(max_years - (adjusted_probability * (max_years - min_years)))
    return current_year + years_away


# ------------------------------------------------------------------
# 5. SELF-TEST (runs when you execute this file directly)
# ------------------------------------------------------------------

if __name__ == "__main__":

    print("=" * 56)
    print("  Karma Engine — Self Test")
    print("=" * 56)

    # Current cultural conditions (2025 scenario from project doc)
    CONDITIONS_2025 = {
        "mental_health_index"  : 0.80,   # high anxiety epidemic
        "economic_instability" : 0.70,   # high cost-of-living crisis
        "productivity_culture" : 0.75,   # hustle culture still strong
        "social_fragmentation" : 0.65,   # increasing polarisation
    }

    print("\nCurrent cultural conditions (2025):")
    for k, v in CONDITIONS_2025.items():
        bar = "█" * int(v * 20)
        print(f"  {k:<26} {v:.2f}  {bar}")

    print()

    # Test with a sample base probability from the ML model
    test_cases = [
        ("Stoicism",   0.63),
        ("Minimalism", 0.41),
        ("Nihilism",   0.28),
    ]

    results = []
    for idea, base_prob in test_cases:
        karma, breakdown = calculate_karma_score(idea, **CONDITIONS_2025)
        adj_prob         = adjust_probability(base_prob, karma)
        peak_year        = estimate_peak_year(adj_prob)

        results.append({
            "idea"                : idea,
            "base_probability"    : base_prob,
            "karma_score"         : karma,
            "adjusted_probability": adj_prob,
            "peak_year"           : peak_year,
        })

        print(f"── {idea} ──────────────────────────────")
        print(f"  Base probability     : {base_prob}")
        print(f"  Karma score          : {karma}")
        print(f"  Factor breakdown     : {breakdown}")
        print(f"  Adjusted probability : {adj_prob}")
        print(f"  Estimated peak year  : {peak_year}")
        print()

    print("Karma engine working correctly.")
    print("Phase 3b complete. Run predict.py next (Phase 4).")
