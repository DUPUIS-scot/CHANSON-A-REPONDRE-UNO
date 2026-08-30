(()=>{'use strict';
const VERSION='v1';
const innerDocument=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(){
  const frame=document.getElementById('terminalLive'),d=innerDocument(frame),w=d?.defaultView,a=d?.getElementById('audio'),play=d?.getElementById('play');
  if(!d||!w||!a||!play)return false;
  if(d.documentElement.dataset.masterOutputAuthority===VERSION)return true;
  d.documentElement.dataset.masterOutputAuthority=VERSION;
  const recover=async()=>{
    try{
      if(w.__enochNativeStemEngine?.status?.().enabled) return;
      if(a.paused) await a.play();
      d.documentElement.dataset.masterOutputState='playing';
    }catch(_){d.documentElement.dataset.masterOutputState='blocked'}
  };
  play.addEventListener('click',()=>setTimeout(recover,0),false);
  a.addEventListener('play',()=>{d.documentElement.dataset.masterOutputState='playing'});
  a.addEventListener('pause',()=>{d.documentElement.dataset.masterOutputState='paused'});
  w.__enochMasterOutputAuthority={version:VERSION,recover};
  return true;
}
let n=0;const timer=setInterval(()=>{if(install()||++n>240)clearInterval(timer)},50);
})();