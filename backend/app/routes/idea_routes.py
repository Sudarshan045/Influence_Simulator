from fastapi import APIRouter, Depends
from app.database import get_db

router = APIRouter()

@router.post("/add_idea")
async def add_idea(name: str, category: str, db = Depends(get_db)):
    idea = {
        "name": name,
        "category": category
    }
    result = await db.ideas.insert_one(idea)
    
    return {
        "id": str(result.inserted_id),
        "name": name,
        "category": category
    }
