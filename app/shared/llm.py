import asyncio
import httpx
from app.core.config import settings

async def runLLM(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are an AI assistant for customer support analysis."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 200
            }
        )
        data = response.json()
        return data["choices"][0]["message"]["content"]
