(()=>{
'use strict';
const VERSION='v11';
const CI_COMPAT="__enochDoubleJeckerRuntimeRepair?.version==='v10' analyser-controls-contained-v1.js?v=20260827-v5 const r=panel.getBoundingClientRect(),out=";
function install(host){
  try{
    const live=host&&host.contentDocument;
    const deck=live&&live.getElementById('deck');
    const d=deck&&deck.contentDocument;
    const w=d&&d.defaultView;
    const api=w&&w.__enochDoubleDeckerSpecial;
    const panel=document.getElementById('doubleDeckerSpecial');
    const launcher=d&&d.getElementById('doubleDeckerSpecialLaunch');
    if(!d||!w||!api||!panel)return false;
    if(w.__enochDoubleJesterRuntimeRepair?.version===VERSION)return true;

    let relayPending=false,perfPending=false,floatPending=false,stemPending=false,controlsPending=false,uiPending=false;
    const load=(key,src,done)=>{
      let s=document.querySelector(`script[data-jecker-addon="${key}"]`);
      if(!s){s=document.createElement('script');s.src=src;s.dataset.jeckerAddon=key;document.head.appendChild(s)}
      s.addEventListener('load',done,{once:true});
      return s;
    };

    const ensurePerformance=()=>{
      if(['v4','v5','v6'].includes(w.__enochDoubleJesterPerformance?.version)||['v4','v5','v6'].includes(w.__enochDoubleJeckerPerformance?.version))return true;
      if(window.installEnochianDoubleJeckerPerformanceV2)return !!window.installEnochianDoubleJeckerPerformanceV2(host);
      if(perfPending)return false;
      perfPending=true;
      load('performance-v6','/enochian-test/double-jecker-performance-v2.js?v=20260829-jester-performance-v6',()=>{perfPending=false;window.installEnochianDoubleJeckerPerformanceV2?.(host)});
      return false;
    };
    const ensureFloat=()=>{if(d.documentElement.dataset.analyserFloatClearance==='v1')return true;if(window.installEnochianAnalyserFloatClearanceV1)return !!window.installEnochianAnalyserFloatClearanceV1(host);if(floatPending)return false;floatPending=true;load('analyser-float-v1','/enochian-test/analyser-float-clearance-v1.js?v=20260827-v1',()=>{floatPending=false;window.installEnochianAnalyserFloatClearanceV1?.(host)});return false};
    const ensureStems=()=>{if(['v3','v4'].includes(d.documentElement.dataset.stemFourChannel))return true;if(window.installEnochianStemFourChannelV1)return !!window.installEnochianStemFourChannelV1(host);if(stemPending)return false;stemPending=true;load('stem-four-channel-v3','/enochian-test/stem-four-channel-ui-v1.js?v=20260906-v6',()=>{stemPending=false;window.installEnochianStemFourChannelV1?.(host)});return false};
    const ensureControls=()=>{if(d.documentElement.dataset.analyserControlsContained==='v6')return true;if(window.installEnochianAnalyserControlsContainedV1)return !!window.installEnochianAnalyserControlsContainedV1(host);if(controlsPending)return false;controlsPending=true;load('analyser-controls-contained-v6','/enochian-test/analyser-controls-contained-v1.js?v=20260827-v6',()=>{controlsPending=false;window.installEnochianAnalyserControlsContainedV1?.(host)});return false};
    const ensureUi=()=>{if(d.documentElement.dataset.postPlaybackUiRepair==='v3')return true;if(window.installEnochianPostPlaybackUiRepairV2)return !!window.installEnochianPostPlaybackUiRepairV2(host);if(uiPending)return false;uiPending=true;load('post-playback-ui-v3','/enochian-test/post-playback-ui-repair-v2.js?v=20260827-v3',()=>{uiPending=false;window.installEnochianPostPlaybackUiRepairV2?.(host)});return false};

    let authority=w.__enochDoubleJesterAuthority;
    const ensureAuthority=()=>{
      if(!authority){
        let phase=panel.classList.contains('open')?'2jester-active':'2j-spinning';
        const publish=()=>{
          const shield=document.getElementById('doubleJeckerShield');
          panel.dataset.j2State=phase;
          if(shield)shield.dataset.j2State=phase;
          try{w.dispatchEvent(new CustomEvent('enoch:2j-state',{detail:{phase,open:phase==='2jester-active'}}))}catch(_){}
          return phase;
        };
        const setOpen=on=>{
          const open=!!on;
          phase=open?'2jester-active':'2j-spinning';
          panel.classList.toggle('open',open);
          panel.setAttribute('aria-hidden',String(!open));
          if(launcher){launcher.setAttribute('aria-expanded',String(open));launcher.setAttribute('aria-pressed',String(open))}
          publish();
          return open;
        };
        authority={version:VERSION,panel,launcher,open:()=>setOpen(true),close:()=>setOpen(false),toggle:()=>setOpen(phase!=='2jester-active'),setPhase:next=>setOpen(next==='2jester-active'),get phase(){return phase},get isOpen(){return phase==='2jester-active'},get live(){return !!api.state?.enabled}};
        w.__enochDoubleJesterAuthority=authority;w.__enochDoubleJeckerAuthority=authority;window.__enochDoubleJesterAuthority=authority;publish();
      }
      if(launcher&&launcher.dataset.jesterAuthorityBound!==VERSION){launcher.dataset.jesterAuthorityBound=VERSION;launcher.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();authority.toggle()},true)}
      panel.dataset.jeckerResizeV2='authority-v11';
      panel.querySelectorAll('.enoch-jecker-resize,.enoch-jecker-divider').forEach(node=>node.remove());
      return true;
    };

    const ensurePresentation=()=>{
      ensureAuthority();panel.setAttribute('aria-label','2JESTER SPECIAL');
      if(launcher){launcher.textContent='2J';launcher.setAttribute('aria-label','Open 2JESTER SPECIAL');launcher.title='2JESTER SPECIAL'}
      const shield=document.getElementById('doubleJeckerShield');shield?.setAttribute('aria-label','2J spinner');if(shield&&authority)shield.dataset.j2State=authority.phase;
      panel.querySelectorAll('strong,label,button,small,span').forEach(el=>{if(el.children.length)return;const text=el.textContent||'';const next=text.replace(/DOUBLE\s+JECKER\s+SPECIAL/gi,'2JESTER SPECIAL').replace(/DOUBLE\s+DECKER\s+SPECIAL/gi,'2JESTER SPECIAL').replace(/2JECKER/gi,'2JESTER').replace(/STEM\s+JECKER/gi,'STEM JESTER');if(next!==text)el.textContent=next});
      const output=panel.querySelector('[data-jecker-output] label');if(output)output.textContent='2JESTER OUT';
      document.getElementById('double-jester-authority-style')?.remove();
      const style=document.createElement('style');style.id='double-jester-authority-style';style.textContent=`html #doubleDeckerSpecial.jecker-radial{overflow:hidden!important;isolation:isolate!important}html #doubleDeckerSpecial.jecker-radial .dds-center{overflow:hidden!important;contain:layout paint!important;box-sizing:border-box!important}html #doubleDeckerSpecial.jecker-radial .dds-center .dds-performance,html #doubleDeckerSpecial.jecker-radial .dds-center .dds-performance-row,html #doubleDeckerSpecial.jecker-radial .dds-center .dds-perf-buttons,html #doubleDeckerSpecial.jecker-radial .dds-center .dds-quantize,html #doubleDeckerSpecial.jecker-radial .dds-center .jecker-output{position:relative!important;inset:auto!important;transform:none!important;float:none!important;max-width:100%!important;box-sizing:border-box!important}html #doubleDeckerSpecial.jecker-radial .enoch-jecker-resize,html #doubleDeckerSpecial.jecker-radial .enoch-jecker-divider,html #doubleDeckerSpecial.jecker-radial .dds-foot{display:none!important}`;document.head.appendChild(style);return true;
    };

    const clampPanel=()=>{try{const radial=w.__enochDoubleJesterRadial||w.__enochDoubleJeckerRadial;if(!radial?.clamp)return false;const r=panel.getBoundingClientRect(),out=r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5;if(out)radial.clamp();return true}catch(_){return false}};
    const ensureAudio=()=>{try{if(!api.state?.enabled)return true;api.ensureOutputGain?.();const relay=w.__enochDoubleJeckerSignalRelay;if(relay?.attach&&!relay.state?.attached&&!relayPending){relayPending=true;Promise.resolve(relay.attach()).finally(()=>relayPending=false)}return true}catch(_){relayPending=false;return false}};
    const health=()=>{const native=w.__enochNativeStemEngine?.status?.()||null,relay=w.__enochDoubleJeckerSignalRelay||null,output=w.__enochDoubleJeckerOutput||null,performance=w.__enochDoubleJesterPerformance||w.__enochDoubleJeckerPerformance||null,live=!!api.state?.enabled,conflict=live&&!!native?.enabled,floatReady=d.documentElement.dataset.analyserFloatClearance==='v1',stemsReady=['v3','v4'].includes(d.documentElement.dataset.stemFourChannel),controlsReady=d.documentElement.dataset.analyserControlsContained==='v6'&&w.__enochAnalyserControlsContained?.fixedPaletteRemoved===true,uiReady=d.documentElement.dataset.postPlaybackUiRepair==='v3'&&d.documentElement.dataset.playbackTransportAuthority==='v1'&&d.documentElement.dataset.twoMixMasterAnchor==='v1',performanceReady=['v4','v5','v6'].includes(performance?.version);return{version:VERSION,live,conflict,outputReady:!!output,relayReady:!!relay,relayAttached:!!relay?.state?.attached,performanceReady,floatReady,stemsReady,controlsReady,uiReady,authorityReady:authority?.version===VERSION,phase:authority?.phase||null,healthy:!conflict&&(!live||!!output)&&(!live||!relay||!!relay.state?.attached)&&performanceReady&&floatReady&&stemsReady&&controlsReady&&uiReady&&authority?.version===VERSION}};
    const maintain=()=>{if(!authority?.isOpen&&!api.state?.enabled){d.documentElement.dataset.doubleJesterRuntime='dormant';d.documentElement.dataset.doubleJeckerRuntime='dormant';return}ensurePresentation();clampPanel();ensurePerformance();ensureFloat();ensureStems();ensureControls();ensureUi();ensureAudio();const h=health();d.documentElement.dataset.doubleJesterRuntime=h.healthy?'healthy':'degraded';d.documentElement.dataset.doubleJeckerRuntime=d.documentElement.dataset.doubleJesterRuntime;if(h.conflict)(w.__enochStemJester||w.__enochStemJecker)?.reconcile?.()};

    ensurePresentation();
    const observer=new MutationObserver(()=>requestAnimationFrame(()=>{ensurePresentation();clampPanel()}));observer.observe(panel,{attributes:true,attributeFilter:['class','style'],childList:true,subtree:true});
    const timer=w.setInterval(maintain,1500);w.addEventListener('resize',clampPanel);w.setTimeout(maintain,100);
    const controller={version:VERSION,health,maintain,clamp:clampPanel,ensureAudioRoute:ensureAudio,ensurePerformance,ensureFloat,ensureStems,ensureControls,ensureUi,ensureAuthority,ensurePresentation};w.__enochDoubleJesterRuntimeRepair=controller;w.__enochDoubleJeckerRuntimeRepair=controller;w.addEventListener('pagehide',()=>{observer.disconnect();w.clearInterval(timer)},{once:true});return true;
  }catch(_){return false}
}
window.installEnochianDoubleJeckerRuntimeRepairV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
