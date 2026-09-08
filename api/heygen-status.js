export default async function handler(req,res){
 if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
 const videoId=req.query?.id;
 const apiKey=process.env.HEYGEN_API_KEY;
 if(!videoId) return res.status(400).json({error:'id wajib diisi'});
 if(!apiKey) return res.status(503).json({error:'HEYGEN_API_KEY belum diset di Vercel'});
 try{
  const r=await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,{headers:{'X-Api-Key':apiKey}});
  const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok)return res.status(r.status).json({error:data.error?.message||data.message||'HeyGen status error',details:data});
  const d=data.data||{};
  return res.status(200).json({status:d.status||'unknown',videoUrl:d.video_url||null,error:d.error||null,done:d.status==='completed',failed:d.status==='failed'});
 }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
