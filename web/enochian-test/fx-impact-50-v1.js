(()=>{
  'use strict';
  const VERSION='50-v2';
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

    const setWetImpact50=()=>{
      try{
        const wet=d.getElementById('wet');
        if(!wet)return;
        const max=parseFloat(wet.max||'1');
        wet.value=String(max>1?50:.5);
        wet.dispatchEvent(new Event('input',{bubbles:true}));
      }catch(_){}
    };

    const markControls=()=>{
      d.querySelectorAll('[data-pad-fx],.instant-fx-btn').forEach(el=>{
        el.dataset.impactLevel='50';
        el.setAttribute('data-impact-level','50');
      });
      root.dataset.fxImpact='50';
    };

    const forceBaseline=()=>{
      try{
        mixer.value='50';
        if(out)out.textContent='50%';
        mixer.dispatchEvent(new Event('input',{bubbles:true}));
        markControls();
      }catch(_){}
    };

    if(root.dataset.fxImpactAuthority!==VERSION){
      root.dataset.fxImpactAuthority=VERSION;
      forceBaseline();

      d.addEventListener('click',e=>{
        const padButton=e.target?.closest?.('[data-pad-fx]');
        if(!padButton)return;
        setTimeout(()=>{
          setWetImpact50();
          markControls();
        },0);
      });

      d.addEventListener('pointerdown',e=>{
        const instant=e.target?.closest?.('.instant-fx-btn');
        if(!instant)return;
        setTimeout(()=>{
          setWetImpact50();
          markControls();
        },0);
      });

      if(kill&&!kill.dataset.fxImpact50Bound){
        kill.dataset.fxImpact50Bound='1';
        kill.addEventListener('click',()=>setTimeout(forceBaseline,0),true);
      }

      const panel=mixer.closest('.pad-panel')||d.body;
      if(panel&&!panel.__fxImpact50Observer){
        const observer=new MutationObserver(markControls);
        observer.observe(panel,{childList:true,subtree:true});
        panel.__fxImpact50Observer=observer;
      }
    }
    return true;
  };
})();
