import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';

const clamp01=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp01(value);return t*t*(3-2*t)};
const BASE_ROTATION=Math.PI*1.5;

export class CastleJesterGatekeeper {
  constructor({scene,camera,renderer,onEnterRequested,modelUrl}) {
    this.scene=scene;
    this.camera=camera;
    this.renderer=renderer;
    this.onEnterRequested=onEnterRequested;
    this.modelUrl=modelUrl;
    this.root=new THREE.Group();
    this.root.name='castle-jester-gatekeeper';
    this.root.position.set(0,0,18.2);
    this.root.rotation.y=BASE_ROTATION;
    this.root.visible=false;
    this.scene.add(this.root);
    this.keyLight=new THREE.PointLight(0xffb35f,9,9,2);
    this.keyLight.position.set(0,3.1,1.6);
    this.root.add(this.keyLight);
    this.elapsed=0;
    this.clicked=false;
    this.ready=false;
    this.hover=false;
    this.pointer=new THREE.Vector2();
    this.raycaster=new THREE.Raycaster();
    this.bones={};
    this.base={};
    this.dracoLoader=new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
    this.dracoLoader.setWorkerLimit(2);
    this.dracoLoader.preload();
    this.loader=new GLTFLoader();
    this.loader.setDRACOLoader(this.dracoLoader);
    this.load();
  }

  load(){
    this.loader.load(this.modelUrl,gltf=>{
      this.model=gltf.scene;
      this.model.traverse(object=>{
        if(object.isMesh){
          object.castShadow=true;
          object.receiveShadow=true;
          object.frustumCulled=false;
          object.renderOrder=6;
          object.userData.castleGatekeeper=true;
          const materials=Array.isArray(object.material)?object.material:[object.material];
          materials.filter(Boolean).forEach(material=>{
            material.side=THREE.DoubleSide;
            if('roughness' in material)material.roughness=Math.min(material.roughness??.75,.78);
            material.needsUpdate=true;
          });
        }
        if(object.isBone){
          const key=(object.name||'').toLowerCase();
          this.bones[key]=object;
          this.base[object.uuid]={position:object.position.clone(),quaternion:object.quaternion.clone()};
        }
      });
      const bounds=new THREE.Box3().setFromObject(this.model);
      const size=bounds.getSize(new THREE.Vector3());
      const center=bounds.getCenter(new THREE.Vector3());
      // True human scale relative to the gatehouse.
      const scale=3.25/Math.max(size.y,.001);
      this.model.scale.setScalar(scale);
      this.model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
      this.root.add(this.model);
      this.root.visible=true;
      this.ready=true;
      document.body.dataset.castleJester='ready';
      document.body.dataset.castleJesterAnimations=String(gltf.animations.length);
      document.body.dataset.castleJesterState='looping';
      document.body.dataset.castleJesterScale='human-gate-v13';
    },undefined,error=>{
      document.body.dataset.castleJester='failed';
      document.body.dataset.castleJesterError=String(error?.message||error);
      console.warn('Castle jester failed to load.',error);
    });
  }

  bone(...names){for(const name of names){const exact=this.bones[name.toLowerCase()];if(exact)return exact}return null}
  resetBones(){for(const object of Object.values(this.bones)){const base=this.base[object.uuid];if(!base)continue;object.position.copy(base.position);object.quaternion.copy(base.quaternion)}}

