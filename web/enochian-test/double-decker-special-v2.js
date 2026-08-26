(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const api=w.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial'),launcher=d.getElementById('doubleDeckerSpecialLaunch');
      if(!api||!panel||!launcher)return false;
      if(panel.dataset.ddsControls==='v3')return true;
      panel.dataset.ddsControls='v3';
      const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
      const stems=['vocals','drums','bass','other'];
      const oldStyle=document.getElementById('dds-v2-controls-style');if(oldStyle)oldStyle.remove();
      const style=document.createElement('style');style.id='dds-v2-controls-style';style.textContent=`
        .dds-v2-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.dds-v2-actions button{min-height:28px;border:1px solid #6d5836;border-radius:4px;background:#120d06;color:#f0c97e;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-v2-actions button:active{transform:translateY(1px)}
        .dds-deck-shuffle{width:100%;min-height:24px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-engine-live{box-shadow:0 0 16px #d5aa6366!important}
        .dds-slot{grid-template-columns:58px minmax(90px,1fr) 72px 34px 62px!important}.dds-slot .stem-toggle{min-width:0!important;padding:7px 5px!important;font-size:8px!important;white-space:nowrap!important}.dds-slot .stem-toggle.active{background:#083128!important;color:#63f5cf!important;border-color:#68d8bd!important;box-shadow:0 0 10px #40e6b422!important}.dds-slot.stem-off select,.dds-slot.stem-off input,.dds-slot.stem-off output{opacity:.5}
        @media(max-width:720px){.dds-slot{grid-template-columns:43px minmax(72px,1fr) 56px!important;grid-template-rows:auto auto!important}.dds-slot [data-level],.dds-slot [data-value]{grid-row:2!important}.dds-slot .stem-toggle{grid-column:3!important;grid-row:1/3!important;align-self:stretch!important;padding:4px 3px!important;font-size:7px!important}}
      `;document.head.appendChild(style);
      const center=panel.querySelector('.dds-center');
      let actions=panel.querySelector('.dds-v2-actions');
      if(!actions){actions=document.createElement('div');actions.className='dds-v2-actions';actions.innerHTML='<button type="button" data-dds-shuffle="A">SHUFFLE A</button><button type="button" data-dds-shuffle="ALL">SHUFFLE ALL</button><button type="button" data-dds-shuffle="B">SHUFFLE B</button>';center?.insertBefore(actions,center.querySelector('.dds-status'))}
      ['A','B'].forEach(name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;let b=deckEl.querySelector('[data-dds-deck-shuffle]');if(!b){b=document.createElement('button');b.type='button';b.className='dds-deck-shuffle';b.textContent='RANDOM / SHUFFLE STEM SOURCES';b.dataset.ddsDeckShuffle=name;deckEl.insertBefore(b,deckEl.children[1]||null)}});
      const randomKey=avoid=>{const pool=catalog.filter(x=>x!==avoid);return pool[Math.floor(Math.random()*pool.length)]||catalog[0]};
      const slotState=(deckName,stem)=>api.state?.slots?.[deckName]?.[stem]||null;
      const applyStemState=(deckName,stem)=>{const slot=slotState(deckName,stem);if(!slot)return false;if(typeof slot.on!=='boolean')slot.on=true;const gain=slot.gain?.gain,ctx=api.state?.ctx,target=slot.on?Math.max(0,Math.min(1,Number(slot.level)||0)):0;if(gain){try{const now=ctx?.currentTime||0;gain.cancelScheduledValues?.(now);if(gain.setTargetAtTime)gain.setTargetAtTime(target,now,.01);else gain.value=target}catch(_){gain.value=target}}const slotEl=panel.querySelector(`[data-dds-deck="${deckName}"] .dds-slot[data-slot="${stem}"]`),button=slotEl?.querySelector('[data-dds-stem-toggle]');slotEl?.classList.toggle('stem-off',!slot.on);if(button){button.classList.toggle('active',slot.on);button.textContent=stem.toUpperCase();button.setAttribute('aria-pressed',String(slot.on));button.title=stem.toUpperCase()+' '+(slot.on?'ON':'OFF')}return true};
      const setStemOn=(deckName,stem,on)=>{const slot=slotState(deckName,stem);if(!slot)return false;slot.on=!!on;return applyStemState(deckName,stem)};
      const shuffleDeck=async name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;const jobs=[];deckEl.querySelectorAll('.dds-slot').forEach(slot=>{const stem=slot.dataset.slot,select=slot.querySelector('[data-source]');if(!stem||!select)return;const next=randomKey(select.value);select.value=next;jobs.push(Promise.resolve(api.setSource(name,stem,next)));});await Promise.all(jobs);stems.forEach(st=>applyStemState(name,st));api.sync?.();};
      const shuffle=async scope=>{if(scope==='ALL')await Promise.all([shuffleDeck('A'),shuffleDeck('B')]);else await shuffleDeck(scope)};
      panel.querySelectorAll('[data-dds-shuffle]').forEach(b=>{if(b.dataset.ddsBound==='v3')return;b.dataset.ddsBound='v3';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffle(b.dataset.ddsShuffle)})});
      panel.querySelectorAll('[data-dds-deck-shuffle]').forEach(b=>{if(b.dataset.ddsBound==='v3')return;b.dataset.ddsBound='v3';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffleDeck(b.dataset.ddsDeckShuffle)})});
      panel.querySelectorAll('[data-dds-deck]').forEach(deckEl=>{const deckName=deckEl.dataset.ddsDeck;deckEl.querySelectorAll('.dds-slot').forEach(slotEl=>{const stem=slotEl.dataset.slot;if(!stem)return;let button=slotEl.querySelector('[data-dds-stem-toggle]');if(!button){button=document.createElement('button');button.type='button';button.className='btn stem-toggle active';button.dataset.ddsStemToggle='';slotEl.appendChild(button)}button.className='btn stem-toggle';if(button.dataset.ddsBound!=='v3'){button.dataset.ddsBound='v3';button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const slot=slotState(deckName,stem);setStemOn(deckName,stem,slot?.on===false)})}const range=slotEl.querySelector('[data-level]');if(range&&range.dataset.ddsStemBound!=='v3'){range.dataset.ddsStemBound='v3';range.addEventListener('input',()=>{const slot=slotState(deckName,stem);if(slot?.on===false)requestAnimationFrame(()=>applyStemState(deckName,stem))})}applyStemState(deckName,stem)})});
      const engineBtn=panel.querySelector('[data-dds-enable]');
      const paint=()=>{const on=!!api.state?.enabled;const btn=panel.querySelector('[data-dds-enable]');btn?.classList.toggle('active',on);btn?.classList.toggle('dds-engine-live',on);if(btn)btn.textContent=on?'ENGINE ON':'ENGINE OFF';launcher.classList.toggle('active',on)};
      if(engineBtn&&engineBtn.dataset.ddsEngineBound!=='v3'){engineBtn.dataset.ddsEngineBound='v3';engineBtn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(api.state?.enabled)api.disable?.();else await api.enable?.();paint()},{capture:true})}
      const syncBtn=panel.querySelector('[data-dds-sync]');if(syncBtn&&syncBtn.dataset.ddsSyncBound!=='v3'){syncBtn.dataset.ddsSyncBound='v3';syncBtn.addEventListener('click',e=>{api.sync?.();syncBtn.classList.add('active');setTimeout(()=>syncBtn.classList.remove('active'),180)})}
      panel.querySelectorAll('[data-source]').forEach(select=>{select.disabled=false;select.style.pointerEvents='auto'});panel.querySelectorAll('[data-level]').forEach(range=>{range.disabled=false;range.style.pointerEvents='auto'});
      launcher.disabled=false;launcher.style.pointerEvents='auto';paint();
      api.version='v3';api.shuffle=shuffle;api.shuffleDeck=shuffleDeck;api.setStemOn=setStemOn;api.toggleStem=(deckName,stem)=>{const slot=slotState(deckName,stem);return setStemOn(deckName,stem,slot?.on===false)};
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleDeckerSpecialV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
