export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {apiKey,prompt,duration=3,aspect_ratio='9:16',model='cogvideox-2b'}=req.body||{};
    const key=String(apiKey||process.env.FREE_AI_API_KEY||'').trim();
    if(!key) return res.status(400).json({error:'Free.ai API key belum diisi. Buat API key gratis di free.ai lalu masukkan ke kolom API Key.'});
    if(!prompt) return res.status(400).json({error:'Prompt kosong'});
    const r=await fetch('https://api.free.ai/v1/video/generate/',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,duration:Math.min(3,Math.max(2,Number(duration)||3)),aspect_ratio})});
    const text=await r.text();
    let data; try{data=JSON.parse(text)}catch{data={raw:text}};
    if(!r.ok) return res.status(r.status).json({error:`Free.ai HTTP ${r.status}`,details:data});
    return res.status(200).json(data);
  }catch(e){return res.status(500).json({error:e?.message||'Free.ai proxy error'});}
}