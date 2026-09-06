from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import os, httpx

app = FastAPI(title="ChatGPT Agnes Bridge", version="1.0.0")
AGNES_URL = os.getenv("AGNES_URL", "https://agnes-dockerhub-production.up.railway.app").rstrip("/")
BRIDGE_TOKEN = os.getenv("BRIDGE_TOKEN", "")

class GenerateRequest(BaseModel):
    prompt: str
    duration: int = 5
    resolution: str = "768x1152"
    mode: str = "t2v"

def auth(authorization: str | None = None, x_bridge_token: str | None = None):
    token = x_bridge_token
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not BRIDGE_TOKEN or token != BRIDGE_TOKEN:
        raise HTTPException(401, "Unauthorized")

@app.get("/healthz")
async def healthz():
    return {"ok": True, "service": "chatgpt-agnes-bridge"}

@app.get("/api/chatgpt/health")
async def health():
    return {"ok": True, "service": "chatgpt-agnes-bridge"}

@app.post("/api/chatgpt/generate")
async def generate(req: GenerateRequest, authorization: str | None = Header(default=None), x_bridge_token: str | None = Header(default=None)):
    auth(authorization, x_bridge_token)
    if not req.prompt.strip():
        raise HTTPException(400, "prompt is required")
    data = {"prompt": req.prompt, "mode": req.mode, "duration": str(req.duration), "resolution": req.resolution}
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(f"{AGNES_URL}/api/tasks/simple", data=data)
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text[:1000])
    return r.json()

@app.get("/api/chatgpt/status/{task_id}")
async def status(task_id: str, authorization: str | None = Header(default=None), x_bridge_token: str | None = Header(default=None)):
    auth(authorization, x_bridge_token)
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{AGNES_URL}/api/tasks/{task_id}")
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text[:1000])
    return r.json()

@app.get("/api/chatgpt/video/{task_id}")
async def video(task_id: str, authorization: str | None = Header(default=None), x_bridge_token: str | None = Header(default=None)):
    auth(authorization, x_bridge_token)
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{AGNES_URL}/api/video/{task_id}")
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text[:1000])
    from fastapi.responses import Response
    return Response(content=r.content, media_type="video/mp4", headers={"Content-Disposition": f'attachment; filename="agnes-{task_id}.mp4"'})
