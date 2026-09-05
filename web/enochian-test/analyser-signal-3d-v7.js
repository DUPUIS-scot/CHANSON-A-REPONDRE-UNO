(()=>{
'use strict';
// Compatibility loader only: the legacy renderer is retired. The unified terrain
// renderer remains the sole 3D SIGNAL authority; this shim restores its mesh and
// five sculpt controls without creating a competing renderer.
const loaded=new Map();
const ensureScript=(src,test)=>new Promise(resolve=>{
 try{
  if(test())return resolve(true);
  if(loaded.has(src))return loaded.get(src).then(resolve);
  const existing=[...document.scripts].find(s=>s.src.includes(src.split('?')[0]));
  if(existing){let n=0;const wait=()=>test()?resolve(true):(++n>250?resolve(false):setTimeout(wait,40));wait();return}
  const p=new Promise(done=>{const s=document.createElement('script');s.src=src;s.onload=()=>done(test());s.onerror=()=>done(false);document.head.appendChild(s)});
  loaded.set(src,p);p.then(resolve);
 }catch(_){resolve(false)}
});
async function install(frame){
 try{
  const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;if(!d||!w)return false;
  const unifiedReady=await ensureScript('/enochian-test/analyser-signal-unified-v1.js?v=20260905-terrain-restore-v3',()=>typeof window.installEnochianAnalyserSignalUnifiedV1==='function');
  if(!unifiedReady)return false;
  window.installEnochianAnalyserSignalUnifiedV1(frame);
  let mesh=null;
  for(let i=0;i<80&&!mesh;i++){mesh=d.querySelector('.analyser-3d-unified');if(!mesh)await new Promise(r=>setTimeout(r,25))}
  if(!mesh)return false;
  mesh.style.setProperty('display','block','important');mesh.style.setProperty('opacity','.96','important');mesh.style.setProperty('visibility','visible','important');
  d.querySelectorAll('.analyser-3d:not(.analyser-3d-unified)').forEach(c=>{c.style.setProperty('display','none','important');c.style.setProperty('opacity','0','important')});
  const sculptReady=await ensureScript('/enochian-test/analyser-five-sculpt-points-v1.js?v=20260905-five-sculpt-restore-v3',()=>typeof window.installEnochianFiveSculptPointsV1==='function');
  if(sculptReady)window.installEnochianFiveSculptPointsV1?.(frame);
  d.documentElement.dataset.analyserSignal3d='retired-v9';
  d.documentElement.dataset.analyserSignalTerrain='unified-terrain-restored-v13';
  return true;
 }catch(_){return false}
}
window.installEnochianAnalyserSignal3D=frame=>{install(frame);let n=0,t=setInterval(async()=>{if(await install(frame)||++n>240)clearInterval(t)},50);return false};
})();
