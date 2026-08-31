import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VERSION = 'v82';
  const BOOK_VIDEO_URL = new URL('../assets/assets/videos/bureau_screen_loop.mp4', document.baseURI).href;
  const MIRROR_VIDEO_URL = new URL('../assets/assets/videos/0830(1).mp4', document.baseURI).href;
  const BOOK_NAME = /^VideoBookPage_(Left|Right)$/i;
  const MIRROR_NAME = /^VideoScreen_(Left|Right)$/i;
  const CLICK_SLOP_MOUSE_PX = 8;
  const CLICK_SLOP_TOUCH_PX = 18;
  const HIT_TOLERANCE_PX = 10;

  const media = {};
  let boundRoot = null;
  let bookMeshes = new Set();
  let mirrorMeshes = new Set();
  let interactiveMeshes = new Set();
  let observer = null;
  let pointerDown = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  document.body.dataset.bureauVideoOwner = `castle-bureau-video-bridge-${VERSION}`;
  document.body.dataset.bureauVideoContract = 'VideoBookPage_Left|VideoBookPage_Right=>bureau_screen_loop.mp4;VideoScreen_Left|VideoScreen_Right=>0830(1).mp4';

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  const isLaboratoryActive = () => mode() === 'laboratory' || mode() === 'bureau';
  const findLabRoot = () => {
    const runtime = window.__castleSearchRuntime;
    return runtime?.bureauRoot || runtime?.laboratoryRoot || runtime?.scene?.getObjectByName('BureauOfAI') || runtime?.scene || null;
  };
  const activeCanvas = () => window.__castleSearchRuntime?.renderer?.domElement || document.querySelector('canvas');

  function makeMedia(key, url) {
    if (media[key]) return media[key];
    const video = document.createElement('video');
    video.id = `laboratory-${key}-video`;
    Object.assign(video,{loop:true,muted:true,defaultMuted:true,playsInline:true,autoplay:true,preload:'auto',controls:false,volume:0});
    for (const attr of ['playsinline','webkit-playsinline','muted','autoplay']) video.setAttribute(attr,'');
    video.setAttribute('aria-hidden','true');
    video.src = url;
    document.body.appendChild(video);
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
    const material = new THREE.MeshBasicMaterial({name:`laboratory-${key}-video-material-${VERSION}`,map:texture,color:0xffffff,side:THREE.DoubleSide,toneMapped:false,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const state = media[key] = {video,texture,material,url,playPromise:null,frame:0};
    video.addEventListener('loadeddata',()=>{texture.needsUpdate=true;if(isLaboratoryActive()) attemptPlay(key,'laboratory-autoplay');});
    video.addEventListener('error',()=>{document.body.dataset[`${key}VideoError`]=String(video?.error?.message||video?.error?.code||'video-error');});
    const pump=()=>{state.frame=requestAnimationFrame(pump);if(isLaboratoryActive()&&!video.paused&&video.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA)texture.needsUpdate=true;};
    state.frame=requestAnimationFrame(pump);
    video.load();
    return state;
  }

  function bindTargets(root) {
    if (!root) return false;
    const bookMedia=makeMedia('book',BOOK_VIDEO_URL);
    const mirrorMedia=makeMedia('mirror',MIRROR_VIDEO_URL);
    if(boundRoot!==root){boundRoot=root;bookMeshes=new Set();mirrorMeshes=new Set();interactiveMeshes=new Set();}
    const books=[],mirrors=[];
    root.traverse(object=>{if(!object?.isMesh)return;const name=object.name||'';if(BOOK_NAME.test(name))books.push(object);else if(MIRROR_NAME.test(name))mirrors.push(object);});
    for(const object of books){object.material=bookMedia.material;object.visible=true;object.renderOrder=Math.max(object.renderOrder||0,20);object.userData.laboratoryVideoTarget='book';interactiveMeshes.add(object);bookMeshes.add(object);}
    for(const object of mirrors){object.material=mirrorMedia.material;object.visible=true;object.renderOrder=Math.max(object.renderOrder||0,20);object.userData.laboratoryVideoTarget='mirror';interactiveMeshes.add(object);mirrorMeshes.add(object);}
    document.body.dataset.bureauVideoBookAsset=BOOK_VIDEO_URL;
    document.body.dataset.bureauVideoMirrorAsset=MIRROR_VIDEO_URL;
    document.body.dataset.bureauVideoBoundBooks=books.map(o=>o.name).join('|');
    document.body.dataset.bureauVideoBoundMirrors=mirrors.map(o=>o.name).join('|');
    document.body.dataset.bureauVideoState=books.length===2&&mirrors.length===2?`book-and-mirror-ready-${VERSION}`:`target-mismatch-${VERSION}`;
    return books.length===2&&mirrors.length===2;
  }

  function attemptPlay(key,reason='laboratory-autoplay'){
    const state=makeMedia(key,key==='mirror'?MIRROR_VIDEO_URL:BOOK_VIDEO_URL),video=state.video;
    video.muted=true;video.defaultMuted=true;video.playsInline=true;video.volume=0;
    if(!video.paused&&!video.ended)return Promise.resolve(true);if(state.playPromise)return state.playPromise;
    state.playPromise=Promise.resolve(video.play()).then(()=>{state.texture.needsUpdate=true;document.body.dataset[`${key}VideoPlayback`]=`playing-loop-${VERSION}`;return true;}).catch(error=>{document.body.dataset[`${key}VideoPlayback`]=`${reason}-blocked-${VERSION}`;document.body.dataset[`${key}VideoError`]=String(error?.message||error);return false;}).finally(()=>{state.playPromise=null;});return state.playPromise;
  }
  function playAll(reason='laboratory-autoplay'){return Promise.all([attemptPlay('book',reason),attemptPlay('mirror',reason)]);}
  function hydrate(){const root=findLabRoot();if(root)bindTargets(root);if(isLaboratoryActive())playAll();else Object.values(media).forEach(s=>{if(!s.video.paused)s.video.pause();});}
  function hitTarget(clientX,clientY){if(!isLaboratoryActive()||!interactiveMeshes.size)return false;const runtime=window.__castleSearchRuntime,canvas=activeCanvas();if(!runtime?.camera||!canvas)return false;const rect=canvas.getBoundingClientRect();for(const[dx,dy]of[[0,0],[HIT_TOLERANCE_PX,0],[-HIT_TOLERANCE_PX,0],[0,HIT_TOLERANCE_PX],[0,-HIT_TOLERANCE_PX]]){const x=clientX+dx,y=clientY+dy;if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)continue;pointer.x=((x-rect.left)/rect.width)*2-1;pointer.y=-((y-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,runtime.camera);if(raycaster.intersectObjects([...interactiveMeshes],false).length)return true;}return false;}
  window.addEventListener('pointerdown',event=>{if(!isLaboratoryActive()||event.button>0){pointerDown=null;return;}pointerDown={pointerId:event.pointerId,pointerType:event.pointerType,x:event.clientX,y:event.clientY};},{passive:true,capture:true});
  window.addEventListener('pointerup',event=>{const down=pointerDown;pointerDown=null;if(!down||down.pointerId!==event.pointerId||!isLaboratoryActive())return;const slop=down.pointerType==='touch'?CLICK_SLOP_TOUCH_PX:CLICK_SLOP_MOUSE_PX;if(Math.hypot(event.clientX-down.x,event.clientY-down.y)>slop)return;hydrate();if(hitTarget(event.clientX,event.clientY)||hitTarget(down.x,down.y))playAll('surface-click');},{passive:true,capture:true});
  window.__castleBureauVideoPrime=()=>isLaboratoryActive()?playAll('gesture-prime'):Promise.resolve(true);
  window.__castleBureauVideoPlay=hydrate;
  window.__castleBureauVideoDiagnostics=()=>({version:VERSION,mode:mode(),bookSrc:media.book?.video?.currentSrc||BOOK_VIDEO_URL,mirrorSrc:media.mirror?.video?.currentSrc||MIRROR_VIDEO_URL,expectedBooks:['VideoBookPage_Left','VideoBookPage_Right'],expectedMirrors:['VideoScreen_Left','VideoScreen_Right'],boundBooks:[...bookMeshes].map(o=>o.name),boundMirrors:[...mirrorMeshes].map(o=>o.name)});
  window.addEventListener('castleRuntimeReady',hydrate);
  observer=new MutationObserver(()=>{hydrate();if(isLaboratoryActive()){requestAnimationFrame(hydrate);setTimeout(hydrate,120);setTimeout(hydrate,420);setTimeout(hydrate,900);}});
  observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready','data-bureau-ready']});
  const timer=setInterval(hydrate,250);
  window.addEventListener('beforeunload',()=>{clearInterval(timer);observer?.disconnect();Object.values(media).forEach(s=>{if(s.frame)cancelAnimationFrame(s.frame);s.video.pause();s.material.dispose();s.texture.dispose();s.video.remove();});},{once:true});
  hydrate();
}
