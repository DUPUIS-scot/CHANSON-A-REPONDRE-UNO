import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VIDEO_URL = new URL(
    '../assets/assets/videos/bureau_screen_loop.mp4',
    document.baseURI,
  ).href;
  const EXACT_SCREEN_NAME = /^VideoScreen_(Left|Right)$/i;
  const MAX_VIDEO_SURFACES = 3;
  const PRIME_WINDOW_MS = 60000;

  let video = null;
  let texture = null;
  let material = null;
  let boundRoot = null;
  let boundMeshes = new Set();
  let observer = null;
  let entryPrimed = false;
  let entryPrimedAt = 0;
  let playPromise = null;
  let textureFrame = 0;

  document.body.dataset.bureauVideoOwner = 'castle-bureau-video-bridge-v62';
  document.body.dataset.bureauVideoLegacyOwner = 'disabled-v62';

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  const isLaboratoryActive = () => mode() === 'laboratory' || mode() === 'bureau';

  function findBureauRoot() {
    const runtime = window.__castleSearchRuntime;
    return runtime?.scene?.getObjectByName('BureauOfAI') || runtime?.bureauRoot || null;
  }

  function scoreVideoMesh(object) {
    if (!object?.isMesh) return 0;
    const materials = (Array.isArray(object.material) ? object.material : [object.material])
      .map(item => item?.name || '')
      .join(' ');
    const label = `${object.name || ''} ${materials}`.toLowerCase();
    if (/videoscreen|video[_ -]?screen|videomesh|video mesh/.test(label)) return 140;
    if (/video/.test(label)) return 130;
    if (/screen/.test(label)) return 120;
    if (/display|monitor/.test(label)) return 110;
    if (/scry|mirror|portal|oval|central/.test(label)) return 100;
    if (/circle|circular/.test(label)) return 90;
    return 0;
  }

  function discoverVideoMeshes(root) {
    const exact = [];
    const scored = [];
    root.updateMatrixWorld(true);

    root.traverse(object => {
      if (!object?.isMesh) return;
      if (EXACT_SCREEN_NAME.test(object.name || '')) {
        exact.push(object);
        return;
      }
      const score = scoreVideoMesh(object);
      if (score > 0) scored.push({object, score});
    });

    exact.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    scored.sort((a, b) => b.score - a.score);

    const targets = [];
    for (const object of exact) {
      if (targets.length >= 2) break;
      if (!targets.includes(object)) targets.push(object);
    }
    for (const item of scored) {
      if (targets.length >= MAX_VIDEO_SURFACES) break;
      if (!targets.includes(item.object)) targets.push(item.object);
    }

    if (targets.length < 2) {
      const rootBox = new THREE.Box3().setFromObject(root);
      const rootCenter = rootBox.getCenter(new THREE.Vector3());
      const geometric = [];
      root.traverse(object => {
        if (!object?.isMesh || targets.includes(object)) return;
        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) return;
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const dims = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)].sort((a, b) => a - b);
        const thin = dims[0];
        const mid = dims[1];
        const long = dims[2];
        if (thin >= 0.45 || mid <= 0.35 || long >= 8) return;
        const central = Math.hypot(center.x - rootCenter.x, center.z - rootCenter.z);
        const vertical = Math.abs(center.y - rootCenter.y) * 0.35;
        geometric.push({object, score: central + vertical});
      });
      geometric.sort((a, b) => a.score - b.score);
      for (const item of geometric) {
        if (targets.length >= 2) break;
        if (!targets.includes(item.object)) targets.push(item.object);
      }
    }

    document.body.dataset.bureauVideoExactScreenCount = String(exact.length);
    document.body.dataset.bureauVideoBoundNames = targets
      .map(object => object.name || '(unnamed)')
      .join('|');
    return targets;
  }

  function installVideoDiagnostics() {
    if (!video || video.dataset.bureauDiagnosticsInstalled === 'true') return;
    video.dataset.bureauDiagnosticsInstalled = 'true';

    const state = name => {
      document.body.dataset.bureauVideoMediaState = `${name}-v62`;
      document.body.dataset.bureauVideoReadyState = String(video.readyState);
      document.body.dataset.bureauVideoNetworkState = String(video.networkState);
    };

    video.addEventListener('loadedmetadata', () => state('loadedmetadata'));
    video.addEventListener('loadeddata', () => state('loadeddata'));
    video.addEventListener('canplay', () => state('canplay'));
    video.addEventListener('playing', () => state('playing'));
    video.addEventListener('waiting', () => state('waiting'));
    video.addEventListener('stalled', () => state('stalled'));
    video.addEventListener('error', () => {
      state('error');
      const mediaError = video.error;
      document.body.dataset.bureauVideoMediaError = mediaError
        ? `${mediaError.code}:${mediaError.message || 'media-error'}`
        : 'unknown-media-error';
    });
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
    if ('disablePictureInPicture' in video) video.disablePictureInPicture = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('aria-hidden', 'true');
    Object.assign(video.style, {
      position: 'fixed',
      width: '2px',
      height: '2px',
      left: '0',
      top: '0',
      opacity: '0.01',
      pointerEvents: 'none',
      zIndex: '-1',
    });

    video.src = VIDEO_URL;
    document.body.appendChild(video);
    installVideoDiagnostics();
    video.load();

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;

    material = new THREE.MeshBasicMaterial({
      name: 'bureau-live-video-material-v62',
      map: texture,
      color: 0xffffff,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    if (!textureFrame) {
      const pump = () => {
        textureFrame = requestAnimationFrame(pump);
        if (!texture || !video || !isLaboratoryActive()) return;
        if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          texture.needsUpdate = true;
          document.body.dataset.bureauVideoTextureFrames = 'pumping-v62';
        }
      };
      textureFrame = requestAnimationFrame(pump);
    }

    return texture;
  }

  function bindScreens(root) {
    if (!root) return false;
    ensureVideoTexture();

    if (boundRoot !== root) {
      boundRoot = root;
      boundMeshes = new Set();
    }

    const targets = discoverVideoMeshes(root);
    for (const object of targets) {
      if (!object.userData.__laboratoryVideoFacingFixed) {
        object.rotation.y += Math.PI;
        object.userData.__laboratoryVideoFacingFixed = true;
      }
      object.material = material;
      object.material.needsUpdate = true;
      object.visible = true;
      boundMeshes.add(object);
    }

    document.body.dataset.bureauVideoAsset = VIDEO_URL;
    document.body.dataset.bureauVideoScreenCount = String(targets.length);
    document.body.dataset.bureauVideoState = targets.length >= 2
      ? 'exact-or-fallback-ready-v62'
      : 'screen-mismatch-v62';
    document.body.dataset.bureauVideoDiscovery = document.body.dataset.bureauVideoExactScreenCount === '2'
      ? 'exact-video-screens-first-v62'
      : 'named-or-geometric-fallback-v62';
    return targets.length >= 2;
  }

  function configurePlayback() {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.volume = 0;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
  }

  function attemptPlay(reason) {
    ensureVideoTexture();
    configurePlayback();

    if (!video.paused && !video.ended) {
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v62';
      delete document.body.dataset.bureauVideoError;
      return Promise.resolve(true);
    }
    if (playPromise) return playPromise;

    document.body.dataset.bureauVideoPlayback = `${reason}-attempt-v62`;
    playPromise = Promise.resolve(video.play())
      .then(() => {
        document.body.dataset.bureauVideoPlayback = 'playing-loop-v62';
        delete document.body.dataset.bureauVideoError;
        return true;
      })
      .catch(error => {
        document.body.dataset.bureauVideoPlayback = 'waiting-user-gesture-v62';
        document.body.dataset.bureauVideoError = String(error?.message || error);
        return false;
      })
      .finally(() => {
        playPromise = null;
      });
    return playPromise;
  }

  function primeFromGesture(reason = 'gesture-prime') {
    entryPrimed = true;
    entryPrimedAt = performance.now();
    ensureVideoTexture();
    if (video.ended) {
      try { video.currentTime = 0; } catch (_) {}
    }
    document.body.dataset.bureauVideoGesturePrime = 'armed-v62';
    return attemptPlay(reason);
  }

  function keepPrimedDuringEntry() {
    return entryPrimed && mode() === 'interior' && performance.now() - entryPrimedAt < PRIME_WINDOW_MS;
  }

  function syncPlayback() {
    const active = isLaboratoryActive();
    if (active) {
      entryPrimed = false;
      const root = findBureauRoot();
      if (root) bindScreens(root);
      if (!video) ensureVideoTexture();
      if (video.paused) attemptPlay('laboratory-entry');
      else document.body.dataset.bureauVideoPlayback = 'playing-loop-v62';
      return;
    }

    if (keepPrimedDuringEntry()) {
      document.body.dataset.bureauVideoPlayback = video?.paused
        ? 'gesture-primed-pending-v62'
        : 'gesture-primed-playing-v62';
      return;
    }

    entryPrimed = false;
    if (video && !video.paused) video.pause();
    document.body.dataset.bureauVideoPlayback = 'paused-v62';
  }

  function hydrate() {
    const root = findBureauRoot();
    if (root) bindScreens(root);
    syncPlayback();
  }

  function gestureResume(event) {
    if (mode() === 'interior' && event?.isTrusted !== false) {
      const target = event?.target;
      const source = target?.closest?.('#laboratory-medallion-button')
        ? 'laboratory-medallion-v62'
        : target?.closest?.('#bureau-of-ai')
          ? 'bureau-control-v62'
          : 'interior-trusted-gesture-v62';
      document.body.dataset.bureauVideoGestureSource = source;
      primeFromGesture('interior-gesture-prime');
      return;
    }
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
    boundNames: [...boundMeshes].map(object => object.name || '(unnamed)'),
  });

  window.addEventListener('castleRuntimeReady', hydrate);
  window.addEventListener('pointerdown', gestureResume, {capture: true, passive: true});
  window.addEventListener('touchstart', gestureResume, {capture: true, passive: true});
  window.addEventListener('click', gestureResume, {capture: true, passive: true});

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
    if ((boundRoot && boundMeshes.size >= 2 && video?.readyState >= 2) || attempts++ > 450) {
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
