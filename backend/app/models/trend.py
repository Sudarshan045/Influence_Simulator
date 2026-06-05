from sqlalchemy import Column, Integer, Float, ForeignKey
from app.database import Base

class Trend(Base):
    __tablename__ = "trends"

    id = Column(Integer, primary_key=True)
    idea_id = Column(Integer, ForeignKey("ideas.id"))
    popularity_score = Column(Float)
    sentiment_score = Column(Float)
