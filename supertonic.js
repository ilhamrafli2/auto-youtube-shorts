import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/+esm';

export const AVAILABLE_LANGS = ['en','ko','ja','ar','bg','cs','da','de','el','es','et','fi','fr','hi','hr','hu','id','it','lt','lv','nl','pl','pt','ro','ru','sk','sl','sv','tr','uk','vi','na'];

export class UnicodeProcessor {
  constructor(indexer){this.indexer=indexer;}
  call(textList,langList){
    const processed=textList.map((t,i)=>this.preprocessText(t,langList[i]));
    const lengths=processed.map(t=>t.length), maxLen=Math.max(...lengths);
    const textIds=processed.map(t=>{const row=new Array(maxLen).fill(0);for(let j=0;j<t.length;j++){const cp=t.codePointAt(j);row[j]=cp<this.indexer.length?this.indexer[cp]:-1;}return row;});
    return {textIds,textMask:this.lengthToMask(lengths,maxLen)};
  }
  preprocessText(text,lang){
    text=text.normalize('NFKD');
    text=text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+/gu,'');
    const r={'–':'-','‑':'-','—':'-','_':' ','“':'"','”':'"','‘':"'",'’':"'",'´':"'",'`':"'",'[':' ',']':' ','|':' ','/':' ','#':' ','→':' ','←':' '};
    for(const [a,b] of Object.entries(r))text=text.replaceAll(a,b);
    text=text.replace(/[♥☆♡©\\]/g,'').replaceAll('@',' at ').replaceAll('e.g.,','for example, ').replaceAll('i.e.,','that is, ');
    text=text.replace(/ ,/g,',').replace(/ \./g,'.').replace(/ !/g,'!').replace(/ \?/g,'?').replace(/ ;/g,';').replace(/ :/g,':').replace(/\s+/g,' ').trim();
    if(!/[.!?;:,'\"')\]}…。」』】〉》›»]$/.test(text))text+='.';
    if(!AVAILABLE_LANGS.includes(lang))throw new Error('Unsupported TTS language: '+lang);
    return `<${lang}>${text}</${lang}>`;
  }
  lengthToMask(lengths,maxLen){const m=maxLen||Math.max(...lengths);return lengths.map(len=>[Array.from({length:m},(_,i)=>i<len?1:0)]);}
}

export class Style{constructor(ttl,dp){this.ttl=ttl;this.dp=dp;}}

export class TextToSpeech{
  constructor(cfgs,textProcessor,dp,textEnc,vector,vocoder){this.cfgs=cfgs;this.textProcessor=textProcessor;this.dpOrt=dp;this.textEncOrt=textEnc;this.vectorEstOrt=vector;this.vocoderOrt=vocoder;this.sampleRate=cfgs.ae.sample_rate;}
  async _infer(textList,langList,style,totalStep,speed=1.05,progress=null){
    const bsz=textList.length;
    const {textIds,textMask}=this.textProcessor.call(textList,langList);
    const textIdsTensor=new ort.Tensor('int64',new BigInt64Array(textIds.flat().map(x=>BigInt(x))),[bsz,textIds[0].length]);
    const textMaskTensor=new ort.Tensor('float32',new Float32Array(textMask.flat(2)),[bsz,1,textMask[0][0].length]);
    const dpOut=await this.dpOrt.run({text_ids:textIdsTensor,style_dp:style.dp,text_mask:textMaskTensor});
    const duration=Array.from(dpOut.duration.data);for(let i=0;i<duration.length;i++)duration[i]/=speed;
    const encOut=await this.textEncOrt.run({text_ids:textIdsTensor,style_ttl:style.ttl,text_mask:textMaskTensor});
    const textEmb=encOut.text_emb;
    let {xt,latentMask}=this.sampleNoisyLatent(duration,this.sampleRate,this.cfgs.ae.base_chunk_size,this.cfgs.ttl.chunk_compress_factor,this.cfgs.ttl.latent_dim);
    const latentMaskTensor=new ort.Tensor('float32',new Float32Array(latentMask.flat(2)),[bsz,1,latentMask[0][0].length]);
    const totalStepTensor=new ort.Tensor('float32',new Float32Array(bsz).fill(totalStep),[bsz]);
    for(let step=0;step<totalStep;step++){
      progress?.(step+1,totalStep);
      const currentStepTensor=new ort.Tensor('float32',new Float32Array(bsz).fill(step),[bsz]);
      const xtTensor=new ort.Tensor('float32',new Float32Array(xt.flat(2)),[bsz,xt[0].length,xt[0][0].length]);
      const out=await this.vectorEstOrt.run({noisy_latent:xtTensor,text_emb:textEmb,style_ttl:style.ttl,latent_mask:latentMaskTensor,text_mask:textMaskTensor,current_step:currentStepTensor,total_step:totalStepTensor});
      const den=Array.from(out.denoised_latent.data),dim=xt[0].length,len=xt[0][0].length;xt=[];let k=0;
      for(let b=0;b<bsz;b++){const batch=[];for(let d=0;d<dim;d++){const row=[];for(let t=0;t<len;t++)row.push(den[k++]);batch.push(row);}xt.push(batch);}
    }
    const out=await this.vocoderOrt.run({latent:new ort.Tensor('float32',new Float32Array(xt.flat(2)),[bsz,xt[0].length,xt[0][0].length])});
    return {wav:Array.from(out.wav_tts.data),duration};
  }
  async call(text,lang,style,totalStep=8,speed=1.05,silenceDuration=.3,progress=null){
    if(style.ttl.dims[0]!==1)throw new Error('Single speaker style required');
    const chunks=chunkText(text,(lang==='ko'||lang==='ja')?120:300);let wavCat=[],durCat=0;
    for(let i=0;i<chunks.length;i++){const r=await this._infer([chunks[i]],[lang],style,totalStep,speed,progress);if(!wavCat.length){wavCat=r.wav;durCat=r.duration[0];}else{const silence=new Array(Math.floor(silenceDuration*this.sampleRate)).fill(0);wavCat=[...wavCat,...silence,...r.wav];durCat+=r.duration[0]+silenceDuration;}}
    return {wav:wavCat,duration:[durCat]};
  }
  sampleNoisyLatent(duration,sampleRate,baseChunkSize,chunkCompress,latentDim){
    const maxDur=Math.max(...duration),wavLenMax=Math.floor(maxDur*sampleRate),wavLengths=duration.map(d=>Math.floor(d*sampleRate));
    const chunkSize=baseChunkSize*chunkCompress,latentLen=Math.floor((wavLenMax+chunkSize-1)/chunkSize),latentDimVal=latentDim*chunkCompress,xt=[];
    for(let b=0;b<duration.length;b++){const batch=[];for(let d=0;d<latentDimVal;d++){const row=[];for(let t=0;t<latentLen;t++){const u1=Math.max(.0001,Math.random()),u2=Math.random();row.push(Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2));}batch.push(row);}xt.push(batch);}
    const latentLengths=wavLengths.map(len=>Math.floor((len+chunkSize-1)/chunkSize)),latentMask=this.lengthToMask(latentLengths,latentLen);
    for(let b=0;b<xt.length;b++)for(let d=0;d<latentDimVal;d++)for(let t=0;t<latentLen;t++)xt[b][d][t]*=latentMask[b][0][t];
    return {xt,latentMask};
  }
  lengthToMask(lengths,maxLen){const m=maxLen||Math.max(...lengths);return lengths.map(len=>[Array.from({length:m},(_,i)=>i<len?1:0)]);}
}

