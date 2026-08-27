(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const api=w&&w.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial');
      if(!d||!w||!api||!panel)return false;
      if(w.__enochDoubleJeckerRuntimeRepair?.version==='v1')return true;

      let relayAttachPending=false;
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
        const live=!!api.state?.enabled;
        const conflict=live&&!!native?.enabled;
        return {
          version:'v1',live,conflict,
          nativeEnabled:!!native?.enabled,
          outputReady:!!output,
          relayReady:!!relay,
          relayAttached:!!relay?.state?.attached,
          radialReady:!!radial,
          shieldReady:!!shield,
          healthy:!conflict&&(!live||!!output)&&(!live||!relay||!!relay.state?.attached)
        };
      };
      const paintHealth=()=>{
        try{
          const h=health();
          d.documentElement.dataset.doubleJeckerRuntime=h.healthy?'healthy':'degraded';
          d.documentElement.dataset.doubleJeckerConflict=h.conflict?'true':'false';
          if(h.conflict)w.__enochStemJecker?.reconcile?.();
        }catch(_){}
      };
      const maintain=()=>{clampPanel();ensureAudioRoute();paintHealth()};
      const observer=new MutationObserver(()=>requestAnimationFrame(clampPanel));
      observer.observe(panel,{attributes:true,attributeFilter:['class','style']});
      const timer=w.setInterval(maintain,500);
      w.addEventListener('resize',()=>requestAnimationFrame(clampPanel));
      w.addEventListener('orientationchange',()=>w.setTimeout(clampPanel,80));
      w.setTimeout(clampPanel,0);w.setTimeout(clampPanel,120);w.setTimeout(maintain,180);
      w.__enochDoubleJeckerRuntimeRepair={version:'v1',health,maintain,clamp:clampPanel,ensureAudioRoute};
      w.addEventListener('pagehide',()=>{observer.disconnect();w.clearInterval(timer)},{once:true});
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerRuntimeRepairV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
