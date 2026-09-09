// Browser-optimized Supertonic 3 adapter.
// Prefer WebGPU on modern iPhone/iPad; fall back to the smaller q8ve WASM model.
const CORE='https://cdn.jsdelivr.net/gh/ilhamrafli2/auto-youtube-shorts@f5cbd2119b6904e14444ef9efef8cfdb8a3991f8/supertonic.js';
const FAST='https://huggingface.co/payam1394/traxlate-supertonic-3-q8ve/resolve/main/onnx';
const core=await import(CORE);
export const UnicodeProcessor=core.UnicodeProcessor;
export const Style=core.Style;
export const TextToSpeech=core.TextToSpeech;
export const AVAILABLE_LANGS=core.AVAILABLE_LANGS;
export const writeWavFile=core.writeWavFile;
export const loadVoiceStyle=core.loadVoiceStyle;

export async function loadTextToSpeech(_onnxDir,options={},progress=null){
  const hc=Number(globalThis.navigator?.hardwareConcurrency||2);
  const threads=Math.min(4,Math.max(1,hc));
  const base={graphOptimizationLevel:'all',executionMode:'parallel',intraOpNumThreads:threads,interOpNumThreads:1};

  // Try WebGPU first. This avoids the heavy CPU/WASM path on supported iOS browsers.
  if(globalThis.navigator?.gpu){
    try{
      progress?.('WebGPU',0,1);
      return await core.loadTextToSpeech(FAST,{...base,executionProviders:['webgpu']},progress);
    }catch(e){
      console.warn('Supertonic WebGPU failed; using q8ve WASM fallback',e);
      progress?.('WASM fallback',0,1);
    }
  }

  progress?.('q8ve WASM',0,1);
  return core.loadTextToSpeech(FAST,{...base,executionProviders:['wasm']},progress);
}
