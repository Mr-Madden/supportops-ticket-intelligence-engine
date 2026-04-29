from sqlalchemy import Column, Integer, String, Text
from app.db.session import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(255))
    body = Column(Text)
    summary = Column(Text)
    sentiment = Column(String(50))
    tags = Column(String(255))
