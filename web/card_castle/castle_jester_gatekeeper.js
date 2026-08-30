import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const clamp01=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp01(value);return t*t*(3-2*t)};
const BASE_ROTATION=Math.PI*.5;
const isIOS=/iP(?:hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isAndroid=/Android/i.test(navigator.userAgent);
const isMobile=isIOS||isAndroid;

export class CastleJesterGatekeeper {
  constructor({scene,camera,renderer,onEnterRequested,modelUrl}) {
    this.scene=scene;this.camera=camera;this.renderer=renderer;this.onEnterRequested=onEnterRequested;this.modelUrl=modelUrl;
    this.root=new THREE.Group();this.root.name='castle-jester-gatekeeper';this.root.position.set(0,0,18.2);this.root.rotation.y=BASE_ROTATION;this.root.visible=false;this.scene.add(this.root);
    this.keyLight=new THREE.PointLight(0xffb35f,9,9,2);this.keyLight.position.set(0,3.1,1.6);this.root.add(this.keyLight);
    this.elapsed=0;this.clicked=false;this.ready=false;this.hover=false;this.pointer=new THREE.Vector2();this.raycaster=new THREE.Raycaster();this.bones={};this.base={};this.hitProxy=null;this.hitMeshes=[];
    const SharedDRACOLoader=window.DRACOLoader;
    if(typeof SharedDRACOLoader!=='function'){document.body.dataset.castleJester='failed';document.body.dataset.castleJesterError='shared-draco-unavailable';return;}
    this.dracoLoader=new SharedDRACOLoader();this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');this.dracoLoader.setDecoderConfig({type:isIOS?'js':'wasm'});this.dracoLoader.setWorkerLimit(isMobile?1:2);this.dracoLoader.preload();
    this.loader=new GLTFLoader();this.loader.setDRACOLoader(this.dracoLoader);this.load();
  }
  load(){this.loader.load(this.modelUrl,gltf=>{this.model=gltf.scene;this.model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.frustumCulled=false;object.renderOrder=6;this.hitMeshes.push(object);const materials=Array.isArray(object.material)?object.material:[object.material];materials.filter(Boolean).forEach(material=>{material.side=THREE.DoubleSide;material.needsUpdate=true})}if(object.isBone){const key=(object.name||'').toLowerCase();this.bones[key]=object;this.base[object.uuid]={position:object.position.clone(),quaternion:object.quaternion.clone()}}});const bounds=new THREE.Box3().setFromObject(this.model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=3.25/Math.max(size.y,.001);this.model.scale.setScalar(scale);this.model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);this.model.updateMatrixWorld(true);this.root.add(this.model);this.root.visible=true;this.ready=true;document.body.dataset.castleJester='ready';document.body.dataset.castleJesterState='looping';document.body.dataset.castleJesterHitArea='visible-mesh-only-v80'},undefined,error=>{document.body.dataset.castleJester='failed';document.body.dataset.castleJesterError=String(error?.message||error)});}
  bone(...names){for(const name of names){const exact=this.bones[name.toLowerCase()];if(exact)return exact}return null}
  resetBones(){for(const object of Object.values(this.bones)){const base=this.base[object.uuid];if(base){object.position.copy(base.position);object.quaternion.copy(base.quaternion)}}}
  setLoopPose(){if(!this.ready||!this.model)return;this.resetBones();const t=this.elapsed%10,segment=(a,b)=>smooth((t-a)/(b-a)),pulse=(a,b,c)=>segment(a,b)*(1-segment(b,c));const head=this.bone('Head'),spine=this.bone('Spine02','Spine01'),rightUpper=this.bone('R_Upperarm'),rightFore=this.bone('R_Forearm'),leftUpper=this.bone('L_Upperarm'),leftFore=this.bone('L_Forearm');const follow=this.hover?.24:.08*Math.sin(this.elapsed*.9);if(head){head.rotation.y+=follow;head.rotation.x+=.045*Math.sin(this.elapsed*1.25)}const point=pulse(1.3,2,3.05);if(rightUpper)rightUpper.rotation.x-=1.08*point;if(rightFore)rightFore.rotation.x-=.38*point;const bow=pulse(4.55,5.2,6.15);if(spine)spine.rotation.x+=.62*bow;const present=segment(6,7)*(1-segment(8.25,9.45));if(leftUpper){leftUpper.rotation.x-=.72*present;leftUpper.rotation.z+=.88*present}if(leftFore)leftFore.rotation.x-=.26*present}
  update(delta){if(!this.ready)return;this.elapsed+=Math.min(.05,Math.max(0,delta||0));if(this.clicked)return;this.setLoopPose()}
  hitTest(event){if(!this.ready||this.clicked||!this.root.visible||!this.hitMeshes.length)return false;const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.x=((event.clientX-rect.left)/Math.max(1,rect.width))*2-1;this.pointer.y=-((event.clientY-rect.top)/Math.max(1,rect.height))*2+1;this.raycaster.setFromCamera(this.pointer,this.camera);return this.raycaster.intersectObjects(this.hitMeshes,false).length>0}
  setHover(event){const active=this.hitTest(event);this.hover=active;document.body.dataset.castleJesterHover=active?'true':'false';return active}
  clearHover(){this.hover=false;document.body.dataset.castleJesterHover='false'}
  click(event,knownHit=false){if(!knownHit&&!this.hitTest(event))return false;this.clicked=true;document.body.dataset.castleJesterState='entering';return true}
  restartLoop(){if(!this.ready)return;this.clicked=false;this.enterDispatched=false;this.elapsed=0;this.clearHover();this.resetBones();this.root.rotation.y=BASE_ROTATION;document.body.dataset.castleJesterState='looping'}
  setVisible(active){this.root.visible=Boolean(active&&this.ready);if(!active)this.clearHover()}
  dispose(){this.dracoLoader?.dispose();this.scene?.remove(this.root)}
}
