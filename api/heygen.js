export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {script,avatarId,voiceId}=req.body||{};
 if(!script?.trim()) return res.status(400).json({error:'Script wajib diisi'});
 const apiKey=process.env.HEYGEN_API_KEY;
 const avatar=avatarId||process.env.HEYGEN_AVATAR_ID;
 const voice=voiceId||process.env.HEYGEN_VOICE_ID;
 if(!apiKey) return res.status(503).json({error:'HEYGEN_API_KEY belum diset di Vercel'});
 if(!avatar) return res.status(503).json({error:'HEYGEN_AVATAR_ID belum diset di Vercel'});
 if(!voice) return res.status(503).json({error:'HEYGEN_VOICE_ID belum diset di Vercel'});
 try{
  const r=await fetch('https://api.heygen.com/v2/video/generate',{method:'POST',headers:{'Content-Type':'application/json','X-Api-Key':apiKey},body:JSON.stringify({video_inputs:[{character:{type:'avatar',avatar_id:avatar},voice:{type:'text',input_text:script.trim(),voice_id:voice}}],dimension:{width:1080,height:1920}})});
  const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok)return res.status(r.status).json({error:data.error?.message||data.message||'HeyGen API error',details:data});
  const videoId=data.data?.video_id||data.video_id;
  if(!videoId)return res.status(502).json({error:'HeyGen tidak mengembalikan video_id',details:data});
  return res.status(200).json({videoId,status:'processing'});
 }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
