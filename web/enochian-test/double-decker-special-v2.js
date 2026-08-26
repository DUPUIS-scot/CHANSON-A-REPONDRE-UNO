(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const api=w.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial'),launcher=d.getElementById('doubleDeckerSpecialLaunch');
      if(!api||!panel||!launcher)return false;
      if(panel.dataset.ddsControls==='v5')return true;
      panel.dataset.ddsControls='v5';
      const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
      const stems=['vocals','drums','bass','other'];
      const master=d.getElementById('audio'),stemMaster=d.getElementById('stemMasterToggle');
      const oldStyle=document.getElementById('dds-v2-controls-style');if(oldStyle)oldStyle.remove();
      const style=document.createElement('style');style.id='dds-v2-controls-style';style.textContent=`
        .dds-v2-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.dds-v2-actions button{min-height:28px;border:1px solid #6d5836;border-radius:4px;background:#120d06;color:#f0c97e;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-v2-actions button:active{transform:translateY(1px)}
        .dds-deck-shuffle{width:100%;min-height:24px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-engine-live{box-shadow:0 0 16px #d5aa6366!important}
        .dds-slot{grid-template-columns:58px minmax(90px,1fr) 72px 34px 62px!important}.dds-slot .stem-toggle{min-width:0!important;padding:7px 5px!important;font-size:8px!important;white-space:nowrap!important}.dds-slot .stem-toggle.active{background:#083128!important;color:#63f5cf!important;border-color:#68d8bd!important;box-shadow:0 0 10px #40e6b422!important}.dds-slot.stem-off select,.dds-slot.stem-off input,.dds-slot.stem-off output{opacity:.5}
        .dds-master-hold{color:#f0c97e!important;font-weight:900}.dds-master-hold.active{color:#ffe4a4!important;text-shadow:0 0 8px #d5aa6366}
        @media(max-width:720px){.dds-slot{grid-template-columns:43px minmax(72px,1fr) 56px!important;grid-template-rows:auto auto!important}.dds-slot [data-level],.dds-slot [data-value]{grid-row:2!important}.dds-slot .stem-toggle{grid-column:3!important;grid-row:1/3!important;align-self:stretch!important;padding:4px 3px!important;font-size:7px!important}}
      `;document.head.appendChild(style);
      const center=panel.querySelector('.dds-center');
      let actions=panel.querySelector('.dds-v2-actions');
      if(!actions){actions=document.createElement('div');actions.className='dds-v2-actions';actions.innerHTML='<button type="button" data-dds-shuffle="A">SHUFFLE A</button><button type="button" data-dds-shuffle="ALL">SHUFFLE ALL</button><button type="button" data-dds-shuffle="B">SHUFFLE B</button>';center?.insertBefore(actions,center.querySelector('.dds-status'))}
      ['A','B'].forEach(name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;let b=deckEl.querySelector('[data-dds-deck-shuffle]');if(!b){b=document.createElement('button');b.type='button';b.className='dds-deck-shuffle';b.textContent='RANDOM / SHUFFLE STEM SOURCES';b.dataset.ddsDeckShuffle=name;deckEl.insertBefore(b,deckEl.children[1]||null)}});
      const status=panel.querySelector('.dds-status');
      let holdLine=panel.querySelector('[data-dds-master-hold]');
      if(status&&!holdLine){holdLine=document.createElement('div');holdLine.className='dds-master-hold';holdLine.dataset.ddsMasterHold='';holdLine.textContent='MASTER LIVE';status.appendChild(holdLine)}
      const randomKey=avoid=>{const pool=catalog.filter(x=>x!==avoid);return pool[Math.floor(Math.random()*pool.length)]||catalog[0]};
      const slotState=(deckName,stem)=>api.state?.slots?.[deckName]?.[stem]||null;
      const syncSlot=(slot,force=false)=>{if(!slot?.media||!master)return;try{const t=Number(master.currentTime)||0,rate=Math.max(.25,Math.min(4,Number(master.playbackRate)||1)),diff=t-(Number(slot.media.currentTime)||0);slot.media.playbackRate=rate;slot.media.preservesPitch=false;slot.media.webkitPreservesPitch=false;if(force||Math.abs(diff)>.045)slot.media.currentTime=t}catch(_){}};
      const enforceSlotPlayback=async(deckName,stem,force=false)=>{const slot=slotState(deckName,stem);if(!slot?.media)return false;if(slot.on===false||!api.state?.enabled||master?.paused){try{slot.media.pause()}catch(_){}return false}syncSlot(slot,force);try{await slot.media.play();return true}catch(_){return false}};
      const enforceActivePlayback=async(force=false)=>Promise.all(['A','B'].flatMap(deckName=>stems.map(stem=>enforceSlotPlayback(deckName,stem,force))));
      const applyStemState=(deckName,stem)=>{const slot=slotState(deckName,stem);if(!slot)return false;if(typeof slot.on!=='boolean')slot.on=true;const gain=slot.gain?.gain,ctx=api.state?.ctx,target=slot.on?Math.max(0,Math.min(1,Number(slot.level)||0)):0;if(gain){try{const now=ctx?.currentTime||0;gain.cancelScheduledValues?.(now);if(gain.setTargetAtTime)gain.setTargetAtTime(target,now,.01);else gain.value=target}catch(_){gain.value=target}}const slotEl=panel.querySelector(`[data-dds-deck="${deckName}"] .dds-slot[data-slot="${stem}"]`),button=slotEl?.querySelector('[data-dds-stem-toggle]');slotEl?.classList.toggle('stem-off',!slot.on);if(button){button.classList.toggle('active',slot.on);button.textContent=stem.toUpperCase();button.setAttribute('aria-pressed',String(slot.on));button.title=stem.toUpperCase()+' '+(slot.on?'ON':'OFF')}void enforceSlotPlayback(deckName,stem,false);return true};
      const setStemOn=(deckName,stem,on)=>{const slot=slotState(deckName,stem);if(!slot)return false;slot.on=!!on;return applyStemState(deckName,stem)};
      const shuffleDeck=async name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;const jobs=[];deckEl.querySelectorAll('.dds-slot').forEach(slot=>{const stem=slot.dataset.slot,select=slot.querySelector('[data-source]');if(!stem||!select)return;const next=randomKey(select.value);select.value=next;jobs.push(Promise.resolve(api.setSource(name,stem,next)));});await Promise.all(jobs);stems.forEach(st=>applyStemState(name,st));await enforceActivePlayback(true);api.sync?.();};
      const shuffle=async scope=>{if(scope==='ALL')await Promise.all([shuffleDeck('A'),shuffleDeck('B')]);else await shuffleDeck(scope)};
      panel.querySelectorAll('[data-dds-shuffle]').forEach(b=>{if(b.dataset.ddsBound==='v5')return;b.dataset.ddsBound='v5';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffle(b.dataset.ddsShuffle)})});
      panel.querySelectorAll('[data-dds-deck-shuffle]').forEach(b=>{if(b.dataset.ddsBound==='v5')return;b.dataset.ddsBound='v5';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffleDeck(b.dataset.ddsDeckShuffle)})});
      panel.querySelectorAll('[data-dds-deck]').forEach(deckEl=>{const deckName=deckEl.dataset.ddsDeck;deckEl.querySelectorAll('.dds-slot').forEach(slotEl=>{const stem=slotEl.dataset.slot;if(!stem)return;let button=slotEl.querySelector('[data-dds-stem-toggle]');if(!button){button=document.createElement('button');button.type='button';button.className='btn stem-toggle active';button.dataset.ddsStemToggle='';slotEl.appendChild(button)}button.className='btn stem-toggle';if(button.dataset.ddsBound!=='v5'){button.dataset.ddsBound='v5';button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const slot=slotState(deckName,stem);setStemOn(deckName,stem,slot?.on===false)})}const range=slotEl.querySelector('[data-level]');if(range&&range.dataset.ddsStemBound!=='v5'){range.dataset.ddsStemBound='v5';range.addEventListener('input',()=>{const slot=slotState(deckName,stem);if(slot?.on===false)requestAnimationFrame(()=>applyStemState(deckName,stem))})}applyStemState(deckName,stem)})});
      let normalStemWasEnabled=null;
      const normalStemEnabled=()=>{const desired=w.__enochStemAuthority?.desired;if(typeof desired==='boolean')return desired;return !!(stemMaster&&(stemMaster.getAttribute('aria-pressed')==='true'||stemMaster.classList.contains('active')))};
      const clickStemMaster=async()=>{if(!stemMaster)return;stemMaster.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,view:w}));await new Promise(resolve=>w.setTimeout(resolve,35))};
      const suspendNormalStems=async()=>{if(normalStemWasEnabled!==null)return;normalStemWasEnabled=normalStemEnabled();if(normalStemWasEnabled)await clickStemMaster();try{await w.__enochNativeStemEngine?.setEnabled?.(false)}catch(_){}};
      const restoreNormalStems=async()=>{const restore=normalStemWasEnabled;normalStemWasEnabled=null;if(restore&&!normalStemEnabled())await clickStemMaster()};
      const setMasterHold=on=>{try{if(on&&master)master.muted=true}catch(_){};if(holdLine){holdLine.classList.toggle('active',!!on);holdLine.textContent=on?'MASTER HOLD · CLOCK RUNNING':'MASTER LIVE'}};
      const paint=()=>{const on=!!api.state?.enabled;const btn=panel.querySelector('[data-dds-enable]');btn?.classList.toggle('active',on);btn?.classList.toggle('dds-engine-live',on);if(btn)btn.textContent=on?'ENGINE ON · MASTER HOLD':'ENGINE OFF';launcher.classList.toggle('active',on);setMasterHold(on)};
      const engineBtn=panel.querySelector('[data-dds-enable]');
      if(engineBtn&&engineBtn.dataset.ddsEngineBound!=='v5'){engineBtn.dataset.ddsEngineBound='v5';engineBtn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(api.state?.enabled){api.disable?.();await restoreNormalStems();setMasterHold(false)}else{await suspendNormalStems();await api.enable?.();if(api.state?.enabled){await enforceActivePlayback(true);setMasterHold(true)}else await restoreNormalStems()}paint()},{capture:true})}
      const syncBtn=panel.querySelector('[data-dds-sync]');if(syncBtn&&syncBtn.dataset.ddsSyncBound!=='v5'){syncBtn.dataset.ddsSyncBound='v5';syncBtn.addEventListener('click',async e=>{e.preventDefault();api.sync?.();await enforceActivePlayback(true);syncBtn.classList.add('active');setTimeout(()=>syncBtn.classList.remove('active'),180)})}
      if(master&&master.dataset.ddsPerfBound!=='v5'){master.dataset.ddsPerfBound='v5';master.addEventListener('play',()=>{w.setTimeout(()=>void enforceActivePlayback(true),0);w.setTimeout(()=>void enforceActivePlayback(false),40)});master.addEventListener('seeking',()=>{if(api.state?.enabled)w.setTimeout(()=>void enforceActivePlayback(true),0)});master.addEventListener('ratechange',()=>{if(api.state?.enabled)w.setTimeout(()=>void enforceActivePlayback(false),0)})}
      panel.querySelectorAll('[data-source]').forEach(select=>{select.disabled=false;select.style.pointerEvents='auto'});panel.querySelectorAll('[data-level]').forEach(range=>{range.disabled=false;range.style.pointerEvents='auto'});
      launcher.disabled=false;launcher.style.pointerEvents='auto';paint();
      api.version='v5';api.shuffle=shuffle;api.shuffleDeck=shuffleDeck;api.setStemOn=setStemOn;api.toggleStem=(deckName,stem)=>{const slot=slotState(deckName,stem);return setStemOn(deckName,stem,slot?.on===false)};api.setMasterHold=setMasterHold;api.enforceActivePlayback=enforceActivePlayback;api.suspendNormalStems=suspendNormalStems;api.restoreNormalStems=restoreNormalStems;
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleDeckerSpecialV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
