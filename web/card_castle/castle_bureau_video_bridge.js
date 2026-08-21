import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;
  const VIDEO_URL = new URL('../assets/assets/videos/bureau_screen_loop.mp4', document.baseURI).href;
  let video=null, texture=null, boundRoot=null, observer=null;

  function findBureauRoot(){const r=window.__castleSearchRuntime;return r?.scene?.getObjectByName('BureauOfAI')||r?.bureauRoot||null;}
  function isVideoMesh(object){
    if(!object?.isMesh)return false;
    const n=String(object.name||'').toLowerCase();
    const m=String(object.material?.name||'').toLowerCase();
    return n.includes('videoscreen')||n.includes('video_screen')||n.includes('video mesh')||n.includes('videomesh')||n.includes('screen')||m.includes('video')||m.includes('screen');
  }
  function ensureVideoTexture(){
    if(texture)return texture;
    video=document.createElement('video');
    video.id='bureau-screen-loop-video';
    Object.assign(video,{src:VIDEO_URL,loop:true,muted:true,defaultMuted:true,playsInline:true,preload:'auto',crossOrigin:'anonymous'});
    video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.setAttribute('aria-hidden','true');
    video.load();
    texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.flipY=false;
    return texture;
  }
  function bindScreens(root){
    if(!root)return false;
    const map=ensureVideoTexture();let count=0;
    root.traverse(object=>{
      if(!isVideoMesh(object))return;
      object.material=new THREE.MeshBasicMaterial({name:`${object.name||'VideoMesh'}-live-video`,map,color:0xffffff,side:THREE.DoubleSide,toneMapped:false});
      object.material.needsUpdate=true;object.visible=true;count++;
    });
    document.body.dataset.bureauVideoAsset=VIDEO_URL;document.body.dataset.bureauVideoScreenCount=String(count);document.body.dataset.bureauVideoState=count>0?'ready':'screen-mismatch';
    if(count>0)boundRoot=root;return count>0;
  }
  function play(){
    const active=document.body.dataset.sceneMode==='laboratory'||document.body.dataset.sceneMode==='bureau';
    if(!active){if(video)video.pause();document.body.dataset.bureauVideoPlayback='paused';return;}
    const root=findBureauRoot();
    if(root&&!boundRoot)bindScreens(root);
    if(!video){document.body.dataset.bureauVideoPlayback='waiting-screen';return;}
    video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;
    const attempt=()=>video.play().then(()=>{document.body.dataset.bureauVideoPlayback='playing-loop-v57';delete document.body.dataset.bureauVideoError;}).catch(e=>{document.body.dataset.bureauVideoPlayback='waiting-user-gesture';document.body.dataset.bureauVideoError=String(e?.message||e);});
    if(video.readyState>=2)attempt();else video.addEventListener('canplay',attempt,{once:true});
  }
  function hydrate(){const root=findBureauRoot();if(root)bindScreens(root);play();}
  function gestureResume(){if(document.body.dataset.sceneMode==='laboratory')hydrate();}
  window.__castleBureauVideoPlay=hydrate;
  window.addEventListener('castleRuntimeReady',hydrate);
  window.addEventListener('pointerdown',gestureResume,{passive:true});
  window.addEventListener('touchstart',gestureResume,{passive:true});
  observer=new MutationObserver(()=>{
    hydrate();
    if(document.body.dataset.sceneMode==='laboratory'){
      requestAnimationFrame(hydrate);
      setTimeout(hydrate,120);
      setTimeout(hydrate,420);
    }
  });
  observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready','data-bureau-ready']});
  let attempts=0;const timer=setInterval(()=>{hydrate();if((boundRoot&&video?.readyState>=2)||attempts++>300)clearInterval(timer);},200);
  window.addEventListener('beforeunload',()=>{clearInterval(timer);observer?.disconnect();video?.pause();texture?.dispose();delete window.__castleBureauVideoPlay;},{once:true});
  hydrate();
}
