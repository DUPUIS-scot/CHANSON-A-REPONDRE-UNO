import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VERSION = 'v81';
  const VIDEO_URL = new URL('../assets/assets/videos/bureau_screen_loop.mp4', document.baseURI).href;
  const BOOK_NAME = /^VideoBookPage_(Left|Right)$/i;
  const LEGACY_MIRROR_NAME = /^VideoScreen_(Left|Right)$/i;
  const MIRROR_HINT = /(mirror|scry|portal)/i;
  const SURFACE_HINT = /(video|screen|surface|glass|display)/i;
  const CLICK_SLOP_MOUSE_PX = 8;
  const CLICK_SLOP_TOUCH_PX = 18;
  const HIT_TOLERANCE_PX = 10;

  let video = null;
  let texture = null;
  let material = null;
  let boundRoot = null;
  let bookMeshes = new Set();
  let mirrorMeshes = new Set();
  let interactiveMeshes = new Set();
  let observer = null;
  let playPromise = null;
  let textureFrame = 0;
  let pointerDown = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  document.body.dataset.bureauVideoOwner = `castle-bureau-video-bridge-${VERSION}`;
  document.body.dataset.bureauVideoContract = 'VideoBookPage_Left|VideoBookPage_Right|mirror-surface';

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  const isLaboratoryActive = () => mode() === 'laboratory' || mode() === 'bureau';

  function findLabRoot() {
    const runtime = window.__castleSearchRuntime;
    return runtime?.bureauRoot || runtime?.laboratoryRoot || runtime?.scene?.getObjectByName('BureauOfAI') || runtime?.scene || null;
  }

  function activeCanvas() {
    const runtime = window.__castleSearchRuntime;
    return runtime?.renderer?.domElement || document.querySelector('canvas');
  }

  function ensureVideoTexture() {
    if (texture) return texture;
    video = document.createElement('video');
    video.id = 'laboratory-enochian-video';
    Object.assign(video, {loop:true, muted:true, defaultMuted:true, playsInline:true, autoplay:true, preload:'auto', controls:false, volume:0});
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.setAttribute('muted','');
    video.setAttribute('autoplay','');
    video.setAttribute('aria-hidden','true');
    video.src = VIDEO_URL;
    document.body.appendChild(video);
    video.addEventListener('loadeddata', () => {
      if (texture) texture.needsUpdate = true;
      document.body.dataset.bureauVideoMedia = `loadeddata-${VERSION}`;
      if (isLaboratoryActive()) attemptPlay('laboratory-autoplay');
    });
    video.addEventListener('playing', () => {
      if (texture) texture.needsUpdate = true;
      document.body.dataset.bureauVideoPlayback = `playing-loop-${VERSION}`;
    });
    video.addEventListener('error', () => {
      document.body.dataset.bureauVideoPlayback = `media-error-${VERSION}`;
      document.body.dataset.bureauVideoError = String(video?.error?.message || video?.error?.code || 'video-error');
    });
    video.load();

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;

    material = new THREE.MeshBasicMaterial({
      name:`laboratory-enochian-video-material-${VERSION}`,
      map:texture,
      color:0xffffff,
      side:THREE.DoubleSide,
      toneMapped:false,
      depthWrite:true,
      polygonOffset:true,
      polygonOffsetFactor:-2,
      polygonOffsetUnits:-2,
    });

    const pump = () => {
      textureFrame = requestAnimationFrame(pump);
      if (texture && video && isLaboratoryActive() && !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) texture.needsUpdate = true;
    };
    textureFrame = requestAnimationFrame(pump);
    return texture;
  }

  function looksLikeMirrorSurface(object) {
    const objectName = object?.name || '';
    const materials = Array.isArray(object?.material) ? object.material : [object?.material];
    const materialName = materials.map(m => m?.name || '').join('|');
    const combined = `${objectName}|${materialName}`;
    if (LEGACY_MIRROR_NAME.test(objectName)) return true;
    if (!MIRROR_HINT.test(combined)) return false;
    if (SURFACE_HINT.test(combined)) return true;
    return /mirror/i.test(objectName) && !/(frame|rim|border|stand|base|ornament)/i.test(objectName);
  }

  function bindTargets(root) {
    if (!root) return false;
    ensureVideoTexture();
    if (boundRoot !== root) {
      boundRoot = root;
      bookMeshes = new Set();
      mirrorMeshes = new Set();
      interactiveMeshes = new Set();
    }

    const books = [];
    const mirrors = [];
    root.traverse(object => {
      if (!object?.isMesh) return;
      if (BOOK_NAME.test(object.name || '')) books.push(object);
      else if (looksLikeMirrorSurface(object)) mirrors.push(object);
    });

    for (const object of [...books, ...mirrors]) {
      object.material = material;
      object.visible = true;
      object.renderOrder = Math.max(object.renderOrder || 0, 20);
      object.userData.laboratoryVideoTarget = true;
      interactiveMeshes.add(object);
    }
    books.forEach(o => bookMeshes.add(o));
    mirrors.forEach(o => mirrorMeshes.add(o));

    document.body.dataset.bureauVideoAsset = VIDEO_URL;
    document.body.dataset.bureauVideoBookCount = String(books.length);
    document.body.dataset.bureauVideoMirrorCount = String(mirrors.length);
    document.body.dataset.bureauVideoBoundBooks = books.map(o => o.name || '(unnamed)').join('|');
    document.body.dataset.bureauVideoBoundMirrors = mirrors.map(o => o.name || '(unnamed)').join('|');
    document.body.dataset.bureauVideoState = books.length === 2 && mirrors.length >= 1 ? `book-and-mirror-ready-${VERSION}` : `target-mismatch-${VERSION}`;
    return books.length === 2 && mirrors.length >= 1;
  }

  function attemptPlay(reason='laboratory-autoplay') {
    ensureVideoTexture();
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.volume = 0;
    if (!video.paused && !video.ended) return Promise.resolve(true);
    if (playPromise) return playPromise;
    document.body.dataset.bureauVideoPlayback = `${reason}-attempt-${VERSION}`;
    playPromise = Promise.resolve(video.play()).then(() => {
      texture.needsUpdate = true;
      document.body.dataset.bureauVideoPlayback = `playing-loop-${VERSION}`;
      delete document.body.dataset.bureauVideoError;
      return true;
    }).catch(error => {
      document.body.dataset.bureauVideoPlayback = `${reason}-blocked-${VERSION}`;
      document.body.dataset.bureauVideoError = String(error?.message || error);
      return false;
    }).finally(() => { playPromise = null; });
    return playPromise;
  }

  function hydrate() {
    const root = findLabRoot();
    if (root) bindTargets(root);
    if (isLaboratoryActive()) attemptPlay();
    else if (video && !video.paused) video.pause();
  }

  function hitTarget(clientX, clientY) {
    if (!isLaboratoryActive() || !interactiveMeshes.size) return false;
    const runtime = window.__castleSearchRuntime;
    const canvas = activeCanvas();
    if (!runtime?.camera || !canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const samples = [[0,0],[HIT_TOLERANCE_PX,0],[-HIT_TOLERANCE_PX,0],[0,HIT_TOLERANCE_PX],[0,-HIT_TOLERANCE_PX]];
    for (const [dx,dy] of samples) {
      const x=clientX+dx, y=clientY+dy;
      if (x<rect.left||x>rect.right||y<rect.top||y>rect.bottom) continue;
      pointer.x=((x-rect.left)/rect.width)*2-1;
      pointer.y=-((y-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(pointer,runtime.camera);
      if (raycaster.intersectObjects([...interactiveMeshes],false).length) return true;
    }
    return false;
  }

  window.addEventListener('pointerdown', event => {
    if (!isLaboratoryActive() || event.button > 0) { pointerDown=null; return; }
    pointerDown={pointerId:event.pointerId,pointerType:event.pointerType,x:event.clientX,y:event.clientY};
  }, {passive:true,capture:true});

  window.addEventListener('pointerup', event => {
    const down=pointerDown; pointerDown=null;
    if (!down || down.pointerId!==event.pointerId || !isLaboratoryActive()) return;
    const slop=down.pointerType==='touch'?CLICK_SLOP_TOUCH_PX:CLICK_SLOP_MOUSE_PX;
    if (Math.hypot(event.clientX-down.x,event.clientY-down.y)>slop) return;
    hydrate();
    if (hitTarget(event.clientX,event.clientY) || hitTarget(down.x,down.y)) attemptPlay('surface-click');
  }, {passive:true,capture:true});

  window.__castleBureauVideoPrime = () => isLaboratoryActive() ? attemptPlay('gesture-prime') : Promise.resolve(true);
  window.__castleBureauVideoPlay = hydrate;
  window.__castleBureauVideoDiagnostics = () => ({
    version:VERSION,
    mode:mode(),
    src:video?.currentSrc || video?.src || VIDEO_URL,
    paused:video?.paused,
    readyState:video?.readyState,
    expectedBooks:['VideoBookPage_Left','VideoBookPage_Right'],
    boundBooks:[...bookMeshes].map(o=>o.name||'(unnamed)'),
    boundMirrors:[...mirrorMeshes].map(o=>o.name||'(unnamed)'),
  });

  window.addEventListener('castleRuntimeReady', hydrate);
  observer = new MutationObserver(() => { hydrate(); if (isLaboratoryActive()) { requestAnimationFrame(hydrate); setTimeout(hydrate,120); setTimeout(hydrate,420); setTimeout(hydrate,900); } });
  observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready','data-bureau-ready']});
  const timer=setInterval(hydrate,250);
  window.addEventListener('beforeunload',()=>{clearInterval(timer);observer?.disconnect();if(textureFrame)cancelAnimationFrame(textureFrame);video?.pause();material?.dispose();texture?.dispose();video?.remove();},{once:true});
  hydrate();
}
