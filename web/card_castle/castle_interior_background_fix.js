import * as THREE from 'three';

// Dedicated background owner for the three castle scenes.
// The interior uses its actual environment artwork instead of a flat clear colour.
if (!window.__castleInteriorBackgroundFixInstalled) {
  window.__castleInteriorBackgroundFixInstalled = true;
  let runtime = null;
  let attempts = 0;
  let exteriorBackground = null;
  let laboratoryBackground = null;
  let interiorTexture = null;
  let interiorLoadFailed = false;
  const fallbackInterior = new THREE.Color(0x07111c);
  const INTERIOR_BG_URL = new URL('../assets/assets/images/castle_interior_environment.jpg', document.baseURI).href;
  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function applyInterior() {
    if (!runtime?.scene || mode() !== 'interior') return;
    runtime.scene.background = interiorTexture || fallbackInterior;
    runtime.renderer?.setClearColor?.(0x07111c, 1);
    if (runtime.renderer) runtime.renderer.toneMappingExposure = 1.25;
    document.body.dataset.interiorBackground = interiorTexture
      ? 'environment-texture-v51'
      : (interiorLoadFailed ? 'fallback-gothic-blue-v51' : 'loading-environment-v51');
  }

  function sync() {
    if (!runtime?.scene) return;
    const current = mode();
    if (current === 'interior') {
      applyInterior();
      return;
    }
    delete document.body.dataset.interiorBackground;
    if (current === 'laboratory') {
      if (runtime.scene.background && runtime.scene.background !== interiorTexture && runtime.scene.background !== fallbackInterior) {
        laboratoryBackground = runtime.scene.background;
      }
      runtime.scene.background = laboratoryBackground || new THREE.Color(0x08131e);
      runtime.renderer?.setClearColor?.(0x08131e, 1);
      return;
    }
    if (exteriorBackground) runtime.scene.background = exteriorBackground;
    runtime.renderer?.setClearColor?.(0x000000, 1);
  }

  function scheduleSync() {
    // Reassert after the older environment scripts finish their own mode sync.
    requestAnimationFrame(sync);
    setTimeout(sync, 0);
    setTimeout(sync, 80);
    setTimeout(sync, 220);
    setTimeout(sync, 500);
  }

  function loadInteriorBackground() {
    new THREE.TextureLoader().load(
      INTERIOR_BG_URL,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        interiorTexture = texture;
        document.body.dataset.interiorBackgroundAsset = 'ready-v51';
        scheduleSync();
      },
      undefined,
      error => {
        interiorLoadFailed = true;
        document.body.dataset.interiorBackgroundAsset = 'failed-v51';
        document.body.dataset.interiorBackgroundError = String(error?.message || error);
        scheduleSync();
      },
    );
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.scene) {
      if (attempts++ < 180) setTimeout(install, 100);
      return;
    }
    exteriorBackground = runtime.scene.background;
    loadInteriorBackground();
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-scene-mode', 'data-laboratory-ready'] });
    window.addEventListener('resize', scheduleSync);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleSync(); });
    document.body.dataset.castleInteriorBackgroundFix = 'environment-v51';
    scheduleSync();
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
