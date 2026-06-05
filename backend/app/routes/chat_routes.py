from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
import os

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
async def chat_with_ai(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    client = Groq(api_key=api_key)
    
    system_prompt = """
    You are the 'Influence Analyst', an AI assistant integrated into the Influence Simulator dashboard.
    The Influence Simulator predicts the cultural lifecycle of ideas (Birth, Growth, Peak, Decline, Dormancy, Revival) using Markov Chains, Heaps, and a custom Karma Engine.
    The Karma Engine adjusts probabilities based on factors like Mental Health Index, Economic Instability, Productivity Culture, and Social Fragmentation.
    Answer user questions accurately and concisely about trends, simulations, or how the app works. Be insightful, slightly futuristic in tone, and helpful.
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            temperature=0.7,
            max_tokens=500,
        )
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
