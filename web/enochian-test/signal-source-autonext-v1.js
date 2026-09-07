(()=>{
'use strict';
const VERSION='v2';
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
  const d=deckDoc(frame),w=d?.defaultView;if(!d||!w)return false;
  if(d.documentElement.dataset.signalSourceAutonext===VERSION)return true;
  const audio=d.getElementById('audio'),track=d.getElementById('track');
  if(!audio||!track)return false;
  // Playlist continuation is the only responsibility of this legacy entry point.
  // Signal-source selection belongs exclusively to signal-source-unified-v2.
  let autoAdvancing=false;
  const advance=async()=>{
    if(autoAdvancing||w.__enochLoopAuthority?.enabled)return false;
    autoAdvancing=true;
    try{
      const options=[...track.options];if(!options.length)return false;
      const old=track.selectedIndex<0?0:track.selectedIndex,nextIndex=(old+1)%options.length;
      if(nextIndex===old&&options.length===1){audio.currentTime=0;await audio.play().catch(()=>{});return true}
      track.selectedIndex=nextIndex;
      track.dispatchEvent(new w.Event('change',{bubbles:true}));
      await new Promise(resolve=>w.setTimeout(resolve,0));
      const playWhenReady=()=>audio.play().catch(()=>{});
      if(audio.readyState>=2)playWhenReady();else audio.addEventListener('canplay',playWhenReady,{once:true});
      w.__enochAnalyserBus?.emit?.('playlist-auto-next',{from:old,to:nextIndex,source:w.__enochSignalSource||'mix'});
      return true;
    }finally{w.setTimeout(()=>{autoAdvancing=false},120)}
  };
  const onEnded=()=>{if(!w.__enochLoopAuthority?.enabled)advance()};
  audio.addEventListener('ended',onEnded,false);
  d.documentElement.dataset.signalSourceAutonext=VERSION;
  w.__enochPlaylistAutoNext={version:VERSION,advance};
  w.addEventListener('pagehide',()=>audio.removeEventListener('ended',onEnded,false),{once:true});
  return true;
}
let timer=0;window.installEnochianSignalSourceAutonextV1=frame=>{if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>240){clearInterval(timer);timer=0}},100)}return false};
const boot=()=>{const frame=document.getElementById('terminalLive');if(!frame)return;const run=()=>window.installEnochianSignalSourceAutonextV1(frame);frame.addEventListener('load',run);run()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
})();

