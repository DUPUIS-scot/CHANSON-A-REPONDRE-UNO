import * as THREE from 'three';

if (!window.__castleVisualRegressionV60Installed) {
  window.__castleVisualRegressionV60Installed = true;

  const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let runtime = null;
  let attempts = 0;
  let labEntryToken = 0;

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  document.body.dataset.castleJesterRegressionOwnership = 'delegated-to-overlay-v60';
  document.body.dataset.bureauVideoRegressionOwnership = 'delegated-to-bridge-v60';

  function syncBrowseCards() {
    if (!runtime?.scene) return;
    const direct = runtime.scene.getObjectByName('castle-direct-card-previews');
    if (direct) direct.visible = mode() === 'exterior';
    for (const child of runtime.scene.children) {
      if (child === direct || !child?.isGroup) continue;
      if (child.children?.some(item => item?.userData?.card)) {
        child.visible = mode() === 'exterior';
      }
    }
    document.body.dataset.browseCardsScene = mode() === 'exterior' ? 'visible' : 'hidden';
  }

  function frameLaboratory() {
    if (!runtime?.orbit || !runtime?.scene || mode() !== 'laboratory') return false;
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
    document.body.dataset.laboratoryStartingView = portrait
      ? 'inside-bureau-portrait-v60'
      : 'inside-bureau-desktop-v60';
    return true;
  }

  function resumeLaboratoryVideo() {
    if (mode() !== 'laboratory') return;
    // The dedicated bridge owns the sole media element and VideoTexture.
    window.__castleBureauVideoPlay?.();
  }

  function applyLabEntryView(token) {
    if (token !== labEntryToken || mode() !== 'laboratory') return;
    syncBrowseCards();
    frameLaboratory();
    resumeLaboratoryVideo();
  }

  function schedule() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      runtime = window.__castleSearchRuntime || runtime;
      syncBrowseCards();
      if (mode() === 'laboratory') applyLabEntryView(labEntryToken);
    }));
    const token = labEntryToken;
    [120, 320, 700, 1300].forEach(delay => setTimeout(() => {
      runtime = window.__castleSearchRuntime || runtime;
      syncBrowseCards();
      if (mode() === 'laboratory') applyLabEntryView(token);
    }, delay));
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.renderer?.domElement || !runtime?.orbit) {
      if (attempts++ < 240) setTimeout(install, 100);
      return;
    }
    schedule();
    let previousMode = mode();
    const observer = new MutationObserver(() => {
      const nextMode = mode();
      if (nextMode === 'laboratory' && previousMode !== 'laboratory') labEntryToken++;
      previousMode = nextMode;
      schedule();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('pointerdown', resumeLaboratoryVideo, { passive: true });
    window.addEventListener('touchstart', resumeLaboratoryVideo, { passive: true });
    document.getElementById('castle-reset')?.addEventListener('click', schedule);
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
