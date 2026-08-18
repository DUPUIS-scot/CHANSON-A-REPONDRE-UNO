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
  if(mainCanvas){
    installGatekeeper(mainCanvas);
    return;
  }
  if(attempt>=300){
    document.body.dataset.castleJesterIntegration='canvas-timeout';
    console.warn('Castle jester gatekeeper: main castle canvas unavailable.');
    return;
  }
  requestAnimationFrame(()=>waitForCastleCanvas(attempt+1));
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
        gatekeeper=new CastleJesterGatekeeper({
          scene,
          camera,
          renderer:this,
          modelUrl,
          onEnterRequested:requestEntrance,
        });
        document.body.dataset.castleJesterIntegration='scene-captured';
      }
      const now=performance.now();
      const delta=Math.min(.05,Math.max(0,(now-previousRenderTime)/1000));
      previousRenderTime=now;
      const exterior=document.body.dataset.sceneMode!=='interior';
      gatekeeper?.setVisible(exterior);
      gatekeeper?.update(delta);
    }
    return originalRender.call(this,scene,camera);
  };

  function stop(event){
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  mainCanvas.addEventListener('pointerdown',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const jester=gatekeeper?.hitTest(event)===true;
    pointerDown={
      pointerId:event.pointerId,
      x:event.clientX,
      y:event.clientY,
      jester,
      moved:false,
    };
    if(jester){
      stop(event);
      mainCanvas.style.cursor='pointer';
    }
  },true);

  mainCanvas.addEventListener('pointermove',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    if(pointerDown&&pointerDown.pointerId===event.pointerId){
      if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>9){
        pointerDown.moved=true;
      }
      if(pointerDown.jester){stop(event);return}
    }
    const hover=gatekeeper?.setHover(event)===true;
    mainCanvas.style.cursor=hover?'pointer':'';
  },true);

  mainCanvas.addEventListener('pointerleave',()=>{
    gatekeeper?.clearHover();
    mainCanvas.style.cursor='';
  },true);

  mainCanvas.addEventListener('pointercancel',event=>{
    if(pointerDown?.pointerId===event.pointerId)pointerDown=null;
  },true);

  mainCanvas.addEventListener('pointerup',event=>{
    if(document.body.dataset.sceneMode==='interior')return;
    const down=pointerDown;
    pointerDown=null;
    if(!down||down.pointerId!==event.pointerId)return;
    if(down.jester&&!down.moved){
      stop(event);
      if(gatekeeper?.click(event)){
        gatekeeper.clearHover();
        mainCanvas.style.cursor='';
      }
    }
  },true);

  function requestEntrance(){
    if(document.body.dataset.sceneMode==='interior')return;
    document.body.dataset.castleJesterState='opening-gate';
    window.dispatchEvent(new CustomEvent('castleJesterEnter'));
  }

  window.addEventListener('pagehide',()=>{
    if(THREE.WebGLRenderer.prototype.render!==originalRender){
      THREE.WebGLRenderer.prototype.render=originalRender;
    }
    gatekeeper?.dispose();
  },{once:true});
}

waitForCastleCanvas();
