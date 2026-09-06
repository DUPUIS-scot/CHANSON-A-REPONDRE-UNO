(()=>{
'use strict';
const VERSION='v11';
function install(host){
  try{
    const live=host&&host.contentDocument;
    const deck=live&&live.getElementById('deck');
    const d=deck&&deck.contentDocument;
    const w=d&&d.defaultView;
    const api=w&&w.__enochDoubleDeckerSpecial;
    const engine=w&&w.__enochNativeStemEngine;
    const panel=document.getElementById('doubleDeckerSpecial');
    const stemMaster=d&&d.getElementById('stemMasterToggle');
    if(!d||!w||!api||!engine||!panel||!stemMaster||typeof api.setStemOn!=='function')return false;
    if(d.documentElement.dataset.stemJester===VERSION)return true;
    d.documentElement.dataset.stemJester=VERSION;
    d.documentElement.dataset.stemJecker=VERSION;

    document.getElementById('stem-jecker-live-style')?.remove();
    document.getElementById('stem-jester-live-style')?.remove();
    const style=document.createElement('style');
    style.id='stem-jester-live-style';
    style.textContent=`
      .dds-slot .stem-toggle{background:#07100e!important;color:#7a9a94!important;border-color:#315b56!important;box-shadow:none!important}.dds-slot .stem-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important;font-weight:1000!important}
      .stem-jester-toggle,.stem-jecker-toggle{width:100%;min-height:28px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.stem-jester-toggle.active,.stem-jecker-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important}
      #stemMasterToggle.stem-jester-mode,#stemMasterToggle.stem-jecker-mode{background:#5b350b!important;color:#ffd17a!important;border-color:#e88422!important;box-shadow:0 0 10px #ff7a184f!important;font-weight:1000!important}
    `;
    document.head.appendChild(style);

    const keys=['vocals','drums','bass','other'];
    const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
    const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
    let linked=false;
    let mode=engine.status?.().enabled?'on':'off';
    let transition=null;

    const stateFor=key=>{
      const state=engine.status?.().states?.[key];
      const button=d.querySelector(`[data-stem-toggle="${key}"]`);
      const range=d.querySelector(`[data-stem-range="${key}"]`);
      return{on:button?button.classList.contains('active'):!!state?.on,level:range?clamp(Number(range.value)/100):clamp(state?.level)};
    };
    const liveMask=()=>Object.fromEntries(keys.map(key=>[key,linked?stateFor(key).on:(api.state?.slots?.A?.[key]?.on!==false||api.state?.slots?.B?.[key]?.on!==false)]));
    const propagate=()=>{
      if(!linked)return false;
      keys.forEach(key=>{const state=stateFor(key);api.setStemOn?.('A',key,state.on);api.setStemOn?.('B',key,state.on);api.setStemLevel?.('A',key,state.level);api.setStemLevel?.('B',key,state.level)});
      api.enforceActivePlayback?.(false);
      return true;
    };

    const setNative=async on=>{
      try{
        if(on){if(api.state?.enabled)return false;await engine.setEnabled(true);if(!d.getElementById('audio')?.paused&&!engine.status?.().routed)await engine.activate?.();return !!engine.status?.().enabled}
        await engine.setEnabled(false);return !engine.status?.().enabled;
      }catch(_){return false}
    };
    const runTransition=fn=>{if(transition)return transition;transition=Promise.resolve().then(fn).finally(()=>{transition=null;paint()});return transition};
    const enterOff=()=>runTransition(async()=>{linked=false;await setNative(false);mode='off'});
    const enterJester=()=>runTransition(async()=>{await setNative(false);mode='jester';linked=true;propagate()});
    const enterOn=()=>runTransition(async()=>{linked=false;if(api.state?.enabled){await setNative(false);mode='off';return}mode=(await setNative(true))?'on':'off'});
    const cycleMode=()=>mode==='on'?enterOff():mode==='off'?enterJester():(api.state?.enabled?enterOff():enterOn());

    const center=panel.querySelector('.dds-center');
    let linkButton=panel.querySelector('[data-stem-jester-toggle],[data-stem-jecker-toggle]');
    if(!linkButton){linkButton=document.createElement('button');linkButton.type='button';linkButton.className='stem-jester-toggle stem-jecker-toggle';linkButton.dataset.stemJesterToggle='';linkButton.dataset.stemJeckerToggle='';center?.appendChild(linkButton)}else{linkButton.classList.add('stem-jester-toggle');linkButton.dataset.stemJesterToggle=''}
    panel.querySelectorAll('[data-stem-jecker-shuffle],[data-stem-jester-shuffle]').forEach(node=>node.remove());

    const paint=()=>{
      stemMaster.classList.toggle('stem-jester-mode',mode==='jester');stemMaster.classList.toggle('stem-jecker-mode',mode==='jester');
      if(mode==='jester'){stemMaster.classList.remove('active','stem-loading','stem-fallback');stemMaster.setAttribute('aria-pressed','false');stemMaster.dataset.stemMasterMode='jester';stemMaster.textContent='STEM → 2JESTER';stemMaster.title='STEMS MIX drives 2JESTER; native master stems are held off'}
      if(linkButton){const live=!!api.state?.enabled;linkButton.disabled=!!transition;linkButton.classList.toggle('active',linked);linkButton.textContent=transition?'STEM JESTER …':linked?(live?'UNLINK STEMS MIX':'STEM JESTER READY'):'LINK STEMS MIX';linkButton.title=linked?(live?'Stop routing main STEMS MIX changes into live 2JESTER':'STEM JESTER is armed'):'Route main STEMS MIX controls into 2JESTER';linkButton.setAttribute('aria-pressed',String(linked))}
    };

    if(stemMaster.dataset.stemJesterBound!==VERSION){stemMaster.dataset.stemJesterBound=VERSION;stemMaster.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(transition)return;if(mode==='jester'&&api.state?.enabled){propagate();paint();return}void cycleMode()},true)}
    if(linkButton&&linkButton.dataset.stemJesterBound!==VERSION){linkButton.dataset.stemJesterBound=VERSION;linkButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(transition)return;void(linked?enterOff():enterJester())})}

    keys.forEach(key=>{
      const button=d.querySelector(`[data-stem-toggle="${key}"]`),range=d.querySelector(`[data-stem-range="${key}"]`);
      if(button&&!button.dataset.stemJesterSync){button.dataset.stemJesterSync=VERSION;button.addEventListener('click',()=>w.setTimeout(propagate,0))}
      if(range&&!range.dataset.stemJesterSync){range.dataset.stemJesterSync=VERSION;range.addEventListener('input',propagate)}
    });

    const randomKey=avoid=>{const pool=catalog.filter(key=>key!==avoid);return pool[Math.floor(Math.random()*pool.length)]||catalog[0]};
    const shuffleLive=async deckName=>{
      const mask=liveMask(),decks=deckName?[deckName]:['A','B'],jobs=[];
      decks.forEach(name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);deckEl?.querySelectorAll('.dds-slot').forEach(slotEl=>{const stem=slotEl.dataset.slot,slot=api.state?.slots?.[name]?.[stem];if(!stem||!mask[stem]||slot?.on===false)return;const select=slotEl.querySelector('[data-source],select');if(!select)return;const next=randomKey(select.value);select.value=next;jobs.push(Promise.resolve(api.setSource?.(name,stem,next)))})});
      await Promise.all(jobs);if(linked)propagate();await api.enforceActivePlayback?.(true);api.sync?.();return mask;
    };
    ['A','B'].forEach(name=>{const button=panel.querySelector(`[data-dds-deck="${name}"]>.dds-deck-shuffle`);if(!button)return;button.textContent='SHUFFLE '+name;if(button.dataset.stemJesterShuffleBound===VERSION)return;button.dataset.stemJesterShuffleBound=VERSION;button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();void shuffleLive(name)})});

    const reconcile=()=>{try{if(api.state?.enabled&&engine.status?.().enabled)void setNative(false);if(linked&&mode!=='jester')mode='jester';if(linked)propagate();paint()}catch(_){}};
    const onJ2State=()=>reconcile();
    w.addEventListener('enoch:2j-state',onJ2State);
    reconcile();

    const controller={version:VERSION,get linked(){return linked},get mode(){return mode},setLinked(on){void(on?enterJester():enterOff());return !!on},setMode(next){void(next==='on'?enterOn():next==='jester'?enterJester():enterOff());return next},sync:propagate,syncUi:paint,shuffle:shuffleLive,liveMask,reconcile};
    w.__enochStemJester=controller;w.__enochStemJecker=controller;w.__enochStemDecker=controller;

    const loadAddon=(key,src,installer,delay=0)=>{
      const run=()=>{try{return window[installer]?.(host)}catch(_){return false}};
      const start=()=>{if(run())return true;let loader=document.querySelector(`script[data-jecker-addon="${key}"]`);if(!loader){loader=document.createElement('script');loader.src=src;loader.dataset.jeckerAddon=key;loader.onload=()=>run();document.head.appendChild(loader)}return false};
      if(delay)w.setTimeout(start,delay);else start();
    };
    loadAddon('shield','/enochian-test/double-jecker-turntable-shield-v1.js?v=20260829-v5','installEnochianDoubleJeckerTurntableShieldV1');
    loadAddon('portal-spinner','/enochian-test/double-jester-portal-spinner-v1.js?v=20260906-v5','installEnochianDoubleJesterPortalSpinnerV4');
    loadAddon('output','/enochian-test/double-jecker-output-v1.js?v=20260829-output-v3','installEnochianDoubleJeckerOutputV1');
    loadAddon('signal-relay','/enochian-test/double-jecker-signal-relay-v1.js?v=20260827-relay-v3','installEnochianDoubleJeckerSignalRelayV1');
    loadAddon('radial-v13','/enochian-test/double-jecker-radial-layout-v1.js?v=20260829-jester-radial-v13','installEnochianDoubleJeckerRadialV1',80);
    loadAddon('reference-v7','/enochian-test/double-jecker-reference-skin-v1.js?v=20260827-layout-safe-v7','installEnochianDoubleJeckerReferenceSkinV1',100);
    loadAddon('runtime-repair-v11','/enochian-test/double-jecker-runtime-repair-v1.js?v=20260829-jester-authority-v12','installEnochianDoubleJeckerRuntimeRepairV1',140);
    void 'double-jecker-runtime-repair-v1.js?v=20260827-no-recenter-v9';void "stemJecker==='v10'";

    paint();
    w.addEventListener('pagehide',()=>w.removeEventListener('enoch:2j-state',onJ2State),{once:true});
    return true;
  }catch(_){return false}
}
window.installEnochianStemDeckerV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
