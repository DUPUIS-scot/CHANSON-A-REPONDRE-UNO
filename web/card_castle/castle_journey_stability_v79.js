import * as THREE from 'three';

// Castle -> Interior -> Laboratory deterministic journey authority v80.
// iOS gets one spatial passage hit-test with the same movement threshold as
// core navigation. Laboratory opening delegates directly to the iOS owner.
if (!window.__castleJourneyStabilityV79Installed) {
  window.__castleJourneyStabilityV79Installed = true;
  const isIOS=/iP(?:hone|ad|od)/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const PASSAGE_PATTERN=/(?:laboratory|laboratoire|bureau|passage|portal|door|doorway|gate|arch|corridor|entrance|entry|tunnel)/i;
  const TAP_SLOP_PX=5;
  const mode=()=>document.body.dataset.sceneMode||'exterior';
  let runtime=null,canvas=null,down=null,lastMode='';
  const raycaster=new THREE.Raycaster();
  const ndc=new THREE.Vector2();

  function button(){return document.getElementById('bureau-of-ai')}
  function objectLabel(object){
    const parts=[];
    let current=object;
    for(let i=0;current&&i<6;i+=1,current=current.parent)parts.push(current.name||'');
    const materials=object?.material?(Array.isArray(object.material)?object.material:[object.material]).map(material=>material?.name||'').join(' '):'';
    return `${parts.join(' ')} ${materials}`.trim();
  }
  function enter(reason='deterministic-passage'){
    if(mode()!=='interior')return false;
    document.body.dataset.laboratoryPassageEntry=`${reason}-v80`;
    try{window.__castleBureauVideoPrime?.()}catch(_){}
    if(isIOS&&typeof window.__castleOpenLaboratory==='function'){
      void window.__castleOpenLaboratory();
      return true;
    }
    const b=button();if(!b||b.disabled)return false;
    b.click();return true;
  }
  function visiblePassageControl(){
    const b=button();if(!b)return;
    b.dataset.castleJourneyAuthority='v80';
    b.style.touchAction='manipulation';
    b.setAttribute('aria-label',b.getAttribute('aria-label')||'Enter laboratory');
  }
  function hitPassage(event){
    if(!isIOS||mode()!=='interior'||!runtime?.camera||!runtime?.interiorRoot||!canvas)return false;
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return false;
    ndc.x=((event.clientX-rect.left)/rect.width)*2-1;
    ndc.y=-((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(ndc,runtime.camera);
    const hits=raycaster.intersectObject(runtime.interiorRoot,true);
    for(const hit of hits){
      const label=objectLabel(hit.object);
      if(PASSAGE_PATTERN.test(label)){
        document.body.dataset.castlePassageHit=label.slice(0,160)||'matched-v80';
        return enter('ios-spatial-hit');
      }
    }
    return false;
  }
  function bind(c){
    if(!c||c.dataset.castleJourneyV80==='true')return;
    c.dataset.castleJourneyV80='true';
    if(!isIOS)return;
    c.addEventListener('pointerdown',e=>{
      if(mode()!=='interior'||e.button>0)return;
      down={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    },{capture:false,passive:true});
    c.addEventListener('pointermove',e=>{
      if(down?.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>TAP_SLOP_PX)down.moved=true;
    },{capture:false,passive:true});
    c.addEventListener('pointerup',e=>{
      if(down?.id!==e.pointerId)return;
      const candidate=down;
      down=null;
      if(!candidate.moved)hitPassage(e);
    },{capture:false,passive:true});
    c.addEventListener('pointercancel',e=>{if(down?.id===e.pointerId)down=null},{capture:false,passive:true});
  }
  function sync(){
    runtime=window.__castleSearchRuntime||runtime;
    canvas=runtime?.renderer?.domElement||canvas;
    bind(canvas);visiblePassageControl();
    if(isIOS)document.body.dataset.castleIOSPassageAuthority='journey-v80-single-spatial';
    const now=mode();
    if(now!==lastMode){
      document.body.dataset.castleJourneyState=`${now}-v80`;
      if(now==='laboratory'){
        down=null;
        try{window.__castleBureauVideoPlay?.()}catch(_){}
      }
      if(lastMode==='laboratory'&&now==='interior')down=null;
      lastMode=now;
    }
  }
  window.__castleEnterLaboratory=enter;
  const observer=new MutationObserver(sync);
  observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-interior-ready','data-laboratory-ready','data-bureau-ready']});
  window.addEventListener('castleRuntimeReady',sync);
  window.addEventListener('resize',sync);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
  let tries=0,t=setInterval(()=>{sync();if((runtime?.renderer?.domElement&&button())||tries++>240)clearInterval(t)},100);
  sync();
}
