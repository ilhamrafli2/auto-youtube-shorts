export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {apiKey,prompt,aspect='9:16',num_frames=121,frame_rate=24,steps=8}=req.body||{};
    const key=String(apiKey||process.env.PIXAZO_API_KEY||'').trim();
    if(!key) return res.status(400).json({error:'Pixazo API key belum diisi.'});
    if(!prompt) return res.status(400).json({error:'Prompt kosong'});
    const r=await fetch('https://gateway.pixazo.ai/ltx-video/v1/text-to-video',{
      method:'POST',
      headers:{'Content-Type':'application/json','Ocp-Apim-Subscription-Key':key},
      body:JSON.stringify({prompt,aspect,num_frames,frame_rate,steps,cfg:3.0})
    });
    const text=await r.text();
    let data;try{data=JSON.parse(text)}catch{data={raw:text}};
    if(!r.ok)return res.status(r.status).json({error:`Pixazo HTTP ${r.status}`,details:data});
    return res.status(200).json(data);
  }catch(e){return res.status(500).json({error:e?.message||'Pixazo proxy error'});}
}