from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import os, httpx

app = FastAPI(title="ChatGPT Agnes Bridge", version="1.2.0")
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

def _resolution(resolution: str):
    try:
        w, h = (int(x) for x in resolution.lower().split("x", 1))
        return w, h
    except Exception:
        return 768, 1152

@app.get("/healthz")
async def healthz():
    return {"ok": True, "service": "chatgpt-agnes-bridge", "version": "1.2.0"}

@app.get("/api/chatgpt/health")
async def health():
    return {"ok": True, "service": "chatgpt-agnes-bridge", "version": "1.2.0"}

@app.post("/api/chatgpt/generate")
async def generate(req: GenerateRequest, authorization: str | None = Header(default=None), x_bridge_token: str | None = Header(default=None)):
    auth(authorization, x_bridge_token)
    if not req.prompt.strip():
        raise HTTPException(400, "prompt is required")
    mode = req.mode.lower().strip()
    width, height = _resolution(req.resolution)
    if req.duration > 20:
        scene_count = max(2, (req.duration + 9) // 10)
        base = req.duration // scene_count
        remainder = req.duration % scene_count
        scene_durations = [base + (1 if i < remainder else 0) for i in range(scene_count)]
        data = {
            "idea": req.prompt,
            "creative_name": "ChatGPT Agnes Long Video",
            "style": "premium cinematic 3D animation",
            "chaining_mode": "keyframes",
            "video_width": str(width),
            "video_height": str(height),
            "duration_source": "manual",
            "scene_count": str(scene_count),
            "uniform_duration": "false",
            "scene_durations_json": "[" + ",".join(str(x) for x in scene_durations) + "]",
            "audio_enabled": "true",
            "audio_voice": "id-ID-ArdiNeural",
            "audio_rate": "+0%",
            "audio_lang": "id-ID",
            "subtitle_enabled": "false",
        }
        endpoint = f"{AGNES_URL}/api/tasks/creative"
    else:
        if mode == "cinematic":
            mode = "t2v"
        if mode not in {"t2v", "i2v", "ti2vid", "keyframes"}:
            raise HTTPException(422, f"Unsupported mode: {req.mode}")
        data = {"prompt": req.prompt, "mode": mode, "duration": str(req.duration), "resolution": req.resolution}
        endpoint = f"{AGNES_URL}/api/tasks/simple"
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(endpoint, data=data)
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
