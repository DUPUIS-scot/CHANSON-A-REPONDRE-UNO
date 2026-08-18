import * as THREE from 'three';
import { CastleJesterGatekeeper } from './castle_jester_gatekeeper.js';

const modelUrl=new URL(
  '../assets/assets/models/castle_jester_rigged.glb',
  document.baseURI,
).href;
const MOVE_SLOP_PX=9;
document.body.dataset.castleJesterAsset=modelUrl;
document.body.dataset.castleEntranceTrigger='rigged-jester-single-click';
document.body.dataset.castleJesterIntegration='waiting-for-runtime';

let gatekeeper=null;
let frame=0;
let previousTime=performance.now();
let pointerDown=null;
let activeRuntime=null;
let interiorFocusFrame=0;

function isWorldVisible(object){
  for(let current=object;current;current=current.parent){if(current.visible===false)return false}
  return true;
}

function labelFor(object){
  const materials=Array.isArray(object.material)?object.material:[object.material];
  return [object.name,...materials.filter(Boolean).map(material=>material.name)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function findConstructionPanel(runtime){
  const camera=runtime?.camera;
  const scene=runtime?.scene;
  if(!camera||!scene)return null;
  camera.updateMatrixWorld(true);
  const keyword=/construction|panel|sign|dupuis|exhibition|preparation|préparation/;
  let named=null;
  let namedScore=-Infinity;
  let geometric=null;
  let geometricScore=-Infinity;
  const box=new THREE.Box3();
  const size=new THREE.Vector3();
  const center=new THREE.Vector3();
  scene.traverse(object=>{
    if(!object.isMesh||!isWorldVisible(object))return;
    box.setFromObject(object);
    if(box.isEmpty())return;
    box.getSize(size);
    box.getCenter(center);
    const dims=[Math.abs(size.x),Math.abs(size.y),Math.abs(size.z)].sort((a,b)=>a-b);
    const thin=dims[0],mid=dims[1],long=dims[2];
    if(long<.45||mid<.28)return;
    const projected=center.clone().project(camera);
    if(projected.z<-1.2||projected.z>1.2||Math.abs(projected.x)>1.35||Math.abs(projected.y)>1.35)return;
    const distance=camera.position.distanceTo(center);
    const screenPenalty=Math.hypot(projected.x,projected.y*.8);
    const label=labelFor(object);
    if(keyword.test(label)){
      const score=1000-distance*2-screenPenalty*20+Math.min(long*mid,30);
      if(score>namedScore){namedScore=score;named={object,center:center.clone(),size:size.clone(),label}}
      return;
    }
    const flatness=thin/Math.max(mid,.001);
    const ratio=long/Math.max(mid,.001);
    if(flatness>.34||ratio<1.15||ratio>4.8||long>14||mid>8)return;
    const score=120-distance*2.4-screenPenalty*28-flatness*35-Math.abs(ratio-1.9)*5;
    if(score>geometricScore){geometricScore=score;geometric={object,center:center.clone(),size:size.clone(),label}}
  });
  return named||geometric;
}

function focusInteriorOnConstructionPanel(runtime){
  if(!runtime?.camera)return false;
  const match=findConstructionPanel(runtime);
  let target;
  if(match){
    target=match.center.clone();
    target.y+=Math.max(.15,Math.min(match.size.y*.08,.55));
    document.body.dataset.castleInteriorEntryTarget=match.label||match.object.name||'construction-panel-geometry';
  }else{
    // Stable fallback matching the entrance composition: lower-left foreground,
    // where the construction panel sits relative to the current interior origin.
    target=new THREE.Vector3(-3.6,2.8,5.0);
    document.body.dataset.castleInteriorEntryTarget='construction-panel-fallback';
  }
  if(runtime.orbit?.target){
    runtime.orbit.target.copy(target);
    runtime.updateOrbit?.();
  }else{
    runtime.camera.lookAt(target);
  }
  document.body.dataset.castleInteriorEntryCamera='construction-panel-v1';
  return true;
}

function armInteriorEntryFocus(runtime){
  if(interiorFocusFrame)cancelAnimationFrame(interiorFocusFrame);
  let attempts=0;
  const apply=()=>{
    if(document.body.dataset.sceneMode==='interior'){
      focusInteriorOnConstructionPanel(runtime);
      interiorFocusFrame=0;
      return;
    }
    if(attempts++<1200)interiorFocusFrame=requestAnimationFrame(apply);
    else interiorFocusFrame=0;
  };
  interiorFocusFrame=requestAnimationFrame(apply);
}

function requestEntrance(){
  if(document.body.dataset.sceneMode==='interior')return;
  document.body.dataset.castleJesterState='opening-gate';
  armInteriorEntryFocus(activeRuntime);
  window.dispatchEvent(new CustomEvent('castleJesterEnter'));
}

function placeAtGate(castleRoot){
  if(!gatekeeper||!castleRoot||gatekeeper.clicked)return;
  const box=new THREE.Box3().setFromObject(castleRoot);
  if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
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

function activateSingleClick(event,canvas){
  if(!gatekeeper?.hitTest(event))return false;
  document.body.dataset.castleJesterGesture='single-click';
  if(!gatekeeper.click(event))return false;
  gatekeeper.enterDispatched=true;
  gatekeeper.clearHover();
  canvas.style.cursor='';
  requestEntrance();
  return true;
}

function installPointerHandlers(canvas){
  if(canvas.dataset.castleJesterPointerHandlers==='true')return;
  canvas.dataset.castleJesterPointerHandlers='true';

  canvas.addEventListener('pointerdown',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const jester=gatekeeper?.hitTest(event)===true;
    pointerDown={pointerId:event.pointerId,x:event.clientX,y:event.clientY,jester,moved:false};
    if(jester){stop(event);canvas.style.cursor='pointer'}
  },true);

  canvas.addEventListener('pointermove',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    if(pointerDown&&pointerDown.pointerId===event.pointerId){
      if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>MOVE_SLOP_PX)pointerDown.moved=true;
      if(pointerDown.jester){stop(event);return}
    }
    const hover=gatekeeper?.setHover(event)===true;
    canvas.style.cursor=hover?'pointer':'';
  },true);

  canvas.addEventListener('pointerleave',()=>{pointerDown=null;gatekeeper?.clearHover();canvas.style.cursor=''},true);
  canvas.addEventListener('pointercancel',event=>{if(pointerDown?.pointerId===event.pointerId)pointerDown=null},true);
  canvas.addEventListener('pointerup',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const down=pointerDown;
    pointerDown=null;
    if(!down||down.pointerId!==event.pointerId)return;
    if(!down.jester)return;
    stop(event);
    canvas.style.cursor='';
    gatekeeper?.clearHover();
    if(!down.moved)activateSingleClick(event,canvas);
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
  activeRuntime=runtime;
  const canvas=runtime.renderer.domElement;
  gatekeeper=new CastleJesterGatekeeper({scene:runtime.scene,camera:runtime.camera,renderer:runtime.renderer,modelUrl,onEnterRequested:requestEntrance});
  placeAtGate(runtime.castleRoot);
  installPointerHandlers(canvas);
  document.body.dataset.castleJesterIntegration='direct-runtime-single-click-v1';
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
  if(frame)cancelAnimationFrame(frame);
  if(interiorFocusFrame)cancelAnimationFrame(interiorFocusFrame);
  frame=0;
  interiorFocusFrame=0;
  gatekeeper?.dispose();
  gatekeeper=null;
  activeRuntime=null;
},{once:true});

waitForRuntime();
