# Influence Simulator

> **Enterprise-grade AI-powered cultural forecasting platform.**  
> Predicts how ideas evolve through cultural lifecycle stages using probabilistic modeling, Markov chains, and a trained ML model with a Karma Engine.

---

## Project Structure

```
influence-ui/
│
├── src/                          # React Frontend (Vite + Tailwind)
│   ├── context/                  # AuthContext, NotificationContext, SimulationHistoryContext
│   ├── pages/                    # Dashboard, Simulator, Rankings, Trends, Comparison, SavedSimulations, Login, Signup
│   ├── components/               # Layout (Navbar, Sidebar), Charts, UI primitives
│   ├── services/api.js           # API layer (mock → ready for backend integration)
│   ├── hooks/useSimulation.js    # Simulation state management hook
│   └── constants/ideas.js        # Mock data + scenario presets
│
├── backend/                      # FastAPI Backend + PostgreSQL
│   ├── app/
│   │   ├── main.py               # FastAPI app entrypoint
│   │   ├── database.py           # SQLAlchemy + PostgreSQL config
│   │   ├── models/               # ORM: Idea, Prediction, IdeaState
│   │   ├── routes/               # simulation_routes.py, idea_routes.py
│   │   └── services/             # markov.py, ml_stub.py, heap.py
│   ├── run.py                    # uvicorn runner
│   └── requirements.txt
│
└── Influende Simulator/          # Real ML Engine (Python)
    ├── predict.py                # Core prediction function
    ├── karma_engine.py           # Karma score + probability adjuster
    ├── feature_engineering.py    # Feature extraction pipeline
    ├── train_model.py            # Model training script
    ├── api.py                    # Standalone FastAPI for ML predictions
    ├── data/
    │   ├── ideas_dataset.csv     # Raw training data
    │   └── processed_features.csv
    └── model/
        ├── revival_model.pkl     # Trained scikit-learn classifier
        ├── scaler.pkl            # Feature scaler
        └── predictions.json      # Sample real predictions
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v3 |
| Routing | React Router v7 |
| Charts | Chart.js + react-chartjs-2 |
| Backend | FastAPI + Uvicorn |
| Database | PostgreSQL + SQLAlchemy |
| ML Engine | scikit-learn, pandas, numpy |
| ML API | FastAPI (standalone) |

---

## Application Modules

| Module | Status |
|---|---|
| Authentication (Login / Signup / Protected Routes) | ✅ Complete |
| Dashboard (Stats, Leaderboard, Quick Actions) | ✅ Complete |
| Idea Simulator + Lifecycle Visualization | ✅ Complete |
| Scenario Engine (Sliders → Karma Engine) | ✅ Complete |
| AI Predictions Panel | ✅ Complete |
| Comparison Module (up to 4 ideas) | ✅ Complete |
| Real-time Trends Panel (Live Ticker + Sparklines) | ✅ Complete |
| Rankings Leaderboard | ✅ Complete |
| Notification System (Bell, Dropdown, Revival Alerts) | ✅ Complete |
| Saved Simulations (LocalStorage + History) | ✅ Complete |
| Backend API (FastAPI + PostgreSQL) | ✅ Structured |
| ML Engine (Karma + Markov + Classifier) | ✅ Trained |
| Frontend ↔ Backend Integration | 🔄 In Progress |

---

## How to Run

### Frontend

```bash
cd influence-ui
npm install
npm run dev
```

Visit `http://localhost:5173`

**Demo credentials:**
- Email: `demo@influence.ai`
- Password: `password123`

---

### Backend (FastAPI + PostgreSQL)

```bash
cd influence-ui/backend
pip install -r requirements.txt
python run.py
```

Runs at `http://localhost:8000`

**Database:** Requires PostgreSQL running locally.  
Connection string in `app/database.py`:
```
postgresql://postgres:<password>@localhost:5432/influence_db
```

**API Endpoints:**
| Method | Route | Description |
|---|---|---|
| `POST` | `/add_idea` | Add idea to DB |
| `POST` | `/simulate` | Run Markov + store prediction |
| `GET` | `/ideas` | All ideas |
| `GET` | `/predictions` | All predictions |
| `GET` | `/rank` | Top 5 by revival probability |
| `GET` | `/full-data` | Joined ideas + predictions |
| `GET` | `/analytics` | Summary stats |
| `GET` | `/history/{idea_id}` | State history |

---

### ML Engine (Standalone FastAPI)

```bash
cd "influence-ui/Influende Simulator"
pip install fastapi uvicorn scikit-learn pandas numpy
uvicorn api:app --reload --port 8001
```

Runs at `http://localhost:8001`

**Endpoint:**
```
GET /predict/{idea_name}
```

**Supported ideas (trained model):** `Stoicism`, `Minimalism`, `Nihilism`

**Sample response:**
```json
{
  "idea": "Stoicism",
  "current_state": "Peak",
  "base_probability": 0.3343,
  "karma_score": 0.731,
  "adjusted_probability": 0.3652,
  "peak_year_estimate": 2035,
  "confidence_score": 0.3314,
  "feature_scores": { "trend_score": 75.97, "momentum": 6.39 },
  "karma_breakdown": { "mental_health_index": 0.68, "economic_instability": 0.525 }
}
```

---

## Architecture Overview

```
React Frontend
     │
     ├── Auth: Mock token (localStorage)
     ├── Scenario Sliders → map to KarmaEngine params
     └── src/services/api.js
              │
              ├── [MOCK] Math.random() — currently active
              │
              ├── [PLANNED] → FastAPI Backend (port 8000)
              │       └── Markov Chain + PostgreSQL storage
              │
              └── [PLANNED] → ML Engine API (port 8001)
                      └── Karma Engine + sklearn classifier
```

---

## Idea Lifecycle

```
Birth → Growth → Peak → Decline → Dormancy → Revival
```

Transitions are governed by a **Markov chain** in `markov.py`.  
Revival probability is adjusted by the **Karma Engine** — a weighted model that accounts for:
- Mental health index
- Economic instability
- Productivity culture
- Social fragmentation

---

## ML Model Details

- **Algorithm**: scikit-learn classifier (see `model_report.txt` for accuracy)
- **Features**: trend_score, momentum, growth_rate, rolling_avg_3/6, engagement_rate, sentiment, dormancy_flag, revival_signal
- **Trained ideas**: Stoicism, Minimalism, Nihilism
- **Output**: `adjusted_probability` (0–1), `peak_year_estimate`, `confidence_score`
