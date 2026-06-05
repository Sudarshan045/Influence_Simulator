from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
from app.database import get_db
from app.services.ml_engine.predict import predict, STATES
from app.services.heap import rank_ideas
from app.services.llm_enrich import enrich_idea_meta

router = APIRouter()


# ─────────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────────

class ScenarioInput(BaseModel):
    economicConditions:   Optional[float] = 50.0
    mentalHealthIndex:    Optional[float] = 50.0
    socialTrendIntensity: Optional[float] = 50.0
    productivityCulture:  Optional[float] = 50.0
    socialFragmentation:  Optional[float] = 50.0
    region:               Optional[str]   = "Global"

class SimulateRequest(BaseModel):
    idea:     str
    scenario: Optional[ScenarioInput] = None
    liveDataEnabled: Optional[bool] = False


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _extract_scenario(scenario: Optional[ScenarioInput]):
    """Normalise scenario sliders from 0-100 range to 0.0-1.0 for the ML engine."""
    if scenario is None:
        return 0.5, 0.5, 0.5, 0.5, 0.5

    def _clamp(v: float) -> float:
        return max(0.0, min(1.0, v / 100.0))

    return (
        _clamp(scenario.mentalHealthIndex),
        _clamp(scenario.economicConditions),
        _clamp(scenario.productivityCulture),
        _clamp(scenario.socialFragmentation),
        _clamp(scenario.socialTrendIntensity),
    )


def _markov_to_progression(markov_simulation: list, prob_percent: float) -> list:
    """
    Derive lifecycle progression values from the Markov simulation matrix.
    Each value represents the *peak probability* of being in that state
    across all 12 simulation steps, scaled to percentage.

    States order: Birth, Growth, Peak, Decline, Dormancy, Revival
    """
    if not markov_simulation or len(markov_simulation) < 2:
        return [20, 40, 80, 50, 10, round(prob_percent, 1)]

    num_states = len(STATES)
    peak_per_state = [0.0] * num_states

    for step in markov_simulation:
        for i in range(min(num_states, len(step))):
            if step[i] > peak_per_state[i]:
                peak_per_state[i] = step[i]

    # Scale to 0-100 and round, ensuring Revival reflects the model probability
    progression = [round(v * 100, 1) for v in peak_per_state]
    # Anchor the Revival stage to the model's adjusted probability for consistency
    progression[-1] = round(prob_percent, 1)
    return progression


def _build_response(idea_name: str, result: dict, prob_percent: float, conf: float) -> dict:
    """
    Build a fully-typed, flat response contract.
    All keys are documented here — the frontend should never dig into raw_ml_result.
    """
    states = STATES  # ["Birth", "Growth", "Peak", "Decline", "Dormancy", "Revival"]

    markov_data = result.get("markov_simulation")
    progression = _markov_to_progression(markov_data, prob_percent)

    feature_scores = result.get("feature_scores", {})
    karma_breakdown = result.get("karma_breakdown", {})

    return {
        # ── Core prediction ──────────────────────────────────────────
        "idea":                idea_name,
        "revival_probability": prob_percent,
        "current_state":       result["current_state"],
        "peak_year_estimate":  result["peak_year_estimate"],
        "confidence_score":    conf,

        # ── Lifecycle data ───────────────────────────────────────────
        "states":              states,
        "progressionValues":   progression,

        # ── Karma ────────────────────────────────────────────────────
        "karma_score":         round(result["karma_score"] * 100, 2),  # surface as %
        "karma_breakdown":     karma_breakdown,
        "karma_match_type":    karma_breakdown.get("_match_type", "default"),

        # ── Markov Chain simulation (12-step state probability matrix) ─
        "markov_simulation":   markov_data,
        "markov_modifier":     result.get("markov_modifier", {}),

        # ── ML feature signals ───────────────────────────────────────
        "feature_scores":      feature_scores,

        # ── Human-readable explanation ───────────────────────────────
        "explanation": (
            f"Karma Score: {round(result['karma_score'], 3)} | "
            f"Base: {round(result['base_probability'] * 100, 1)}% | "
            f"Adjusted: {prob_percent}% | "
            f"Current Phase: {result['current_state']} | "
            f"Projected Peak: {result['peak_year_estimate']}"
        ),

        # ── Metadata from DB (if available) ──────────────────────────
        "meta": result.get("meta"),

        # ── Raw ML output (advanced/debug use only) ──────────────────
        "raw_ml_result": result,
    }


