export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {prompt,duration}=req.body||{};
 if(!prompt) return res.status(400).json({error:'Prompt wajib diisi'});
 const apiUrl=process.env.AGNES_API_URL;
 const apiKey=process.env.AGNES_API_KEY;
 if(!apiUrl) return res.status(503).json({error:'AGNES_API_URL belum diset di Vercel Environment Variables'});
 try{
  const r=await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json',...(apiKey?{'Authorization':`Bearer ${apiKey}`}: {})},body:JSON.stringify({prompt,duration:duration||60})});
  const text=await r.text();
  let data;try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok)return res.status(r.status).json({error:data.error||data.message||'Agnes API error'});
  return res.status(200).json(data);
 }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
