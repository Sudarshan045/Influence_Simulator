from fastapi import FastAPI, HTTPException
from predict import predict

app = FastAPI(
    title="Influence Simulator API",
    description="ML Prediction Service for Idea Revival",
    version="1.0"
)

# Root route (test)
@app.get("/")
def home():
    return {"message": "Influence Simulator API is running"}

# 🔥 MAIN ENDPOINT
@app.get("/predict/{idea_name}")
def get_prediction(idea_name: str):
    try:
        result = predict(idea_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))