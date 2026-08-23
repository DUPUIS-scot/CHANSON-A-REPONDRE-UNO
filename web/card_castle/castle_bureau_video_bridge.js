import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VIDEO_URL = new URL(
    '../assets/assets/videos/bureau_screen_loop.mp4',
    document.baseURI,
  ).href;
  const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i;
  const PRIME_WINDOW_MS = 60000;

  let video = null;
  let texture = null;
  let material = null;
  let boundRoot = null;
  let boundMeshes = new Set();
  let observer = null;
  let playPromise = null;
  let textureFrame = 0;
  let entryPrimed = false;
  let entryPrimedAt = 0;

  document.body.dataset.bureauVideoOwner = 'castle-bureau-video-bridge-v72';

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  const isLaboratoryActive = () => mode() === 'laboratory' || mode() === 'bureau';

  function findBureauRoot() {
    const runtime = window.__castleSearchRuntime;
    return runtime?.scene?.getObjectByName('BureauOfAI') || runtime?.bureauRoot || null;
  }

  function ensureVideoTexture() {
    if (texture) return texture;

    video = document.createElement('video');
    video.id = 'bureau-screen-loop-video';
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
    video.load();

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    material = new THREE.MeshBasicMaterial({
      name: 'bureau-live-video-material-v72',
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
      boundMeshes.add(object);
    }

    document.body.dataset.bureauVideoAsset = VIDEO_URL;
    document.body.dataset.bureauVideoScreenCount = String(targets.length);
    document.body.dataset.bureauVideoBoundNames = targets.map(object => object.name || '(unnamed)').join('|');
    document.body.dataset.bureauVideoState = targets.length === 2
      ? 'exact-screens-ready-v72'
      : 'screen-mismatch-v72';
    return targets.length === 2;
  }

  function attemptPlay(reason) {
    ensureVideoTexture();
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.volume = 0;

    if (!video.paused && !video.ended) {
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v72';
      delete document.body.dataset.bureauVideoError;
      return Promise.resolve(true);
    }
    if (playPromise) return playPromise;

    document.body.dataset.bureauVideoPlayback = `${reason}-attempt-v72`;
    playPromise = Promise.resolve(video.play())
      .then(() => {
        document.body.dataset.bureauVideoPlayback = 'playing-loop-v72';
        delete document.body.dataset.bureauVideoError;
        return true;
      })
      .catch(error => {
        document.body.dataset.bureauVideoPlayback = 'waiting-user-gesture-v72';
        document.body.dataset.bureauVideoError = String(error?.message || error);
        return false;
      })
      .finally(() => { playPromise = null; });
    return playPromise;
  }

  function primeFromGesture(reason = 'interior-gesture-prime') {
    if (mode() !== 'interior') return Promise.resolve(false);
    entryPrimed = true;
    entryPrimedAt = performance.now();
    document.body.dataset.bureauVideoGesturePrime = 'armed-v72';
    if (video?.ended) {
      try { video.currentTime = 0; } catch (_) {}
    }
    return attemptPlay(reason);
  }

  function keepPrimedDuringEntry() {
    return entryPrimed
      && mode() === 'interior'
      && performance.now() - entryPrimedAt < PRIME_WINDOW_MS;
  }

  function syncPlayback() {
    if (isLaboratoryActive()) {
      entryPrimed = false;
      const root = findBureauRoot();
      if (root) bindScreens(root);
      attemptPlay('laboratory-entry');
      return;
    }

    if (keepPrimedDuringEntry()) {
      document.body.dataset.bureauVideoPlayback = video?.paused
        ? 'gesture-primed-pending-v72'
        : 'gesture-primed-playing-v72';
      return;
    }

    entryPrimed = false;
    if (video && !video.paused) video.pause();
    document.body.dataset.bureauVideoPlayback = 'paused-v72';
  }

  function hydrate() {
    const root = findBureauRoot();
    if (root) bindScreens(root);
    syncPlayback();
  }

  function gestureResume() {
    if (isLaboratoryActive()) attemptPlay('gesture-resume');
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
    entryPrimed,
    boundNames: [...boundMeshes].map(object => object.name || '(unnamed)'),
  });

  window.addEventListener('castleRuntimeReady', hydrate);
  window.addEventListener('pointerdown', gestureResume, {passive: true});
  window.addEventListener('touchstart', gestureResume, {passive: true});
  window.addEventListener('click', gestureResume, {passive: true});

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
