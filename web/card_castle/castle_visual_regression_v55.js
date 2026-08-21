import * as THREE from 'three';

if (!window.__castleVisualRegressionV55Installed) {
  window.__castleVisualRegressionV55Installed = true;

  const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let runtime = null;
  let attempts = 0;

  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function faceExteriorJesterToCamera() {
    if (!runtime?.scene || mode() !== 'exterior') return;
    const jester = runtime.scene.getObjectByName('castle-jester-gatekeeper');
    if (!jester || !runtime.camera) return;
    const jp = new THREE.Vector3();
    const cp = new THREE.Vector3();
    jester.getWorldPosition(jp);
    runtime.camera.getWorldPosition(cp);
    const desiredWorldYaw = Math.atan2(cp.x - jp.x, cp.z - jp.z);
    const parentQuat = new THREE.Quaternion();
    jester.parent?.getWorldQuaternion(parentQuat);
    const parentEuler = new THREE.Euler().setFromQuaternion(parentQuat, 'YXZ');
    jester.rotation.y = desiredWorldYaw - parentEuler.y;
    jester.visible = true;
    jester.userData.castleCameraFacingV55 = true;
    document.body.dataset.exteriorJesterFacing = 'camera-v55';
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

    // Target the architectural bureau, not the walking statue. Portrait needs
    // extra distance so the circular table and surrounding architecture fit.
    center.y = THREE.MathUtils.clamp(bounds.min.y + size.y * 0.43, 3.0, 12.0);
    runtime.orbit.target.copy(center);
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.10;
    const horizontal = Math.max(size.x, size.z);
    const portrait = innerHeight > innerWidth;
    const fitFactor = portrait ? (isIOS ? 1.34 : 1.22) : 0.78;
    runtime.orbit.distance = THREE.MathUtils.clamp(horizontal * fitFactor, 24, 78);
    runtime.updateOrbit?.();
    document.body.dataset.laboratoryStartingView = portrait
      ? 'whole-bureau-portrait-v55'
      : 'whole-bureau-desktop-v55';
    return true;
  }

  function resumeLaboratoryVideos() {
    if (mode() !== 'laboratory') return;
    document.querySelectorAll('video').forEach(video => {
      if (!/bureau|screen|loop/i.test(`${video.src} ${video.id} ${video.className}`)) return;
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.play().catch(() => {});
    });
  }

  function apply() {
    runtime = window.__castleSearchRuntime || runtime;
    if (!runtime?.renderer?.domElement) return;
    if (mode() === 'exterior') faceExteriorJesterToCamera();
    if (mode() === 'laboratory') {
      frameLaboratory();
      resumeLaboratoryVideos();
    }
  }

  function schedule() {
    requestAnimationFrame(() => requestAnimationFrame(apply));
    setTimeout(apply, 180);
    setTimeout(apply, 550);
    setTimeout(apply, 1100);
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.renderer?.domElement || !runtime?.orbit) {
      if (attempts++ < 240) setTimeout(install, 100);
      return;
    }
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    // iOS permits muted inline autoplay; retry on the user's transition gesture too.
    window.addEventListener('pointerdown', resumeLaboratoryVideos, { passive: true });
    window.addEventListener('touchstart', resumeLaboratoryVideos, { passive: true });
    document.getElementById('castle-reset')?.addEventListener('click', schedule);
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
