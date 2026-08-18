import * as THREE from 'three';
import { CastleJesterGatekeeper } from './castle_jester_gatekeeper.js';

const modelUrl=new URL(
  '../assets/assets/models/castle_jester_rigged.glb',
  document.baseURI,
).href;
const LONG_PRESS_MS=600;
const MOVE_SLOP_PX=9;
document.body.dataset.castleJesterAsset=modelUrl;
document.body.dataset.castleEntranceTrigger='rigged-jester-long-press';
document.body.dataset.castleJesterIntegration='waiting-for-runtime';

let gatekeeper=null;
let frame=0;
let previousTime=performance.now();
let pointerDown=null;
let longPressTimer=0;

function requestEntrance(){
  if(document.body.dataset.sceneMode==='interior')return;
  document.body.dataset.castleJesterState='opening-gate';
  window.dispatchEvent(new CustomEvent('castleJesterEnter'));
}

function clearLongPress(){
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=0}
}

function placeAtGate(castleRoot){
  if(!gatekeeper||!castleRoot||gatekeeper.clicked)return;
  const box=new THREE.Box3().setFromObject(castleRoot);
  if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  // The visible gatehouse sits on the visitor-facing right side of this GLB.
  // Place the jester on that architectural axis instead of at the bounds centre.
  gatekeeper.root.position.set(
    center.x+size.x*.30,
    box.min.y+.04,
    box.max.z+Math.max(.55,size.z*.018),
  );
  gatekeeper.root.rotation.y=Math.PI;
  document.body.dataset.castleJesterPlacement='gatehouse-axis-v13';
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

function activateLongPress(event,canvas){
  if(!pointerDown||pointerDown.moved||pointerDown.activated||!pointerDown.jester)return;
  if(!gatekeeper?.hitTest(event))return;
  pointerDown.activated=true;
  document.body.dataset.castleJesterGesture='long-press';
  if(gatekeeper.click(event)){
    gatekeeper.enterDispatched=true;
    gatekeeper.clearHover();
    canvas.style.cursor='';
    requestEntrance();
  }
}

function installPointerHandlers(canvas){
  if(canvas.dataset.castleJesterPointerHandlers==='true')return;
  canvas.dataset.castleJesterPointerHandlers='true';

  canvas.addEventListener('pointerdown',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    clearLongPress();
    const jester=gatekeeper?.hitTest(event)===true;
    pointerDown={pointerId:event.pointerId,x:event.clientX,y:event.clientY,jester,moved:false,activated:false};
    if(jester){
      stop(event);
      canvas.style.cursor='pointer';
      longPressTimer=window.setTimeout(()=>{
        longPressTimer=0;
        activateLongPress(event,canvas);
      },LONG_PRESS_MS);
    }
  },true);

  canvas.addEventListener('pointermove',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    if(pointerDown&&pointerDown.pointerId===event.pointerId){
      if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>MOVE_SLOP_PX){pointerDown.moved=true;clearLongPress()}
      if(pointerDown.jester){stop(event);return}
    }
    const hover=gatekeeper?.setHover(event)===true;
    canvas.style.cursor=hover?'pointer':'';
  },true);

  canvas.addEventListener('pointerleave',()=>{clearLongPress();pointerDown=null;gatekeeper?.clearHover();canvas.style.cursor=''},true);
  canvas.addEventListener('pointercancel',event=>{if(pointerDown?.pointerId===event.pointerId){clearLongPress();pointerDown=null}},true);
  canvas.addEventListener('pointerup',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const down=pointerDown;clearLongPress();pointerDown=null;
    if(!down||down.pointerId!==event.pointerId)return;
    if(down.jester){stop(event);canvas.style.cursor='';gatekeeper?.clearHover()}
  },true);
  canvas.addEventListener('contextmenu',event=>{if(gatekeeper?.hitTest(event))stop(event)},true);
}

function animate(runtime,now=performance.now()){
  if(!gatekeeper)return;
  const delta=Math.min(.05,Math.max(0,(now-previousTime)/1000));
  previousTime=now;
  const exterior=document.body.dataset.sceneMode!=='interior';
  if(exterior&&!gatekeeper.clicked)placeAtGate(runtime.castleRoot);
  gatekeeper.setVisible(exterior);
  gatekeeper.update(delta);
  frame=requestAnimationFrame(t=>animate(runtime,t));
}

function install(runtime){
  if(gatekeeper||!runtime?.scene||!runtime?.camera||!runtime?.renderer||!runtime?.castleRoot)return false;
  const canvas=runtime.renderer.domElement;
  gatekeeper=new CastleJesterGatekeeper({scene:runtime.scene,camera:runtime.camera,renderer:runtime.renderer,modelUrl,onEnterRequested:requestEntrance});
  placeAtGate(runtime.castleRoot);
  installPointerHandlers(canvas);
  document.body.dataset.castleJesterIntegration='direct-runtime-v13';
  document.body.dataset.castleJesterLongPressMs=String(LONG_PRESS_MS);
  previousTime=performance.now();
  frame=requestAnimationFrame(t=>animate(runtime,t));
  return true;
}

function waitForRuntime(attempt=0){
  if(install(window.__castleSearchRuntime))return;
  if(attempt>=600){document.body.dataset.castleJesterIntegration='runtime-timeout';console.warn('Castle jester gatekeeper: live castle runtime unavailable.');return}
  requestAnimationFrame(()=>waitForRuntime(attempt+1));
}

window.addEventListener('castleRuntimeReady',()=>install(window.__castleSearchRuntime));
window.addEventListener('pagehide',()=>{
  clearLongPress();
  if(frame)cancelAnimationFrame(frame);
  frame=0;
  gatekeeper?.dispose();
  gatekeeper=null;
},{once:true});

waitForRuntime();
