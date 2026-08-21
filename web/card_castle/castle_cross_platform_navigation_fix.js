import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

if (!window.__castleCrossPlatformNavigationFixInstalled) {
  window.__castleCrossPlatformNavigationFixInstalled = true;
  const LAB_TOKEN='laboratory_interior.glb', INTERIOR_MAX_DISTANCE=78;
  const PASSAGE_PATTERN=/(?:laboratory|laboratoire|bureau|passage|portal|door|doorway|gate|arch|corridor|entrance|entry|tunnel)/i;
  let runtime=null,canvas=null,attempts=0,pointerDown=null,pinch=null; const touchPointers=new Map();
  const mode=()=>document.body.dataset.sceneMode||'exterior';

  if(!GLTFLoader.prototype.__laboratoryOrientationSourceV48){GLTFLoader.prototype.__laboratoryOrientationSourceV48=true;const previousLoad=GLTFLoader.prototype.load;GLTFLoader.prototype.load=function(url,onLoad,onProgress,onError){if(!String(url||'').includes(LAB_TOKEN))return previousLoad.call(this,url,onLoad,onProgress,onError);return previousLoad.call(this,url,gltf=>{const root=gltf?.scene;if(root?.userData?.laboratoryUprightV47&&!root.userData.laboratorySourceOrientationV48){root.rotation.x-=Math.PI;root.updateMatrixWorld(true);root.userData.laboratorySourceOrientationV48=true;document.body.dataset.laboratoryOrientation='source-world-orientation-v48';}onLoad?.(gltf);},onProgress,onError);};}

  // Target composition: elevated wide overview of the complete circular bureau,
  // fountain/screens and stained-glass architecture (user reference image 3).
  // This intentionally replaces the older walking-statue close focus, which
  // could put the camera inside foreground geometry.
  function setWideLaboratoryStart(){
    if(mode()!=='laboratory'||!runtime?.orbit||!runtime?.scene)return false;
    const root=runtime.scene.getObjectByName('BureauOfAI'); if(!root?.visible)return false;
    root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root); if(box.isEmpty())return false;
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    runtime.orbit.target.set(center.x,THREE.MathUtils.clamp(box.min.y+size.y*.34,2.5,10),center.z);
    runtime.orbit.yaw=0;
    runtime.orbit.pitch=.52;
    runtime.orbit.distance=THREE.MathUtils.clamp(Math.max(34,Math.max(size.x,size.z)*.78),34,64);
    runtime.updateOrbit?.();
    document.body.dataset.laboratoryStartingView='elevated-wide-bureau-v55';
    return true;
  }
  function scheduleWideStart(){if(mode()!=='laboratory')return;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!setWideLaboratoryStart()){setTimeout(setWideLaboratoryStart,180);setTimeout(setWideLaboratoryStart,500);}}));}

  function enterLaboratoryFromPassage(){if(mode()!=='interior')return false;const button=document.getElementById('bureau-of-ai');if(!button||button.disabled)return false;button.click();document.body.dataset.laboratoryPassageEntry='spatial-hit-v55';return true;}
  function objectLabel(object){const materials=object?.material?(Array.isArray(object.material)?object.material:[object.material]).map(m=>m?.name||'').join(' '):'';const ancestors=[];let current=object;for(let i=0;current&&i<5;i++,current=current.parent)ancestors.push(current.name||'');return `${ancestors.join(' ')} ${materials}`.trim();}
  function raycastInteriorPassage(clientX,clientY){if(mode()!=='interior'||!runtime?.camera||!runtime?.interiorRoot||!canvas)return false;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return false;const pointer=new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1,-((clientY-rect.top)/rect.height)*2+1);const raycaster=new THREE.Raycaster();raycaster.setFromCamera(pointer,runtime.camera);const hits=raycaster.intersectObject(runtime.interiorRoot,true);for(const hit of hits.slice(0,8)){if(PASSAGE_PATTERN.test(objectLabel(hit.object)))return enterLaboratoryFromPassage();}return false;}

  function bindCrossPlatformNavigation(targetCanvas){if(!targetCanvas||targetCanvas.dataset.castleCrossPlatformV55==='true')return;targetCanvas.dataset.castleCrossPlatformV55='true';targetCanvas.style.touchAction='none';
    targetCanvas.addEventListener('wheel',event=>{if(mode()!=='interior'||!runtime?.orbit)return;runtime.orbit.distance=THREE.MathUtils.clamp(runtime.orbit.distance+event.deltaY*.025,4.5,INTERIOR_MAX_DISTANCE);runtime.updateOrbit?.();document.body.dataset.castleNavigationGesture='wheel-zoom-v55';event.preventDefault();event.stopImmediatePropagation();},{capture:true,passive:false});
    targetCanvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){touchPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(touchPointers.size===2&&runtime?.orbit){const[a,b]=[...touchPointers.values()];pinch={distance:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)),orbitDistance:runtime.orbit.distance,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},target:runtime.orbit.target.clone()};}}pointerDown={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};},{capture:true,passive:false});
    targetCanvas.addEventListener('pointermove',event=>{if(pointerDown?.id===event.pointerId&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>7)pointerDown.moved=true;if(event.pointerType!=='touch'||!touchPointers.has(event.pointerId))return;touchPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(touchPointers.size!==2||!pinch||mode()!=='interior'||!runtime?.orbit)return;const[a,b]=[...touchPointers.values()],distance=Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)),center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};runtime.orbit.distance=THREE.MathUtils.clamp(pinch.orbitDistance*pinch.distance/distance,4.5,INTERIOR_MAX_DISTANCE);if(runtime.camera&&runtime.orbit.target){const scale=runtime.orbit.distance*.0018,right=new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix,0),up=new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix,1);runtime.orbit.target.copy(pinch.target).addScaledVector(right,-(center.x-pinch.center.x)*scale).addScaledVector(up,(center.y-pinch.center.y)*scale);}runtime.updateOrbit?.();event.preventDefault();event.stopImmediatePropagation();},{capture:true,passive:false});
    const release=event=>{if(event.pointerType==='touch'){touchPointers.delete(event.pointerId);if(touchPointers.size<2)pinch=null;}const down=pointerDown;if(down?.id===event.pointerId){if(!down.moved&&mode()==='interior')raycastInteriorPassage(event.clientX,event.clientY);pointerDown=null;}};targetCanvas.addEventListener('pointerup',release,{capture:true,passive:false});targetCanvas.addEventListener('pointercancel',release,{capture:true,passive:false});targetCanvas.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});targetCanvas.addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});targetCanvas.addEventListener('dblclick',event=>{if(raycastInteriorPassage(event.clientX,event.clientY)){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  }
  function sync(){if(!runtime)runtime=window.__castleSearchRuntime;if(!runtime?.renderer?.domElement)return;canvas=runtime.renderer.domElement;bindCrossPlatformNavigation(canvas);if(mode()==='laboratory')scheduleWideStart();}
  function install(){runtime=window.__castleSearchRuntime;if(!runtime?.renderer?.domElement||!runtime?.orbit){if(attempts++<180)setTimeout(install,100);return;}canvas=runtime.renderer.domElement;bindCrossPlatformNavigation(canvas);const observer=new MutationObserver(()=>{sync();if(mode()==='laboratory')scheduleWideStart();});observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready']});window.addEventListener('resize',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});document.body.dataset.interiorMaxDistance=String(INTERIOR_MAX_DISTANCE);sync();}
  window.addEventListener('castleRuntimeReady',install,{once:true});install();
}
