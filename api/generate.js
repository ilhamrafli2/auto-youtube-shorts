export default async function handler(req,res){
 const input=req.method==='GET'?(req.query||{}):(req.body||{});
 if(req.method!=='GET'&&req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {prompt,duration=50}=input;
 if(!prompt?.trim()) return res.status(400).json({error:'Prompt wajib diisi'});
 const baseUrl='https://agnes-dockerhub-production.up.railway.app';
 const apiKey=process.env.AGNES_API_KEY;
 if(!apiKey) return res.status(503).json({error:'AGNES_API_KEY belum diset di Vercel'});
 try{
  const seconds=Number(duration)||50;
  if(seconds<2||seconds>150) return res.status(400).json({error:'Duration harus 2-150 detik'});
  const sceneCount=Math.ceil(seconds/10);
  const base=Math.floor(seconds/sceneCount), rem=seconds%sceneCount;
  const durations=Array.from({length:sceneCount},(_,i)=>base+(i<rem?1:0));
  const form=new FormData();
  form.append('idea',prompt.trim());
  form.append('creative_name','ChatGPT Agnes Long Video');
  form.append('style','premium cinematic 3D animation, consistent character design, smooth camera movement, expressive cartoon character, polished animation');
  form.append('chaining_mode','keyframes');
  form.append('video_width','1080');
  form.append('video_height','1920');
  form.append('duration_source','manual');
  form.append('scene_count',String(sceneCount));
  form.append('uniform_duration','false');
  form.append('scene_durations_json',JSON.stringify(durations));
  form.append('audio_enabled','true');
  form.append('audio_voice','id-ID-ArdiNeural');
  form.append('audio_rate','+0%');
  form.append('audio_lang','id-ID');
  form.append('subtitle_enabled','false');
  const r=await fetch(`${baseUrl}/api/tasks/creative`,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form});
  const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok)return res.status(r.status).json({error:data.detail||data.error||data.message||'Agnes API error',details:data});
  const taskId=data.task_id||data.taskId||data.id;
  if(!taskId)return res.status(502).json({error:'Agnes tidak mengembalikan task ID',details:data});
  return res.status(200).json({taskId,status:data.status||'pending',duration:seconds,sceneCount,durations});
 }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
