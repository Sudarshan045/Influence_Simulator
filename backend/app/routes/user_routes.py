from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.models.user import UserCreate
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/sync")
async def sync_user(user: UserCreate, db=Depends(get_db)):
    users_collection = db["users"]
    
    existing_user = await users_collection.find_one({"uid": user.uid})
    
    if existing_user:
        # Update last login
        update_data = user.dict(exclude_unset=True)
        update_data["last_login"] = datetime.utcnow()
        await users_collection.update_one(
            {"uid": user.uid},
            {"$set": update_data}
        )
        return {"message": "User updated", "uid": user.uid}
    else:
        # Create new user
        new_user = user.dict()
        new_user["created_at"] = datetime.utcnow()
        new_user["last_login"] = datetime.utcnow()
        await users_collection.insert_one(new_user)
        return {"message": "User created", "uid": user.uid}
