(()=>{
  'use strict';
  const VERSION='50-v1';
  function innerDocument(frame){
    try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}
  }
  window.installEnochianFxImpact50V1=function(frame){
    const d=innerDocument(frame); if(!d)return false;
    const root=d.documentElement;
    const mixer=d.getElementById('mixerLevel');
    const out=d.getElementById('mixerLevelV');
    const kill=d.getElementById('killfx');
    if(!mixer)return false;
    const forceBaseline=()=>{
      try{
        mixer.value='50';
        if(out)out.textContent='50%';
        mixer.dispatchEvent(new Event('input',{bubbles:true}));
        d.querySelectorAll('[data-pad-fx],.instant-fx-btn').forEach(el=>{
          el.dataset.impactLevel='50';
          el.setAttribute('data-impact-level','50');
        });
        root.dataset.fxImpact='50';
      }catch(_){}
    };
    if(root.dataset.fxImpactAuthority!==VERSION){
      root.dataset.fxImpactAuthority=VERSION;
      forceBaseline();
      if(kill&&!kill.dataset.fxImpact50Bound){
        kill.dataset.fxImpact50Bound='1';
        kill.addEventListener('click',()=>setTimeout(forceBaseline,0),true);
      }
      const panel=mixer.closest('.pad-panel')||d.body;
      if(panel&&!panel.__fxImpact50Observer){
        const observer=new MutationObserver(()=>{
          d.querySelectorAll('[data-pad-fx],.instant-fx-btn').forEach(el=>el.dataset.impactLevel='50');
        });
        observer.observe(panel,{childList:true,subtree:true});
        panel.__fxImpact50Observer=observer;
      }
    }
    return true;
  };
})();
