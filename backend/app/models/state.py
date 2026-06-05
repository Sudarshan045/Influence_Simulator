from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class IdeaState(Base):
    __tablename__ = "idea_states"

    id = Column(Integer, primary_key=True)
    idea_id = Column(Integer, ForeignKey("ideas.id"))
    state = Column(String)
