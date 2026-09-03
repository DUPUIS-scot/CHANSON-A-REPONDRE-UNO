import * as THREE from 'three';

// Final mode-aware texture-reveal lighting owner for Castle/Laboratory.
if (!window.__castleSceneLightingFixInstalled) {
  window.__castleSceneLightingFixInstalled = true;
  let runtime=null, laboratoryRig=null, attempts=0;
  let exteriorLights=[], exteriorIntensities=new Map();
  const mode=()=>document.body.dataset.sceneMode||'exterior';
  const targeted=(rig,light,pos,target)=>{light.position.copy(pos);const t=new THREE.Object3D();t.position.copy(target);rig.add(t);light.target=t;rig.add(light);return light;};
  function createLabRig(){
    if(!runtime?.scene||laboratoryRig)return laboratoryRig;
    const rig=new THREE.Group();rig.name='laboratory-texture-reveal-v4';rig.visible=false;
    rig.add(new THREE.AmbientLight(0x8099aa,.92));
    rig.add(new THREE.HemisphereLight(0xb9d4e4,0x35251b,1.12));
    const key=targeted(rig,new THREE.DirectionalLight(0xc5e4f3,2.7),new THREE.Vector3(-11,15,-8),new THREE.Vector3(0,4,0));
    const warm=targeted(rig,new THREE.DirectionalLight(0xffc28c,1.35),new THREE.Vector3(12,9,8),new THREE.Vector3(0,3,-1));
    const bureau=targeted(rig,new THREE.SpotLight(0xdaf2ff,43,40,Math.PI/5.7,.72,1.3),new THREE.Vector3(-4,13,9),new THREE.Vector3(0,2.8,0));
    const statue=targeted(rig,new THREE.SpotLight(0xffd4a6,30,30,Math.PI/5.5,.75,1.35),new THREE.Vector3(5,10,3),new THREE.Vector3(0,3,-2));
    const videoFill=targeted(rig,new THREE.SpotLight(0x9bdcff,24,34,Math.PI/4.8,.82,1.5),new THREE.Vector3(-6,7,-3),new THREE.Vector3(0,3,-3));
    [[-6,3,2,0xffad69,18],[6,3,1,0xffa05f,17],[-3,3,-6,0x79bfe7,14],[4,3,-5,0x91d4ef,14]].forEach(([x,y,z,c,i])=>{const l=new THREE.PointLight(c,i,14,2);l.position.set(x,y,z);rig.add(l);});
    [key,bureau,statue].forEach(l=>{l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.camera.near=.8;l.shadow.camera.far=60;l.shadow.bias=-.0003;});
    runtime.scene.add(rig);laboratoryRig=rig;return rig;
  }
  function sync(){
    if(!runtime?.scene||!runtime?.renderer)return;
    createLabRig();const m=mode(), renderer=runtime.renderer;
    if(m==='laboratory'){
      exteriorLights.forEach(l=>l.intensity=0);
      if(window.__castleInteriorLightingRig?.group)window.__castleInteriorLightingRig.group.visible=false;
      laboratoryRig.visible=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.82;
      runtime.scene.fog=new THREE.FogExp2(0x101820,.0018);renderer.domElement.style.filter='contrast(.99) saturate(1.04) brightness(1.06)';
      document.body.dataset.laboratoryLighting='substantive-texture-reveal-v4';document.body.dataset.sceneExposureOwner='laboratory-texture-reveal-v4';return;
    }
    laboratoryRig.visible=false;
    if(m==='interior'){exteriorLights.forEach(l=>l.intensity=0);window.__castleInteriorLightingRig?.sync?.();document.body.dataset.sceneExposureOwner='castle-texture-reveal-v8';return;}
    exteriorLights.forEach(l=>l.intensity=exteriorIntensities.get(l)??l.intensity);if(window.__castleInteriorLightingRig?.group)window.__castleInteriorLightingRig.group.visible=false;renderer.domElement.style.filter='';delete document.body.dataset.sceneExposureOwner;
  }
  function install(){runtime=window.__castleSearchRuntime;if(!runtime?.scene||!runtime?.renderer){if(attempts++<180)setTimeout(install,100);return;}exteriorLights=runtime.scene.children.filter(o=>o?.isLight);exteriorLights.forEach(l=>exteriorIntensities.set(l,l.intensity));createLabRig();new MutationObserver(()=>{setTimeout(sync,0);setTimeout(sync,100)}).observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready']});document.body.dataset.sceneLightingFix='substantive-texture-reveal-v4';sync();}
  window.addEventListener('castleRuntimeReady',install,{once:true});install();
}