export async function loadVoiceStyle(paths){const first=await(await fetch(paths[0])).json(),td=first.style_ttl.dims,dd=first.style_dp.dims,ttl=new Float32Array(paths.length*td[1]*td[2]),dp=new Float32Array(paths.length*dd[1]*dd[2]);for(let i=0;i<paths.length;i++){const s=await(await fetch(paths[i])).json();ttl.set(s.style_ttl.data.flat(Infinity),i*td[1]*td[2]);dp.set(s.style_dp.data.flat(Infinity),i*dd[1]*dd[2]);}return new Style(new ort.Tensor('float32',ttl,[paths.length,td[1],td[2]]),new ort.Tensor('float32',dp,[paths.length,dd[1],dd[2]]));}
export async function loadTextToSpeech(onnxDir,options={},progress=null){const cfg=await(await fetch(`${onnxDir}/tts.json`)).json(),paths=['duration_predictor.onnx','text_encoder.onnx','vector_estimator.onnx','vocoder.onnx'];const sessions=[];for(let i=0;i<paths.length;i++){progress?.(paths[i],i+1,paths.length);sessions.push(await ort.InferenceSession.create(`${onnxDir}/${paths[i]}`,options));}const indexer=await(await fetch(`${onnxDir}/unicode_indexer.json`)).json();return {textToSpeech:new TextToSpeech(cfg,new UnicodeProcessor(indexer),...sessions),cfgs:cfg};}
function chunkText(text,maxLen=300){const paras=text.trim().split(/\n\s*\n+/).filter(Boolean),chunks=[];for(let p of paras){const sentences=p.trim().split(/(?<=[.!?])\s+/);let cur='';for(const s of sentences){if(cur.length+s.length+1<=maxLen)cur+=(cur?' ':'')+s;else{if(cur)chunks.push(cur.trim());cur=s;}}if(cur)chunks.push(cur.trim());}return chunks.length?chunks:[text.trim()];}
export function writeWavFile(audioData,sampleRate){const buffer=new ArrayBuffer(44+audioData.length*2),v=new DataView(buffer),write=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};write(0,'RIFF');v.setUint32(4,36+audioData.length*2,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,audioData.length*2,true);const pcm=new Int16Array(audioData.length);for(let i=0;i<audioData.length;i++)pcm[i]=Math.floor(Math.max(-1,Math.min(1,audioData[i]))*32767);new Uint8Array(buffer,44).set(new Uint8Array(pcm.buffer));return buffer;}
