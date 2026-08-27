(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      const w=d&&d.defaultView;
      if(!d||!w)return false;
      const api=w.__enochDoubleDeckerSpecial;
      const engine=w.__enochNativeStemEngine;
      const panel=document.getElementById('doubleDeckerSpecial');
      const stemMaster=d.getElementById('stemMasterToggle');
      if(!api||!engine||typeof api.setStemOn!=='function'||!panel||!stemMaster)return false;
      if(d.documentElement.dataset.stemJecker==='v9')return true;
      d.documentElement.dataset.stemJecker='v9';

      let visualStyle=document.getElementById('stem-jecker-live-style');
      if(visualStyle)visualStyle.remove();
      visualStyle=document.createElement('style');
      visualStyle.id='stem-jecker-live-style';
      visualStyle.textContent=`
        .dds-slot .stem-toggle{background:#07100e!important;color:#7a9a94!important;border-color:#315b56!important;box-shadow:none!important}.dds-slot .stem-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important;font-weight:1000!important}
        .stem-jecker-toggle{width:100%;min-height:28px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.stem-jecker-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important}
        #stemMasterToggle.stem-jecker-mode{background:#5b350b!important;color:#ffd17a!important;border-color:#e88422!important;box-shadow:0 0 10px #ff7a184f!important;font-weight:1000!important}
      `;
      document.head.appendChild(visualStyle);

      const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
      const rows=[...d.querySelectorAll('.stem-toggle')];
      let linked=false;
      let mode=engine.status?.().enabled?'on':'off';
      let bypassMasterClick=false;
      const setBoth=(stem,on)=>{api.setStemOn('A',stem,!!on);api.setStemOn('B',stem,!!on)};
      const mainToggleOn=key=>!!d.querySelector(`[data-stem-toggle="${key}"]`)?.classList.contains('active');
      const mainLevel=key=>Math.max(0,Math.min(1,Number(d.querySelector(`[data-stem-range="${key}"]`)?.value||0)/100));
      const mainMask=()=>({vocals:mainToggleOn('vocals'),drums:mainToggleOn('drums'),bass:mainToggleOn('instruments'),other:mainToggleOn('instruments')});
      const setBothLevel=(stem,level)=>{api.setStemLevel?.('A',stem,level);api.setStemLevel?.('B',stem,level)};
      const syncFromMain=()=>{if(!linked)return false;const s=mainMask();setBoth('vocals',s.vocals);setBothLevel('vocals',mainLevel('vocals'));setBoth('drums',s.drums);setBothLevel('drums',mainLevel('drums'));const instruments=mainLevel('instruments');setBoth('bass',s.bass);setBothLevel('bass',instruments);setBoth('other',s.other);setBothLevel('other',instruments);api.enforceActivePlayback?.(false);return true};

      const paintMasterMode=()=>{
        stemMaster.classList.toggle('stem-jecker-mode',mode==='jecker');
        if(mode==='jecker'){
          stemMaster.classList.remove('active','stem-loading','stem-fallback');
          stemMaster.setAttribute('aria-pressed','false');
          stemMaster.setAttribute('data-stem-master-mode','jecker');
          stemMaster.textContent='STEM → 2JECKER';
          stemMaster.title='STEMS MIX is linked to 2JECKER; native master stems remain off';
        }else{
          stemMaster.setAttribute('data-stem-master-mode',mode);
          stemMaster.title=mode==='on'?'STEMS ON':'STEMS OFF';
        }
      };

      const invokeNativeMasterClick=()=>new Promise(resolve=>{bypassMasterClick=true;try{stemMaster.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,view:w}))}finally{bypassMasterClick=false;w.setTimeout(resolve,45)}});
      const enterOff=async()=>{linked=false;if(!api.state?.enabled&&engine.status?.().enabled)await invokeNativeMasterClick();mode=engine.status?.().enabled?'on':'off';paintMasterMode()};
      const enterJecker=async()=>{if(!api.state?.enabled&&engine.status?.().enabled)await invokeNativeMasterClick();mode='jecker';linked=true;syncFromMain();paintMasterMode()};
      const enterOn=async()=>{linked=false;if(!api.state?.enabled&&!engine.status?.().enabled)await invokeNativeMasterClick();mode='on';paintMasterMode()};
      const cycleMode=async()=>{if(mode==='on')await enterOff();else if(mode==='off')await enterJecker();else await enterOn()};

      stemMaster.addEventListener('click',e=>{if(bypassMasterClick)return;e.preventDefault();e.stopImmediatePropagation();if(mode==='jecker'&&api.state?.enabled){syncFromMain();paintMasterMode();return}void cycleMode()},true);
      const masterObserver=new MutationObserver(()=>{if(mode==='jecker'&&stemMaster.textContent!=='STEM → 2JECKER')paintMasterMode()});
      masterObserver.observe(stemMaster,{attributes:true,childList:true,characterData:true,subtree:true});

      const randomKey=avoid=>{const pool=catalog.filter(key=>key!==avoid);return pool[Math.floor(Math.random()*pool.length)]||catalog[0]};
      const liveMask=()=>{if(linked)return mainMask();const on=(deckName,stem)=>api.state?.slots?.[deckName]?.[stem]?.on!==false;return{vocals:on('A','vocals')||on('B','vocals'),drums:on('A','drums')||on('B','drums'),bass:on('A','bass')||on('B','bass'),other:on('A','other')||on('B','other')}};
      const shuffleLive=async()=>{const mask=liveMask(),jobs=[];['A','B'].forEach(deckName=>{const deckEl=panel.querySelector(`[data-dds-deck="${deckName}"]`);if(!deckEl)return;deckEl.querySelectorAll('.dds-slot').forEach(slotEl=>{const stem=slotEl.dataset.slot,slot=api.state?.slots?.[deckName]?.[stem];if(!stem||!mask[stem]||slot?.on===false)return;const select=slotEl.querySelector('[data-source]');if(!select)return;const next=randomKey(select.value);select.value=next;jobs.push(Promise.resolve(api.setSource?.(deckName,stem,next)))})});await Promise.all(jobs);if(linked)syncFromMain();await api.enforceActivePlayback?.(true);api.sync?.();return mask};

      rows.forEach(button=>{if(button.dataset.stemJeckerBound==='v9')return;button.dataset.stemJeckerBound='v9';button.addEventListener('click',()=>w.setTimeout(syncFromMain,0))});
      d.querySelectorAll('[data-stem-range]').forEach(range=>{if(range.dataset.stemJeckerBound==='v9')return;range.dataset.stemJeckerBound='v9';range.addEventListener('input',()=>syncFromMain())});

      const center=panel.querySelector('.dds-center');
      const statusEl=center?.querySelector('.dds-status');
      let linkButton=panel.querySelector('[data-stem-jecker-toggle]');
      if(!linkButton){linkButton=document.createElement('button');linkButton.type='button';linkButton.className='stem-jecker-toggle';linkButton.dataset.stemJeckerToggle='';if(center)center.insertBefore(linkButton,statusEl||null)}
      const paintLink=()=>{const live=!!api.state?.enabled;linkButton.disabled=false;linkButton.classList.toggle('active',linked);linkButton.textContent=linked?(live?'UNLINK STEMS MIX':'STEM JECKER READY'):'LINK STEMS MIX';linkButton.title=linked?(live?'Stop routing main STEMS MIX changes into live 2JECKER':'STEM JECKER is armed'):'Route main STEMS MIX controls into 2JECKER';linkButton.setAttribute('aria-pressed',String(linked))};
      if(linkButton.dataset.stemJeckerBound!=='v9'){linkButton.dataset.stemJeckerBound='v9';linkButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(linked){void enterOff()}else{void enterJecker()}w.setTimeout(paintLink,55)})}

      let shuffleButton=panel.querySelector('[data-stem-jecker-shuffle]')||panel.querySelector('[data-stem-decker-shuffle]');
      if(!shuffleButton){shuffleButton=document.createElement('button');shuffleButton.type='button';shuffleButton.className='dds-deck-shuffle';if(center)center.insertBefore(shuffleButton,statusEl||null)}
      delete shuffleButton.dataset.stemDeckerShuffle;shuffleButton.dataset.stemJeckerShuffle='';shuffleButton.textContent='STEM JECKER SHUFFLE';
      if(shuffleButton.dataset.stemJeckerBound!=='v9'){shuffleButton.dataset.stemJeckerBound='v9';shuffleButton.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();shuffleButton.classList.add('active');try{await shuffleLive()}finally{w.setTimeout(()=>shuffleButton.classList.remove('active'),180)}})}

      const syncUi=()=>{paintLink();paintMasterMode()};
      w.__enochStemJecker={version:'v9',get linked(){return linked},get mode(){return mode},setLinked(on){if(on)void enterJecker();else void enterOff();w.setTimeout(syncUi,55);return !!on},setMode(next){if(next==='on')void enterOn();else if(next==='jecker')void enterJecker();else void enterOff();w.setTimeout(syncUi,55);return next},sync:syncFromMain,syncUi,shuffle:shuffleLive,liveMask};
      w.__enochStemDecker=w.__enochStemJecker;syncUi();

      const loadAddon=(key,src,installer,delay=0)=>{
        const run=()=>{try{return window[installer]?.(host)}catch(_){return false}};
        const start=()=>{if(run())return true;let loader=document.querySelector(`script[data-jecker-addon="${key}"]`);if(!loader){loader=document.createElement('script');loader.src=src;loader.dataset.jeckerAddon=key;loader.onload=()=>run();document.head.appendChild(loader)}return false};
        if(delay)w.setTimeout(start,delay);else start();
      };
      loadAddon('shield','/enochian-test/double-jecker-turntable-shield-v1.js?v=20260827-v3','installEnochianDoubleJeckerTurntableShieldV1');
      loadAddon('output','/enochian-test/double-jecker-output-v1.js?v=20260827-output-v2','installEnochianDoubleJeckerOutputV1');
      loadAddon('signal-relay','/enochian-test/double-jecker-signal-relay-v1.js?v=20260827-relay-v3','installEnochianDoubleJeckerSignalRelayV1');
      loadAddon('radial-v2','/enochian-test/double-jecker-radial-layout-v1.js?v=20260827-radial-v2','installEnochianDoubleJeckerRadialV1',80);
      loadAddon('reference-v2','/enochian-test/double-jecker-reference-skin-v1.js?v=20260827-skin-v2','installEnochianDoubleJeckerReferenceSkinV1',100);

      w.addEventListener('pagehide',()=>masterObserver.disconnect(),{once:true});
      return true;
    }catch(_){return false}
  }
  window.installEnochianStemDeckerV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
