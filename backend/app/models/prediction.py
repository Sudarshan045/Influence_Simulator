from sqlalchemy import Column, Integer, Float, String, ForeignKey
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True)
    idea_id = Column(Integer, ForeignKey("ideas.id"))
    revival_probability = Column(Float)
    peak_time = Column(String)
    confidence_score = Column(Float)   # ✅ ADD THIS LINE