# ─────────────────────────────────────────────
# 🚀  CORE SIMULATION ENDPOINT
# ─────────────────────────────────────────────

@router.post("/simulate_idea")
async def simulate_idea(req: SimulateRequest, db=Depends(get_db)):
    idea_name = req.idea.strip()
    if not idea_name:
        raise HTTPException(status_code=422, detail="Idea name cannot be empty.")

    mental, economic, productivity, fragmentation, social = _extract_scenario(req.scenario)
    region = req.scenario.region if req.scenario else "Global"

    try:
        result = predict(
            idea_name=idea_name,
            mental_health_index=mental,
            economic_instability=economic,
            productivity_culture=productivity,
            social_fragmentation=fragmentation,
            live_data_enabled=getattr(req, 'liveDataEnabled', False),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction engine error: {e}")

    prob_percent = round(result["adjusted_probability"] * 100, 2)
    conf         = round(result["confidence_score"] * 100, 2)
    peak_y       = str(result["peak_year_estimate"])
    now          = datetime.now(timezone.utc)

    # ── Upsert idea in DB ──────────────────────────────────────────────
    idea_obj = await db.ideas.find_one({"name": idea_name})
    
    meta_data = None
    if not idea_obj or "description" not in idea_obj:
        # Generate metadata using LLM if it's new or lacks description
        meta_data = enrich_idea_meta(idea_name, current_state=result["current_state"], revival_probability=prob_percent)
    else:
        meta_data = {
            "category": idea_obj.get("category", "General"),
            "description": idea_obj.get("description"),
            "meaning": idea_obj.get("meaning"),
            "origin_year": idea_obj.get("origin_year"),
            "historical_context": idea_obj.get("historical_context"),
            "key_events": idea_obj.get("key_events"),
            "year_data": idea_obj.get("year_data"),
        }

    if not idea_obj:
        insert_data = {
            "name":     idea_name,
            "category": meta_data.get("category", "Generated") if meta_data else "Generated",
            "created_at": now,
        }
        if meta_data:
            insert_data.update({
                "description": meta_data.get("description"),
                "meaning": meta_data.get("meaning"),
                "origin_year": meta_data.get("origin_year"),
                "historical_context": meta_data.get("historical_context"),
                "key_events": meta_data.get("key_events"),
                "year_data": meta_data.get("year_data"),
            })
        res = await db.ideas.insert_one(insert_data)
        idea_id = str(res.inserted_id)
    else:
        idea_id = str(idea_obj["_id"])
        # Update existing idea with new meta if we generated it
        if meta_data and "description" not in idea_obj:
            await db.ideas.update_one({"_id": idea_obj["_id"]}, {"$set": {
                "category": meta_data.get("category", idea_obj.get("category")),
                "description": meta_data.get("description"),
                "meaning": meta_data.get("meaning"),
                "origin_year": meta_data.get("origin_year"),
                "historical_context": meta_data.get("historical_context"),
                "key_events": meta_data.get("key_events"),
                "year_data": meta_data.get("year_data"),
            }})
            
    # Attach meta to result so _build_response can use it
    result["meta"] = meta_data

    # ── Store prediction with full scenario context ────────────────────
    await db.predictions.insert_one({
        "idea_id":            idea_id,
        "revival_probability": prob_percent,
        "peak_time":           peak_y,
        "confidence_score":    conf,
        "karma_score":         result["karma_score"],
        "current_state":       result["current_state"],
        "region":              region,
        "scenario": {
            "economicConditions":   req.scenario.economicConditions if req.scenario else 50,
            "mentalHealthIndex":    req.scenario.mentalHealthIndex if req.scenario else 50,
            "socialTrendIntensity": req.scenario.socialTrendIntensity if req.scenario else 50,
            "productivityCulture":  req.scenario.productivityCulture if req.scenario else 50,
            "socialFragmentation":  req.scenario.socialFragmentation if req.scenario else 50,
        },
        "created_at": now,
    })

    # ── Store state event ──────────────────────────────────────────────
    await db.idea_states.insert_one({
        "idea_id":    idea_id,
        "state":      result["current_state"],
        "created_at": now,
    })

    return _build_response(idea_name, result, prob_percent, conf)


# ─────────────────────────────────────────────
# 📊  IDEAS ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/ideas")
async def get_all_ideas(db=Depends(get_db)):
    cursor = db.ideas.find({})
    ideas  = await cursor.to_list(length=200)
    return [
        {"id": str(i["_id"]), "name": i["name"], "category": i["category"]}
        for i in ideas
    ]


@router.get("/ideas/search")
async def search_ideas(q: str = "", db=Depends(get_db)):
    """
    Live search endpoint for the Simulator auto-suggest feature.
    Returns ideas whose names contain the query string (case-insensitive).
    """
    if not q or len(q) < 2:
        # Return all if no query
        cursor = db.ideas.find({}).limit(20)
    else:
        cursor = db.ideas.find(
            {"name": {"$regex": q, "$options": "i"}}
        ).limit(10)

    ideas = await cursor.to_list(length=20)
    # Enrich with latest prediction score
    result = []
    for idea in ideas:
        idea_id = str(idea["_id"])
        latest_pred = await db.predictions.find_one(
            {"idea_id": idea_id},
            sort=[("created_at", -1)]
        )
        result.append({
            "id":                  idea_id,
            "name":                idea["name"],
            "category":            idea["category"],
            "revivalProbability":  latest_pred["revival_probability"] if latest_pred else None,
        })
    return result


# ─────────────────────────────────────────────
# 📈  PREDICTIONS
# ─────────────────────────────────────────────

@router.get("/predictions")
async def get_predictions(db=Depends(get_db)):
    cursor = db.predictions.find({}).sort("created_at", -1)
    predictions = await cursor.to_list(length=200)
    return [{
        "idea_id":            p["idea_id"],
        "revival_probability": p["revival_probability"],
        "peak_time":           p["peak_time"],
        "confidence":          p.get("confidence_score", 0),
        "current_state":       p.get("current_state", "Unknown"),
        "created_at":          p.get("created_at", "").isoformat() if p.get("created_at") else "",
    } for p in predictions]


# ─────────────────────────────────────────────
# 🏆  HEAP-RANKED IDEAS
# ─────────────────────────────────────────────

@router.get("/rank")
async def rank(db=Depends(get_db)):
    cursor = db.predictions.find({})
    predictions = await cursor.to_list(length=500)
    data = [(p["revival_probability"], p["idea_id"]) for p in predictions]
    top  = rank_ideas(data)
    return [{"idea_id": idea_id, "score": score} for score, idea_id in top]


# ─────────────────────────────────────────────
# 📊  FULL DATA (Dashboard / Rankings / Trends)
# ─────────────────────────────────────────────

@router.get("/full-data")
async def full_data(db=Depends(get_db)):
    """
    Returns one enriched record per unique idea, using the LATEST prediction
    (sorted by `created_at` timestamp) via a MongoDB aggregation pipeline.
    Results are sorted by revival_probability descending (Heap logic).
    """
    # Step 1: Get ideas
    ideas_cursor = db.ideas.find({})
    ideas        = await ideas_cursor.to_list(length=500)
    idea_map     = {str(i["_id"]): i for i in ideas}

    if not idea_map:
        return []

    # Step 2: Get latest prediction per idea via aggregation
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id":                "$idea_id",
            "revival_probability": {"$first": "$revival_probability"},
            "peak_time":           {"$first": "$peak_time"},
            "confidence_score":    {"$first": "$confidence_score"},
            "karma_score":         {"$first": "$karma_score"},
            "current_state":       {"$first": "$current_state"},
            "created_at":          {"$first": "$created_at"},
        }},
        {"$sort": {"revival_probability": -1}},
    ]
    cursor = db.predictions.aggregate(pipeline)
    latest_preds = await cursor.to_list(length=500)

    result = []
    for p in latest_preds:
        idea_id = p["_id"]
        if idea_id not in idea_map:
            continue

        idea         = idea_map[idea_id]
        prob         = p["revival_probability"]
        conf         = p.get("confidence_score", 50)
        state        = p.get("current_state", "Birth")
        karma        = p.get("karma_score", 0.5)
        trend        = (
            "rising"   if prob > 65 else
            "declining" if prob < 40 else
            "stable"
        )

        # Approximate progression from probability + state context
        state_idx = STATES.index(state) if state in STATES else 0
        progression = [
            round(max(5,  min(100, 15 + state_idx * 5)),  1),  # Birth
            round(max(10, min(100, 30 + state_idx * 8)),  1),  # Growth
            round(max(20, min(100, 55 + karma * 30)),     1),  # Peak
            round(max(10, min(100, 45 - state_idx * 5)), 1),  # Decline
            round(max(5,  min(100, 10 + (1 - karma) * 20)), 1),  # Dormancy
            round(prob, 1),                                      # Revival
        ]
        
        desc = idea.get("description", f"AI Forecast: Projected peak in {p['peak_time']}. Current phase: {state}.")
        if "AI Forecast" not in desc:
            desc = desc + f" AI Forecast: Projected peak in {p['peak_time']}."

        result.append({
            "id":                 idea_id,
            "name":               idea["name"],
            "category":           idea.get("category", "General"),
            "revivalProbability": prob,
            "trendScore":         round(conf / 10, 1),
            "trend":              trend,
            "current_state":      state,
            "description":        desc,
            "states":             STATES,
            "progressionValues":  progression,
        })

    return result


