import * as THREE from 'three';

if (!window.__castleBrightLabUiPatchInstalled) {
  window.__castleBrightLabUiPatchInstalled = true;

  let attempts = 0;
  let labFillRig = null;

  function ensureLabFillRig() {
    const runtime = window.__castleSearchRuntime;
    if (!runtime?.scene || labFillRig) return labFillRig;
    const rig = new THREE.Group();
    rig.name = 'laboratory-extra-readable-light-v5';
    rig.visible = false;
    rig.add(new THREE.AmbientLight(0x8aa8bc, 0.98));
    rig.add(new THREE.HemisphereLight(0xd2e4ee, 0x38291f, 1.08));
    const front = new THREE.DirectionalLight(0xe0f2fb, 1.9);
    front.position.set(2, 11, 12); rig.add(front);
    const warm = new THREE.PointLight(0xffc184, 18, 20, 2);
    warm.position.set(0, 5.5, 2); rig.add(warm);
    const side = new THREE.PointLight(0xb8e0f2, 16, 24, 2);
    side.position.set(-8, 6, -2); rig.add(side);
    runtime.scene.add(rig); labFillRig = rig; return rig;
  }

  function ensureBackButton() {
    let button = document.getElementById('laboratory-back-interior');
    if (button) return button;
    button = document.createElement('button');
    button.id = 'laboratory-back-interior';
    button.type = 'button';
    button.className = 'castle-control';
    button.setAttribute('aria-label', 'Retour au château intérieur');
    button.innerHTML = '<span class="control-medallion">←</span><span class="control-copy"><span class="control-title">CHÂTEAU INTÉRIEUR</span><span class="control-subtitle">Retour</span></span>';
    Object.assign(button.style, {position:'fixed',left:'18px',top:'18px',zIndex:'10020',display:'none'});
    button.addEventListener('click', event => {
      event.preventDefault();
      // The navigation core already binds this action to the bureau control
      // while in laboratory mode, so use it as the canonical transition.
      const canonical = document.getElementById('bureau-of-ai');
      if (canonical) canonical.click();
    });
    document.body.appendChild(button);
    return button;
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

    // Hard-hide every gatekeeper/jester object outside the exterior scene.
    runtime.scene.traverse(object => {
      const name = String(object?.name || '').toLowerCase();
      if (name.includes('jester') || object?.userData?.castleGatekeeper === true) {
        if (mode !== 'exterior') object.visible = false;
      }
    });

    // Old top laboratory route stays withdrawn.
    const bureauButton = document.getElementById('bureau-of-ai');
    if (bureauButton) {
      bureauButton.hidden = true;
      bureauButton.style.display = 'none';
      bureauButton.setAttribute('aria-hidden', 'true');
    }

    // Bottom entry medallion is interior-only and has no text caption.
    const medallion = document.getElementById('laboratory-medallion-button');
    if (medallion) medallion.style.display = mode === 'interior' ? '' : 'none';
    const medallionLabel = document.querySelector('#laboratory-medallion-button .lab-medallion-label');
    if (medallionLabel) { medallionLabel.textContent = ''; medallionLabel.style.display = 'none'; }

    // Dedicated, visible laboratory exit.
    const back = ensureBackButton();
    back.style.display = lab ? 'flex' : 'none';

    if (lab) {
      runtime.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      runtime.renderer.toneMappingExposure = 2.05;
      runtime.scene.fog = new THREE.FogExp2(0x182630, 0.0015);
      const canvas = runtime.renderer.domElement;
      if (canvas) canvas.style.filter = 'contrast(.94) saturate(.92) brightness(1.18)';
      document.body.dataset.laboratoryLighting = 'extra-bright-readable-v5';
      document.body.dataset.sceneExposureOwner = 'laboratory-extra-bright-v5';
    }
  }

  const observer = new MutationObserver(() => requestAnimationFrame(sync));
  observer.observe(document.body, {attributes:true, attributeFilter:['data-scene-mode','data-laboratory-ready']});
  window.addEventListener('castleRuntimeReady', sync);
  setInterval(() => {
    const mode = document.body.dataset.sceneMode;
    if (mode === 'laboratory' || mode === 'interior') sync();
  }, 500);
  sync();
}
