// Browser-optimized Supertonic 3 adapter.
// The previous implementation is pinned so the app can switch models without changing index.html.
const CORE='https://cdn.jsdelivr.net/gh/ilhamrafli2/auto-youtube-shorts@f5cbd2119b6904e14444ef9efef8cfdb8a3991f8/supertonic.js';
const FAST='https://huggingface.co/payam1394/traxlate-supertonic-3-q8ve/resolve/main/onnx';
const core=await import(CORE);
export const UnicodeProcessor=core.UnicodeProcessor;
export const Style=core.Style;
export const TextToSpeech=core.TextToSpeech;
export const AVAILABLE_LANGS=core.AVAILABLE_LANGS;
export const writeWavFile=core.writeWavFile;
export const loadVoiceStyle=core.loadVoiceStyle;
export async function loadTextToSpeech(_onnxDir,_options={},progress=null){
  const hc=Number(globalThis.navigator?.hardwareConcurrency||2);
  const threads=Math.min(4,Math.max(1,hc));
  progress?.('browser-optimized WASM model',0,1);
  return core.loadTextToSpeech(FAST,{executionProviders:['wasm'],graphOptimizationLevel:'all',executionMode:'parallel',intraOpNumThreads:threads,interOpNumThreads:1},progress);
}
