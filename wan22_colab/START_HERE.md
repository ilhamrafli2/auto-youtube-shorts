# 🚀 OpenClaw + Wan 2.2 — no Railway

**Target:** iPhone → OpenClaw → public ComfyUI → Wan 2.2 TI2V 5B → MP4.

## One-click Colab

Open this notebook in Colab:

https://colab.research.google.com/github/ilhamrafli2/auto-youtube-shorts/blob/main/wan22_colab/OPENCLAW_WAN22_COMFYUI.ipynb

Then use **Runtime → Change runtime type → T4 GPU** and **Run all**.

The notebook installs ComfyUI, downloads the Wan 2.2 model, starts ComfyUI, creates a Cloudflare Quick Tunnel, and prints `COMFYUI_BASE_URL`.

## Important

This avoids paid video API credits and Railway. A free Colab GPU still has Google's session/runtime limits; it is not literally unlimited compute.

After the notebook prints `COMFYUI_BASE_URL`, put that URL into the OpenClaw ComfyUI provider. Do not expose any API keys in the notebook or GitHub.
