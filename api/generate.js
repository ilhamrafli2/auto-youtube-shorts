export default async function handler(req,res){
 const input=req.method==='GET'?(req.query||{}):(req.body||{});
 if(req.method!=='GET'&&req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {prompt,duration}=input;
 if(!prompt?.trim()) return res.status(400).json({error:'Prompt wajib diisi'});
 const baseUrl='https://agnes-dockerhub-production.up.railway.app';
 const apiKey=process.env.AGNES_API_KEY;
 if(!apiKey) return res.status(503).json({error:'AGNES_API_KEY belum diset di Vercel'});
 try{
  const total=Number(duration)||60;
  const allowed=[30,60,90];
  const seconds=allowed.includes(total)?total:60;
  const sceneCount=seconds/5;
  const form=new FormData();
  form.append('idea',prompt.trim());
  form.append('creative_name','AI Video Studio');
  form.append('style','cinematic realistic, vertical short video, engaging social media style');
  form.append('chaining_mode','keyframes');
  form.append('video_width','768');
  form.append('video_height','1152');
  form.append('duration_source','manual');
  form.append('scene_count',String(sceneCount));
  form.append('uniform_duration','true');
  form.append('scene_durations_json',JSON.stringify(Array(sceneCount).fill(5)));
  form.append('audio_enabled','true');
  form.append('audio_voice','id-ID-GadisNeural');
  form.append('audio_rate','+0%');
  form.append('audio_lang','id');
  form.append('subtitle_enabled','true');
  form.append('subtitle_style_mode','fixed');
  form.append('subtitle_position','bottom');
  form.append('subtitle_fontsize','48');
  form.append('subtitle_color','white');
  form.append('subtitle_stroke_color','black');
  form.append('subtitle_stroke_width','2');
  form.append('subtitle_bg_color','black@0.5');
  const r=await fetch(`${baseUrl}/api/tasks/creative`,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form});
  const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={message:text}};
  if(!r.ok)return res.status(r.status).json({error:data.detail||data.error||data.message||'Agnes API error',details:data});
  const taskId=data.task_id||data.taskId||data.id;
  if(!taskId)return res.status(502).json({error:'Agnes tidak mengembalikan task ID',details:data});
  return res.status(200).json({taskId,status:data.status||'pending'});
 }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
