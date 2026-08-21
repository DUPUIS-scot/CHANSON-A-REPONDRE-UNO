import * as THREE from 'three';

// Scene-background owner. The castle interior must display only its GLB
// architecture: no exterior atmosphere image, sky texture, or artificial
// background colour behind it.
if (!window.__castleInteriorBackgroundFixInstalled) {
  window.__castleInteriorBackgroundFixInstalled = true;

  let runtime = null;
  let attempts = 0;
  let exteriorBackground = null;
  let laboratoryBackground = null;

  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function sync() {
    if (!runtime?.scene) return;
    const current = mode();

    if (current === 'interior') {
      runtime.scene.background = null;
      // Transparent renderer clear keeps the interior free of any Three.js
      // background while preserving the actual GLB walls/ceiling/geometry.
      runtime.renderer?.setClearColor?.(0x000000, 0);
      document.body.dataset.interiorBackground = 'none-v49';
      return;
    }

    delete document.body.dataset.interiorBackground;

    if (current === 'laboratory') {
      if (runtime.scene.background) laboratoryBackground = runtime.scene.background;
      if (laboratoryBackground) runtime.scene.background = laboratoryBackground;
      runtime.renderer?.setClearColor?.(0x000000, 1);
      return;
    }

    if (exteriorBackground) runtime.scene.background = exteriorBackground;
    runtime.renderer?.setClearColor?.(0x000000, 1);
  }

  function scheduleSync() {
    setTimeout(sync, 0);
    setTimeout(sync, 80);
    setTimeout(sync, 220);
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.scene) {
      if (attempts++ < 180) setTimeout(install, 100);
      return;
    }
    exteriorBackground = runtime.scene.background;
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
    });
    window.addEventListener('resize', scheduleSync);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleSync();
    });
    document.body.dataset.castleInteriorBackgroundFix = 'no-background-v49';
    scheduleSync();
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
