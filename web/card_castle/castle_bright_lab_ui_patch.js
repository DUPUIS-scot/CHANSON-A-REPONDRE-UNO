import * as THREE from 'three';

if (!window.__castleBrightLabUiPatchInstalled) {
  window.__castleBrightLabUiPatchInstalled = true;

  let attempts = 0;
  let labFillRig = null;

  function ensureLabFillRig() {
    const runtime = window.__castleSearchRuntime;
    if (!runtime?.scene || labFillRig) return labFillRig;

    const rig = new THREE.Group();
    rig.name = 'laboratory-extra-readable-light-v4';
    rig.visible = false;
    rig.add(new THREE.AmbientLight(0x7894aa, 0.78));
    rig.add(new THREE.HemisphereLight(0xc0d8e8, 0x33231a, 0.92));

    const front = new THREE.DirectionalLight(0xd7ecf8, 1.65);
    front.position.set(2, 11, 12);
    rig.add(front);

    const warm = new THREE.PointLight(0xffc184, 18, 20, 2);
    warm.position.set(0, 5.5, 2);
    rig.add(warm);

    const side = new THREE.PointLight(0xa9d5ed, 14, 22, 2);
    side.position.set(-8, 6, -2);
    rig.add(side);

    runtime.scene.add(rig);
    labFillRig = rig;
    return rig;
  }

  function sync() {
    const runtime = window.__castleSearchRuntime;
    if (!runtime?.scene || !runtime?.renderer) {
      if (attempts++ < 180) setTimeout(sync, 100);
      return;
    }

    const mode = document.body.dataset.sceneMode || 'exterior';
    const lab = mode === 'laboratory';
    const rig = ensureLabFillRig();
    if (rig) rig.visible = lab;

    // The gatekeeper belongs to the exterior entrance only. Never carry it
    // into the castle interior or laboratory subscene.
    const gatekeeper = runtime.scene.getObjectByName('castle-jester-gatekeeper');
    if (gatekeeper) gatekeeper.visible = mode === 'exterior';

    // Remove the old toolbar route to the laboratory. The rotating medallion
    // remains the sole interior entry control.
    const bureauButton = document.getElementById('bureau-of-ai');
    if (bureauButton) {
      bureauButton.hidden = true;
      bureauButton.style.display = 'none';
      bureauButton.setAttribute('aria-hidden', 'true');
    }

    // Keep the bottom medallion graphic but remove its LABORATOIRE caption.
    const medallionLabel = document.querySelector('#laboratory-medallion-button .lab-medallion-label');
    if (medallionLabel) {
      medallionLabel.textContent = '';
      medallionLabel.style.display = 'none';
    }

    if (lab) {
      runtime.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      runtime.renderer.toneMappingExposure = 1.95;
      runtime.scene.fog = new THREE.FogExp2(0x15212a, 0.0018);
      const canvas = runtime.renderer.domElement;
      if (canvas) canvas.style.filter = 'contrast(.95) saturate(.94) brightness(1.14)';
      document.body.dataset.laboratoryLighting = 'extra-bright-readable-v4';
      document.body.dataset.sceneExposureOwner = 'laboratory-extra-bright-v4';
    }
  }

  const observer = new MutationObserver(() => requestAnimationFrame(sync));
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
  });
  window.addEventListener('castleRuntimeReady', sync);
  setInterval(() => {
    const mode = document.body.dataset.sceneMode;
    if (mode === 'laboratory' || mode === 'interior') sync();
  }, 500);
  sync();
}
