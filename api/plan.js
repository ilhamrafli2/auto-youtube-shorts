export default async function handler(req,res){
  try{
    if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
    const {topic}=req.body||{};
    const openaiKey=process.env.OPENAI_API_KEY;
    const geminiKey=process.env.GEMINI_API_KEY;
    if(!openaiKey && !geminiKey) return res.status(500).json({error:'OPENAI_API_KEY belum dipasang di Vercel.'});

    const userPrompt=`Buat paket lengkap YouTube Short 60-64 detik tentang "${topic||'AI terbaru'}".

Tugas:
1. Tulis voice-over bahasa Indonesia yang natural, enak didengar, informatif, dan cocok untuk Shorts, sekitar 120-150 kata.
2. Pecah voice-over menjadi tepat 8 bagian narasi, satu narasi untuk setiap scene, masing-masing sekitar 15-20 kata agar total durasi sekitar 60-64 detik.
3. Buat tepat 8 scene, masing-masing sekitar 8 detik.
4. Setiap scene wajib memiliki "narration" dalam Bahasa Indonesia yang merupakan bagian langsung dari cerita utama. Jangan gunakan bahasa Inggris untuk narration.
5. Setiap scene juga wajib memiliki "visual_prompt" dalam bahasa Inggris yang self-contained dan siap dipakai Google Flow/Veo.
6. Scene 1 harus menjadi hook yang sangat kuat dalam 1-2 detik pertama.
7. Scene 2-6 menyampaikan inti cerita/informasi secara runtut.
8. Scene 7 memberi kesimpulan atau insight mengejutkan.
9. Scene 8 memberi ending kuat/call to action.
10. Semua scene harus punya kontinuitas karakter, pakaian, lokasi, waktu, pencahayaan, gaya visual, dan kamera.
11. Semua visual prompt wajib vertical 9:16, cinematic, realistic motion, natural camera movement, natural ambient audio/dialogue bila relevan.
12. Jangan memasukkan subtitle, caption, teks, logo, UI, atau watermark ke video.
13. Visual harus benar-benar mendukung narration scene tersebut, bukan filler.
14. Kembalikan JSON saja dengan struktur: {"script":"...","scenes":[{"narration":"...","visual_prompt":"..."},{"narration":"...","visual_prompt":"..."},{"narration":"...","visual_prompt":"..."},{"narration":"...","visual_prompt":"..."},{"narration":"...","visual_prompt":"..."},{"narration":"...","visual_prompt":"..."},{"narration":"...","visual_prompt":"..."},{"narration":"...","visual_prompt":"..."}]}.`;

    if(openaiKey){
      const r=await fetch('https://api.openai.com/v1/responses',{
        method:'POST',
        headers:{'Authorization':'Bearer '+openaiKey,'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'gpt-5.6-luna',
          input:[
            {role:'system',content:'You are the AI script and visual-planning engine for a YouTube Shorts factory. Produce high-retention Indonesian narration and precise English cinematic visual prompts for Google Flow.'},
            {role:'user',content:userPrompt}
          ],
          text:{format:{type:'json_schema',name:'shorts_plan',strict:true,schema:{type:'object',additionalProperties:false,properties:{script:{type:'string'},scenes:{type:'array',minItems:8,maxItems:8,items:{type:'object',additionalProperties:false,properties:{narration:{type:'string'},visual_prompt:{type:'string'}},required:['narration','visual_prompt']}}},required:['script','scenes']}}},
          max_output_tokens:5000
        })
      });
      const j=await r.json();
      if(!r.ok) throw Error(j.error?.message||'OpenAI gagal membuat script.');
      const text=(j.output||[])
        .flatMap(item=>item.content||[])
        .filter(part=>part.type==='output_text' && typeof part.text==='string')
        .map(part=>part.text)
        .join('');
      if(!text) throw Error('OpenAI tidak mengembalikan hasil script.');
      const plan=JSON.parse(text);
      if(!plan.script || !Array.isArray(plan.scenes) || plan.scenes.length!==8) throw Error('AI tidak mengembalikan script dan tepat 8 scene.');
      return res.status(200).json(plan);
    }

    const prompt=`${userPrompt}\nKembalikan JSON valid saja.`;
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key='+geminiKey,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json'}})});
    const j=await r.json();
    if(!r.ok) throw Error(j.error?.message||'AI gagal membuat script.');
    return res.status(200).json(JSON.parse(j.candidates[0].content.parts[0].text));
  }catch(e){
    return res.status(500).json({error:e.message});
  }
}