# ─────────────────────────────────────────────
# 📈  ANALYTICS
# ─────────────────────────────────────────────

@router.get("/analytics")
async def analytics(db=Depends(get_db)):
    count = await db.predictions.count_documents({})
    if count == 0:
        return {
            "total_simulations":          0,
            "unique_ideas":               0,
            "average_revival_probability": 0,
            "highest_revival":             0,
            "rising_ideas":                0,
        }

    pipeline = [
        {"$group": {
            "_id":          None,
            "avg_prob":     {"$avg": "$revival_probability"},
            "max_prob":     {"$max": "$revival_probability"},
            "rising_count": {"$sum": {"$cond": [{"$gt": ["$revival_probability", 65]}, 1, 0]}},
        }}
    ]
    cursor = db.predictions.aggregate(pipeline)
    res    = await cursor.to_list(length=1)
    agg    = res[0] if res else {}

    unique_ideas = await db.ideas.count_documents({})

    return {
        "total_simulations":           count,
        "unique_ideas":                unique_ideas,
        "average_revival_probability": round(agg.get("avg_prob", 0), 2),
        "highest_revival":             round(agg.get("max_prob", 0), 2),
        "rising_ideas":                agg.get("rising_count", 0),
    }


# ─────────────────────────────────────────────
# 📜  IDEA STATE HISTORY
# ─────────────────────────────────────────────

