import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

if (!window.__castleRegressionHotfixV48Installed) {
  window.__castleRegressionHotfixV48Installed = true;

  const LAB_TOKEN = 'laboratory_interior.glb';
  const EXTERIOR_BG_URL = new URL('../assets/assets/images/castle_exterior_atmosphere.png', document.baseURI).href;
  const VIDEO_URL = new URL('../assets/assets/videos/bureau_screen_loop.mp4', document.baseURI).href;
  let laboratoryMixer = null, laboratoryFrame = 0, lastTime = performance.now();
  let exteriorTexture = null, video = null, videoTexture = null, boundVideoMeshes = [];
  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function startLaboratoryAnimations(root, clips) {
    const playable = (clips || []).filter(clip => !/camera/i.test(clip?.name || ''));
    if (!root || !playable.length) { document.body.dataset.laboratoryAnimationPlayback = 'no-clips-v48'; return; }
    laboratoryMixer?.stopAllAction?.(); laboratoryMixer = new THREE.AnimationMixer(root);
    playable.forEach(clip => laboratoryMixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).reset().play());
    document.body.dataset.laboratoryAnimationPlayback = 'looping-v48';
    if (!laboratoryFrame) { lastTime = performance.now(); const tick = now => { laboratoryFrame=requestAnimationFrame(tick); const d=Math.min(.05,Math.max(0,(now-lastTime)/1000)); lastTime=now; if(laboratoryMixer&&mode()==='laboratory')laboratoryMixer.update(d); }; laboratoryFrame=requestAnimationFrame(tick); }
  }

  if (!GLTFLoader.prototype.__laboratoryHotfixV48) {
    GLTFLoader.prototype.__laboratoryHotfixV48 = true; const originalLoad=GLTFLoader.prototype.load;
    GLTFLoader.prototype.load=function(url,onLoad,onProgress,onError){
      if(!String(url||'').includes(LAB_TOKEN))return originalLoad.call(this,url,onLoad,onProgress,onError);
      return originalLoad.call(this,url,gltf=>{ const root=gltf?.scene; if(root&&!root.userData.laboratoryUprightV48){root.rotation.x+=Math.PI;root.updateMatrixWorld(true);root.userData.laboratoryUprightV48=true;} onLoad?.(gltf); requestAnimationFrame(()=>requestAnimationFrame(()=>{startLaboratoryAnimations(root,gltf?.animations||[]);hideLaboratoryCards();bindLaboratoryVideo();})); },onProgress,onError);
    };
  }

  function hideLaboratoryCards(){const scene=window.__castleSearchRuntime?.scene;if(!scene)return;const active=mode()==='laboratory';scene.children.forEach(child=>{if(!child?.isGroup)return;let has=false;child.traverse?.(o=>{if(o?.userData?.card)has=true});if(has)child.visible=!active&&mode()==='exterior';});}

  function ensureVideo(){if(videoTexture)return videoTexture;video=document.createElement('video');video.src=VIDEO_URL;video.loop=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;videoTexture.minFilter=THREE.LinearFilter;videoTexture.magFilter=THREE.LinearFilter;videoTexture.generateMipmaps=false;return videoTexture;}

  function scoreVideoMesh(object){if(!object?.isMesh)return 0;const mats=(Array.isArray(object.material)?object.material:[object.material]).map(m=>m?.name||'').join(' ');const label=`${object.name||''} ${mats}`.toLowerCase();if(/video/.test(label))return 120;if(/screen/.test(label))return 110;if(/display|monitor/.test(label))return 100;if(/mirror|scry|portal|oval|circle|circular|central/.test(label))return 90;if(/recto|verso/.test(label))return 60;return 0;}

  function bindLaboratoryVideo(){
    const root=window.__castleSearchRuntime?.scene?.getObjectByName('BureauOfAI');if(!root)return false;
    const candidates=[];root.updateMatrixWorld(true);root.traverse(object=>{if(!object?.isMesh)return;const score=scoreVideoMesh(object);if(score)candidates.push({object,score});});candidates.sort((a,b)=>b.score-a.score);
    const named=candidates.slice(0,3).map(x=>x.object);const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3());
    const geometric=[];root.traverse(object=>{if(!object?.isMesh||named.includes(object))return;const b=new THREE.Box3().setFromObject(object);if(b.isEmpty())return;const s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());const dims=[s.x,s.y,s.z].sort((a,b)=>a-b);const thin=dims[0],mid=dims[1],long=dims[2];if(thin<.45&&mid>.35&&long<8){const central=Math.hypot(c.x-center.x,c.z-center.z);geometric.push({object,score:central+Math.abs(c.y-center.y)*.35});}});geometric.sort((a,b)=>a.score-b.score);
    const targets=[...named];for(const item of geometric){if(targets.length>=3)break;if(!targets.includes(item.object))targets.push(item.object);}if(!targets.length)return false;
    const map=ensureVideo();boundVideoMeshes=targets;targets.forEach(mesh=>{mesh.material=new THREE.MeshBasicMaterial({name:`${mesh.name||'laboratory-video'}-v48`,map,color:0xffffff,side:THREE.DoubleSide,toneMapped:false});mesh.material.needsUpdate=true;mesh.visible=true;});
    document.body.dataset.bureauVideoScreenCount=String(targets.length);document.body.dataset.bureauVideoState='three-surfaces-central-display-v48';syncVideoPlayback();return true;
  }

  function syncVideoPlayback(){if(!video)return;if(mode()==='laboratory')video.play().then(()=>document.body.dataset.bureauVideoPlayback='playing-v48').catch(e=>document.body.dataset.bureauVideoError=String(e?.message||e));else video.pause();}
  function restoreExteriorBackground(){if(mode()!=='exterior')return;const runtime=window.__castleSearchRuntime;if(!runtime?.scene||!runtime?.renderer)return;if(exteriorTexture)runtime.scene.background=exteriorTexture;runtime.scene.fog=new THREE.FogExp2(0x08131e,.0062);runtime.renderer.toneMappingExposure=2.05;if(window.__castleDirectExteriorEnvironment)window.__castleDirectExteriorEnvironment.visible=true;}
  new THREE.TextureLoader().load(EXTERIOR_BG_URL,t=>{t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;exteriorTexture=t;restoreExteriorBackground();});
  function sync(){hideLaboratoryCards();syncVideoPlayback();if(mode()==='laboratory'){if(boundVideoMeshes.length<3)bindLaboratoryVideo();}else if(mode()==='exterior'){setTimeout(restoreExteriorBackground,120);setTimeout(restoreExteriorBackground,300);}}
  const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready']});window.addEventListener('castleRuntimeReady',sync);setInterval(()=>{if(mode()==='laboratory'&&boundVideoMeshes.length<3)bindLaboratoryVideo();},750);sync();
}
