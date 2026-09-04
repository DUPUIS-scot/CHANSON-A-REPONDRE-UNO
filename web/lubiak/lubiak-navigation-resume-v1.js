(()=>{
  'use strict';
  if(window.__lubiakNavigationResumeV1)return;
  window.__lubiakNavigationResumeV1=true;

  let recovering=false;
  let lastReload=0;
  const canvas=()=>document.querySelector('#stage canvas');
  const contextFor=(c)=>{
    if(!c)return null;
    try{return c.getContext('webgl2')||c.getContext('webgl')||c.getContext('experimental-webgl')}catch(_){return null}
  };
  const markReady=(reason)=>{
    const c=canvas();
    if(!c)return false;
    const gl=contextFor(c);
    if(!gl)return false;
    if(typeof gl.isContextLost==='function'&&gl.isContextLost())return false;
    document.body.classList.add('lubiak-3d-ready');
    c.style.removeProperty('visibility');
    c.style.removeProperty('display');
    window.dispatchEvent(new Event('resize'));
    document.body.dataset.lubiakNavigationResume=`ready-${reason}-v1`;
    return true;
  };
  const recover=(reason)=>{
    if(recovering)return;
    recovering=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(markReady(reason)){recovering=false;return;}
      const c=canvas();
      const gl=contextFor(c);
      const lost=!!(gl&&typeof gl.isContextLost==='function'&&gl.isContextLost());
      document.body.dataset.lubiakNavigationResume=`${lost?'context-lost':'canvas-missing'}-${reason}-v1`;
      recovering=false;
      if(!lost)return;
      const now=Date.now();
      if(now-lastReload<8000)return;
      lastReload=now;
      try{sessionStorage.setItem('lubiak-navigation-recovery','1')}catch(_){}
      location.reload();
    }));
  };

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)recover('visibility')});
  window.addEventListener('pageshow',()=>recover('pageshow'));
  window.addEventListener('focus',()=>recover('focus'));
  window.addEventListener('orientationchange',()=>setTimeout(()=>recover('orientation'),120));
  document.addEventListener('fullscreenchange',()=>setTimeout(()=>recover('fullscreen'),80));
  document.addEventListener('webkitfullscreenchange',()=>setTimeout(()=>recover('webkit-fullscreen'),80));

  const portal=document.querySelector('#megapole-portal');
  if(portal){
    new MutationObserver(()=>{
      if(!portal.classList.contains('is-open'))setTimeout(()=>recover('megapole-return'),80);
    }).observe(portal,{attributes:true,attributeFilter:['class']});
  }

  const stage=document.querySelector('#stage');
  if(stage){
    new MutationObserver(()=>recover('canvas-ready')).observe(stage,{childList:true});
  }
  setTimeout(()=>recover('boot'),700);
})();
