"""
seed.py -- Influence Simulator Database Seed Script
====================================================
Populates MongoDB with curated ideas and ML-generated predictions.
Safe to run multiple times -- uses upsert so existing data is refreshed.

Usage (from backend/ directory):
    .\venv_new\Scripts\python.exe seed.py             # Seed / refresh
    .\venv_new\Scripts\python.exe seed.py --clear     # Wipe DB then seed
    .\venv_new\Scripts\python.exe seed.py --dry-run   # Preview, no writes
"""

import asyncio
import sys
import os
import argparse
from datetime import datetime, timezone
from collections import defaultdict

# Force UTF-8 stdout so Unicode emojis don't crash on Windows cp1252
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Path setup (allows `from app.x import y` from the backend/ root) ──────────
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from motor.motor_asyncio import AsyncIOMotorClient
from app.services.ml_engine.predict import predict


# ─────────────────────────────────────────────────────────────────────────────
# SEED CATALOGUE
# 30 curated ideas across all 9 cultural domains, with category labels.
# The ML engine + Karma Engine will compute all actual prediction values.
# ─────────────────────────────────────────────────────────────────────────────

SEED_IDEAS = [
    # Philosophy
    ("Stoicism",            "Philosophy"),
    ("Minimalism",          "Philosophy"),
    ("Nihilism",            "Philosophy"),
    ("Absurdism",           "Philosophy"),
    ("Existentialism",      "Philosophy"),
    ("Epicureanism",        "Philosophy"),

    # Wellness
    ("Meditation",          "Wellness"),
    ("Mindfulness",         "Wellness"),
    ("Breathwork",          "Wellness"),
    ("Biohacking",          "Wellness"),
    ("Cold Therapy",        "Wellness"),
    ("Journaling",          "Wellness"),

    # Lifestyle
    ("Slow Living",         "Lifestyle"),
    ("Cottagecore",         "Lifestyle"),
    ("Dark Academia",       "Lifestyle"),
    ("Goblin Mode",         "Lifestyle"),
    ("Quiet Quitting",      "Lifestyle"),
    ("Van Life",            "Lifestyle"),
    ("Hustle Culture",      "Lifestyle"),
    ("FIRE Movement",       "Lifestyle"),

    # Technology
    ("AI Ethics",           "Technology"),
    ("Digital Detox",       "Technology"),
    ("Cryptocurrency",      "Technology"),
    ("Decentralization",    "Technology"),
    ("Privacy Technology",  "Technology"),

    # Aesthetics / Creative
    ("Y2K Aesthetic",       "Aesthetics"),
    ("Cyberpunk",           "Aesthetics"),
    ("Vaporwave",           "Aesthetics"),
    ("Lo-fi Music",         "Creative"),
    ("Vinyl Revival",       "Creative"),

    # Social / Spirituality
    ("Anti-Consumerism",    "Social"),
    ("Degrowth",            "Social"),
    ("Environmentalism",    "Social"),
    ("Astrology",           "Spirituality"),
    ("Secular Buddhism",    "Spirituality"),

    # Work
    ("Remote Work",         "Work"),
    ("4-Day Work Week",     "Work"),
    ("Work-Life Balance",   "Work"),
]

# ── 2025 Cultural Conditions (scenario used for seeding) ─────────────────────
CONDITIONS_2025 = {
    "mental_health_index":  0.80,   # High anxiety epidemic
    "economic_instability": 0.70,   # Cost-of-living crisis
    "productivity_culture": 0.75,   # Hustle culture still dominant
    "social_fragmentation": 0.65,   # Increasing polarisation
}

STATES = ["Birth", "Growth", "Peak", "Decline", "Dormancy", "Revival"]


# ─────────────────────────────────────────────────────────────────────────────
# ASYNC SEED ENGINE
# ─────────────────────────────────────────────────────────────────────────────

