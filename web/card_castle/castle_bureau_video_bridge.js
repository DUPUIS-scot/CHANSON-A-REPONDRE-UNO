import * as THREE from 'three';

if (!window.__castleBureauVideoBridgeInstalled) {
  window.__castleBureauVideoBridgeInstalled = true;

  const VIDEO_URL = new URL(
    '../assets/assets/videos/bureau_screen_loop.mp4',
    document.baseURI,
  ).href;
  const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i;

  let video = null;
  let texture = null;
  let boundRoot = null;
  let observer = null;

  function findBureauRoot() {
    const runtime = window.__castleSearchRuntime;
    if (!runtime?.scene) return null;
    return runtime.scene.getObjectByName('BureauOfAI') || runtime.bureauRoot || null;
  }

  function ensureVideoTexture() {
    if (texture) return texture;
    video = document.createElement('video');
    video.src = VIDEO_URL;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');

    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  function bindScreens(root) {
    if (!root || root === boundRoot) return false;
    const map = ensureVideoTexture();
    let count = 0;
    root.traverse(object => {
      if (!object?.isMesh || !SCREEN_NAME.test(object.name || '')) return;
      object.material = new THREE.MeshBasicMaterial({
        name: `${object.name}-bureau-video-loop`,
        map,
        color: 0xffffff,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      object.material.needsUpdate = true;
      count += 1;
    });
    document.body.dataset.bureauVideoAsset = VIDEO_URL;
    document.body.dataset.bureauVideoScreenCount = String(count);
    document.body.dataset.bureauVideoState = count === 2 ? 'ready' : 'screen-mismatch';
    if (count === 2) boundRoot = root;
    return count === 2;
  }

  function syncPlayback() {
    if (!video) return;
    const active = document.body.dataset.sceneMode === 'laboratory' || document.body.dataset.sceneMode === 'bureau';
    if (active) {
      video.play().then(() => {
        document.body.dataset.bureauVideoPlayback = 'playing-loop';
      }).catch(error => {
        document.body.dataset.bureauVideoPlayback = 'autoplay-blocked';
        document.body.dataset.bureauVideoError = String(error?.message || error);
      });
    } else {
      video.pause();
      document.body.dataset.bureauVideoPlayback = 'paused';
    }
  }

  function hydrate() {
    const root = findBureauRoot();
    if (root) bindScreens(root);
    syncPlayback();
  }

  window.addEventListener('castleRuntimeReady', hydrate);
  observer = new MutationObserver(hydrate);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-scene-mode', 'data-laboratory-ready', 'data-bureau-ready'],
  });

  let attempts = 0;
  const timer = setInterval(() => {
    hydrate();
    if (boundRoot || attempts++ > 300) clearInterval(timer);
  }, 200);

  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    observer?.disconnect();
    video?.pause();
    texture?.dispose();
  }, { once: true });

  hydrate();
}
