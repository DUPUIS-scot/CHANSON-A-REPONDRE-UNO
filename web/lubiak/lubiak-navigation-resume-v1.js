(()=>{
  'use strict';
  if(window.__lubiakNavigationResumeV2)return;
  window.__lubiakNavigationResumeV2=true;

  let reloadTimer=0;
  let lastReload=0;
  const canvas=()=>document.querySelector('#stage canvas');
  const contextFor=(c)=>{
    if(!c)return null;
    try{return c.getContext('webgl2')||c.getContext('webgl')||c.getContext('experimental-webgl')}catch(_){return null}
  };
  const contextLost=(gl)=>!!(gl&&typeof gl.isContextLost==='function'&&gl.isContextLost());

  // Navigation resume must never resize or re-style a healthy Three.js canvas.
  // The main runtime owns renderer sizing and WebGL restoration. This helper only
  // restores the ready marker if browser navigation dropped it, and escalates a
  // genuinely persistent lost context to one guarded page reload.
  const check=(reason)=>{
    const c=canvas();
    if(!c){
      document.body.dataset.lubiakNavigationResume=`canvas-missing-${reason}-v2`;
      return;
    }
    const gl=contextFor(c);
    if(!gl){
      document.body.dataset.lubiakNavigationResume=`context-missing-${reason}-v2`;
      return;
    }
    if(!contextLost(gl)){
      if(!document.body.classList.contains('lubiak-3d-ready')){
        document.body.classList.add('lubiak-3d-ready');
      }
      document.body.dataset.lubiakNavigationResume=`healthy-${reason}-v2`;
      if(reloadTimer){clearTimeout(reloadTimer);reloadTimer=0;}
      return;
    }

    document.body.dataset.lubiakNavigationResume=`context-lost-${reason}-v2`;
    if(reloadTimer)return;
    reloadTimer=setTimeout(()=>{
      reloadTimer=0;
      const current=canvas();
      const currentGl=contextFor(current);
      if(!contextLost(currentGl))return;
      const now=Date.now();
      if(now-lastReload<10000)return;
      lastReload=now;
      try{sessionStorage.setItem('lubiak-navigation-recovery','1')}catch(_){}
      location.reload();
    },1200);
  };

  // These checks are deliberately passive: no synthetic resize, no display or
  // visibility writes, and no canvas mutation observer. Browser/native resize
  // events continue to be handled solely by lubiak.js.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check('visibility')});
  window.addEventListener('pageshow',()=>check('pageshow'));
  window.addEventListener('focus',()=>check('focus'));

  const portal=document.querySelector('#megapole-portal');
  if(portal){
    new MutationObserver(()=>{
      if(!portal.classList.contains('is-open'))requestAnimationFrame(()=>check('megapole-return'));
    }).observe(portal,{attributes:true,attributeFilter:['class']});
  }

  const c=canvas();
  if(c){
    c.addEventListener('webglcontextrestored',()=>requestAnimationFrame(()=>check('context-restored')),{passive:true});
  }
})();
