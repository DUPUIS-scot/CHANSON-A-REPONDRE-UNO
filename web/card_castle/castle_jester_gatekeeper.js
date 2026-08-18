import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

export class CastleJesterGatekeeper {
  constructor({scene,camera,renderer,onEnterRequested,modelUrl}) {
    this.scene=scene;
    this.camera=camera;
    this.renderer=renderer;
    this.onEnterRequested=onEnterRequested;
    this.modelUrl=modelUrl;
    this.root=new THREE.Group();
    this.root.position.set(0,0,10.8);
    this.root.rotation.y=Math.PI;
    this.root.visible=false;
    this.scene.add(this.root);
    this.clock=new THREE.Clock();
    this.elapsed=0;
    this.clicked=false;
    this.ready=false;
    this.hover=false;
    this.pointer=new THREE.Vector2();
    this.raycaster=new THREE.Raycaster();
    this.bones={};
    this.base={};
    this.load();
  }

  load(){
    new GLTFLoader().load(this.modelUrl,gltf=>{
      this.model=gltf.scene;
      this.model.traverse(o=>{
        if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.castleGatekeeper=true;}
        if(o.isBone){
          const key=(o.name||'').toLowerCase();
          this.bones[key]=o;
          this.base[o.uuid]={p:o.position.clone(),q:o.quaternion.clone()};
        }
      });
      const bounds=new THREE.Box3().setFromObject(this.model);
      const size=bounds.getSize(new THREE.Vector3());
      const center=bounds.getCenter(new THREE.Vector3());
      this.model.position.sub(center);
      this.model.position.y+=size.y*.5;
      this.model.scale.setScalar(5.6/Math.max(size.y,.001));
      this.root.add(this.model);
      this.root.visible=true;
      this.ready=true;
      document.body.dataset.castleJester='ready';
      document.body.dataset.castleJesterAnimations=String(gltf.animations.length);
    },undefined,error=>{
      document.body.dataset.castleJester='failed';
      document.body.dataset.castleJesterError=String(error?.message||error);
    });
  }

  findBone(...parts){
    const keys=Object.keys(this.bones);
    const key=keys.find(k=>parts.every(p=>k.includes(p)));
    return key?this.bones[key]:null;
  }

  setPose(){
    if(!this.ready||!this.model)return;
    for(const o of Object.values(this.bones)){
      const b=this.base[o.uuid]; if(!b)continue;
      o.position.copy(b.p);o.quaternion.copy(b.q);
    }
    const t=this.elapsed%10.0;
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
    const seg=(a,b)=>smooth((t-a)/(b-a));
    const pulse=(a,b,c)=>seg(a,b)*(1-seg(b,c));
    const head=this.findBone('head')||this.findBone('neck');
    const spine=this.findBone('spine');
    const rArm=this.findBone('right','arm')||this.findBone('r','arm');
    const rFore=this.findBone('right','fore')||this.findBone('right','lower');
    const lArm=this.findBone('left','arm')||this.findBone('l','arm');
    const lFore=this.findBone('left','fore')||this.findBone('left','lower');
    const hip=this.findBone('hip')||this.findBone('pelvis');

    if(head){
      const look=this.hover?0.26:0.10*Math.sin(this.elapsed*.9);
      head.rotation.y+=look;
      head.rotation.x+=0.05*Math.sin(this.elapsed*1.3);
    }
    if(spine){spine.rotation.z+=0.025*Math.sin(this.elapsed*1.7);}

    // Point toward visitor: 1.4s–3.1s
    const point=pulse(1.4,2.0,3.1);
    if(rArm){rArm.rotation.x-=1.05*point;rArm.rotation.z-=0.28*point;}
    if(rFore){rFore.rotation.x-=0.34*point;}

    // Beckon: 3.0s–4.7s
    const beckon=pulse(3.0,3.5,4.7);
    if(rArm){rArm.rotation.x-=0.72*beckon;rArm.rotation.z-=0.5*beckon;}
    if(rFore){rFore.rotation.x-=0.75*beckon*(0.65+0.35*Math.sin(this.elapsed*9));}

    // Theatrical bow: 4.6s–6.1s
    const bow=pulse(4.6,5.2,6.1);
    if(spine)spine.rotation.x+=0.65*bow;
    if(hip)hip.rotation.x+=0.22*bow;

    // Turn toward gate + present entrance: 6.0s–8.8s
    const present=seg(6.0,7.0)*(1-seg(8.0,9.4));
    this.root.rotation.y=Math.PI-0.72*present;
    if(lArm){lArm.rotation.x-=0.72*present;lArm.rotation.z+=0.9*present;}
    if(lFore){lFore.rotation.x-=0.22*present;}
  }

  update(dt){
    if(!this.ready)return;
    this.elapsed+=Math.min(.05,dt||0);
    if(this.clicked){
      const p=Math.min(1,(this.elapsed-this.clickStarted)/1.35);
      const e=p*p*(3-2*p);
      this.root.position.x=THREE.MathUtils.lerp(this.clickOriginX,5.4,e);
      this.root.rotation.y=THREE.MathUtils.lerp(this.clickOriginRot,Math.PI*.68,e);
      if(p>=1&&!this.enterDispatched){
        this.enterDispatched=true;
        this.onEnterRequested?.();
      }
      return;
    }
    this.setPose();
  }

  hitTest(event){
    if(!this.ready||this.clicked)return false;
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    this.pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    return this.raycaster.intersectObject(this.root,true).some(hit=>hit.object.userData.castleGatekeeper);
  }

  setHover(event){
    const active=this.hitTest(event);
    this.hover=active;
    document.body.dataset.castleJesterHover=active?'true':'false';
    return active;
  }

  click(event){
    if(!this.hitTest(event))return false;
    this.clicked=true;
    this.clickStarted=this.elapsed;
    this.clickOriginX=this.root.position.x;
    this.clickOriginRot=this.root.rotation.y;
    document.body.dataset.castleJesterState='entering';
    return true;
  }

  setVisible(active){this.root.visible=Boolean(active&&this.ready);}
  dispose(){this.scene?.remove(this.root);}
}
