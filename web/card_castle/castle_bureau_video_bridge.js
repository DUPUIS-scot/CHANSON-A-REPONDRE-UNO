import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VIDEO_URL = new URL(
    '../assets/assets/videos/bureau_screen_loop.mp4',
    document.baseURI,
  ).href;
  const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i;
  const CLICK_SLOP_PX = 6;

  let video = null;
  let texture = null;
  let material = null;
  let boundRoot = null;
  let boundMeshes = new Set();
  let observer = null;
  let playPromise = null;
  let textureFrame = 0;
  let pointerDown = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  document.body.dataset.bureauVideoOwner = 'castle-bureau-video-bridge-v73';

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
    video.id = 'bureau-screen-loop-video';
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.preload = 'auto';
    video.controls = false;
    video.volume = 0;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('aria-hidden', 'true');
    video.src = VIDEO_URL;
    document.body.appendChild(video);
    video.load();

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    material = new THREE.MeshBasicMaterial({
      name: 'bureau-live-video-material-v73',
      map: texture,
      color: 0xffffff,
      side: THREE.DoubleSide,
      toneMapped: false,
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
      object.material = material;
      object.material.needsUpdate = true;
      object.visible = true;
      object.userData.bureauMirrorVideoTarget = true;
      boundMeshes.add(object);
    }

    document.body.dataset.bureauVideoAsset = VIDEO_URL;
    document.body.dataset.bureauVideoScreenCount = String(targets.length);
    document.body.dataset.bureauVideoBoundNames = targets.map(object => object.name || '(unnamed)').join('|');
    document.body.dataset.bureauVideoState = targets.length === 2
      ? 'exact-screens-ready-v73'
      : 'screen-mismatch-v73';
    return targets.length === 2;
  }

  function attemptPlay(reason = 'mirror-click') {
    ensureVideoTexture();
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.volume = 0;

    if (!video.paused && !video.ended) {
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v73';
      delete document.body.dataset.bureauVideoError;
      return Promise.resolve(true);
    }
    if (playPromise) return playPromise;

    document.body.dataset.bureauVideoPlayback = `${reason}-attempt-v73`;
    playPromise = Promise.resolve(video.play())
      .then(() => {
        document.body.dataset.bureauVideoPlayback = 'playing-loop-v73';
        delete document.body.dataset.bureauVideoError;
        return true;
      })
      .catch(error => {
        document.body.dataset.bureauVideoPlayback = 'mirror-click-blocked-v73';
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
    document.body.dataset.bureauVideoPlayback = isLaboratoryActive()
      ? 'paused-awaiting-mirror-click-v73'
      : 'preloaded-v73';
    return Promise.resolve(true);
  }

  function syncPlayback() {
    if (isLaboratoryActive()) {
      const root = findBureauRoot();
      if (root) bindScreens(root);
      if (video && !video.paused) video.pause();
      document.body.dataset.bureauVideoPlayback = 'paused-awaiting-mirror-click-v73';
      return;
    }

    if (video && !video.paused) video.pause();
    document.body.dataset.bureauVideoPlayback = 'paused-v73';
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
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;

    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, runtime.camera);
    const hits = raycaster.intersectObjects([...boundMeshes], false);
    return hits.length > 0;
  }

  function onPointerDown(event) {
    if (!isLaboratoryActive() || event.button > 0) {
      pointerDown = null;
      return;
    }
    pointerDown = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function onPointerUp(event) {
    const down = pointerDown;
    pointerDown = null;
    if (!down || down.pointerId !== event.pointerId || !isLaboratoryActive()) return;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > CLICK_SLOP_PX) return;

    const root = findBureauRoot();
    if (root) bindScreens(root);
    if (!mirrorHit(event.clientX, event.clientY)) return;

    document.body.dataset.bureauVideoInteraction = 'mirror-click-v73';
    attemptPlay('mirror-click');
  }

  window.__castleBureauVideoPrime = primeFromGesture;
  window.__castleBureauVideoPlay = hydrate;
  window.__castleBureauVideoDiagnostics = () => ({
    mode: mode(),
    src: video?.currentSrc || video?.src || VIDEO_URL,
    paused: video?.paused,
    readyState: video?.readyState,
    networkState: video?.networkState,
    currentTime: video?.currentTime,
    interaction: document.body.dataset.bureauVideoInteraction || '',
    boundNames: [...boundMeshes].map(object => object.name || '(unnamed)'),
  });

  window.addEventListener('castleRuntimeReady', hydrate);
  window.addEventListener('pointerdown', onPointerDown, {passive: true});
  window.addEventListener('pointerup', onPointerUp, {passive: true});

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
    if ((boundRoot && boundMeshes.size === 2 && video?.readyState >= 2) || attempts++ > 300) clearInterval(timer);
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
