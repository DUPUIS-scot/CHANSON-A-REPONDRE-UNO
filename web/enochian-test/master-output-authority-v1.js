(()=>{'use strict';
const VERSION='v3';
const innerDocument=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function looperAuthorized(){try{return Number(sessionStorage.getItem('enochianMidiUntil')||0)>Date.now()}catch(_){return false}}
function loadFourLine(){
  const host=document.getElementById('terminalLive');
  if(!looperAuthorized()){
    try{const d=innerDocument(host);d?.getElementById('enoch-four-line-looper')?.remove();if(d)d.documentElement.dataset.fourLineLooperAccess='locked'}catch(_){}
    return;
  }
  if(window.installEnochianFourLineLooperV1){try{window.installEnochianFourLineLooperV1(host)}catch(_){};return}
  if(document.getElementById('enoch-four-line-looper-loader'))return;
  const s=document.createElement('script');s.id='enoch-four-line-looper-loader';s.src='/enochian-test/four-line-looper-v1.js?v=20260831-private-v2';s.onload=()=>{try{window.installEnochianFourLineLooperV1?.(host)}catch(_){}};document.head.appendChild(s)
}
function install(){
  const frame=document.getElementById('terminalLive'),d=innerDocument(frame),w=d?.defaultView,a=d?.getElementById('audio'),play=d?.getElementById('play');
  if(!d||!w||!a||!play)return false;
  d.getElementById('enoch-live-input-bar')?.remove();
  loadFourLine();
  if(d.documentElement.dataset.masterOutputAuthority===VERSION)return true;
  d.documentElement.dataset.masterOutputAuthority=VERSION;
  d.documentElement.dataset.fourLineLooperAccess=looperAuthorized()?'authorized':'locked';
  const recover=async()=>{
    try{
      if(w.__enochFourLineLooper?.state?.started)return;
      if(w.__enochNativeStemEngine?.status?.().enabled)return;
      if(a.paused)await a.play();
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