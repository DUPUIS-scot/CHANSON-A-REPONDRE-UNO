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

  // These installers own bounded readiness retries. The outer boot may call
  // them repeatedly, but only one underlying retry loop is armed per iframe.
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
    s.setAttribute(attr,'v3');
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

  // The current terminal boot gate still names stem UI v3 even though the
  // deployed authority is v4. Replace the gate after the inline boot script
  // defines it so a healthy terminal actually exits its 250 ms boot loop.
  const repairBootGate=()=>{
    if(typeof window.terminalBootReady!=='function')return false;
    if(window.terminalBootReady.__enochPerfGate==='v1')return true;
    const ready=function(){
      try{
        const frame=document.getElementById('terminalLive');
        const d=innerDocument(frame),j=d?.defaultView;
        return !!(d?.getElementById('iosFullscreen')&&
          ['v3','v4'].includes(d.documentElement.dataset.stemFourChannel)&&
          d.documentElement.dataset.stemJester==='v11'&&
          d.documentElement.dataset.playbackTransportAuthority==='v1'&&
          d.documentElement.dataset.twoMixMasterAnchor==='v1'&&
          d.documentElement.dataset.analyserControlsContained==='v6'&&
          document.getElementById('doubleDeckerSpecial')?.dataset.ddsControls==='v11'&&
          document.getElementById('doubleDeckerSpecial')?.dataset.jeckerRadial==='v10'&&
          j?.__enochDoubleJesterRuntimeRepair?.version==='v11'&&
          document.documentElement.dataset.outerAnalyserPanel==='v2');
      }catch(_){return false}
    };
    ready.__enochPerfGate='v1';
    window.terminalBootReady=ready;
    document.documentElement.dataset.terminalPerformanceGate='v1';
    return true;
  };

  window.__enochInstallerBroker={
    version:'v3',
    deduped:['analyser-data-bus','stem-four-channel','performance-reset','double-jester-runtime','double-decker-special'],
    repairBootGate
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLateAuthorities,{once:true});
  else installLateAuthorities();
  setTimeout(()=>{if(!repairBootGate())setTimeout(repairBootGate,50)},0);
})();
