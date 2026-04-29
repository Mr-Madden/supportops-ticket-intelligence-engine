import asyncio
from app.shared.llm import runLLM
from app.shared.pii import scrubPII

async def analyze_ticket(ticket: dict):
    clean_text = scrubPII(ticket.get("body", ""))
    summary = await runLLM(f"Summarize this support ticket:\n{clean_text}")
    sentiment = await runLLM(f"Classify sentiment (positive, neutral, negative):\n{clean_text}")
    tags = await runLLM(f"Generate 3 tags for this ticket:\n{clean_text}")
    return {"summary": summary, "sentiment": sentiment, "tags": tags}
