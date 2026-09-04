(()=>{
'use strict';
const loaded=new Map();
const ensureScript=(src,test)=>new Promise(resolve=>{
  try{if(test())return resolve(true);if(loaded.has(src))return loaded.get(src).then(resolve);const existing=[...document.scripts].find(s=>s.src.includes(src.split('?')[0]));if(existing){const wait=()=>test()?resolve(true):setTimeout(wait,40);wait();return}const p=new Promise(done=>{const s=document.createElement('script');s.src=src;s.onload=()=>done(true);s.onerror=()=>done(false);document.head.appendChild(s)});loaded.set(src,p);p.then(resolve)}catch(_){resolve(false)}
});
async function install(frame){
 try{
  const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;if(!d||!w)return false;
  await ensureScript('/enochian-test/analyser-signal-unified-v1.js?v=20260904-mesh-restore-v1',()=>typeof window.installEnochianAnalyserSignalUnifiedV1==='function');
  if(typeof window.installEnochianAnalyserSignalUnifiedV1!=='function')return false;
  const unified=!!window.installEnochianAnalyserSignalUnifiedV1(frame);
  if(!unified)return false;
  await ensureScript('/enochian-test/analyser-five-sculpt-points-v1.js?v=20260904-five-sculpt-v1',()=>typeof window.installEnochianFiveSculptPointsV1==='function');
  window.installEnochianFiveSculptPointsV1?.(frame);
  d.querySelectorAll('.analyser-3d:not(.analyser-3d-unified)').forEach(c=>{c.style.setProperty('display','none','important');c.style.setProperty('opacity','0','important')});
  const mesh=d.querySelector('.analyser-3d-unified');if(mesh){mesh.style.setProperty('display','block','important');mesh.style.setProperty('opacity','.96','important')}
  d.documentElement.dataset.analyserSignal3d='unified-restored-v10';
  return !!mesh;
 }catch(_){return false}
}
window.installEnochianAnalyserSignal3D=frame=>{install(frame);let n=0,t=setInterval(async()=>{if(await install(frame)||++n>240)clearInterval(t)},50);return false};
})();