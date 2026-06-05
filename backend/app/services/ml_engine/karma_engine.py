"""
karma_engine.py — Cultural Karma Scoring Engine
================================================
Adjusts ML base probability using 4 cultural indicators (0.0–1.0):
  mental_health_index   : how high is the mental health / anxiety crisis?
  economic_instability  : how unstable is the economy?
  productivity_culture  : how dominant is hustle / productivity culture?
  social_fragmentation  : how isolated / atomised is society?

Each idea profile describes its SENSITIVITY to each indicator.
High weight = that idea's revival is strongly boosted when that indicator is high.
"""

import re
import numpy as np


# ─────────────────────────────────────────────────────────────────────────────
# 1. IDEA PROFILES  (60+ entries, grouped by category)
#    Keys: mental_health_index, economic_instability,
#          productivity_culture, social_fragmentation
# ─────────────────────────────────────────────────────────────────────────────

def _p(mhi, ei, pc, sf):
    return {
        "mental_health_index":  mhi,
        "economic_instability": ei,
        "productivity_culture": pc,
        "social_fragmentation": sf,
    }

IDEA_PROFILES = {

    # ── PHILOSOPHY ────────────────────────────────────────────────────────────
    "Stoicism":            _p(0.85, 0.75, 0.70, 0.60),
    "Minimalism":          _p(0.60, 0.80, 0.50, 0.40),
    "Nihilism":            _p(0.70, 0.65, 0.20, 0.80),
    "Absurdism":           _p(0.85, 0.80, 0.10, 0.70),
    "Existentialism":      _p(0.75, 0.60, 0.25, 0.65),
    "Epicureanism":        _p(0.65, 0.55, 0.15, 0.45),
    "Cynicism":            _p(0.60, 0.70, 0.10, 0.75),
    "Pragmatism":          _p(0.40, 0.60, 0.75, 0.35),
    "Secular Humanism":    _p(0.50, 0.45, 0.55, 0.30),
    "Solipsism":           _p(0.65, 0.40, 0.10, 0.90),
    "Hedonism":            _p(0.55, 0.50, 0.15, 0.55),
    "Rationalism":         _p(0.40, 0.45, 0.80, 0.35),
    "Moral Relativism":    _p(0.55, 0.50, 0.20, 0.70),
    "Determinism":         _p(0.70, 0.55, 0.20, 0.65),

    # ── WELLNESS & SELF-DEVELOPMENT ───────────────────────────────────────────
    "Meditation":          _p(0.90, 0.55, 0.40, 0.50),
    "Mindfulness":         _p(0.90, 0.50, 0.45, 0.50),
    "Breathwork":          _p(0.85, 0.50, 0.30, 0.45),
    "Cold Therapy":        _p(0.70, 0.35, 0.85, 0.30),
    "Forest Bathing":      _p(0.85, 0.50, 0.05, 0.25),
    "Biohacking":          _p(0.50, 0.30, 0.90, 0.40),
    "Journaling":          _p(0.85, 0.70, 0.40, 0.65),
    "Therapy Culture":     _p(0.90, 0.50, 0.40, 0.55),
    "Radical Acceptance":  _p(0.85, 0.55, 0.15, 0.50),
    "Sleep Optimization":  _p(0.80, 0.40, 0.75, 0.35),

    # ── LIFESTYLE ─────────────────────────────────────────────────────────────
    "Slow Living":         _p(0.80, 0.65, 0.05, 0.25),
    "Hustle Culture":      _p(0.20, 0.50, 0.95, 0.30),
    "Cottagecore":         _p(0.80, 0.65, 0.05, 0.30),
    "Dark Academia":       _p(0.70, 0.50, 0.55, 0.65),
    "Goblin Mode":         _p(0.75, 0.65, 0.05, 0.70),
    "Quiet Quitting":      _p(0.80, 0.55, 0.05, 0.60),
    "Van Life":            _p(0.70, 0.75, 0.10, 0.55),
    "Frugal Hedonism":     _p(0.55, 0.90, 0.25, 0.40),
    "Digital Nomad":       _p(0.45, 0.65, 0.75, 0.55),
    "FIRE Movement":       _p(0.55, 0.85, 0.80, 0.40),
    "Doomscrolling":       _p(0.75, 0.60, 0.10, 0.75),
    "Normcore":            _p(0.60, 0.70, 0.15, 0.50),
    "Gorpcore":            _p(0.55, 0.50, 0.40, 0.40),
    "Maximalism":          _p(0.40, 0.35, 0.55, 0.45),

    # ── AESTHETICS ────────────────────────────────────────────────────────────
    "Y2K Aesthetic":       _p(0.50, 0.50, 0.35, 0.60),
    "Cyberpunk":           _p(0.65, 0.70, 0.40, 0.75),
    "Vaporwave":           _p(0.65, 0.55, 0.10, 0.70),
    "Lo-fi Music":         _p(0.75, 0.55, 0.15, 0.65),
    "Vinyl Revival":       _p(0.65, 0.50, 0.15, 0.55),
    "Retro Gaming":        _p(0.65, 0.60, 0.15, 0.75),
    "Cassette Tape Revival":_p(0.55, 0.65, 0.10, 0.60),

    # ── TECHNOLOGY TRENDS ─────────────────────────────────────────────────────
    "AI Ethics":           _p(0.45, 0.40, 0.65, 0.50),
    "Metaverse":           _p(0.55, 0.35, 0.70, 0.75),
    "Cryptocurrency":      _p(0.40, 0.85, 0.75, 0.55),
    "Blockchain":          _p(0.35, 0.80, 0.75, 0.50),
    "Digital Detox":       _p(0.80, 0.50, 0.05, 0.60),
    "Privacy Technology":  _p(0.60, 0.55, 0.55, 0.70),
    "Open Source":         _p(0.45, 0.70, 0.65, 0.45),
    "Decentralization":    _p(0.40, 0.80, 0.60, 0.60),
    "Web3":                _p(0.35, 0.75, 0.75, 0.55),
    "Space Commerce":      _p(0.30, 0.40, 0.85, 0.25),
    "Post-Humanism":       _p(0.40, 0.35, 0.80, 0.50),
    "Longtermism":         _p(0.35, 0.45, 0.75, 0.30),
    "Algorithmic Resistance": _p(0.65, 0.55, 0.15, 0.65),

    # ── WORK CULTURE ──────────────────────────────────────────────────────────
    "Remote Work":         _p(0.65, 0.65, 0.55, 0.60),
    "4-Day Work Week":     _p(0.75, 0.45, 0.15, 0.25),
    "Work-Life Balance":   _p(0.85, 0.40, 0.05, 0.20),
    "Freelance Economy":   _p(0.55, 0.75, 0.75, 0.55),

    # ── SOCIAL MOVEMENTS ─────────────────────────────────────────────────────
    "Environmentalism":    _p(0.55, 0.65, 0.25, 0.25),
    "Veganism":            _p(0.50, 0.60, 0.35, 0.30),
    "Anti-Consumerism":    _p(0.65, 0.90, 0.05, 0.45),
    "Degrowth":            _p(0.60, 0.85, 0.05, 0.40),
    "Feminism":            _p(0.65, 0.55, 0.45, 0.35),
    "Effective Altruism":  _p(0.45, 0.55, 0.70, 0.30),
    "Decentralized Governance": _p(0.45, 0.75, 0.55, 0.50),
    "Neo-Tribalism":       _p(0.60, 0.65, 0.25, 0.80),

    # ── SPIRITUALITY ──────────────────────────────────────────────────────────
    "Astrology":           _p(0.75, 0.55, 0.05, 0.60),
    "New Age Spirituality":_p(0.75, 0.50, 0.05, 0.55),
    "Secular Buddhism":    _p(0.85, 0.55, 0.15, 0.50),
    "Crystal Healing":     _p(0.70, 0.45, 0.05, 0.55),

    # ── CREATIVE & CULTURE ────────────────────────────────────────────────────
    "Zine Culture":        _p(0.60, 0.70, 0.15, 0.60),
    "Indie Film":          _p(0.60, 0.65, 0.25, 0.55),
}


