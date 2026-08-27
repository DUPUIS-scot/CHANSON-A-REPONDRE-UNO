(()=>{
  'use strict';
  const wrap=(name,ready)=>{
    const original=window[name];
    if(typeof original!=='function'||original.__enochSingletonWrapped)return;
    let documentToken=null;
    let armed=false;
    const wrapped=frame=>{
      let token=null;
      try{token=frame?.contentDocument||null}catch(_){}
      if(token!==documentToken){documentToken=token;armed=false}
      if(ready(frame))return true;
      if(armed)return false;
      armed=true;
      try{return !!original(frame)}catch(_){return false}
    };
    wrapped.__enochSingletonWrapped=true;
    wrapped.__enochOriginal=original;
    window[name]=wrapped;
  };
  const innerDocument=frame=>{
    try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}
  };
  wrap('installEnochianStemFourChannelV1',frame=>['v3','v4'].includes(innerDocument(frame)?.documentElement?.dataset?.stemFourChannel));
  wrap('installEnochianDoubleDeckerSpecialV2',frame=>document.getElementById('doubleDeckerSpecial')?.dataset?.ddsControls==='v11');
  const loadElapsedBlue=()=>{
    if(window.installEnochianPlaybackElapsedBlueV1){window.installEnochianPlaybackElapsedBlueV1(document.getElementById('terminalLive'));return}
    if(document.querySelector('script[data-enoch-playback-blue]'))return;
    const s=document.createElement('script');s.src='/enochian-test/playback-elapsed-terminal-blue-v1.js?v=20260827-v1';s.dataset.enochPlaybackBlue='v1';s.onload=()=>window.installEnochianPlaybackElapsedBlueV1?.(document.getElementById('terminalLive'));document.head.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadElapsedBlue,{once:true});else loadElapsedBlue();
})();
