export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {prompt,duration}=req.body||{};
 if(!prompt?.trim()) return res.status(400).json({error:'Prompt wajib diisi'});
 const baseUrl=(process.env.AGNES_API_URL||'https://agnes-production.up.railway.app').replace(/\/$/,'');
 const apiKey=process.env.AGNES_API_KEY;
 if(!apiKey) return res.status(503).json({error:'AGNES_API_KEY belum diset di Vercel'});
 try{
  const form=new FormData();
  form.append('prompt',prompt.trim()); form.append('mode','t2v');
  form.append('duration',String(duration||60)); form.append('resolution','768x1152');
  const r=await fetch(`${baseUrl}/api/tasks/simple`,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form});
  const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok)return res.status(r.status).json({error:data.error||data.message||'Agnes API error'});
  const taskId=data.task_id||data.taskId||data.id;
  if(!taskId)return res.status(502).json({error:'Agnes tidak mengembalikan task ID',details:data});
  return res.status(200).json({taskId,status:data.status||'pending'});
 }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