# ─────────────────────────────────────────────────────────────────────────────
# 2. ALIASES — common alternate names → canonical profile key
# ─────────────────────────────────────────────────────────────────────────────

IDEA_ALIASES = {
    "stoic":               "Stoicism",
    "minimalist":          "Minimalism",
    "nihilist":            "Nihilism",
    "absurd":              "Absurdism",
    "existential":         "Existentialism",
    "mindful":             "Mindfulness",
    "meditate":            "Meditation",
    "lofi":                "Lo-fi Music",
    "lo fi":               "Lo-fi Music",
    "vaporwave aesthetic": "Vaporwave",
    "y2k":                 "Y2K Aesthetic",
    "cyber punk":          "Cyberpunk",
    "digital detox":       "Digital Detox",
    "cold shower":         "Cold Therapy",
    "wim hof":             "Cold Therapy",
    "quiet quit":          "Quiet Quitting",
    "hustle":              "Hustle Culture",
    "cottage core":        "Cottagecore",
    "dark academia aesthetic": "Dark Academia",
    "goblin mode":         "Goblin Mode",
    "van life":            "Van Life",
    "fire":                "FIRE Movement",
    "financial independence": "FIRE Movement",
    "slow life":           "Slow Living",
    "web 3":               "Web3",
    "nft":                 "Web3",
    "defi":                "Cryptocurrency",
    "bitcoin":             "Cryptocurrency",
    "crypto":              "Cryptocurrency",
    "ai ethics":           "AI Ethics",
    "artificial intelligence ethics": "AI Ethics",
    "biohack":             "Biohacking",
    "effective altruist":  "Effective Altruism",
    "e/acc":               "Post-Humanism",
    "longtermist":         "Longtermism",
    "anti consumerism":    "Anti-Consumerism",
    "degrowth movement":   "Degrowth",
    "4 day work week":     "4-Day Work Week",
    "four day work week":  "4-Day Work Week",
    "remote work":         "Remote Work",
    "work from home":      "Remote Work",
    "wfh":                 "Remote Work",
}


