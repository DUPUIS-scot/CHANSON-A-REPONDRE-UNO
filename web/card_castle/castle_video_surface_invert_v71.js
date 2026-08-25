if (!window.__castleVideoSurfaceInvertV71Installed) {
  window.__castleVideoSurfaceInvertV71Installed = true;

  const EXACT_SCREEN_NAME = /^VideoScreen_(Left|Right)$/i;

  function restoreScreens() {
    const runtime = window.__castleSearchRuntime;
    const root = runtime?.scene?.getObjectByName('BureauOfAI') || runtime?.bureauRoot;
    if (!root) return false;

    let restored = 0;
    root.traverse(object => {
      if (!object?.isMesh || !EXACT_SCREEN_NAME.test(object.name || '')) return;

      // Preserve the GLB/video-bridge facing orientation. The previous v71
      // patch added another PI rotation here, turning both canonical screen
      // meshes away from the intended laboratory-facing orientation.
      if (object.userData.__videoSurfaceInvertedV71) {
        object.rotation.y -= Math.PI;
        object.updateMatrixWorld(true);
        delete object.userData.__videoSurfaceInvertedV71;
      }
      restored++;
    });

    if (restored) {
      document.body.dataset.bureauVideoSurfaceOrientation = 'laboratory-facing';
      document.body.dataset.bureauVideoSurfaceInvertedCount = '0';
      window.__castleBureauVideoPlay?.();
      return true;
    }
    return false;
  }

  function schedule() {
    requestAnimationFrame(restoreScreens);
    [80, 220, 500, 1000].forEach(delay => setTimeout(restoreScreens, delay));
  }

  window.addEventListener('castleRuntimeReady', schedule);
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-scene-mode', 'data-laboratory-ready', 'data-bureau-ready'],
  });
  schedule();
}