async def clear_database(db):
    """Wipe all seed-related collections."""
    print("  🗑️  Clearing: ideas, predictions, idea_states ...")
    await asyncio.gather(
        db.ideas.delete_many({}),
        db.predictions.delete_many({}),
        db.idea_states.delete_many({}),
    )
    print("  ✅ Database cleared.\n")


async def seed_idea(db, idea_name: str, category: str, dry_run: bool) -> dict | None:
    """
    1. Run predict() synchronously to get ML results.
    2. Upsert idea into `ideas` collection.
    3. Insert fresh prediction into `predictions` collection.
    4. Insert state event into `idea_states` collection.
    Returns a summary dict for the report, or None on failure.
    """
    try:
        result = predict(
            idea_name=idea_name,
            **CONDITIONS_2025,
        )
    except Exception as e:
        print(f"  ❌ PREDICT FAILED [{idea_name}]: {e}")
        return None

    prob_percent = round(result["adjusted_probability"] * 100, 2)
    conf         = round(result["confidence_score"] * 100, 2)
    state        = result["current_state"]
    peak_year    = str(result["peak_year_estimate"]) if result["peak_year_estimate"] else "N/A"
    karma        = round(result["karma_score"], 4)
    now          = datetime.now(timezone.utc)

    # Lifecycle progression from Markov simulation
    markov = result.get("markov_simulation") or []
    num_states = len(STATES)
    if markov:
        peak_per_state = [0.0] * num_states
        for step in markov:
            for i in range(min(num_states, len(step))):
                if step[i] > peak_per_state[i]:
                    peak_per_state[i] = step[i]
        progression = [round(v * 100, 1) for v in peak_per_state]
        progression[-1] = round(prob_percent, 1)
    else:
        progression = [20, 40, 80, 50, 10, round(prob_percent, 1)]

    trend = (
        "rising"    if prob_percent > 65 else
        "declining" if prob_percent < 40 else
        "stable"
    )

    if dry_run:
        return {
            "name": idea_name, "category": category,
            "prob": prob_percent, "karma": karma,
            "state": state, "trend": trend, "peak": peak_year,
        }

    # ── Upsert idea ───────────────────────────────────────────────────────────
    idea_result = await db.ideas.find_one_and_update(
        {"name": idea_name},
        {"$set": {
            "name":       idea_name,
            "category":   category,
            "updated_at": now,
        }, "$setOnInsert": {"created_at": now}},
        upsert=True,
        return_document=True,
    )
    # find_one_and_update with upsert returns None when a new doc is inserted (motor quirk)
    if idea_result is None:
        idea_result = await db.ideas.find_one({"name": idea_name})
    idea_id = str(idea_result["_id"])

    # ── Insert prediction (always fresh, timestamped) ─────────────────────────
    await db.predictions.insert_one({
        "idea_id":             idea_id,
        "revival_probability": prob_percent,
        "peak_time":           peak_year,
        "confidence_score":    conf,
        "karma_score":         karma,
        "current_state":       state,
        "region":              "Global",
        "seeded":              True,
        "scenario":            CONDITIONS_2025,
        "progression":         progression,
        "trend":               trend,
        "created_at":          now,
    })

    # ── Insert state event ────────────────────────────────────────────────────
    await db.idea_states.insert_one({
        "idea_id":    idea_id,
        "state":      state,
        "created_at": now,
    })

    return {
        "name": idea_name, "category": category,
        "prob": prob_percent, "karma": karma,
        "state": state, "trend": trend, "peak": peak_year,
    }


# ─────────────────────────────────────────────────────────────────────────────
# REPORTING
# ─────────────────────────────────────────────────────────────────────────────

TREND_ICON = {"rising": "^", "stable": "-", "declining": "v"}
TREND_COLOR = {"rising": "\033[92m", "stable": "\033[93m", "declining": "\033[91m"}
RESET = "\033[0m"