@router.get("/history/{idea_id}")
async def history(idea_id: str, db=Depends(get_db)):
    cursor = db.idea_states.find(
        {"idea_id": idea_id},
        sort=[("created_at", 1)]
    )
    states = await cursor.to_list(length=200)
    return [{
        "state":      s["state"],
        "created_at": s.get("created_at", "").isoformat() if s.get("created_at") else "",
    } for s in states]


# ─────────────────────────────────────────────
# 🌍  GLOBAL TRENDS
# ─────────────────────────────────────────────

@router.get("/global-trends")
async def global_trends(db=Depends(get_db)):
    """
    Top 10 ideas by revival probability, enriched with live ML scores.
    Uses Heap-ranked predictions from DB, re-runs predict() for Markov data.
    """
    # Heap-ranked from DB
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id":                "$idea_id",
            "revival_probability": {"$first": "$revival_probability"},
            "current_state":       {"$first": "$current_state"},
        }},
        {"$sort": {"revival_probability": -1}},
        {"$limit": 10},
    ]
    cursor      = db.predictions.aggregate(pipeline)
    top_preds   = await cursor.to_list(length=10)

    results = []
    for p in top_preds:
        idea = await db.ideas.find_one({"_id": ObjectId(p["_id"])})
        if not idea:
            continue

        idea_name = idea["name"]
        try:
            res           = predict(idea_name)
            prob          = round(res["adjusted_probability"] * 100, 2)
            momentum_val  = res["feature_scores"]["momentum"]
            momentum_sign = "+" if momentum_val >= 0 else ""
            karma         = res["karma_score"]

            results.append({
                "id":               str(p["_id"]),
                "name":             idea_name,
                "region":           "Global",
                "probability":      prob,
                "momentum":         f"{momentum_sign}{int(momentum_val * 100)}%",
                "status":           res["current_state"].lower(),
                "karma_score":      round(karma * 100, 1),
                "progressionValues": _markov_to_progression(
                    res.get("markov_simulation"), prob
                ),
            })
        except Exception:
            pass

    return results


