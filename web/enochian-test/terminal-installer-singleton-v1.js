(()=>{
  'use strict';

  const innerDocument=frame=>{
    try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}
  };

  const wrap=(name,ready)=>{
    const original=window[name];
    if(typeof original!=='function'||original.__enochSingletonWrapped)return;
    let documentToken=null;
    let armed=false;
    const wrapped=frame=>{
      let token=null;
      try{token=frame?.contentDocument||null}catch(_){}
      if(token!==documentToken){documentToken=token;armed=false}
      if(ready?.(frame))return true;
      if(armed)return false;
      armed=true;
      try{return !!original(frame)}catch(_){return false}
    };
    wrapped.__enochSingletonWrapped=true;
    wrapped.__enochOriginal=original;
    window[name]=wrapped;
  };

  const innerDataset=(frame,key)=>innerDocument(frame)?.documentElement?.dataset?.[key];

  // These installers all own their own bounded readiness retry. The outer boot
  // may call them repeatedly, but only the first call per iframe document is
  // allowed to arm the underlying retry loop.
  wrap('installEnochianAnalyserDataBus',frame=>['v2','v3'].includes(innerDataset(frame,'analyserDataBus')));
  wrap('installEnochianStemFourChannelV1',frame=>['v3','v4'].includes(innerDataset(frame,'stemFourChannel')));
  wrap('installEnochianPerformanceResetV1',frame=>innerDataset(frame,'performanceResetV1')==='1');
  wrap('installEnochianDoubleJeckerRuntimeRepairV1',frame=>{
    try{return ['v11','v12'].includes(innerDocument(frame)?.defaultView?.__enochDoubleJesterRuntimeRepair?.version)}catch(_){return false}
  });
  wrap('installEnochianDoubleDeckerSpecialV2',()=>document.getElementById('doubleDeckerSpecial')?.dataset?.ddsControls==='v11');

  const loadScript=(attr,src,ready)=>{
    if(ready())return;
    if(document.querySelector(`script[${attr}]`))return;
    const s=document.createElement('script');
    s.src=src;
    s.setAttribute(attr,'v2');
    s.onload=ready;
    document.head.appendChild(s);
  };

  const installLateAuthorities=()=>{
    const frame=document.getElementById('terminalLive');
    loadScript('data-enoch-playback-blue','/enochian-test/playback-elapsed-terminal-blue-v1.js?v=20260827-v1',()=>{
      if(window.installEnochianPlaybackElapsedBlueV1){window.installEnochianPlaybackElapsedBlueV1(frame);return true}
      return false;
    });
    loadScript('data-enoch-layout-contract','/enochian-test/terminal-viewport-layout-contract-v1.js?v=20260827-v1',()=>{
      if(window.installEnochianTerminalViewportLayoutContractV1){window.installEnochianTerminalViewportLayoutContractV1(frame);return true}
      return false;
    });
  };

  window.__enochInstallerBroker={
    version:'v2',
    deduped:['analyser-data-bus','stem-four-channel','performance-reset','double-jester-runtime','double-decker-special']
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLateAuthorities,{once:true});
  else installLateAuthorities();
})();
