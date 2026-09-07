import express from 'express';

const app = express();
app.use(express.json({limit:'2mb'}));

const PORT = process.env.PORT || 8080;
const COMFYUI_BASE_URL = (process.env.COMFYUI_BASE_URL || '').replace(/\/$/, '');
const GATEWAY_KEY = process.env.GATEWAY_KEY || '';

function auth(req,res,next){
  if (!GATEWAY_KEY) return next();
  if (req.headers.authorization !== `Bearer ${GATEWAY_KEY}`) return res.status(401).json({error:'unauthorized'});
  next();
}

app.get('/health',(req,res)=>res.json({ok:true, service:'video-gateway', comfyui_configured:Boolean(COMFYUI_BASE_URL)}));

app.post('/api/comfy/prompt',auth,async(req,res)=>{
  if(!COMFYUI_BASE_URL) return res.status(503).json({error:'COMFYUI_BASE_URL is not configured'});
  try{
    const r=await fetch(`${COMFYUI_BASE_URL}/prompt`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(req.body)});
    const text=await r.text();
    res.status(r.status).type('application/json').send(text);
  }catch(e){res.status(502).json({error:'ComfyUI unreachable',detail:String(e)})}
});

app.get('/api/comfy/history/:id',auth,async(req,res)=>{
  if(!COMFYUI_BASE_URL) return res.status(503).json({error:'COMFYUI_BASE_URL is not configured'});
  try{
    const r=await fetch(`${COMFYUI_BASE_URL}/history/${encodeURIComponent(req.params.id)}`);
    const text=await r.text();
    res.status(r.status).type('application/json').send(text);
  }catch(e){res.status(502).json({error:'ComfyUI unreachable',detail:String(e)})}
});

app.get('/api/comfy/view',auth,async(req,res)=>{
  if(!COMFYUI_BASE_URL) return res.status(503).json({error:'COMFYUI_BASE_URL is not configured'});
  const qs=new URLSearchParams(req.query).toString();
  try{
    const r=await fetch(`${COMFYUI_BASE_URL}/view?${qs}`);
    res.status(r.status);
    const ct=r.headers.get('content-type'); if(ct) res.set('content-type',ct);
    res.send(Buffer.from(await r.arrayBuffer()));
  }catch(e){res.status(502).json({error:'ComfyUI unreachable',detail:String(e)})}
});

app.get('/',(req,res)=>res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Video Gateway</title><style>body{font-family:system-ui;max-width:720px;margin:40px auto;padding:20px}code{background:#eee;padding:3px 6px;border-radius:5px}.ok{font-weight:700}</style></head><body><h1>AI Video Gateway</h1><p class="ok">Gateway online.</p><p>Backend: <code>${COMFYUI_BASE_URL?'ComfyUI configured':'ComfyUI not configured yet'}</code></p><p>Use <code>POST /api/comfy/prompt</code> to submit a ComfyUI workflow.</p></body></html>`));

app.listen(PORT,()=>console.log(`video-gateway listening on ${PORT}`));