# ─────────────────────────────────────────────
# 🗺️  REGIONAL TRENDS
# ─────────────────────────────────────────────

@router.get("/regional-trends")
async def regional_trends(db=Depends(get_db)):
    """
    Groups latest top ideas by region (round-robin assignment from DB order).
    """
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id":                "$idea_id",
            "revival_probability": {"$first": "$revival_probability"},
        }},
        {"$sort": {"revival_probability": -1}},
        {"$limit": 20},
    ]
    cursor = db.predictions.aggregate(pipeline)
    preds  = await cursor.to_list(length=20)

    ideas_list = []
    for p in preds:
        idea = await db.ideas.find_one({"_id": ObjectId(p["_id"])})
        if idea:
            ideas_list.append(idea["name"])

    if not ideas_list:
        ideas_list = ["Absurdism", "Stoicism", "Minimalism", "Cyberpunk Fashion"]

    region_keys = ["North America", "Europe", "Asia", "Global"]
    response    = {k: [] for k in region_keys}

    for i, idea_name in enumerate(ideas_list):
        region = region_keys[i % len(region_keys)]
        try:
            res  = predict(idea_name)
            prob = round(res["adjusted_probability"] * 100, 2)
            response[region].append({
                "idea":          idea_name,
                "score":         prob,
                "status":        res["current_state"].lower(),
                "karma_score":   round(res["karma_score"] * 100, 1),
            })
        except Exception:
            pass

    return response


# ─────────────────────────────────────────────
# ➕  ADD NEW IDEA TO CATALOGUE
# ─────────────────────────────────────────────

class AddIdeaRequest(BaseModel):
    name:                str
    category:            Optional[str] = "General"
    revival_probability: Optional[float] = None
    current_state:       Optional[str] = None

@router.post("/ideas/add")
async def add_idea(req: AddIdeaRequest, db=Depends(get_db)):
    """Add a newly simulated idea to the permanent catalogue."""
    idea_name = req.name.strip()
    if not idea_name:
        raise HTTPException(status_code=422, detail="Idea name cannot be empty.")

    existing = await db.ideas.find_one({"name": idea_name})
    if existing:
        return {"status": "exists", "id": str(existing["_id"]), "name": idea_name}

    now = datetime.now(timezone.utc)
    res = await db.ideas.insert_one({
        "name":       idea_name,
        "category":   req.category or "General",
        "created_at": now,
        "updated_at": now,
    })
    return {"status": "created", "id": str(res.inserted_id), "name": idea_name}
