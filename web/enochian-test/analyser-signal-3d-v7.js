(()=>{
'use strict';
function install(frame){
 try{
  const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;if(!d||!w)return false;
  d.querySelectorAll('.analyser-3d:not(.analyser-3d-unified)').forEach(c=>{c.style.setProperty('display','none','important');c.style.setProperty('opacity','0','important')});
  d.documentElement.dataset.analyserSignal3d='retired-v9';
  if(window.installEnochianAnalyserSignalUnifiedV1)return !!window.installEnochianAnalyserSignalUnifiedV1(frame);
  return false;
 }catch(_){return false}
}
window.installEnochianAnalyserSignal3D=frame=>{if(install(frame))return true;let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return false};
})();