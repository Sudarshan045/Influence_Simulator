from sqlalchemy import Column, Integer, String
from app.database import Base

class Idea(Base):
    __tablename__ = "ideas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
