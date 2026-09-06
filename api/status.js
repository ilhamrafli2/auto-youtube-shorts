export default async function handler(req,res){
 const {id}=req.query||{};
 if(!id)return res.status(400).json({error:'Task ID wajib diisi'});
 const base=(process.env.AGNES_API_URL||'https://agnes-production.up.railway.app').replace(/\/$/,'');
 const key=process.env.AGNES_API_KEY;
 try{const r=await fetch(`${base}/api/tasks/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`}});const text=await r.text();let d;try{d=JSON.parse(text)}catch{d={message:text}};if(!r.ok)return res.status(r.status).json({error:d.error||d.message||'Status error'});const status=d.status||d.state||'processing';const done=['completed','success','done'].includes(String(status).toLowerCase());const failed=['failed','error','cancelled'].includes(String(status).toLowerCase());return res.status(200).json({status,done,failed,videoUrl:done?`${base}/api/video/${encodeURIComponent(id)}`:null,details:d});}catch(e){return res.status(500).json({error:e.message||'Status request gagal'});}
}
