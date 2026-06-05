"""
generate_dataset.py
====================
Generates a synthetic cultural trends dataset for the Influence Simulator.

Each row represents one month of data for one idea.
Three ideas simulated across 10 years (2013-2022):
  - Stoicism   : dormant → revival (matches real 2010s self-help boom)
  - Minimalism : steady growth → peak → slight decline
  - Nihilism   : mostly flat with minor fluctuations

Output: data/ideas_dataset.csv
"""

import pandas as pd
import numpy as np
import os

# Reproducible results every run
np.random.seed(42)


# ------------------------------------------------------------------
# 1. DATE RANGE
# ------------------------------------------------------------------
dates = pd.date_range(start="2013-01-01", end="2022-12-01", freq="MS")
n = len(dates)          # 120 months


# ------------------------------------------------------------------
# 2. TREND SCORE CURVES (0–100 scale, like Google Trends)
#    Modeled after real cultural patterns + added noise
# ------------------------------------------------------------------

def add_noise(signal, scale=4):
    """Add realistic random fluctuation to a signal."""
    return signal + np.random.normal(0, scale, len(signal))


# --- STOICISM ---
# Low (10-15) from 2013-2016, then revival, peaks ~2019-2020
stoicism_base = np.concatenate([
    np.linspace(12, 15, 36),     # 2013-2015: dormancy
    np.linspace(15, 35, 24),     # 2016-2017: early revival
    np.linspace(35, 70, 24),     # 2018-2019: growth
    np.linspace(70, 85, 12),     # 2020: peak
    np.linspace(85, 78, 12),     # 2021: slight decline from peak
    np.linspace(78, 72, 12),     # 2022: stabilisation
])
stoicism_trend = np.clip(add_noise(stoicism_base, scale=3), 5, 100)


# --- MINIMALISM ---
# Grows steadily 2013-2018, peaks, slowly declining after
minimalism_base = np.concatenate([
    np.linspace(25, 45, 36),     # 2013-2015: growth
    np.linspace(45, 72, 24),     # 2016-2017: strong growth
    np.linspace(72, 88, 24),     # 2018-2019: approaching peak
    np.linspace(88, 82, 12),     # 2020: peak-to-decline
    np.linspace(82, 70, 12),     # 2021: decline
    np.linspace(70, 60, 12),     # 2022: continued decline
])
minimalism_trend = np.clip(add_noise(minimalism_base, scale=4), 5, 100)


# --- NIHILISM ---
# Mostly flat, low-level, minor bump 2020 (COVID existential crisis)
nihilism_base = np.concatenate([
    np.linspace(18, 22, 36),     # 2013-2015: flat
    np.linspace(22, 25, 24),     # 2016-2017: very slight rise
    np.linspace(25, 28, 24),     # 2018-2019: creeping up
    np.linspace(28, 40, 12),     # 2020: COVID bump
    np.linspace(40, 32, 12),     # 2021: retreating
    np.linspace(32, 27, 12),     # 2022: back to baseline
])
nihilism_trend = np.clip(add_noise(nihilism_base, scale=3), 5, 100)


# ------------------------------------------------------------------
# 3. SOCIAL SIGNALS (mentions + engagement)
#    Loosely correlated with trend score, different noise profile
# ------------------------------------------------------------------

def social_from_trend(trend, base_mentions=500, base_engagement=200):
    """Generate social mentions and engagement from trend score."""
    mentions   = (trend / 100) * base_mentions * np.random.uniform(0.7, 1.4, len(trend))
    engagement = (trend / 100) * base_engagement * np.random.uniform(0.6, 1.5, len(trend))
    return np.round(mentions).astype(int), np.round(engagement).astype(int)


s_mentions,   s_engagement   = social_from_trend(stoicism_trend,   3000, 1200)
m_mentions,   m_engagement   = social_from_trend(minimalism_trend, 4000, 1600)
n_mentions,   n_engagement   = social_from_trend(nihilism_trend,   1500,  500)


# ------------------------------------------------------------------
# 4. SENTIMENT SCORE (-1 to +1)
#    Stoicism & Minimalism mostly positive; Nihilism mixed/negative
# ------------------------------------------------------------------

def sentiment_curve(n, mean, std=0.12):
    return np.clip(np.random.normal(mean, std, n), -1, 1).round(3)


s_sentiment = sentiment_curve(n, mean=0.55)
m_sentiment = sentiment_curve(n, mean=0.50)
ni_sentiment = sentiment_curve(n, mean=-0.10)


# ------------------------------------------------------------------
# 5. ASSEMBLE INTO DATAFRAME
# ------------------------------------------------------------------

def make_idea_df(idea_name, trend, mentions, engagement, sentiment):
    return pd.DataFrame({
        "date":       dates,
        "idea":       idea_name,
        "trend_score":  trend.round(2),
        "mentions":   mentions,
        "engagement": engagement,
        "sentiment":  sentiment,
    })


df_stoicism   = make_idea_df("Stoicism",   stoicism_trend,   s_mentions,   s_engagement,   s_sentiment)
df_minimalism = make_idea_df("Minimalism", minimalism_trend, m_mentions,   m_engagement,   m_sentiment)
df_nihilism   = make_idea_df("Nihilism",   nihilism_trend,   n_mentions,   n_engagement,   ni_sentiment)

df = pd.concat([df_stoicism, df_minimalism, df_nihilism], ignore_index=True)
df = df.sort_values(["idea", "date"]).reset_index(drop=True)


# ------------------------------------------------------------------
# 6. SAVE TO CSV
# ------------------------------------------------------------------
out_path = os.path.join(os.path.dirname(__file__), "ideas_dataset.csv")
df.to_csv(out_path, index=False)

print(f"Dataset saved → {out_path}")
print(f"Total rows  : {len(df)}")
print(f"Ideas       : {df['idea'].unique().tolist()}")
print(f"Date range  : {df['date'].min().date()} to {df['date'].max().date()}")
print()
print(df.groupby("idea")[["trend_score", "mentions", "engagement", "sentiment"]].mean().round(2))
print()
print("Sample rows:")
print(df.head(6).to_string(index=False))
