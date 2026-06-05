from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None
    provider: Optional[str] = None
    role: Optional[str] = "Analyst"

class UserCreate(UserBase):
    pass

class UserInDB(UserBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)
