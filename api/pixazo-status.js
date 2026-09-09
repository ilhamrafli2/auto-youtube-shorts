export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {apiKey,request_id}=req.body||{};
    const key=String(apiKey||process.env.PIXAZO_API_KEY||'').trim();
    if(!key||!request_id)return res.status(400).json({error:'API key dan request_id wajib.'});
    const r=await fetch('https://gateway.pixazo.ai/v2/requests/status/'+encodeURIComponent(request_id),{headers:{'Ocp-Apim-Subscription-Key':key,'Cache-Control':'no-cache'}});
    const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}};
    if(!r.ok)return res.status(r.status).json({error:`Pixazo status HTTP ${r.status}`,details:data});
    const video_url=data.output?.media_url?.[0]||data.output?.media_url||data.output_url||data.url||null;
    return res.status(200).json({...data,video_url});
  }catch(e){return res.status(500).json({error:e?.message||'Pixazo status error'});}
}