# ─────────────────────────────────────────────────────────────────────────────
# 3. CATEGORY FALLBACK PROFILES
#    When no profile matches, we infer a category from keywords.
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_PROFILES = {
    "philosophy":  _p(0.65, 0.60, 0.25, 0.65),
    "wellness":    _p(0.80, 0.50, 0.35, 0.50),
    "technology":  _p(0.45, 0.55, 0.70, 0.55),
    "lifestyle":   _p(0.65, 0.60, 0.20, 0.50),
    "social":      _p(0.60, 0.65, 0.30, 0.40),
    "creative":    _p(0.65, 0.55, 0.20, 0.60),
    "spirituality":_p(0.75, 0.50, 0.08, 0.55),
    "work":        _p(0.70, 0.55, 0.30, 0.40),
    "aesthetics":  _p(0.55, 0.55, 0.20, 0.60),
}

CATEGORY_KEYWORDS = {
    "philosophy":   ["philosoph", "ethic", "metaphys", "ontolog", "epistemolog",
                     "moral", "virtue", "logic", "rationali"],
    "wellness":     ["wellness", "health", "healing", "therap", "mindful",
                     "yoga", "breathe", "breath", "meditat", "sleep", "detox"],
    "technology":   ["tech", "digital", "ai ", "machine", "cyber", "crypto",
                     "blockchain", "web3", "metaverse", "algorithm", "software",
                     "hardware", "robot", "data", "privacy"],
    "lifestyle":    ["living", "lifestyle", "life", "home", "core", "culture",
                     "fashion", "style", "aesthetic", "movement"],
    "social":       ["social", "society", "communit", "activist", "justice",
                     "movement", "collective", "feminism", "equality", "climate"],
    "creative":     ["music", "art", "film", "zine", "creative", "design",
                     "write", "writing", "paint", "poetry", "craft"],
    "spirituality": ["spirit", "astro", "crystal", "buddhis", "meditation",
                     "sacred", "mystic", "conscious", "chakra", "tarot"],
    "work":         ["work", "career", "job", "employ", "freelance", "office",
                     "remote", "productivity", "hustle", "quit"],
    "aesthetics":   ["aesthetic", "vibe", "wave", "core", "punk", "retro",
                     "vintage", "nostalgia", "y2k", "lo-fi", "lofi"],
}

