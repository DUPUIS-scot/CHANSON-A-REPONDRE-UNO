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
  const loadScript=(attr,src,ready)=>{
    if(ready())return;
    if(document.querySelector(`script[${attr}]`))return;
    const s=document.createElement('script');s.src=src;s.setAttribute(attr,'v1');s.onload=ready;document.head.appendChild(s);
  };
  const installLateAuthorities=()=>{
    const frame=document.getElementById('terminalLive');
    loadScript('data-enoch-playback-blue','/enochian-test/playback-elapsed-terminal-blue-v1.js?v=20260827-v1',()=>{if(window.installEnochianPlaybackElapsedBlueV1){window.installEnochianPlaybackElapsedBlueV1(frame);return true}return false});
    loadScript('data-enoch-layout-contract','/enochian-test/terminal-viewport-layout-contract-v1.js?v=20260827-v1',()=>{if(window.installEnochianTerminalViewportLayoutContractV1){window.installEnochianTerminalViewportLayoutContractV1(frame);return true}return false});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLateAuthorities,{once:true});else installLateAuthorities();
})();
