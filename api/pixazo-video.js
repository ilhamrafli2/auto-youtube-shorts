export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {apiKey,prompt}=req.body||{};
    const key=String(apiKey||process.env.PIXAZO_API_KEY||'').trim();
    if(!key) return res.status(400).json({error:'Pixazo API key belum diisi.'});
    if(!prompt) return res.status(400).json({error:'Prompt kosong'});
    const r=await fetch('https://gateway.pixazo.ai/ltx-video/v1/text-to-video',{
      method:'POST',
      headers:{'Content-Type':'application/json','Cache-Control':'no-cache','Ocp-Apim-Subscription-Key':key},
      body:JSON.stringify({prompt})
    });
    const text=await r.text();
    let data;try{data=JSON.parse(text)}catch{data={raw:text}};
    if(!r.ok)return res.status(r.status).json({error:`Pixazo HTTP ${r.status}`,details:data});
    const id=data.request_id;
    if(!id)return res.status(200).json(data);
    for(let i=0;i<72;i++){
      await new Promise(x=>setTimeout(x,5000));
      const q=await fetch('https://gateway.pixazo.ai/v2/requests/status/'+encodeURIComponent(id),{headers:{'Ocp-Apim-Subscription-Key':key,'Cache-Control':'no-cache'}});
      const qt=await q.text();let x;try{x=JSON.parse(qt)}catch{x={raw:qt}};
      if(x.status==='COMPLETED'){
        const u=x.output?.media_url?.[0]||x.output?.media_url||x.output_url||x.url;
        return res.status(200).json({...x,video_url:u});
      }
      if(x.status==='ERROR'||x.status==='FAILED')return res.status(502).json({error:'Pixazo job gagal',details:x});
    }
    return res.status(504).json({error:'Pixazo timeout',request_id:id});
  }catch(e){return res.status(500).json({error:e?.message||'Pixazo proxy error'});}
}