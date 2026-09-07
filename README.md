# Auto YouTube Video Generator

Simple phone-friendly web app: enter a topic/prompt → Generate Video → wait for rendering → preview and download the finished MP4.

## Architecture
- Vercel: web UI + serverless API
- Agnes: long-video rendering backend
- API key: `AGNES_API_KEY` stored server-side in Vercel, never in the browser

## Endpoints
- `/api/generate` — creates a render task
- `/api/status?id=TASK_ID` — polls task status and returns the MP4 URL when complete
- `/api/health` — checks whether the Agnes key is configured

## Setup
1. Connect this GitHub repo to Vercel.
2. Add the Vercel environment variable `AGNES_API_KEY`.
3. Redeploy.
4. Open the deployed site on your phone.
5. Enter a topic or prompt and press **Generate Video**.

The default workflow is a 50-second vertical 9:16 video with narration and no subtitles. Duration options are controlled in the UI.