DEFAULT_PROFILE = _p(0.50, 0.50, 0.50, 0.50)


# ─────────────────────────────────────────────────────────────────────────────
# 4. PROFILE RESOLVER
# ─────────────────────────────────────────────────────────────────────────────

def _normalise(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip().lower())


def resolve_profile(idea_name: str) -> tuple[dict, str]:
    """
    Resolves the best matching idea profile for any input string.
    Returns (profile_dict, match_type) where match_type describes how it matched.

    Resolution order:
      1. Exact match (case-insensitive)
      2. Alias lookup
      3. Fuzzy substring: profile key is substring of idea name or vice-versa
      4. Keyword token overlap (Jaccard-like score)
      5. Category inference from keyword clusters
      6. DEFAULT_PROFILE
    """
    norm = _normalise(idea_name)

    # ── 1. Exact match ────────────────────────────────────────────────────────
    for key, profile in IDEA_PROFILES.items():
        if _normalise(key) == norm:
            return profile, "exact"

    # ── 2. Alias lookup ───────────────────────────────────────────────────────
    for alias, canonical in IDEA_ALIASES.items():
        if alias in norm or norm in alias:
            if canonical in IDEA_PROFILES:
                return IDEA_PROFILES[canonical], f"alias:{canonical}"

    # ── 3. Fuzzy substring match ──────────────────────────────────────────────
    best_key   = None
    best_score = 0
    for key in IDEA_PROFILES:
        k = _normalise(key)
        # Containment check
        if k in norm or norm in k:
            score = len(set(k.split()) & set(norm.split())) / max(len(k.split()), 1)
            if score > best_score:
                best_score = score
                best_key   = key
    if best_key and best_score >= 0.4:
        return IDEA_PROFILES[best_key], f"fuzzy:{best_key}"

    # ── 4. Token overlap across all profile keys ──────────────────────────────
    norm_tokens = set(norm.split())
    best_key    = None
    best_overlap = 0
    for key in IDEA_PROFILES:
        key_tokens = set(_normalise(key).split())
        overlap    = len(norm_tokens & key_tokens)
        if overlap > best_overlap:
            best_overlap = overlap
            best_key     = key
    if best_key and best_overlap >= 1:
        return IDEA_PROFILES[best_key], f"token:{best_key}"

    # ── 5. Category keyword inference (weighted blend) ────────────────────────
    category_scores: dict[str, int] = {}
    for category, kws in CATEGORY_KEYWORDS.items():
        hits = sum(1 for kw in kws if kw in norm)
        if hits:
            category_scores[category] = hits

    if category_scores:
        total_hits = sum(category_scores.values())
        # Blend all matching category profiles weighted by keyword hit counts
        keys = list(DEFAULT_PROFILE.keys())
        blended = {}
        for k in keys:
            blended[k] = sum(
                CATEGORY_PROFILES[cat][k] * (hits / total_hits)
                for cat, hits in category_scores.items()
            )
        # Round for cleanliness
        blended = {k: round(v, 4) for k, v in blended.items()}
        top_cats = sorted(category_scores, key=category_scores.get, reverse=True)
        label = "+".join(top_cats[:2]) if len(top_cats) > 1 else top_cats[0]
        return blended, f"category_blend:{label}"

    # ── 6. Default ────────────────────────────────────────────────────────────
    return DEFAULT_PROFILE, "default"


