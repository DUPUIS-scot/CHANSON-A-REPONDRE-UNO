import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VIDEO_URL = new URL(
    '../assets/assets/videos/bureau_screen_loop.mp4',
    document.baseURI,
  ).href;
  const MAX_VIDEO_SURFACES = 3;
  const PRIME_WINDOW_MS = 30000;

  let video = null;
  let texture = null;
  let material = null;
  let boundRoot = null;
  let boundMeshes = new Set();
  let observer = null;
  let entryPrimed = false;
  let entryPrimedAt = 0;

  document.body.dataset.bureauVideoOwner = 'castle-bureau-video-bridge-v61';
  document.body.dataset.bureauVideoLegacyOwner = 'disabled-v61';

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
    const scored = [];
    root.updateMatrixWorld(true);
    root.traverse(object => {
      const score = scoreVideoMesh(object);
      if (score > 0) scored.push({ object, score });
    });
    scored.sort((a, b) => b.score - a.score);

    const targets = [];
    for (const item of scored) {
      if (targets.length >= MAX_VIDEO_SURFACES) break;
      if (!targets.includes(item.object)) targets.push(item.object);
    }

    if (targets.length < MAX_VIDEO_SURFACES) {
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
        geometric.push({ object, score: central + vertical });
      });
      geometric.sort((a, b) => a.score - b.score);
      for (const item of geometric) {
        if (targets.length >= MAX_VIDEO_SURFACES) break;
        if (!targets.includes(item.object)) targets.push(item.object);
      }
    }

    return targets;
  }

  function ensureVideoTexture() {
    if (texture) return texture;

    video = document.createElement('video');
    video.id = 'bureau-screen-loop-video';
    Object.assign(video, {
      src: VIDEO_URL,
      loop: true,
      muted: true,
      defaultMuted: true,
      playsInline: true,
      preload: 'auto',
      crossOrigin: 'anonymous',
      autoplay: false,
    });
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('aria-hidden', 'true');
    Object.assign(video.style, {
      position: 'fixed',
      width: '1px',
      height: '1px',
      left: '-4px',
      top: '-4px',
      opacity: '0',
      pointerEvents: 'none',
    });
    document.body.appendChild(video);
    video.load();

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;

    material = new THREE.MeshBasicMaterial({
      name: 'bureau-live-video-material-v61',
      map: texture,
      color: 0xffffff,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
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
    document.body.dataset.bureauVideoState = targets.length > 0
      ? 'single-owner-ready-v61'
      : 'screen-mismatch-v61';
    document.body.dataset.bureauVideoDiscovery = targets.length >= 3
      ? 'named-plus-fallback-v61'
      : 'named-or-geometric-v61';
    return targets.length > 0;
  }

  function configurePlayback() {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  function attemptPlay(reason) {
    ensureVideoTexture();
    configurePlayback();
    if (!video.paused && !video.ended) {
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v61';
      delete document.body.dataset.bureauVideoError;
      return Promise.resolve(true);
    }
    document.body.dataset.bureauVideoPlayback = `${reason}-attempt-v61`;
    return video.play().then(() => {
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v61';
      delete document.body.dataset.bureauVideoError;
      return true;
    }).catch(error => {
      document.body.dataset.bureauVideoPlayback = 'waiting-user-gesture-v61';
      document.body.dataset.bureauVideoError = String(error?.message || error);
      return false;
    });
  }

  function primeFromGesture() {
    entryPrimed = true;
    entryPrimedAt = performance.now();
    ensureVideoTexture();
    if (video.ended) {
      try { video.currentTime = 0; } catch (_) {}
    }
    document.body.dataset.bureauVideoGesturePrime = 'armed-v61';
    return attemptPlay('gesture-prime');
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
      else document.body.dataset.bureauVideoPlayback = 'playing-loop-v61';
      return;
    }

    if (keepPrimedDuringEntry()) {
      document.body.dataset.bureauVideoPlayback = video?.paused
        ? 'gesture-primed-pending-v61'
        : 'gesture-primed-playing-v61';
      return;
    }

    entryPrimed = false;
    if (video && !video.paused) video.pause();
    document.body.dataset.bureauVideoPlayback = 'paused-v61';
  }

  function hydrate() {
    const root = findBureauRoot();
    if (root) bindScreens(root);
    syncPlayback();
  }

  function isBureauEntryTarget(event) {
    if (mode() !== 'interior') return false;
    const target = event?.target;
    return Boolean(target?.closest?.('#bureau-of-ai, #laboratory-medallion-button'));
  }

  function gestureResume(event) {
    if (isBureauEntryTarget(event)) {
      document.body.dataset.bureauVideoGestureSource = event?.target?.closest?.('#laboratory-medallion-button')
        ? 'laboratory-medallion-v61'
        : 'bureau-control-v61';
      primeFromGesture();
      return;
    }
    if (isLaboratoryActive()) attemptPlay('gesture-resume');
  }

  window.__castleBureauVideoPrime = primeFromGesture;
  window.__castleBureauVideoPlay = hydrate;

  window.addEventListener('castleRuntimeReady', hydrate);
  window.addEventListener('pointerdown', gestureResume, { capture: true, passive: true });
  window.addEventListener('touchstart', gestureResume, { capture: true, passive: true });
  window.addEventListener('click', gestureResume, { capture: true, passive: true });

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
    if ((boundRoot && boundMeshes.size > 0 && video?.readyState >= 2) || attempts++ > 300) {
      clearInterval(timer);
    }
  }, 200);

  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    observer?.disconnect();
    video?.pause();
    material?.dispose();
    texture?.dispose();
    video?.remove();
    delete window.__castleBureauVideoPrime;
    delete window.__castleBureauVideoPlay;
  }, { once: true });

  hydrate();
}
