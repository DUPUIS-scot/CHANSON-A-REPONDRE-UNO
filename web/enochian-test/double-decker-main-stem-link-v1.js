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
      if(!api||!engine||typeof api.setStemOn!=='function')return false;
      if(d.documentElement.dataset.ddsMainStemLink==='v1')return true;
      d.documentElement.dataset.ddsMainStemLink='v1';

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

      rows.forEach(button=>{
        if(button.dataset.ddsMainStemBound==='v1')return;
        button.dataset.ddsMainStemBound='v1';
        button.addEventListener('click',()=>w.setTimeout(syncFromMain,0));
      });

      const stemMaster=d.getElementById('stemMasterToggle');
      if(stemMaster&&stemMaster.dataset.ddsMainStemBound!=='v1'){
        stemMaster.dataset.ddsMainStemBound='v1';
        stemMaster.addEventListener('click',()=>w.setTimeout(syncFromMain,0));
      }

      w.__enochDoubleDeckerMainStemLink={version:'v1',sync:syncFromMain};
      syncFromMain();
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleDeckerMainStemLinkV1=host=>{
    let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);
    return install(host);
  };
})();
