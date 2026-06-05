"""
main.py — Influence Simulator FastAPI Application
=================================================
Startup lifecycle:
  1. Connect to MongoDB (motor async client is initialised in database.py)
  2. Auto-seed the database if the `ideas` collection is empty
     (prevents empty Rankings/Trends pages on first launch)
  3. Mount all API routers
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import idea_routes, simulation_routes, user_routes, chat_routes
from app.database import db


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP AUTO-SEED
# ─────────────────────────────────────────────────────────────────────────────

async def _auto_seed_if_empty():
    """
    If the ideas collection is empty (fresh install / first launch),
    run the seed script automatically so the UI has real data immediately.
    Skipped silently if data already exists to avoid overwriting user sims.
    """
    try:
        count = await db.ideas.count_documents({})
        if count > 0:
            print(f"[startup] DB already has {count} idea(s). Skipping auto-seed.")
            return

        print("[startup] Empty database detected — running auto-seed...")

        # Import here to avoid loading the ML model at module level unnecessarily
        from app.services.ml_engine.predict import predict
        from datetime import datetime, timezone

        SEED_CATALOGUE = [
            ("Stoicism", "Philosophy"),      ("Minimalism", "Philosophy"),
            ("Nihilism", "Philosophy"),      ("Absurdism", "Philosophy"),
            ("Existentialism", "Philosophy"),("Meditation", "Wellness"),
            ("Mindfulness", "Wellness"),     ("Biohacking", "Wellness"),
            ("Cold Therapy", "Wellness"),    ("Journaling", "Wellness"),
            ("Slow Living", "Lifestyle"),    ("Cottagecore", "Lifestyle"),
            ("Dark Academia", "Lifestyle"),  ("Goblin Mode", "Lifestyle"),
            ("Quiet Quitting", "Lifestyle"), ("Van Life", "Lifestyle"),
            ("Hustle Culture", "Lifestyle"), ("AI Ethics", "Technology"),
            ("Digital Detox", "Technology"), ("Cryptocurrency", "Technology"),
            ("Decentralization", "Technology"),("Y2K Aesthetic", "Aesthetics"),
            ("Cyberpunk", "Aesthetics"),     ("Vaporwave", "Aesthetics"),
            ("Lo-fi Music", "Creative"),     ("Anti-Consumerism", "Social"),
            ("Degrowth", "Social"),          ("Environmentalism", "Social"),
            ("Astrology", "Spirituality"),   ("Secular Buddhism", "Spirituality"),
            ("Remote Work", "Work"),         ("4-Day Work Week", "Work"),
            ("Work-Life Balance", "Work"),   ("FIRE Movement", "Lifestyle"),
            ("Privacy Technology", "Technology"),("Vinyl Revival", "Creative"),
            ("Breathwork", "Wellness"),      ("Frugal Hedonism", "Lifestyle"),
        ]

        CONDITIONS = {
            "mental_health_index":  0.80,
            "economic_instability": 0.70,
            "productivity_culture": 0.75,
            "social_fragmentation": 0.65,
        }
        STATES = ["Birth", "Growth", "Peak", "Decline", "Dormancy", "Revival"]

        seeded = 0
        for idea_name, category in SEED_CATALOGUE:
            try:
                result  = predict(idea_name=idea_name, **CONDITIONS)
                prob    = round(result["adjusted_probability"] * 100, 2)
                conf    = round(result["confidence_score"] * 100, 2)
                state   = result["current_state"]
                peak    = str(result["peak_year_estimate"]) if result["peak_year_estimate"] else "N/A"
                karma   = round(result["karma_score"], 4)
                trend   = "rising" if prob > 65 else "declining" if prob < 40 else "stable"
                now     = datetime.now(timezone.utc)

                # Markov-derived progression
                markov = result.get("markov_simulation") or []
                if markov:
                    peaks = [0.0] * len(STATES)
                    for step in markov:
                        for i in range(min(len(STATES), len(step))):
                            if step[i] > peaks[i]:
                                peaks[i] = step[i]
                    progression = [round(v * 100, 1) for v in peaks]
                    progression[-1] = round(prob, 1)
                else:
                    progression = [20, 40, 80, 50, 10, round(prob, 1)]

                res = await db.ideas.insert_one({
                    "name": idea_name, "category": category,
                    "created_at": now, "updated_at": now,
                })
                idea_id = str(res.inserted_id)

                await db.predictions.insert_one({
                    "idea_id":             idea_id,
                    "revival_probability": prob,
                    "peak_time":           peak,
                    "confidence_score":    conf,
                    "karma_score":         karma,
                    "current_state":       state,
                    "region":              "Global",
                    "seeded":              True,
                    "scenario":            CONDITIONS,
                    "progression":         progression,
                    "trend":               trend,
                    "created_at":          now,
                })

                await db.idea_states.insert_one({
                    "idea_id":    idea_id,
                    "state":      state,
                    "created_at": now,
                })

                seeded += 1
            except Exception as e:
                print(f"[startup] Seed failed for '{idea_name}': {e}")

        print(f"[startup] ✅ Auto-seed complete — {seeded}/{len(SEED_CATALOGUE)} ideas written.")

    except Exception as e:
        # Never block startup — if seed fails, app still runs
        print(f"[startup] ⚠️  Auto-seed error (non-fatal): {e}")


# ─────────────────────────────────────────────────────────────────────────────
# LIFESPAN
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await _auto_seed_if_empty()
    yield
    # (shutdown logic goes here if needed)


# ─────────────────────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Influence Simulator API",
    description="Cultural lifecycle forecasting engine powered by Markov Chains, Heap ranking, and the Karma Engine.",
    version="2.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(idea_routes.router)
app.include_router(simulation_routes.router)
app.include_router(user_routes.router)
app.include_router(chat_routes.router)
