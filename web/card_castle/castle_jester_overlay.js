import * as THREE from 'three';
import { CastleJesterGatekeeper } from './castle_jester_gatekeeper.js';

const mainCanvas=document.querySelector('#scene canvas');
if(!mainCanvas){
  console.warn('Castle jester gatekeeper: main castle canvas unavailable.');
} else {
  const modelUrl=new URL(
    '../assets/assets/models/castle_jester_rigged.glb',
    document.baseURI,
  ).href;
  document.body.dataset.castleJesterAsset=modelUrl;
  document.body.dataset.castleEntranceTrigger='jester-only';

  // The former door/lamp cue must never become an entrance control again.
  const neutralizer=document.createElement('style');
  neutralizer.id='castle-jester-door-cue-neutralizer';
  neutralizer.textContent=`
    body.castle-door-hover #scene::after {
      animation: none !important;
      background: radial-gradient(ellipse at 47% 40%,transparent 52%,#01040912 79%,#0004 100%) !important;
    }
  `;
  document.head.appendChild(neutralizer);
  const removeDoorCue=()=>document.body.classList.remove('castle-door-hover');
  removeDoorCue();
  const classObserver=new MutationObserver(removeDoorCue);
  classObserver.observe(document.body,{attributes:true,attributeFilter:['class']});

  let gatekeeper=null;
  let capturedScene=null;
  let capturedCamera=null;
  let capturedRenderer=null;
  let previousRenderTime=performance.now();
  let entranceBypass=false;
  let pointerDown=null;

  const originalRender=THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){
    if(this.domElement===mainCanvas){
      if(!gatekeeper){
        capturedScene=scene;
        capturedCamera=camera;
        capturedRenderer=this;
        gatekeeper=new CastleJesterGatekeeper({
          scene,
          camera,
          renderer:this,
          modelUrl,
          onEnterRequested:requestExistingEntrance,
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

  function pointerNdc(event){
    const rect=mainCanvas.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX-rect.left)/Math.max(1,rect.width))*2-1,
      -((event.clientY-rect.top)/Math.max(1,rect.height))*2+1,
    );
  }

  function hitCastleCard(event){
    if(!capturedScene||!capturedCamera)return false;
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(pointerNdc(event),capturedCamera);
    const hits=raycaster.intersectObjects(capturedScene.children,true);
    return hits.some(hit=>{
      let object=hit.object;
      while(object){
        if(object.userData?.card)return true;
        if(object===capturedScene)break;
        object=object.parent;
      }
      return false;
    });
  }

  function stop(event){
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  mainCanvas.addEventListener('pointerdown',event=>{
    if(entranceBypass||document.body.dataset.sceneMode==='interior')return;
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
    if(entranceBypass||document.body.dataset.sceneMode==='interior')return;
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
    if(entranceBypass||document.body.dataset.sceneMode==='interior')return;
    const down=pointerDown;
    pointerDown=null;
    if(!down||down.pointerId!==event.pointerId)return;

    if(down.jester&&!down.moved){
      stop(event);
      if(gatekeeper?.click(event)){
        gatekeeper.clearHover();
        mainCanvas.style.cursor='';
      }
      return;
    }

    // Preserve card taps and drag/orbit releases. A stationary tap on empty
    // castle space is converted to pointercancel so the old door target cannot
    // trigger entrance. The jester is therefore the sole entrance control.
    if(!down.moved&&!hitCastleCard(event)){
      stop(event);
      entranceBypass=true;
      try{
        mainCanvas.dispatchEvent(new PointerEvent('pointercancel',{
          bubbles:true,cancelable:true,pointerId:event.pointerId,
          pointerType:event.pointerType||'mouse',clientX:event.clientX,clientY:event.clientY,
        }));
      } finally {
        entranceBypass=false;
      }
    }
  },true);

  function requestExistingEntrance(){
    if(!capturedCamera||!gatekeeper||document.body.dataset.sceneMode==='interior')return;
    document.body.dataset.castleJesterState='opening-gate';

    // Aim through the jester toward the gateway, then hand off to the castle's
    // existing entrance/video/interior transition instead of duplicating it.
    const target=gatekeeper.root.localToWorld(new THREE.Vector3(0,3.2,0));
    capturedCamera.lookAt(target);
    capturedCamera.updateMatrixWorld(true);

    const rect=mainCanvas.getBoundingClientRect();
    const x=rect.left+rect.width*.5;
    const y=rect.top+rect.height*.62;
    const pointerId=9107;
    entranceBypass=true;
    try{
      mainCanvas.dispatchEvent(new PointerEvent('pointerdown',{
        bubbles:true,cancelable:true,pointerId,pointerType:'mouse',button:0,
        buttons:1,clientX:x,clientY:y,
      }));
      mainCanvas.dispatchEvent(new PointerEvent('pointerup',{
        bubbles:true,cancelable:true,pointerId,pointerType:'mouse',button:0,
        buttons:0,clientX:x,clientY:y,
      }));
    } finally {
      entranceBypass=false;
    }
  }

  window.addEventListener('pagehide',()=>{
    classObserver.disconnect();
    if(THREE.WebGLRenderer.prototype.render===originalRender)return;
    THREE.WebGLRenderer.prototype.render=originalRender;
    gatekeeper?.dispose();
  },{once:true});
}
