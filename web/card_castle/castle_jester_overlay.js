import * as THREE from 'three';
import { CastleJesterGatekeeper } from './castle_jester_gatekeeper.js';

const modelUrl=new URL(
  '../assets/assets/models/castle_jester_rigged.glb',
  document.baseURI,
).href;
document.body.dataset.castleJesterAsset=modelUrl;
document.body.dataset.castleEntranceTrigger='rigged-jester';
document.body.dataset.castleJesterIntegration='waiting-for-canvas';

function waitForCastleCanvas(attempt=0){
  const mainCanvas=document.querySelector('#scene canvas');
  if(mainCanvas){installGatekeeper(mainCanvas);return}
  if(attempt>=300){
    document.body.dataset.castleJesterIntegration='canvas-timeout';
    console.warn('Castle jester gatekeeper: main castle canvas unavailable.');
    return;
  }
  requestAnimationFrame(()=>waitForCastleCanvas(attempt+1));
}

function findCastleBounds(scene,gatekeeper){
  let best=null;
  let bestScore=0;
  for(const object of scene.children){
    if(object===gatekeeper?.root||object.visible===false||!object.isGroup)continue;
    const box=new THREE.Box3().setFromObject(object);
    if(box.isEmpty())continue;
    const size=box.getSize(new THREE.Vector3());
    if(!Number.isFinite(size.x+size.y+size.z))continue;
    const score=size.x*size.y*size.z;
    if(size.y>4&&score>bestScore){best={box,size};bestScore=score}
  }
  return best;
}

function placeAtLiveGate(scene,gatekeeper){
  if(!gatekeeper||gatekeeper.clicked||gatekeeper.userGatePlacementResolved)return;
  const candidate=findCastleBounds(scene,gatekeeper);
  if(!candidate)return;
  const {box,size}=candidate;
  const center=box.getCenter(new THREE.Vector3());
  // Gatehouse sits on the visitor-facing/front edge of the fitted castle.
  // Derive the placement from the actual live GLB bounds instead of a hard-coded
  // z value so later scale/forecourt changes cannot hide the gatekeeper again.
  gatekeeper.root.position.set(
    center.x-size.x*.055,
    box.min.y+.04,
    box.max.z+Math.max(1.35,size.z*.055),
  );
  gatekeeper.root.rotation.y=Math.PI;
  gatekeeper.userGatePlacementResolved=true;
  document.body.dataset.castleJesterPlacement='live-gate-bounds-v9';
  document.body.dataset.castleJesterGateZ=gatekeeper.root.position.z.toFixed(2);
}

function installGatekeeper(mainCanvas){
  if(mainCanvas.dataset.castleJesterInstalled==='true')return;
  mainCanvas.dataset.castleJesterInstalled='true';
  document.body.dataset.castleJesterIntegration='canvas-ready';

  let gatekeeper=null;
  let previousRenderTime=performance.now();
  let pointerDown=null;

  const originalRender=THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){
    if(this.domElement===mainCanvas){
      if(!gatekeeper){
        gatekeeper=new CastleJesterGatekeeper({scene,camera,renderer:this,modelUrl,onEnterRequested:requestEntrance});
        document.body.dataset.castleJesterIntegration='scene-captured';
      }
      placeAtLiveGate(scene,gatekeeper);
      const now=performance.now();
      const delta=Math.min(.05,Math.max(0,(now-previousRenderTime)/1000));
      previousRenderTime=now;
      const exterior=document.body.dataset.sceneMode!=='interior';
      gatekeeper?.setVisible(exterior);
      gatekeeper?.update(delta);
    }
    return originalRender.call(this,scene,camera);
  };

  function stop(event){event.preventDefault();event.stopImmediatePropagation()}

  mainCanvas.addEventListener('pointerdown',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const jester=gatekeeper?.hitTest(event)===true;
    pointerDown={pointerId:event.pointerId,x:event.clientX,y:event.clientY,jester,moved:false};
    if(jester){stop(event);mainCanvas.style.cursor='pointer'}
  },true);

  mainCanvas.addEventListener('pointermove',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    if(pointerDown&&pointerDown.pointerId===event.pointerId){
      if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>9)pointerDown.moved=true;
      if(pointerDown.jester){stop(event);return}
    }
    const hover=gatekeeper?.setHover(event)===true;
    mainCanvas.style.cursor=hover?'pointer':'';
  },true);

  mainCanvas.addEventListener('pointerleave',()=>{gatekeeper?.clearHover();mainCanvas.style.cursor=''},true);
  mainCanvas.addEventListener('pointercancel',event=>{if(pointerDown?.pointerId===event.pointerId)pointerDown=null},true);
  mainCanvas.addEventListener('pointerup',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const down=pointerDown;pointerDown=null;
    if(!down||down.pointerId!==event.pointerId)return;
    if(down.jester&&!down.moved){
      stop(event);
      if(gatekeeper?.click(event)){gatekeeper.clearHover();mainCanvas.style.cursor=''}
    }
  },true);

  function requestEntrance(){
    if(document.body.dataset.sceneMode==='interior')return;
    document.body.dataset.castleJesterState='opening-gate';
    window.dispatchEvent(new CustomEvent('castleJesterEnter'));
  }

  window.addEventListener('pagehide',()=>{
    if(THREE.WebGLRenderer.prototype.render!==originalRender)THREE.WebGLRenderer.prototype.render=originalRender;
    gatekeeper?.dispose();
  },{once:true});
}

waitForCastleCanvas();
