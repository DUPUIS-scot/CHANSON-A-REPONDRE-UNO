import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

if (!window.__castleRegressionHotfixV60Installed) {
  window.__castleRegressionHotfixV60Installed = true;

  const LAB_TOKEN = 'laboratory_interior.glb';
  const EXTERIOR_BG_URL = new URL(
    '../assets/assets/images/castle_exterior_atmosphere.png',
    document.baseURI,
  ).href;
  let laboratoryMixer = null;
  let laboratoryFrame = 0;
  let lastTime = performance.now();
  let exteriorTexture = null;
  const mode = () => document.body.dataset.sceneMode || 'exterior';

  document.body.dataset.bureauVideoLegacyOwner = 'disabled-v60';

  function startLaboratoryAnimations(root, clips) {
    const playable = (clips || []).filter(clip => !/camera/i.test(clip?.name || ''));
    if (!root || !playable.length) {
      document.body.dataset.laboratoryAnimationPlayback = 'no-clips-v60';
      return;
    }

    laboratoryMixer?.stopAllAction?.();
    laboratoryMixer = new THREE.AnimationMixer(root);
    playable.forEach(clip => {
      laboratoryMixer.clipAction(clip)
        .setLoop(THREE.LoopRepeat, Infinity)
        .reset()
        .play();
    });
    document.body.dataset.laboratoryAnimationPlayback = 'looping-v60';

    if (!laboratoryFrame) {
      lastTime = performance.now();
      const tick = now => {
        laboratoryFrame = requestAnimationFrame(tick);
        const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
        lastTime = now;
        if (laboratoryMixer && mode() === 'laboratory') laboratoryMixer.update(delta);
      };
      laboratoryFrame = requestAnimationFrame(tick);
    }
  }

  if (!GLTFLoader.prototype.__laboratoryHotfixV60) {
    GLTFLoader.prototype.__laboratoryHotfixV60 = true;
    const originalLoad = GLTFLoader.prototype.load;
    GLTFLoader.prototype.load = function(url, onLoad, onProgress, onError) {
      if (!String(url || '').includes(LAB_TOKEN)) {
        return originalLoad.call(this, url, onLoad, onProgress, onError);
      }
      return originalLoad.call(this, url, gltf => {
        const root = gltf?.scene;
        if (root && !root.userData.laboratorySourceOrientationV60) {
          root.updateMatrixWorld(true);
          root.userData.laboratorySourceOrientationV60 = true;
          document.body.dataset.laboratoryOrientation = 'source-world-orientation-v60';
        }
        onLoad?.(gltf);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          startLaboratoryAnimations(root, gltf?.animations || []);
          hideLaboratoryCards();
          // Video surfaces are intentionally not touched here. The dedicated
          // castle_bureau_video_bridge.js is the single owner of video media,
          // VideoTexture, material replacement, mesh facing, and playback.
        }));
      }, onProgress, onError);
    };
  }

  function hideLaboratoryCards() {
    const scene = window.__castleSearchRuntime?.scene;
    if (!scene) return;
    const active = mode() === 'laboratory';
    scene.children.forEach(child => {
      if (!child?.isGroup) return;
      let hasCards = false;
      child.traverse?.(object => {
        if (object?.userData?.card) hasCards = true;
      });
      if (hasCards && active) child.visible = false;
    });
  }

  function restoreExteriorBackground() {
    if (mode() !== 'exterior') return;
    const runtime = window.__castleSearchRuntime;
    if (!runtime?.scene || !runtime?.renderer) return;
    if (exteriorTexture) runtime.scene.background = exteriorTexture;
    runtime.scene.fog = new THREE.FogExp2(0x08131e, 0.0062);
    runtime.renderer.toneMappingExposure = 2.05;
    if (window.__castleDirectExteriorEnvironment) {
      window.__castleDirectExteriorEnvironment.visible = true;
    }
  }

  new THREE.TextureLoader().load(EXTERIOR_BG_URL, texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    exteriorTexture = texture;
    restoreExteriorBackground();
  });

  function sync() {
    hideLaboratoryCards();
    if (mode() === 'exterior') {
      setTimeout(restoreExteriorBackground, 120);
      setTimeout(restoreExteriorBackground, 300);
    }
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
  });
  window.addEventListener('castleRuntimeReady', sync);
  sync();
}
