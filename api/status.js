export default async function handler(req,res){
 const {id}=req.query||{};
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
 res.setHeader('Pragma','no-cache');
 res.setHeader('Expires','0');
 if(!id)return res.status(400).json({error:'Task ID wajib diisi'});
 const base='https://agnes-dockerhub-production.up.railway.app';
 const key=process.env.AGNES_API_KEY;
 try{
  const r=await fetch(`${base}/api/tasks/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`},cache:'no-store'});
  const text=await r.text();let d;try{d=JSON.parse(text)}catch{d={message:text}};
  if(!r.ok)return res.status(r.status).json({error:d.error||d.message||'Status error'});
  const status=d.status||d.state||d.task?.status||d.data?.status||'processing';
  const done=['completed','success','done'].includes(String(status).toLowerCase());
  const failed=['failed','error','cancelled'].includes(String(status).toLowerCase());
  const src=d.data||d.task||d.result||d;
  let progress=src.progress??src.percentage??src.percent??src.progress_percentage??src.progressPercent??d.progress??d.percentage??d.percent??null;
  if(typeof progress==='object'&&progress)progress=progress.percent??progress.percentage??progress.value??null;
  if(typeof progress==='string')progress=parseFloat(progress.replace('%',''));
  progress=Number.isFinite(Number(progress))?Math.max(0,Math.min(100,Number(progress))):null;
  if(done)progress=100;
  return res.status(200).json({status,done,failed,progress,videoUrl:done?`${base}/api/video/${encodeURIComponent(id)}`:null,details:d});
 }catch(e){return res.status(500).json({error:e.message||'Status request gagal'});}
}