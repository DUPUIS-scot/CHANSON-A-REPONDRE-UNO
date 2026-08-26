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
      if(d.documentElement.dataset.stemJecker==='v4')return true;
      d.documentElement.dataset.stemJecker='v4';

      let visualStyle=document.getElementById('stem-jecker-live-style');
      if(!visualStyle){
        visualStyle=document.createElement('style');
        visualStyle.id='stem-jecker-live-style';
        visualStyle.textContent=`
          .dds-slot .stem-toggle{background:#07100e!important;color:#7a9a94!important;border-color:#315b56!important;box-shadow:none!important}
          .dds-slot .stem-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important;font-weight:1000!important}
          .stem-jecker-toggle{width:100%;min-height:28px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}
          .stem-jecker-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important}
        `;
        document.head.appendChild(visualStyle);
      }

      const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
      const rows=[...d.querySelectorAll('.stem-toggle')];
      const status=()=>engine.status?.().states||{};
      let linked=true;
      const setBoth=(stem,on)=>{api.setStemOn('A',stem,!!on);api.setStemOn('B',stem,!!on)};
      const syncFromMain=()=>{
        if(!linked)return false;
        const s=status();
        setBoth('vocals',!!s.vocals?.on);
        setBoth('drums',!!s.drums?.on);
        setBoth('bass',!!s.bass?.on);
        setBoth('other',!!s.other?.on);
        api.enforceActivePlayback?.(false);
        return true;
      };

      const randomKey=avoid=>{
        const pool=catalog.filter(key=>key!==avoid);
        return pool[Math.floor(Math.random()*pool.length)]||catalog[0];
      };
      const liveMask=()=>{
        if(linked){
          const s=status();
          return {vocals:!!s.vocals?.on,drums:!!s.drums?.on,bass:!!s.bass?.on,other:!!s.other?.on};
        }
        const on=(deckName,stem)=>api.state?.slots?.[deckName]?.[stem]?.on!==false;
        return {
          vocals:on('A','vocals')||on('B','vocals'),
          drums:on('A','drums')||on('B','drums'),
          bass:on('A','bass')||on('B','bass'),
          other:on('A','other')||on('B','other'),
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
            const slot=api.state?.slots?.[deckName]?.[stem];
            if(!stem||!mask[stem]||slot?.on===false)return;
            const select=slotEl.querySelector('[data-source]');
            if(!select)return;
            const next=randomKey(select.value);
            select.value=next;
            jobs.push(Promise.resolve(api.setSource?.(deckName,stem,next)));
          });
        });
        await Promise.all(jobs);
        if(linked)syncFromMain();
        await api.enforceActivePlayback?.(true);
        api.sync?.();
        return mask;
      };

      rows.forEach(button=>{
        if(button.dataset.stemJeckerBound==='v4')return;
        button.dataset.stemJeckerBound='v4';
        button.addEventListener('click',()=>w.setTimeout(syncFromMain,0));
      });
      const stemMaster=d.getElementById('stemMasterToggle');
      if(stemMaster&&stemMaster.dataset.stemJeckerBound!=='v4'){
        stemMaster.dataset.stemJeckerBound='v4';
        stemMaster.addEventListener('click',()=>w.setTimeout(syncFromMain,0));
      }

      const center=panel.querySelector('.dds-center');
      const statusEl=center?.querySelector('.dds-status');
      let linkButton=panel.querySelector('[data-stem-jecker-toggle]');
      if(!linkButton){
        linkButton=document.createElement('button');
        linkButton.type='button';
        linkButton.className='stem-jecker-toggle active';
        linkButton.dataset.stemJeckerToggle='';
        if(center)center.insertBefore(linkButton,statusEl||null);
      }
      const paintLink=()=>{
        linkButton.classList.toggle('active',linked);
        linkButton.textContent=linked?'STEM JECKER ON':'STEM JECKER OFF';
        linkButton.setAttribute('aria-pressed',String(linked));
      };
      if(linkButton.dataset.stemJeckerBound!=='v4'){
        linkButton.dataset.stemJeckerBound='v4';
        linkButton.addEventListener('click',e=>{
          e.preventDefault();e.stopPropagation();
          linked=!linked;
          paintLink();
          if(linked)syncFromMain();
        });
      }
      paintLink();

      let shuffleButton=panel.querySelector('[data-stem-jecker-shuffle]')||panel.querySelector('[data-stem-decker-shuffle]');
      if(!shuffleButton){
        shuffleButton=document.createElement('button');
        shuffleButton.type='button';
        shuffleButton.className='dds-deck-shuffle';
        if(center)center.insertBefore(shuffleButton,statusEl||null);
      }
      delete shuffleButton.dataset.stemDeckerShuffle;
      shuffleButton.dataset.stemJeckerShuffle='';
      shuffleButton.textContent='STEM JECKER SHUFFLE';
      if(shuffleButton.dataset.stemJeckerBound!=='v4'){
        shuffleButton.dataset.stemJeckerBound='v4';
        shuffleButton.addEventListener('click',async e=>{
          e.preventDefault();e.stopPropagation();
          shuffleButton.classList.add('active');
          try{await shuffleLive()}finally{w.setTimeout(()=>shuffleButton.classList.remove('active'),180)}
        });
      }

      w.__enochStemJecker={version:'v4',get linked(){return linked},setLinked(on){linked=!!on;paintLink();if(linked)syncFromMain();return linked},sync:syncFromMain,shuffle:shuffleLive,liveMask};
      w.__enochStemDecker=w.__enochStemJecker;
      syncFromMain();
      return true;
    }catch(_){return false}
  }
  window.installEnochianStemDeckerV2=host=>{
    let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);
    return install(host);
  };
})();
