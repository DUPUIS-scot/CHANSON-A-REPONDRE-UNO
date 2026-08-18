import * as THREE from 'three';
import { CastleJesterGatekeeper } from './castle_jester_gatekeeper.js';

const modelUrl=new URL(
  '../assets/assets/models/castle_jester_rigged.glb',
  document.baseURI,
).href;
document.body.dataset.castleJesterAsset=modelUrl;
document.body.dataset.castleEntranceTrigger='rigged-jester';
document.body.dataset.castleJesterIntegration='waiting-for-runtime';

let gatekeeper=null;
let frame=0;
let previousTime=performance.now();
let pointerDown=null;

function requestEntrance(){
  if(document.body.dataset.sceneMode==='interior')return;
  document.body.dataset.castleJesterState='opening-gate';
  window.dispatchEvent(new CustomEvent('castleJesterEnter'));
}

function placeAtGate(castleRoot){
  if(!gatekeeper||!castleRoot||gatekeeper.clicked)return;
  const box=new THREE.Box3().setFromObject(castleRoot);
  if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  // The gate is on the front/visitor edge. Keep the character centred on that
  // entrance and close to the bridge instead of floating far onto the plaza.
  gatekeeper.root.position.set(
    center.x,
    box.min.y+.04,
    box.max.z+Math.max(.72,size.z*.024),
  );
  // User-facing correction: rotate the previous placement by 180 degrees.
  gatekeeper.root.rotation.y=0;
  document.body.dataset.castleJesterPlacement='front-gate-centred-v11';
  document.body.dataset.castleJesterGatePosition=[
    gatekeeper.root.position.x.toFixed(2),
    gatekeeper.root.position.y.toFixed(2),
    gatekeeper.root.position.z.toFixed(2),
  ].join(',');
}

function stop(event){
  event.preventDefault();
  event.stopImmediatePropagation();
}

function installPointerHandlers(canvas){
  if(canvas.dataset.castleJesterPointerHandlers==='true')return;
  canvas.dataset.castleJesterPointerHandlers='true';

  canvas.addEventListener('pointerdown',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const jester=gatekeeper?.hitTest(event)===true;
    pointerDown={
      pointerId:event.pointerId,
      x:event.clientX,
      y:event.clientY,
      jester,
      moved:false,
    };
    if(jester){stop(event);canvas.style.cursor='pointer'}
  },true);

  canvas.addEventListener('pointermove',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    if(pointerDown&&pointerDown.pointerId===event.pointerId){
      if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>9){
        pointerDown.moved=true;
      }
      if(pointerDown.jester){stop(event);return}
    }
    const hover=gatekeeper?.setHover(event)===true;
    canvas.style.cursor=hover?'pointer':'';
  },true);

  canvas.addEventListener('pointerleave',()=>{
    gatekeeper?.clearHover();
    canvas.style.cursor='';
  },true);

  canvas.addEventListener('pointercancel',event=>{
    if(pointerDown?.pointerId===event.pointerId)pointerDown=null;
  },true);

  canvas.addEventListener('pointerup',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const down=pointerDown;
    pointerDown=null;
    if(!down||down.pointerId!==event.pointerId)return;
    if(down.jester&&!down.moved){
      stop(event);
      if(gatekeeper?.click(event)){
        gatekeeper.clearHover();
        canvas.style.cursor='';
      }
    }
  },true);
}

function animate(runtime,now=performance.now()){
  if(!gatekeeper)return;
  const delta=Math.min(.05,Math.max(0,(now-previousTime)/1000));
  previousTime=now;
  const exterior=document.body.dataset.sceneMode!=='interior';
  if(exterior&&!gatekeeper.clicked)placeAtGate(runtime.castleRoot);
  gatekeeper.setVisible(exterior);
  gatekeeper.update(delta);
  // The castle renderer already owns the render loop. Do not render a second
  // full frame here; that doubled GPU work and was especially expensive on iOS.
  frame=requestAnimationFrame(t=>animate(runtime,t));
}

function install(runtime){
  if(gatekeeper||!runtime?.scene||!runtime?.camera||!runtime?.renderer||!runtime?.castleRoot)return false;
  const canvas=runtime.renderer.domElement;
  gatekeeper=new CastleJesterGatekeeper({
    scene:runtime.scene,
    camera:runtime.camera,
    renderer:runtime.renderer,
    modelUrl,
    onEnterRequested:requestEntrance,
  });
  placeAtGate(runtime.castleRoot);
  installPointerHandlers(canvas);
  document.body.dataset.castleJesterIntegration='direct-runtime-v11';
  previousTime=performance.now();
  frame=requestAnimationFrame(t=>animate(runtime,t));
  return true;
}

function waitForRuntime(attempt=0){
  if(install(window.__castleSearchRuntime))return;
  if(attempt>=600){
    document.body.dataset.castleJesterIntegration='runtime-timeout';
    console.warn('Castle jester gatekeeper: live castle runtime unavailable.');
    return;
  }
  requestAnimationFrame(()=>waitForRuntime(attempt+1));
}

window.addEventListener('castleRuntimeReady',()=>install(window.__castleSearchRuntime));
window.addEventListener('pagehide',()=>{
  if(frame)cancelAnimationFrame(frame);
  frame=0;
  gatekeeper?.dispose();
  gatekeeper=null;
},{once:true});

waitForRuntime();
