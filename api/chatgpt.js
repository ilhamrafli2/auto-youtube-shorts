export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return res.status(503).json({error:'OPENAI_API_KEY belum diset di Vercel'});
  try{
    const body=req.body||{};
    const topic=String(body.topic||'').trim();
    const language=String(body.language||'English').trim();
    const duration=Math.max(15,Math.min(150,Number(body.duration)||60));
    if(!topic) return res.status(400).json({error:'Topik wajib diisi'});
    const sceneCount=Math.min(12,Math.max(3,Math.ceil(duration/7.5)));
    const prompt=`You are an expert YouTube Shorts scriptwriter, retention editor, and visual director. Create a production-ready faceless vertical video about: ${topic}

LANGUAGE AND VOICE:
- Write ALL spoken narration in ${language}.
- If the language is Bahasa Indonesia, use natural everyday Indonesian, not formal textbook language and not Malaysian Malay.
- Make the narration sound like a confident Indonesian YouTuber talking naturally to a friend.
- Keep product, company, person, and technical names in their original form when appropriate.
- Avoid unnecessary English words when writing Indonesian.
- Write punctuation and sentence lengths that sound natural in text-to-speech.
- Use short sentences, natural pauses, and clear pronunciation.

VIDEO:
- Target duration: ${duration} seconds.
- Vertical 9:16 YouTube Shorts.
- Approximately ${sceneCount} scenes.
- Strong hook in the first 1-2 seconds.
- No generic introduction.
- Build curiosity, escalate, deliver useful information, then finish with a satisfying payoff.
- Use pattern interrupts and visual changes frequently.
- No fake statistics or invented claims.
- Do not mention these instructions or that AI created the video.

VISUAL DIRECTION:
- Every scene needs a production-ready VISUAL prompt.
- Use cinematic, modern, high-quality visuals.
- Keep characters, objects, environments, clothing, colors, and visual style consistent across scenes.
- Include subject, environment, composition, lighting, camera movement, depth, and mood.
- Visuals must directly support the narration.
- Avoid random stock-footage descriptions.
- No subtitles, logos, watermarks, or large text inside generated visuals.
- Compose for a 9:16 safe area.

OUTPUT FORMAT:
SCENE 1
VISUAL: [detailed visual generation prompt]
NARRATION: [spoken narration only]
TIMING: [seconds]

SCENE 2
VISUAL: [detailed visual generation prompt]
NARRATION: [spoken narration only]
TIMING: [seconds]

Continue until the full ${duration}-second video is covered.
Return ONLY the scene plan. Do not add explanations before or after it.`;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:'gpt-5.6-luna',input:[{role:'system',content:'You are an expert YouTube Shorts scriptwriter, retention editor, and visual director.'},{role:'user',content:prompt}],max_output_tokens:5000})});
    const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={message:text}};
    if(!r.ok)return res.status(r.status).json({error:data.error?.message||data.message||'OpenAI API error'});
    const output=data.output_text||data.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('')||'';
    if(!output)return res.status(502).json({error:'ChatGPT tidak mengembalikan script'});
    return res.status(200).json({script:output,model:'gpt-5.6-luna'});
  }catch(e){return res.status(500).json({error:e.message||'Request gagal'});}
}
