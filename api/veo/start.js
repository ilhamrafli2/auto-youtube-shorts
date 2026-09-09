export default async function handler(req,res){
  try{
    if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
    const {prompt}=req.body||{};
    const key=process.env.GEMINI_API_KEY;
    if(!key) return res.status(500).json({error:'GEMINI_API_KEY belum dipasang di Vercel.'});

    const url='https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning';
    const body={instances:[{prompt}],parameters:{aspectRatio:'9:16',durationSeconds:'8',resolution:'720p'}};
    let last='Veo gagal start';

    for(let attempt=0;attempt<4;attempt++){
      const r=await fetch(url,{method:'POST',headers:{'x-goog-api-key':key,'content-type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(r.ok && j.name) return res.status(200).json({name:j.name});

      last=j.error?.message||last;
      const transient=r.status===429 || r.status===408 || r.status>=500;
      if(!transient || attempt===3) break;
      await new Promise(resolve=>setTimeout(resolve,2000*Math.pow(2,attempt)+Math.floor(Math.random()*1000)));
    }

    if(/high demand|temporarily|try again later/i.test(last)){
      return res.status(503).json({error:'Veo 3.1 sedang mengalami permintaan tinggi dari Google. Website normal. Coba lagi beberapa saat, atau gunakan mode GOOGLE FLOW PRO agar memakai kredit Flow.'});
    }
    return res.status(500).json({error:last});
  }catch(e){
    return res.status(500).json({error:e.message});
  }
}