export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(503).json({error:'OPENAI_API_KEY belum diset di Vercel'});
  try{
    const body=req.body||{};
    const topic=String(body.topic||'').trim();
    const language=String(body.language||'English').trim();
    const duration=Math.max(15,Math.min(150,Number(body.duration)||50));
    if(!topic) return res.status(400).json({error:'Topik wajib diisi'});
    const prompt=`Create a production-ready voiceover script for a vertical faceless YouTube video about: ${topic}\n\nRequirements:\n- Language: ${language}\n- Target duration: ${duration} seconds\n- Strong hook in the first 2 seconds\n- Clear, natural narration suitable for AI voice\n- Break into ${Math.ceil(duration/10)} short scenes of about 10 seconds each\n- For every scene include: SCENE, VISUAL, NARRATION\n- Keep the same subject/character visually consistent across scenes\n- No on-screen text, subtitles, logos, or watermarks\n- Make it engaging and concise; do not mention these instructions.\nReturn only the scene plan and narration.`;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:'gpt-5.6-luna',input:[{role:'system',content:'You are an expert YouTube Shorts scriptwriter and visual director.'},{role:'user',content:prompt}],max_output_tokens:3000})});
    const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={message:text}};
    if(!r.ok)return res.status(r.status).json({error:data.error?.message||data.message||'OpenAI API error'});
    const output=data.output_text||data.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('')||'';
    if(!output)return res.status(502).json({error:'ChatGPT tidak mengembalikan script'});
    return res.status(200).json({script:output,model:'gpt-5.6-luna'});
  }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
