import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VERSION = 'v80';
  const VIDEO_URL = new URL(
    '../assets/videos/0830(1).mp4',
    document.baseURI,
  ).href;
  const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i;
  const CLICK_SLOP_MOUSE_PX = 8;
  const CLICK_SLOP_TOUCH_PX = 18;
  const HIT_TOLERANCE_PX = 10;

  let video = null;
  let texture = null;
  let material = null;
  let boundRoot = null;
  let boundMeshes = new Set();
  let observer = null;
  let playPromise = null;
  let textureFrame = 0;
  let pointerDown = null;
  let playRequested = false;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  document.body.dataset.bureauVideoOwner = `castle-bureau-video-bridge-${VERSION}`;
  document.body.dataset.bureauVideoContract = 'VideoScreen_Left|VideoScreen_Right';

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  const isLaboratoryActive = () => mode() === 'laboratory' || mode() === 'bureau';

  function findBureauRoot() {
    const runtime = window.__castleSearchRuntime;
    return runtime?.scene?.getObjectByName('BureauOfAI') || runtime?.bureauRoot || null;
  }

  function activeCanvas() {
    const runtime = window.__castleSearchRuntime;
    return runtime?.renderer?.domElement || document.querySelector('canvas');
  }

  function ensureVideoTexture() {
    if (texture) return texture;

    video = document.createElement('video');
    video.id = 'bureau-mirror-loop-video';
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.controls = false;
    video.volume = 0;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('aria-hidden', 'true');
    video.src = VIDEO_URL;
    document.body.appendChild(video);

    video.addEventListener('loadeddata', () => {
      if (texture) texture.needsUpdate = true;
      document.body.dataset.bureauVideoMedia = 'loadeddata-v80';
      if (isLaboratoryActive()) attemptPlay('laboratory-autoplay');
    });
    video.addEventListener('playing', () => {
      if (texture) texture.needsUpdate = true;
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v80';
    });
    video.addEventListener('error', () => {
      document.body.dataset.bureauVideoPlayback = 'media-error-v80';
      document.body.dataset.bureauVideoError =
        String(video?.error?.message || video?.error?.code || 'video-error');
    });

    video.load();
    if (isLaboratoryActive()) attemptPlay('laboratory-autoplay');

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    material = new THREE.MeshBasicMaterial({
      name: 'bureau-live-mirror-video-material-v80',
      map: texture,
      color: 0xffffff,
      side: THREE.DoubleSide,
      toneMapped: false,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const pump = () => {
      textureFrame = requestAnimationFrame(pump);
      if (!texture || !video || !isLaboratoryActive()) return;
      if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        texture.needsUpdate = true;
      }
    };
    textureFrame = requestAnimationFrame(pump);

    return texture;
  }

  function bindScreens(root) {
    if (!root) return false;
    ensureVideoTexture();

    if (boundRoot !== root) {
      boundRoot = root;
      boundMeshes = new Set();
    }

    const targets = [];
    root.traverse(object => {
      if (object?.isMesh && SCREEN_NAME.test(object.name || '')) targets.push(object);
    });

    for (const object of targets) {
      if (object.material !== material) object.material = material;
      object.visible = true;
      object.renderOrder = Math.max(object.renderOrder || 0, 10);
      object.userData.bureauMirrorVideoTarget = true;
      boundMeshes.add(object);
    }

    document.body.dataset.bureauVideoAsset = VIDEO_URL;
    document.body.dataset.bureauVideoScreenCount = String(targets.length);
    document.body.dataset.bureauVideoBoundNames =
      targets.map(object => object.name || '(unnamed)').join('|');
    document.body.dataset.bureauVideoState = targets.length === 2
      ? 'exact-mirrors-ready-v80'
      : 'mirror-mismatch-v80';
    return targets.length === 2;
  }

  function attemptPlay(reason = 'mirror-click') {
    ensureVideoTexture();
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.volume = 0;

    if (!video.paused && !video.ended) {
      texture.needsUpdate = true;
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v80';
      delete document.body.dataset.bureauVideoError;
      return Promise.resolve(true);
    }
    if (playPromise) return playPromise;

    playRequested = true;
    document.body.dataset.bureauVideoPlayback = `${reason}-attempt-v80`;
    playPromise = Promise.resolve(video.play())
      .then(() => {
        texture.needsUpdate = true;
        document.body.dataset.bureauVideoPlayback = 'playing-loop-v80';
        delete document.body.dataset.bureauVideoError;
        return true;
      })
      .catch(error => {
        playRequested = false;
        document.body.dataset.bureauVideoPlayback = `${reason}-blocked-v80`;
        document.body.dataset.bureauVideoError = String(error?.message || error);
        return false;
      })
      .finally(() => { playPromise = null; });
    return playPromise;
  }

  function primeFromGesture() {
    ensureVideoTexture();
    if (video?.ended) {
      try { video.currentTime = 0; } catch (_) {}
    }
    if (isLaboratoryActive()) return attemptPlay('gesture-prime');
    document.body.dataset.bureauVideoPlayback = 'preloaded-v80';
    return Promise.resolve(true);
  }

  function syncPlayback() {
    if (isLaboratoryActive()) {
      const root = findBureauRoot();
      if (root) bindScreens(root);
      attemptPlay('laboratory-autoplay');
      return;
    }

    playRequested = false;
    if (video && !video.paused) video.pause();
    document.body.dataset.bureauVideoPlayback = 'paused-v80';
  }

  function hydrate() {
    const root = findBureauRoot();
    if (root) bindScreens(root);
    syncPlayback();
  }

  function mirrorHit(clientX, clientY) {
    if (!isLaboratoryActive()) return false;
    const runtime = window.__castleSearchRuntime;
    const canvas = activeCanvas();
    if (!runtime?.camera || !canvas || !boundMeshes.size) return false;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const samples = [
      [0, 0],
      [HIT_TOLERANCE_PX, 0],
      [-HIT_TOLERANCE_PX, 0],
      [0, HIT_TOLERANCE_PX],
      [0, -HIT_TOLERANCE_PX],
      [HIT_TOLERANCE_PX * 0.7, HIT_TOLERANCE_PX * 0.7],
      [-HIT_TOLERANCE_PX * 0.7, HIT_TOLERANCE_PX * 0.7],
      [HIT_TOLERANCE_PX * 0.7, -HIT_TOLERANCE_PX * 0.7],
      [-HIT_TOLERANCE_PX * 0.7, -HIT_TOLERANCE_PX * 0.7],
    ];

    for (const [offsetX, offsetY] of samples) {
      const x = clientX + offsetX;
      const y = clientY + offsetY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
      pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, runtime.camera);
      if (raycaster.intersectObjects([...boundMeshes], false).length > 0) return true;
    }
    return false;
  }

  function onPointerDown(event) {
    if (!isLaboratoryActive() || event.button > 0) {
      pointerDown = null;
      return;
    }
    pointerDown = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function onPointerUp(event) {
    const down = pointerDown;
    pointerDown = null;
    if (!down || down.pointerId !== event.pointerId || !isLaboratoryActive()) return;
    const clickSlop = down.pointerType === 'touch' ? CLICK_SLOP_TOUCH_PX : CLICK_SLOP_MOUSE_PX;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > clickSlop) return;

    const root = findBureauRoot();
    if (root) bindScreens(root);
    if (!mirrorHit(event.clientX, event.clientY) && !mirrorHit(down.x, down.y)) return;

    document.body.dataset.bureauVideoInteraction = 'mirror-click-v80';
    attemptPlay('mirror-click');
  }

  window.__castleBureauVideoPrime = primeFromGesture;
  window.__castleBureauVideoPlay = hydrate;
  window.__castleBureauVideoDiagnostics = () => ({
    version: VERSION,
    mode: mode(),
    src: video?.currentSrc || video?.src || VIDEO_URL,
    paused: video?.paused,
    readyState: video?.readyState,
    networkState: video?.networkState,
    currentTime: video?.currentTime,
    interaction: document.body.dataset.bureauVideoInteraction || '',
    playRequested,
    expectedNames: ['VideoScreen_Left', 'VideoScreen_Right'],
    boundNames: [...boundMeshes].map(object => object.name || '(unnamed)'),
  });

  window.addEventListener('castleRuntimeReady', hydrate);
  window.addEventListener('pointerdown', onPointerDown, {passive: true, capture: true});
  window.addEventListener('pointerup', onPointerUp, {passive: true, capture: true});

  observer = new MutationObserver(() => {
    hydrate();
    if (isLaboratoryActive()) {
      requestAnimationFrame(hydrate);
      setTimeout(hydrate, 120);
      setTimeout(hydrate, 420);
      setTimeout(hydrate, 900);
    }
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-scene-mode', 'data-laboratory-ready', 'data-bureau-ready'],
  });

  let attempts = 0;
  const timer = setInterval(() => {
    hydrate();
    if ((boundRoot && boundMeshes.size === 2 && video?.readyState >= 2) || attempts++ > 300) {
      clearInterval(timer);
    }
  }, 200);

  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    observer?.disconnect();
    if (textureFrame) cancelAnimationFrame(textureFrame);
    video?.pause();
    material?.dispose();
    texture?.dispose();
    video?.remove();
    delete window.__castleBureauVideoPrime;
    delete window.__castleBureauVideoPlay;
    delete window.__castleBureauVideoDiagnostics;
  }, {once: true});

  hydrate();
}
