(()=>{
  'use strict';
  function install(frame){
    try{
      const live=frame?.contentDocument;
      const deck=live?.getElementById('deck');
      const d=deck?.contentDocument;
      const w=d?.defaultView;
      const iso=d?.querySelector('.stem-isolator');
      const engine=w?.__enochNativeStemEngine;
      if(!d||!w||!iso||!engine)return false;
      if(d.documentElement.dataset.stemFourChannel==='v3')return true;

      const keys=['vocals','drums','bass','other'];
      const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
      const instBtn=iso.querySelector('[data-stem-toggle="instruments"]');
      const instRange=iso.querySelector('[data-stem-range="instruments"]');
      const instRow=instBtn?.closest('.stem-row')||instRange?.closest('.stem-row');
      const template=iso.querySelector('[data-stem-toggle="vocals"]')?.closest('.stem-row')||iso.querySelector('[data-stem-toggle="drums"]')?.closest('.stem-row')||instRow;
      if(!template)return false;

      const makeRow=(key,label)=>{
        const row=template.cloneNode(true);
        const btn=row.querySelector('.stem-toggle');
        const range=row.querySelector('.stem-range');
        const value=row.querySelector('.stem-value');
        if(!btn||!range)return null;
        btn.dataset.stemToggle=key;
        btn.textContent=label;
        btn.className='btn stem-toggle';
        btn.setAttribute('aria-label',label+' stem on or off');
        range.dataset.stemRange=key;
        range.className='stem-range';
        range.setAttribute('aria-label',label+' stem level');
        if(value){value.dataset.stemValue=key;value.className='stem-value'}
        return row;
      };

      if(instRow){
        const bass=makeRow('bass','BASS');
        const other=makeRow('other','OTHER');
        if(bass&&other)instRow.replaceWith(bass,other);
      }

      iso.querySelectorAll('[data-stem-jecker-split],.stem-jecker-split').forEach(n=>n.remove());
      [...iso.querySelectorAll('.stem-row')].forEach(row=>{
        const key=row.querySelector('[data-stem-toggle]')?.dataset.stemToggle;
        if(key&&!keys.includes(key))row.remove();
      });

      const note=iso.querySelector('.stem-note');
      if(note)note.textContent='VOCALS · DRUMS · BASS · OTHER · LOCKED TO MASTER TRANSPORT';

      let style=d.getElementById('stem-four-channel-style');
      if(!style){
        style=d.createElement('style');
        style.id='stem-four-channel-style';
        style.textContent='.stem-isolator .stem-row{display:grid!important;grid-template-columns:88px minmax(0,1fr) 42px!important;gap:6px!important;align-items:center!important}.stem-isolator .stem-toggle{min-width:0!important;padding:7px 5px!important;font-size:8px!important;white-space:nowrap!important}.stem-isolator .stem-range{width:100%!important}.stem-isolator .stem-value{font-size:9px!important;text-align:right!important}.stem-isolator [data-stem-jecker-split],.stem-isolator .stem-jecker-split{display:none!important}@media(max-width:1000px){.stem-isolator .stem-row{grid-template-columns:72px minmax(0,1fr) 34px!important;gap:3px!important}}';
        d.head.appendChild(style);
      }

      const syncUi=()=>{
        const states=engine.status?.().states||{};
        keys.forEach(key=>{
          const button=iso.querySelector(`[data-stem-toggle="${key}"]`);
          const range=iso.querySelector(`[data-stem-range="${key}"]`);
          const output=iso.querySelector(`[data-stem-value="${key}"]`);
          const state=states[key]||{};
          if(button){
            button.classList.toggle('active',!!state.on);
            button.setAttribute('aria-pressed',String(!!state.on));
          }
          const pct=Math.round(clamp(state.level)*100);
          if(range&&Math.abs((parseFloat(range.value)||0)-pct)>.5)range.value=String(pct);
          if(output)output.textContent=pct+'%';
        });
      };

      const propagate=()=>{
        const jecker=w.__enochStemJecker;
        const api=w.__enochDoubleDeckerSpecial;
        if(!jecker?.linked||!api)return false;
        const states=engine.status?.().states||{};
        keys.forEach(key=>{
          api.setStemOn?.('A',key,!!states[key]?.on);
          api.setStemOn?.('B',key,!!states[key]?.on);
          api.setStemLevel?.('A',key,clamp(states[key]?.level));
          api.setStemLevel?.('B',key,clamp(states[key]?.level));
        });
        api.enforceActivePlayback?.(false);
        return true;
      };

      keys.forEach(key=>{
        const button=iso.querySelector(`[data-stem-toggle="${key}"]`);
        const range=iso.querySelector(`[data-stem-range="${key}"]`);
        if(button&&!button.dataset.fourStemBound){
          button.dataset.fourStemBound='v3';
          button.addEventListener('click',event=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            const state=engine.status?.().states?.[key];
            engine.setRow?.(key,!state?.on);
            syncUi();
            propagate();
          },true);
        }
        if(range&&!range.dataset.fourStemBound){
          range.dataset.fourStemBound='v3';
          range.addEventListener('input',event=>{
            event.stopImmediatePropagation();
            engine.setLevel?.(key,clamp((parseFloat(range.value)||0)/100));
            syncUi();
            propagate();
          },true);
        }
      });

      const patchJecker=()=>{
        const jecker=w.__enochStemJecker;
        if(!jecker||jecker.__fourNativePatched)return false;
        jecker.sync=()=>{propagate();return true};
        jecker.liveMask=()=>{
          const states=engine.status?.().states||{};
          return Object.fromEntries(keys.map(key=>[key,!!states[key]?.on]));
        };
        jecker.__fourNativePatched=true;
        return true;
      };

      const timer=w.setInterval(()=>{
        iso.querySelectorAll('[data-stem-jecker-split],.stem-jecker-split').forEach(n=>n.remove());
        syncUi();
        patchJecker();
        propagate();
      },250);

      d.documentElement.dataset.stemFourChannel='v3';
      w.__enochStemFourChannel={version:'v3',sync:syncUi,propagate,patchJecker};
      syncUi();
      patchJecker();
      propagate();
      w.addEventListener('pagehide',()=>w.clearInterval(timer),{once:true});
      return true;
    }catch(_){return false}
  }
  window.installEnochianStemFourChannelV1=frame=>{
    let n=0;
    const t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);
    return install(frame);
  };
})();
