(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const api=w&&w.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial');
      if(!d||!w||!api||!panel)return false;
      if(w.__enochDoubleJeckerRuntimeRepair?.version==='v2')return true;

      let relayAttachPending=false,performanceLoadPending=false;
      const clampPanel=()=>{
        try{
          const radial=w.__enochDoubleJeckerRadial;
          if(!radial?.clamp)return false;
          const r=panel.getBoundingClientRect();
          const out=r.left<0||r.top<0||r.right>innerWidth||r.bottom>innerHeight;
          if(out||panel.classList.contains('open'))radial.clamp();
          return true;
        }catch(_){return false}
      };
      const ensurePerformance=()=>{
        try{
          if(w.__enochDoubleJeckerPerformance?.version==='v2')return true;
          if(window.installEnochianDoubleJeckerPerformanceV2)return !!window.installEnochianDoubleJeckerPerformanceV2(host);
          if(performanceLoadPending)return false;
          performanceLoadPending=true;
          let s=document.querySelector('script[data-jecker-addon="performance-v2"]');
          if(!s){s=document.createElement('script');s.src='/enochian-test/double-jecker-performance-v2.js?v=20260827-v2';s.dataset.jeckerAddon='performance-v2';document.head.appendChild(s)}
          s.addEventListener('load',()=>{performanceLoadPending=false;try{window.installEnochianDoubleJeckerPerformanceV2?.(host)}catch(_){}},{once:true});
          s.addEventListener('error',()=>{performanceLoadPending=false},{once:true});
          return false;
        }catch(_){performanceLoadPending=false;return false}
      };
      const ensureAudioRoute=()=>{
        try{
          if(!api.state?.enabled)return true;
          api.ensureOutputGain?.();
          const relay=w.__enochDoubleJeckerSignalRelay;
          if(relay?.attach&&!relay.state?.attached&&!relayAttachPending){
            relayAttachPending=true;
            Promise.resolve(relay.attach()).finally(()=>{relayAttachPending=false});
          }
          return true;
        }catch(_){relayAttachPending=false;return false}
      };
      const health=()=>{
        const native=w.__enochNativeStemEngine?.status?.()||null;
        const relay=w.__enochDoubleJeckerSignalRelay||null;
        const output=w.__enochDoubleJeckerOutput||null;
        const radial=w.__enochDoubleJeckerRadial||null;
        const shield=w.__enochDoubleJeckerShield||w.__enochDoubleJeckerTurntableShield||null;
        const performance=w.__enochDoubleJeckerPerformance||null;
        const live=!!api.state?.enabled;
        const conflict=live&&!!native?.enabled;
        return {
          version:'v2',live,conflict,
          nativeEnabled:!!native?.enabled,
          outputReady:!!output,
          relayReady:!!relay,
          relayAttached:!!relay?.state?.attached,
          radialReady:!!radial,
          shieldReady:!!shield,
          performanceReady:performance?.version==='v2',
          splitAuthorityReady:performance?.version==='v2',
          healthy:!conflict&&(!live||!!output)&&(!live||!relay||!!relay.state?.attached)&&performance?.version==='v2'
        };
      };
      const paintHealth=()=>{
        try{
          const h=health();
          d.documentElement.dataset.doubleJeckerRuntime=h.healthy?'healthy':'degraded';
          d.documentElement.dataset.doubleJeckerConflict=h.conflict?'true':'false';
          d.documentElement.dataset.doubleJeckerPerformance=h.performanceReady?'ready':'loading';
          if(h.conflict)w.__enochStemJecker?.reconcile?.();
        }catch(_){}
      };
      const maintain=()=>{clampPanel();ensurePerformance();ensureAudioRoute();paintHealth()};
      const observer=new MutationObserver(()=>requestAnimationFrame(clampPanel));
      observer.observe(panel,{attributes:true,attributeFilter:['class','style']});
      const timer=w.setInterval(maintain,350);
      w.addEventListener('resize',()=>requestAnimationFrame(clampPanel));
      w.addEventListener('orientationchange',()=>w.setTimeout(clampPanel,80));
      w.setTimeout(clampPanel,0);w.setTimeout(clampPanel,120);w.setTimeout(maintain,180);
      w.__enochDoubleJeckerRuntimeRepair={version:'v2',health,maintain,clamp:clampPanel,ensureAudioRoute,ensurePerformance};
      w.addEventListener('pagehide',()=>{observer.disconnect();w.clearInterval(timer)},{once:true});
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerRuntimeRepairV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
