if (!window.__castleVideoSurfaceInvertV71Installed) {
  window.__castleVideoSurfaceInvertV71Installed = true;

  const EXACT_SCREEN_NAME = /^VideoScreen_(Left|Right)$/i;

  function invertScreens() {
    const runtime = window.__castleSearchRuntime;
    const root = runtime?.scene?.getObjectByName('BureauOfAI') || runtime?.bureauRoot;
    if (!root) return false;

    let inverted = 0;
    root.traverse(object => {
      if (!object?.isMesh || !EXACT_SCREEN_NAME.test(object.name || '')) return;
      if (object.userData.__videoSurfaceInvertedV71) return;

      // The video bridge already applies a 180° facing correction. Apply a
      // second 180° turn to both canonical screens so their visible surfaces
      // are inverted relative to the current live orientation.
      object.rotation.y += Math.PI;
      object.updateMatrixWorld(true);
      object.userData.__videoSurfaceInvertedV71 = true;
      inverted++;
    });

    if (inverted) {
      document.body.dataset.bureauVideoSurfaceOrientation = 'both-inverted-v71';
      document.body.dataset.bureauVideoSurfaceInvertedCount = String(inverted);
      window.__castleBureauVideoPlay?.();
      return true;
    }
    return false;
  }

  function schedule() {
    requestAnimationFrame(invertScreens);
    [80, 220, 500, 1000].forEach(delay => setTimeout(invertScreens, delay));
  }

  window.addEventListener('castleRuntimeReady', schedule);
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-scene-mode', 'data-laboratory-ready', 'data-bureau-ready'],
  });
  schedule();
}
