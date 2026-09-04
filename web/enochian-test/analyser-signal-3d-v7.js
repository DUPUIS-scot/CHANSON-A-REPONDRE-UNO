(()=>{
'use strict';
let unifiedLoad=null;
const ensureUnified=()=>{if(typeof window.installEnochianAnalyserSignalUnifiedV1==='function')return Promise.resolve(true);if(unifiedLoad)return unifiedLoad;unifiedLoad=new Promise(resolve=>{try{const existing=[...document.scripts].find(s=>s.src.includes('/enochian-test/analyser-signal-unified-v1.js'));if(existing){const wait=()=>typeof window.installEnochianAnalyserSignalUnifiedV1==='function'?resolve(true):setTimeout(wait,40);wait();return}const s=document.createElement('script');s.src='/enochian-test/analyser-signal-unified-v1.js?v=20260904-unified-five-sculpt-v3';s.onload=()=>resolve(typeof window.installEnochianAnalyserSignalUnifiedV1==='function');s.onerror=()=>resolve(false);document.head.appendChild(s)}catch(_){resolve(false)}});return unifiedLoad};
async function install(frame){
 try{
  const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;if(!d||!w)return false;
  d.documentElement.dataset.analyserSignal3d='retired-v9';
  d.querySelectorAll('.analyser-3d:not(.analyser-3d-unified)').forEach(c=>{c.style.setProperty('display','none','important');c.style.setProperty('opacity','0','important')});
  if(!await ensureUnified())return false;
  const ready=!!window.installEnochianAnalyserSignalUnifiedV1?.(frame);
  const mesh=d.querySelector('.analyser-3d-unified');
  if(mesh){mesh.style.setProperty('display','block','important');mesh.style.setProperty('opacity','.96','important')}
  return ready||!!mesh;
 }catch(_){return false}
}
window.installEnochianAnalyserSignal3D=frame=>{install(frame);let n=0,t=setInterval(async()=>{if(await install(frame)||++n>240)clearInterval(t)},50);return false};
})();