import * as THREE from 'three';

if (!window.__castleLaboratoryEntryResetV70Installed) {
  window.__castleLaboratoryEntryResetV70Installed = true;

  const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let lastMode = document.body.dataset.sceneMode || 'exterior';

  function applyLaboratoryResetView(reason = 'manual-reset') {
    const runtime = window.__castleSearchRuntime;
    if (!runtime?.orbit || !runtime?.scene || document.body.dataset.sceneMode !== 'laboratory') return false;
    const root = runtime.scene.getObjectByName('BureauOfAI');
    if (!root?.visible) return false;
    root.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(root);
    if (bounds.isEmpty()) return false;
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const horizontal = Math.max(size.x, size.z);
    const portrait = innerHeight > innerWidth;
    center.y = THREE.MathUtils.clamp(bounds.min.y + size.y * 0.32, 3.0, 8.0);
    runtime.orbit.target.copy(center);
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = portrait ? 0.24 : 0.30;
    const insideFactor = portrait ? (isIOS ? 0.42 : 0.40) : 0.34;
    runtime.orbit.distance = THREE.MathUtils.clamp(horizontal * insideFactor, 14, 22);
    runtime.updateOrbit?.();
    document.body.dataset.laboratoryStartingView = 'reset-identical-v70';
    document.body.dataset.laboratoryViewReason = reason;
    return true;
  }

  function settle(reason) {
    requestAnimationFrame(() => requestAnimationFrame(() => applyLaboratoryResetView(reason)));
    [120, 320, 700].forEach(delay => setTimeout(() => applyLaboratoryResetView(reason), delay));
  }

  document.addEventListener('click', event => {
    if (event.target?.closest?.('#castle-reset') && document.body.dataset.sceneMode === 'laboratory') {
      settle('reset-button-v70');
    }
  }, true);

  const observer = new MutationObserver(() => {
    const mode = document.body.dataset.sceneMode || 'exterior';
    if (mode === lastMode) return;
    lastMode = mode;
    if (mode === 'laboratory') settle('laboratory-entry-v70');
  });
  observer.observe(document.body, {attributes: true, attributeFilter: ['data-scene-mode']});

  window.__castleResetLaboratoryView = () => {
    settle('public-reset-v70');
    return true;
  };
}
