// Castle -> Interior -> Laboratory deterministic journey authority v79.
// Keeps the existing Three.js camera/runtime ownership while making the
// laboratory passage and return state deterministic across iOS gestures.
if (!window.__castleJourneyStabilityV79Installed) {
  window.__castleJourneyStabilityV79Installed = true;
  const mode=()=>document.body.dataset.sceneMode||'exterior';
  let runtime=null,canvas=null,down=null,lastMode='';
  const slop=e=>e.pointerType==='touch'?18:8;
  function button(){return document.getElementById('bureau-of-ai')}
  function enter(reason='deterministic-passage'){
    if(mode()!=='interior')return false;
    const b=button();if(!b||b.disabled)return false;
    document.body.dataset.laboratoryPassageEntry=`${reason}-v79`;
    try{window.__castleBureauVideoPrime?.()}catch(_){}
    b.click();return true;
  }
  function visiblePassageControl(){
    const b=button();if(!b)return;
    b.dataset.castleJourneyAuthority='v79';
    b.style.touchAction='manipulation';
    b.setAttribute('aria-label',b.getAttribute('aria-label')||'Enter laboratory');
  }
  function bind(c){
    if(!c||c.dataset.castleJourneyV79==='true')return;
    c.dataset.castleJourneyV79='true';
    c.addEventListener('pointerdown',e=>{if(mode()!=='interior'||e.button>0)return;down={id:e.pointerId,type:e.pointerType,x:e.clientX,y:e.clientY,moved:false}}, {capture:false,passive:true});
    c.addEventListener('pointermove',e=>{if(down?.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>slop(e))down.moved=true},{capture:false,passive:true});
    const release=e=>{if(down?.id!==e.pointerId)return;down=null};
    c.addEventListener('pointerup',release,{capture:false,passive:true});
    c.addEventListener('pointercancel',release,{capture:false,passive:true});
  }
  function sync(){
    runtime=window.__castleSearchRuntime||runtime;
    canvas=runtime?.renderer?.domElement||canvas;
    bind(canvas);visiblePassageControl();
    const now=mode();
    if(now!==lastMode){
      document.body.dataset.castleJourneyState=`${now}-v79`;
      if(now==='laboratory'){
        // Clear stale touch bookkeeping after the scene transition so the
        // first mirror tap cannot inherit an interior navigation gesture.
        down=null;
        try{window.__castleBureauVideoPlay?.()}catch(_){}
      }
      if(lastMode==='laboratory'&&now==='interior')down=null;
      lastMode=now;
    }
  }
  // Public deterministic entry point for the existing passage/raycast layer.
  window.__castleEnterLaboratory=enter;
  const observer=new MutationObserver(sync);
  observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-interior-ready','data-laboratory-ready','data-bureau-ready']});
  window.addEventListener('castleRuntimeReady',sync);
  window.addEventListener('resize',sync);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
  let tries=0,t=setInterval(()=>{sync();if((runtime?.renderer?.domElement&&button())||tries++>240)clearInterval(t)},100);
  sync();
}
