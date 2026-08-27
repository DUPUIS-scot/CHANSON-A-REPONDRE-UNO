(()=>{
'use strict';
function install(frame){
 try{
  const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
  const panel=document.getElementById('outerAnalyserPanel'),canvas=panel?.querySelector('#outerAnalyserCanvas');
  if(!d||!w||!panel||!canvas)return false;
  if(panel.dataset.hiresFloat==='v1')return true;panel.dataset.hiresFloat='v1';
  const sync=()=>{
   if(!panel.classList.contains('open'))return;
   const r=canvas.getBoundingClientRect(),dpr=Math.min(3,Math.max(1,window.devicePixelRatio||1));
   const W=Math.max(2,Math.round(r.width*dpr)),H=Math.max(2,Math.round(r.height*dpr));
   if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
   canvas.style.width='100%';canvas.style.height='100%';
   w.__enochAnalyser3D?.invalidate?.();
  };
  if(window.ResizeObserver){const ro=new ResizeObserver(()=>requestAnimationFrame(sync));ro.observe(panel);ro.observe(canvas);panel.__hiresFloatObserver=ro}
  window.addEventListener('resize',()=>requestAnimationFrame(sync));
  document.addEventListener('fullscreenchange',()=>setTimeout(sync,60));
  document.addEventListener('webkitfullscreenchange',()=>setTimeout(sync,60));
  const mo=new MutationObserver(sync);mo.observe(panel,{attributes:true,attributeFilter:['class','style']});panel.__hiresFloatMutation=mo;
  requestAnimationFrame(sync);return true;
 }catch(_){return false}
}
window.installEnochianFloatHiResRepairV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)};
})();