# ─────────────────────────────────────────────────────────────────────────────
# 5. KARMA SCORE CALCULATOR
# ─────────────────────────────────────────────────────────────────────────────

def calculate_karma_score(
    idea_name: str,
    mental_health_index:  float,
    economic_instability: float,
    productivity_culture: float,
    social_fragmentation: float,
) -> tuple[float, dict]:
    """
    Computes karma score (0.0–1.0) and per-factor breakdown.

    Returns:
        karma_score (float) — weighted alignment of conditions with idea's needs
        breakdown   (dict)  — per-factor contribution (for frontend display)
    """
    indicators = {
        "mental_health_index":  mental_health_index,
        "economic_instability": economic_instability,
        "productivity_culture": productivity_culture,
        "social_fragmentation": social_fragmentation,
    }
    for name, val in indicators.items():
        if not (0.0 <= float(val) <= 1.0):
            raise ValueError(f"{name} must be 0.0–1.0, got {val}")

    profile, match_type = resolve_profile(idea_name)

    weighted_sum  = sum(profile[k] * indicators[k] for k in indicators)
    total_weights = sum(profile.values())
    karma_score   = weighted_sum / total_weights if total_weights else 0.5

    breakdown = {k: round(profile[k] * indicators[k], 4) for k in indicators}
    breakdown["_match_type"] = match_type

    return round(float(karma_score), 4), breakdown


# ─────────────────────────────────────────────────────────────────────────────
# 6. PROBABILITY ADJUSTER
# ─────────────────────────────────────────────────────────────────────────────

def adjust_probability(base_probability: float, karma_score: float) -> float:
    """
    adjusted = base × (1 + 0.5 × (karma − 0.5))
    karma=0.5 → no change  |  karma>0.5 → boost  |  karma<0.5 → dampen
    Max swing: ±25% of base probability.
    """
    adjustment = 1.0 + 0.5 * (karma_score - 0.5)
    adjusted   = base_probability * adjustment
    return round(float(np.clip(adjusted, 0.0, 1.0)), 4)


# ─────────────────────────────────────────────────────────────────────────────
# 7. PEAK YEAR ESTIMATOR
# ─────────────────────────────────────────────────────────────────────────────

def estimate_peak_year(
    adjusted_probability: float,
    current_year: int = 2025,
    min_years:    int = 3,
    max_years:    int = 15,
):
    """Higher probability → nearer peak. Below 0.2 → no revival forecast."""
    if adjusted_probability < 0.2:
        return None
    years_away = int(max_years - (adjusted_probability * (max_years - min_years)))
    return current_year + years_away


# ─────────────────────────────────────────────────────────────────────────────
# 8. SELF-TEST
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    CONDITIONS = {
        "mental_health_index":  0.80,
        "economic_instability": 0.70,
        "productivity_culture": 0.75,
        "social_fragmentation": 0.65,
    }

    tests = [
        "Stoicism", "Absurdism", "Digital Detox", "Goblin Mode",
        "Cottagecore", "Biohacking", "Van Life", "Y2K Aesthetic",
        "Stoic Meditation Practice",   # fuzzy → Meditation / Stoicism
        "Anti Hustle Philosophy",      # category → philosophy
        "Future of Work Culture",      # category → work
    ]

    print(f"\n{'Idea':<35} {'Match':<30} {'Karma':>6}")
    print("─" * 75)
    for idea in tests:
        karma, bd = calculate_karma_score(idea, **CONDITIONS)
        match = bd.get("_match_type", "?")
        print(f"{idea:<35} {match:<30} {karma:>6.3f}")
    print("\n✅ Karma engine self-test complete.")
