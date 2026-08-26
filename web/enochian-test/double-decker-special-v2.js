(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const api=w.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial'),launcher=d.getElementById('doubleDeckerSpecialLaunch');
      if(!api||!panel||!launcher)return false;
      if(panel.dataset.ddsControls==='v2')return true;
      panel.dataset.ddsControls='v2';
      const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
      const stems=['vocals','drums','bass','other'];
      const style=document.createElement('style');style.id='dds-v2-controls-style';style.textContent=`
        .dds-v2-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.dds-v2-actions button{min-height:28px;border:1px solid #6d5836;border-radius:4px;background:#120d06;color:#f0c97e;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-v2-actions button:active{transform:translateY(1px)}
        .dds-deck-shuffle{width:100%;min-height:24px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-engine-live{box-shadow:0 0 16px #d5aa6366!important}
      `;document.head.appendChild(style);
      const center=panel.querySelector('.dds-center');
      const actions=document.createElement('div');actions.className='dds-v2-actions';actions.innerHTML='<button type="button" data-dds-shuffle="A">SHUFFLE A</button><button type="button" data-dds-shuffle="ALL">SHUFFLE ALL</button><button type="button" data-dds-shuffle="B">SHUFFLE B</button>';
      center?.insertBefore(actions,center.querySelector('.dds-status'));
      ['A','B'].forEach(name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;const b=document.createElement('button');b.type='button';b.className='dds-deck-shuffle';b.textContent='RANDOM / SHUFFLE STEM SOURCES';b.dataset.ddsDeckShuffle=name;deckEl.insertBefore(b,deckEl.children[1]||null)});
      const randomKey=(avoid)=>{const pool=catalog.filter(x=>x!==avoid);return pool[Math.floor(Math.random()*pool.length)]||catalog[0]};
      const shuffleDeck=async name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;const jobs=[];deckEl.querySelectorAll('.dds-slot').forEach(slot=>{const stem=slot.dataset.slot,select=slot.querySelector('[data-source]');if(!stem||!select)return;const next=randomKey(select.value);select.value=next;jobs.push(Promise.resolve(api.setSource(name,stem,next)));});await Promise.all(jobs);api.sync?.();};
      const shuffle=async scope=>{if(scope==='ALL'){await Promise.all([shuffleDeck('A'),shuffleDeck('B')])}else await shuffleDeck(scope);};
      panel.querySelectorAll('[data-dds-shuffle]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffle(b.dataset.ddsShuffle)}));
      panel.querySelectorAll('[data-dds-deck-shuffle]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffleDeck(b.dataset.ddsDeckShuffle)}));
      const engineBtn=panel.querySelector('[data-dds-enable]');
      const paint=()=>{const on=!!api.state?.enabled;engineBtn?.classList.toggle('active',on);engineBtn?.classList.toggle('dds-engine-live',on);if(engineBtn)engineBtn.textContent=on?'ENGINE ON':'ENGINE OFF';launcher.classList.toggle('active',on)};
      if(engineBtn){const replacement=engineBtn.cloneNode(true);engineBtn.replaceWith(replacement);replacement.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(api.state?.enabled)api.disable?.();else await api.enable?.();paint()})}
      const syncBtn=panel.querySelector('[data-dds-sync]');if(syncBtn){const replacement=syncBtn.cloneNode(true);syncBtn.replaceWith(replacement);replacement.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();api.sync?.();replacement.classList.add('active');setTimeout(()=>replacement.classList.remove('active'),180)})}
      panel.querySelectorAll('[data-source]').forEach(select=>{select.disabled=false;select.style.pointerEvents='auto'});panel.querySelectorAll('[data-level]').forEach(range=>{range.disabled=false;range.style.pointerEvents='auto'});
      launcher.disabled=false;launcher.style.pointerEvents='auto';paint();
      w.__enochDoubleDeckerSpecial.version='v2';w.__enochDoubleDeckerSpecial.shuffle=shuffle;w.__enochDoubleDeckerSpecial.shuffleDeck=shuffleDeck;
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleDeckerSpecialV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
