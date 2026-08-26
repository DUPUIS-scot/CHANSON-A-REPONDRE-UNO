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
      if(!api||!engine||typeof api.setStemOn!=='function'||!panel)return false;
      if(d.documentElement.dataset.stemDecker==='v3')return true;
      d.documentElement.dataset.stemDecker='v3';

      let visualStyle=document.getElementById('stem-decker-live-style');
      if(!visualStyle){
        visualStyle=document.createElement('style');
        visualStyle.id='stem-decker-live-style';
        visualStyle.textContent='.dds-slot .stem-toggle{background:#07100e!important;color:#7a9a94!important;border-color:#315b56!important;box-shadow:none!important}.dds-slot .stem-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important;font-weight:1000!important}';
        document.head.appendChild(visualStyle);
      }

      const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
      const rows=[...d.querySelectorAll('.stem-toggle')];
      const status=()=>engine.status?.().states||{};
      const setBoth=(stem,on)=>{api.setStemOn('A',stem,!!on);api.setStemOn('B',stem,!!on)};
      const syncFromMain=()=>{
        const s=status();
        setBoth('vocals',!!s.vocals?.on);
        setBoth('drums',!!s.drums?.on);
        setBoth('bass',!!s.bass?.on);
        setBoth('other',!!s.other?.on);
        api.enforceActivePlayback?.(false);
      };

      const randomKey=avoid=>{
        const pool=catalog.filter(key=>key!==avoid);
        return pool[Math.floor(Math.random()*pool.length)]||catalog[0];
      };
      const liveMask=()=>{
        const s=status();
        return {
          vocals:!!s.vocals?.on,
          drums:!!s.drums?.on,
          bass:!!s.bass?.on,
          other:!!s.other?.on,
        };
      };
      const shuffleLive=async()=>{
        const mask=liveMask();
        const jobs=[];
        ['A','B'].forEach(deckName=>{
          const deckEl=panel.querySelector(`[data-dds-deck="${deckName}"]`);
          if(!deckEl)return;
          deckEl.querySelectorAll('.dds-slot').forEach(slotEl=>{
            const stem=slotEl.dataset.slot;
            if(!stem||!mask[stem])return;
            const select=slotEl.querySelector('[data-source]');
            if(!select)return;
            const next=randomKey(select.value);
            select.value=next;
            jobs.push(Promise.resolve(api.setSource?.(deckName,stem,next)));
          });
        });
        await Promise.all(jobs);
        syncFromMain();
        await api.enforceActivePlayback?.(true);
        api.sync?.();
        return mask;
      };

      rows.forEach(button=>{
        if(button.dataset.stemDeckerBound==='v3')return;
        button.dataset.stemDeckerBound='v3';
        button.addEventListener('click',()=>w.setTimeout(syncFromMain,0));
      });

      const stemMaster=d.getElementById('stemMasterToggle');
      if(stemMaster&&stemMaster.dataset.stemDeckerBound!=='v3'){
        stemMaster.dataset.stemDeckerBound='v3';
        stemMaster.addEventListener('click',()=>w.setTimeout(syncFromMain,0));
      }

      let button=panel.querySelector('[data-stem-decker-shuffle]');
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='dds-deck-shuffle';
        button.dataset.stemDeckerShuffle='';
        button.textContent='STEM DECKER SHUFFLE';
        const center=panel.querySelector('.dds-center');
        const statusEl=center?.querySelector('.dds-status');
        if(center)center.insertBefore(button,statusEl||null);
      }
      if(button.dataset.stemDeckerBound!=='v3'){
        button.dataset.stemDeckerBound='v3';
        button.addEventListener('click',async e=>{
          e.preventDefault();e.stopPropagation();
          button.classList.add('active');
          try{await shuffleLive()}finally{w.setTimeout(()=>button.classList.remove('active'),180)}
        });
      }

      w.__enochStemDecker={version:'v3',sync:syncFromMain,shuffle:shuffleLive,liveMask};
      syncFromMain();
      return true;
    }catch(_){return false}
  }
  window.installEnochianStemDeckerV2=host=>{
    let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);
    return install(host);
  };
})();
