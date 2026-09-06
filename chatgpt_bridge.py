from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os, httpx

app = FastAPI(title="ChatGPT Agnes Bridge")
AGNES_URL = os.getenv("AGNES_URL", "http://127.0.0.1:8765")

class GenerateRequest(BaseModel):
    prompt: str
    duration: int = 5
    resolution: str = "768x1152"
    mode: str = "t2v"

@app.get("/api/chatgpt/health")
async def health():
    return {"ok": True, "service": "chatgpt-agnes-bridge"}

@app.post("/api/chatgpt/generate")
async def generate(req: GenerateRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "prompt is required")
    data = {
        "prompt": req.prompt,
        "mode": req.mode,
        "duration": str(req.duration),
        "resolution": req.resolution,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(f"{AGNES_URL}/api/tasks/simple", data=data)
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text[:1000])
    return r.json()
