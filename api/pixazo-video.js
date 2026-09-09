export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {apiKey,prompt}=req.body||{};
    const key=String(apiKey||process.env.PIXAZO_API_KEY||'').trim();
    if(!key) return res.status(400).json({error:'Pixazo API key belum diisi.'});
    if(!prompt) return res.status(400).json({error:'Prompt kosong'});
    const r=await fetch('https://gateway.pixazo.ai/ltx-video/v1/text-to-video',{
      method:'POST',headers:{'Content-Type':'application/json','Cache-Control':'no-cache','Ocp-Apim-Subscription-Key':key},
      body:JSON.stringify({prompt})
    });
    const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}};
    console.log('[pixazo-video] upstream', {status:r.status, request_id:data?.request_id, model_id:data?.model_id, status_value:data?.status, polling_url:!!data?.polling_url});
    if(!r.ok)return res.status(r.status).json({error:`Pixazo HTTP ${r.status}`,details:data});
    return res.status(200).json(data);
  }catch(e){
    console.error('[pixazo-video] error',e);
    return res.status(500).json({error:e?.message||'Pixazo proxy error'});
  }
}