from fastapi import APIRouter
from app.services.ticket_analyzer import analyze_ticket

router = APIRouter(prefix="/analyze", tags=["Analyze"])

@router.post("/")
async def analyze(ticket: dict):
    result = await analyze_ticket(ticket)
    return result
