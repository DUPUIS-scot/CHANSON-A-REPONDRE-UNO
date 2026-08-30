import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VERSION = 'v79';
  const VIDEO_PART_URLS = Array.from({length: 6}, (_, index) =>
    new URL(
      `../assets/assets/videos/enochian_jj_dupuis_bookpage.part${String(index + 1).padStart(2, '0')}.b64`,
      document.baseURI,
    ).href
  );
  const SCREEN_NAME = /^VideoBookPage_(Left|Right)$/i;
  const CLICK_SLOP_MOUSE_PX = 8;
  const CLICK_SLOP_TOUCH_PX = 18;
  const HIT_TOLERANCE_PX = 10;

  let video = null;
  let texture = null;
  let material = null;
  let videoObjectUrl = '';
  let videoSourcePromise = null;
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
  document.body.dataset.bureauVideoContract = 'VideoBookPage_Left|VideoBookPage_Right';

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

  function ensureVideoSource() {
    if (videoObjectUrl) return Promise.resolve(videoObjectUrl);
    if (videoSourcePromise) return videoSourcePromise;

    videoSourcePromise = Promise.all(
      VIDEO_PART_URLS.map(async url => {
        const response = await fetch(url, {cache: 'force-cache'});
        if (!response.ok) throw new Error(`video-payload-${response.status}`);
        return response.text();
      })
    ).then(parts => {
      const base64 = parts.join('').replace(/\s+/g, '');
      const raw = atob(base64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
      videoObjectUrl = URL.createObjectURL(new Blob([bytes], {type: 'video/mp4'}));
      document.body.dataset.bureauVideoPayload = 'enochian-jj-dupuis-bookpage-v79';
      return videoObjectUrl;
    }).catch(error => {
      videoSourcePromise = null;
      document.body.dataset.bureauVideoPlayback = 'payload-error-v79';
      document.body.dataset.bureauVideoError = String(error?.message || error);
      throw error;
    });

    return videoSourcePromise;
  }

  function ensureVideoTexture() {
    if (texture) return texture;

    video = document.createElement('video');
    video.id = 'bureau-book-page-loop-video';
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
    document.body.appendChild(video);

    video.addEventListener('loadeddata', () => {
      if (texture) texture.needsUpdate = true;
      document.body.dataset.bureauVideoMedia = 'loadeddata-v79';
      if (isLaboratoryActive()) attemptPlay('laboratory-autoplay');
    });
    video.addEventListener('playing', () => {
      if (texture) texture.needsUpdate = true;
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v79';
    });
    video.addEventListener('error', () => {
      document.body.dataset.bureauVideoPlayback = 'media-error-v79';
      document.body.dataset.bureauVideoError =
        String(video?.error?.message || video?.error?.code || 'video-error');
    });

    ensureVideoSource().then(src => {
      if (!video) return;
      video.src = src;
      video.load();
      if (isLaboratoryActive()) attemptPlay('laboratory-autoplay');
    }).catch(() => {});

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    material = new THREE.MeshBasicMaterial({
      name: 'bureau-live-book-page-video-material-v79',
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
      object.userData.bureauVideoBookPageTarget = true;
      boundMeshes.add(object);
    }

    document.body.dataset.bureauVideoAsset = VIDEO_PART_URLS.join('|');
    document.body.dataset.bureauVideoScreenCount = String(targets.length);
    document.body.dataset.bureauVideoBoundNames =
      targets.map(object => object.name || '(unnamed)').join('|');
    document.body.dataset.bureauVideoState = targets.length === 2
      ? 'exact-book-pages-ready-v79'
      : 'book-page-mismatch-v79';
    return targets.length === 2;
  }

  function attemptPlay(reason = 'book-page-click') {
    ensureVideoTexture();
    if (!video?.src) {
      ensureVideoSource().then(src => {
        if (!video) return;
        if (!video.src) {
          video.src = src;
          video.load();
        }
        if (isLaboratoryActive()) attemptPlay(reason);
      }).catch(() => {});
      return Promise.resolve(false);
    }

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.volume = 0;

    if (!video.paused && !video.ended) {
      texture.needsUpdate = true;
      document.body.dataset.bureauVideoPlayback = 'playing-loop-v79';
      delete document.body.dataset.bureauVideoError;
      return Promise.resolve(true);
    }
    if (playPromise) return playPromise;

    playRequested = true;
    document.body.dataset.bureauVideoPlayback = `${reason}-attempt-v79`;
    playPromise = Promise.resolve(video.play())
      .then(() => {
        texture.needsUpdate = true;
        document.body.dataset.bureauVideoPlayback = 'playing-loop-v79';
        delete document.body.dataset.bureauVideoError;
        return true;
      })
      .catch(error => {
        playRequested = false;
        document.body.dataset.bureauVideoPlayback = `${reason}-blocked-v79`;
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
    document.body.dataset.bureauVideoPlayback = 'preloaded-v79';
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
    document.body.dataset.bureauVideoPlayback = 'paused-v79';
  }

  function hydrate() {
    const root = findBureauRoot();
    if (root) bindScreens(root);
    syncPlayback();
  }

  function bookPageHit(clientX, clientY) {
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
    if (!bookPageHit(event.clientX, event.clientY) && !bookPageHit(down.x, down.y)) return;

    document.body.dataset.bureauVideoInteraction = 'book-page-click-v79';
    attemptPlay('book-page-click');
  }

  window.__castleBureauVideoPrime = primeFromGesture;
  window.__castleBureauVideoPlay = hydrate;
  window.__castleBureauVideoDiagnostics = () => ({
    version: VERSION,
    mode: mode(),
    src: video?.currentSrc || video?.src || '',
    paused: video?.paused,
    readyState: video?.readyState,
    networkState: video?.networkState,
    currentTime: video?.currentTime,
    interaction: document.body.dataset.bureauVideoInteraction || '',
    playRequested,
    expectedNames: ['VideoBookPage_Left', 'VideoBookPage_Right'],
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
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    delete window.__castleBureauVideoPrime;
    delete window.__castleBureauVideoPlay;
    delete window.__castleBureauVideoDiagnostics;
  }, {once: true});

  hydrate();
}
