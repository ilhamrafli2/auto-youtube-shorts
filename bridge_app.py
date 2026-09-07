from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import os, httpx

# Agnes long-video bridge: 50s requests become Creative Video scenes.
app = FastAPI(title="ChatGPT Agnes Bridge", version="1.4.0")
AGNES_URL = os.getenv("AGNES_URL", "https://agnes-dockerhub-production.up.railway.app").rstrip("/")
BRIDGE_TOKEN = os.getenv("BRIDGE_TOKEN", "")

class GenerateRequest(BaseModel):
    prompt: str
    duration: int = 5
    resolution: str = "1080x1920"
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
        return 1080, 1920

def _scene_durations(total: int):
    # Keep every Creative scene <= 10s for reliable generation.
    if total <= 20:
        return [total]
    count = max(2, (total + 9) // 10)
    base, rem = divmod(total, count)
    return [base + (1 if i < rem else 0) for i in range(count)]

@app.get("/healthz")
async def healthz():
    return {"ok": True, "service": "chatgpt-agnes-bridge", "version": "1.4.0"}

@app.get("/api/chatgpt/health")
async def health():
    return {"ok": True, "service": "chatgpt-agnes-bridge", "version": "1.4.0"}

@app.post("/api/chatgpt/generate")
@app.post("/generate")
async def generate(req: GenerateRequest, authorization: str | None = Header(default=None), x_bridge_token: str | None = Header(default=None)):
    auth(authorization, x_bridge_token)
    if not req.prompt.strip():
        raise HTTPException(400, "prompt is required")
    mode = req.mode.lower().strip()
    width, height = _resolution(req.resolution)

    if req.duration > 20:
        durations = _scene_durations(req.duration)
        data = {
            "idea": req.prompt,
            "creative_name": "ChatGPT Agnes Long Video",
            "style": "premium cinematic 3D animation, consistent character design, smooth camera movement",
            "chaining_mode": "keyframes",
            "video_width": str(width),
            "video_height": str(height),
            "duration_source": "manual",
            "scene_count": str(len(durations)),
            "uniform_duration": "false",
            "scene_durations_json": "[" + ",".join(map(str, durations)) + "]",
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