def print_report(results: list[dict]):
    print()
    print("-" * 80)
    header = f"  {'Idea':<28}{'Category':<16}{'Revival':>8}{'Karma':>8}{'State':<12}{'Trend':>8}{'Peak':>6}"
    print(header)
    print("-" * 80)

    by_category = defaultdict(list)
    for r in results:
        by_category[r["category"]].append(r)

    total_prob = 0
    for category, items in sorted(by_category.items()):
        for r in sorted(items, key=lambda x: -x["prob"]):
            trend_icon  = TREND_ICON.get(r["trend"], "?")
            trend_color = TREND_COLOR.get(r["trend"], "")
            total_prob += r["prob"]
            print(
                f"  {r['name']:<28}{r['category']:<16}"
                f"{r['prob']:>7.1f}%{r['karma']:>8.4f}"
                f"  {r['state']:<12}"
                f"  {trend_color}{trend_icon} {r['trend']:<10}{RESET}"
                f"{r['peak']:>6}"
            )
        print()

    print("-" * 80)
    avg = total_prob / len(results) if results else 0
    rising    = sum(1 for r in results if r["trend"] == "rising")
    stable    = sum(1 for r in results if r["trend"] == "stable")
    declining = sum(1 for r in results if r["trend"] == "declining")
    print(f"  Total seeded : {len(results)}")
    print(f"  Avg revival  : {avg:.1f}%")
    print(f"  Rising ^: {rising}  |  Stable -: {stable}  |  Declining v: {declining}")
    print("-" * 80)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

async def main(clear: bool, dry_run: bool):
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name   = os.getenv("DATABASE_NAME", "influence_db")

    mode = "DRY RUN" if dry_run else ("CLEAR + SEED" if clear else "UPSERT SEED")
    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║       INFLUENCE SIMULATOR — DATABASE SEED SCRIPT             ║")
    print(f"║  Mode: {mode:<55}║")
    print(f"║  Target: {db_name:<53}║")
    print(f"║  Ideas: {len(SEED_IDEAS):<54}║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()

    if dry_run:
        print("  ℹ️  DRY RUN — no writes to MongoDB.\n")
    else:
        print(f"  🔌 Connecting to MongoDB Atlas...")
        client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=10000)
        try:
            await client.admin.command("ping")
            print(f"  ✅ Connected to {db_name}\n")
        except Exception as e:
            print(f"  ❌ MongoDB connection failed: {e}")
            print(f"  Check MONGODB_URI in backend/.env")
            client.close()
            return
        db = client[db_name]

        if clear:
            await clear_database(db)

    results = []
    failed  = []

    print(f"  ⚡ Running ML predictions for {len(SEED_IDEAS)} ideas...\n")
    for i, (idea_name, category) in enumerate(SEED_IDEAS, 1):
        label = f"  [{i:02d}/{len(SEED_IDEAS)}]"
        print(f"{label} {idea_name:<30}", end="", flush=True)

        if dry_run:
            record = await seed_idea(None, idea_name, category, dry_run=True)
        else:
            record = await seed_idea(db, idea_name, category, dry_run=False)

        if record:
            results.append(record)
            trend_icon = TREND_ICON.get(record["trend"], "?")
            print(f"  {record['prob']:>5.1f}%  {record['state']:<10} {trend_icon}")
        else:
            failed.append(idea_name)
            print("  FAILED")

    if not dry_run:
        client.close()

    print_report(results)

    if failed:
        print(f"\n  ⚠️  Failed ideas ({len(failed)}): {', '.join(failed)}")

    action = "would be written" if dry_run else "written"
    print(f"\n  ✅ Done. {len(results)} records {action} to MongoDB.\n")


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed the Influence Simulator MongoDB database with ML-generated idea predictions."
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Wipe the ideas, predictions, and idea_states collections before seeding.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run ML predictions and print the report without writing to MongoDB.",
    )
    args = parser.parse_args()
    asyncio.run(main(clear=args.clear, dry_run=args.dry_run))