  setLoopPose(){
    if(!this.ready||!this.model)return;
    this.resetBones();
    const t=this.elapsed%10;
    const segment=(start,end)=>smooth((t-start)/(end-start));
    const pulse=(start,peak,end)=>segment(start,peak)*(1-segment(peak,end));
    const head=this.bone('Head');
    const neck=this.bone('NeckTwist01','NeckTwist02');
    const spine=this.bone('Spine02','Spine01');
    const waist=this.bone('Waist','Hip');
    const rightUpper=this.bone('R_Upperarm');
    const rightFore=this.bone('R_Forearm');
    const rightHand=this.bone('R_Hand');
    const leftUpper=this.bone('L_Upperarm');
    const leftFore=this.bone('L_Forearm');
    const leftHand=this.bone('L_Hand');
    const follow=this.hover?0.24:0.08*Math.sin(this.elapsed*.9);
    if(head){head.rotation.y+=follow;head.rotation.x+=0.045*Math.sin(this.elapsed*1.25)}
    if(neck)neck.rotation.y+=follow*.35;
    if(spine)spine.rotation.z+=0.022*Math.sin(this.elapsed*1.7);
    const point=pulse(1.3,2.0,3.05);
    if(rightUpper){rightUpper.rotation.x-=1.08*point;rightUpper.rotation.z-=0.24*point}
    if(rightFore)rightFore.rotation.x-=0.38*point;
    if(rightHand)rightHand.rotation.x+=0.12*point;
    const beckon=pulse(2.95,3.55,4.65);
    if(rightUpper){rightUpper.rotation.x-=0.72*beckon;rightUpper.rotation.z-=0.48*beckon}
    if(rightFore)rightFore.rotation.x-=0.62*beckon*(.78+.22*Math.sin(this.elapsed*10));
    if(rightHand)rightHand.rotation.x-=0.28*beckon*Math.sin(this.elapsed*10);
    const bow=pulse(4.55,5.2,6.15);
    if(spine)spine.rotation.x+=0.62*bow;
    if(waist)waist.rotation.x+=0.20*bow;
    const present=segment(6.0,7.0)*(1-segment(8.25,9.45));
    // Preserve the +90-degree base orientation throughout the loop.
    this.root.rotation.y=BASE_ROTATION+.42*present;
    if(leftUpper){leftUpper.rotation.x-=.72*present;leftUpper.rotation.z+=.88*present}
    if(leftFore)leftFore.rotation.x-=.26*present;
    if(leftHand)leftHand.rotation.z+=.18*present;
  }

  update(delta){
    if(!this.ready)return;
    this.elapsed+=Math.min(.05,Math.max(0,delta||0));
    if(this.clicked){
      const progress=clamp01((this.elapsed-this.clickStarted)/1.45);
      const eased=smooth(progress);
      this.root.position.x=THREE.MathUtils.lerp(this.clickOriginX,this.clickOriginX+3.4,eased);
      this.root.position.z=THREE.MathUtils.lerp(this.clickOriginZ,this.clickOriginZ-.7,eased);
      this.root.rotation.y=THREE.MathUtils.lerp(this.clickOriginRotation,BASE_ROTATION+.7,eased);
      if(progress>=1&&!this.enterDispatched){this.enterDispatched=true;document.body.dataset.castleJesterState='aside';this.onEnterRequested?.()}
      return;
    }
    this.setLoopPose();
  }

  hitTest(event){
    if(!this.ready||this.clicked||!this.root.visible)return false;
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.x=((event.clientX-rect.left)/Math.max(1,rect.width))*2-1;
    this.pointer.y=-((event.clientY-rect.top)/Math.max(1,rect.height))*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    // Any rendered mesh that belongs to the jester is clickable, including skinned/accessory meshes.
    return this.raycaster.intersectObject(this.root,true).some(hit=>{
      let object=hit.object;
      while(object&&object!==this.root){
        if(object.isMesh||object.userData?.castleGatekeeper===true)return true;
        object=object.parent;
      }
      return false;
    });
  }

  setHover(event){const active=this.hitTest(event);this.hover=active;document.body.dataset.castleJesterHover=active?'true':'false';return active}
  clearHover(){this.hover=false;document.body.dataset.castleJesterHover='false'}
  click(event){
    if(!this.hitTest(event))return false;
    this.clicked=true;
    this.clickStarted=this.elapsed;
    this.clickOriginX=this.root.position.x;
    this.clickOriginZ=this.root.position.z;
    this.clickOriginRotation=this.root.rotation.y;
    document.body.dataset.castleJesterState='entering';
    return true;
  }
  setVisible(active){this.root.visible=Boolean(active&&this.ready);if(!active)this.clearHover()}
  dispose(){this.dracoLoader?.dispose();this.scene?.remove(this.root)}
}
