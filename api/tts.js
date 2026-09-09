export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  try{
    const text=String(req.body?.text||'').replace(/\s+/g,' ').trim();
    const lang=String(req.body?.lang||'id').toLowerCase();
    if(!text) return res.status(400).json({error:'text kosong'});
    const q=text.slice(0,190);
    const url='https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='+encodeURIComponent(lang)+'&q='+encodeURIComponent(q);
    const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
    if(!r.ok) throw new Error('TTS upstream HTTP '+r.status);
    const buf=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(buf);
  }catch(e){return res.status(500).json({error:e?.message||'TTS gagal'})}
}
