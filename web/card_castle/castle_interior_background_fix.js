import * as THREE from 'three';

// Final interior background owner. Keeps castle interior independent from the
// exterior atmosphere texture and the laboratory environment on iOS/Windows.
if (!window.__castleInteriorBackgroundFixInstalled) {
  window.__castleInteriorBackgroundFixInstalled = true;

  let runtime = null;
  let attempts = 0;
  let exteriorBackground = null;
  let laboratoryBackground = null;
  const interiorBackground = new THREE.Color(0x03070d);

  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function sync() {
    if (!runtime?.scene) return;
    const current = mode();

    if (current === 'interior') {
      runtime.scene.background = interiorBackground;
      document.body.dataset.interiorBackground = 'dedicated-gothic-midnight-v48';
      return;
    }

    delete document.body.dataset.interiorBackground;

    if (current === 'laboratory') {
      if (runtime.scene.background && runtime.scene.background !== interiorBackground) {
        laboratoryBackground = runtime.scene.background;
      }
      if (laboratoryBackground) runtime.scene.background = laboratoryBackground;
      return;
    }

    if (exteriorBackground) runtime.scene.background = exteriorBackground;
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

    document.body.dataset.castleInteriorBackgroundFix = 'installed-v48';
    scheduleSync();
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
