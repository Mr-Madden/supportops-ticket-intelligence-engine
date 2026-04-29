import asyncio

async def runLLM(prompt: str) -> str:
    await asyncio.sleep(0.2)
    return f"[AI simulated output for prompt: {prompt[:50]}...]"
