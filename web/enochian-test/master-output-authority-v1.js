(()=>{'use strict';
const VERSION='v2';
const innerDocument=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function loadFourLine(){
  if(window.installEnochianFourLineLooperV1){try{window.installEnochianFourLineLooperV1(document.getElementById('terminalLive'))}catch(_){};return}
  if(document.getElementById('enoch-four-line-looper-loader'))return;
  const s=document.createElement('script');s.id='enoch-four-line-looper-loader';s.src='/enochian-test/four-line-looper-v1.js?v=20260830-v1';s.onload=()=>{try{window.installEnochianFourLineLooperV1?.(document.getElementById('terminalLive'))}catch(_){}};document.head.appendChild(s)
}
function install(){
  const frame=document.getElementById('terminalLive'),d=innerDocument(frame),w=d?.defaultView,a=d?.getElementById('audio'),play=d?.getElementById('play');
  if(!d||!w||!a||!play)return false;
  loadFourLine();
  if(d.documentElement.dataset.masterOutputAuthority===VERSION)return true;
  d.documentElement.dataset.masterOutputAuthority=VERSION;
  const recover=async()=>{
    try{
      if(w.__enochFourLineLooper?.state?.started)return;
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