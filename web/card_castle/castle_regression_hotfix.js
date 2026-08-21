import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

if (!window.__castleRegressionHotfixV47Installed) {
  window.__castleRegressionHotfixV47Installed = true;

  const LAB_TOKEN = 'laboratory_interior.glb';
  const EXTERIOR_BG_URL = new URL('../assets/assets/images/castle_exterior_atmosphere.png', document.baseURI).href;
  const VIDEO_URL = new URL('../assets/assets/videos/bureau_screen_loop.mp4', document.baseURI).href;
  let laboratoryMixer = null;
  let laboratoryFrame = 0;
  let lastTime = performance.now();
  let exteriorTexture = null;
  let video = null;
  let videoTexture = null;
  let boundVideoMeshes = [];

  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function startLaboratoryAnimations(root, clips) {
    const playable = (clips || []).filter(clip => !/camera/i.test(clip?.name || ''));
    if (!root || !playable.length) {
      document.body.dataset.laboratoryAnimationPlayback = 'no-clips-v47';
      return;
    }
    laboratoryMixer?.stopAllAction?.();
    laboratoryMixer = new THREE.AnimationMixer(root);
    playable.forEach(clip => {
      const action = laboratoryMixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = false;
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().play();
    });
    document.body.dataset.laboratoryAnimationPlayback = 'looping-v47';
    document.body.dataset.laboratoryAnimationCount = String(playable.length);
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

  if (!GLTFLoader.prototype.__laboratoryHotfixV47) {
    GLTFLoader.prototype.__laboratoryHotfixV47 = true;
    const originalLoad = GLTFLoader.prototype.load;
    GLTFLoader.prototype.load = function(url, onLoad, onProgress, onError) {
      if (!String(url || '').includes(LAB_TOKEN)) return originalLoad.call(this, url, onLoad, onProgress, onError);
      return originalLoad.call(this, url, gltf => {
        const root = gltf?.scene;
        if (root && !root.userData.laboratoryUprightV47) {
          root.rotation.x += Math.PI;
          root.updateMatrixWorld(true);
          root.userData.laboratoryUprightV47 = true;
          document.body.dataset.laboratoryOrientation = 'upright-x180-v47';
        }
        onLoad?.(gltf);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          startLaboratoryAnimations(root, gltf?.animations || []);
          hideLaboratoryCards();
          bindLaboratoryVideo();
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
      child.traverse?.(object => { if (object?.userData?.card) hasCards = true; });
      if (hasCards) child.visible = !active && mode() === 'exterior';
    });
    const labRoot = scene.getObjectByName('BureauOfAI');
    if (!labRoot) return;
    let hidden = 0;
    labRoot.traverse(object => {
      if (!object?.isMesh) return;
      const materialNames = (Array.isArray(object.material) ? object.material : [object.material])
        .map(material => material?.name || '').join(' ');
      if (/\b(card|cards|uno|brio)\b/i.test(`${object.name || ''} ${materialNames}`)) {
        object.visible = false;
        object.userData.hiddenLaboratoryCardV47 = true;
        hidden += 1;
      }
    });
    document.body.dataset.laboratoryHiddenCardMeshes = String(hidden);
  }

  function ensureVideo() {
    if (videoTexture) return videoTexture;
    video = document.createElement('video');
    video.src = VIDEO_URL;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.generateMipmaps = false;
    return videoTexture;
  }

  function scoreVideoMesh(object) {
    if (!object?.isMesh) return 0;
    const materialNames = (Array.isArray(object.material) ? object.material : [object.material])
      .map(material => material?.name || '').join(' ');
    const label = `${object.name || ''} ${materialNames}`.toLowerCase();
    if (label.includes('video')) return 100;
    if (label.includes('screen')) return 90;
    if (label.includes('display')) return 80;
    if (label.includes('monitor')) return 70;
    if (label.includes('recto') || label.includes('verso')) return 60;
    if (label.includes('mirror')) return 50;
    return 0;
  }

  function bindLaboratoryVideo() {
    const root = window.__castleSearchRuntime?.scene?.getObjectByName('BureauOfAI');
    if (!root) return false;
    const candidates = [];
    root.traverse(object => {
      const score = scoreVideoMesh(object);
      if (score) candidates.push({ object, score });
    });
    candidates.sort((a, b) => b.score - a.score);
    const targets = candidates.slice(0, 2).map(item => item.object);
    if (!targets.length) {
      document.body.dataset.bureauVideoState = 'no-video-mesh-v47';
      return false;
    }
    const map = ensureVideo();
    boundVideoMeshes = targets;
    targets.forEach(mesh => {
      mesh.material = new THREE.MeshBasicMaterial({
        name: `${mesh.name || 'laboratory-video'}-v47`,
        map,
        color: 0xffffff,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      mesh.material.needsUpdate = true;
      mesh.visible = true;
    });
    document.body.dataset.bureauVideoScreenCount = String(targets.length);
    document.body.dataset.bureauVideoState = 'bound-flexible-v47';
    syncVideoPlayback();
    return true;
  }

  function syncVideoPlayback() {
    if (!video) return;
    if (mode() === 'laboratory') {
      video.play().then(() => {
        document.body.dataset.bureauVideoPlayback = 'playing-v47';
      }).catch(error => {
        document.body.dataset.bureauVideoPlayback = 'autoplay-blocked-v47';
        document.body.dataset.bureauVideoError = String(error?.message || error);
      });
    } else video.pause();
  }

  function restoreExteriorBackground() {
    if (mode() !== 'exterior') return;
    const runtime = window.__castleSearchRuntime;
    if (!runtime?.scene || !runtime?.renderer) return;
    if (exteriorTexture) runtime.scene.background = exteriorTexture;
    runtime.scene.fog = new THREE.FogExp2(0x08131e, 0.0062);
    runtime.renderer.toneMappingExposure = 2.05;
    if (window.__castleDirectExteriorEnvironment) window.__castleDirectExteriorEnvironment.visible = true;
    document.body.dataset.exteriorBackgroundHotfix = exteriorTexture ? 'restored-v47' : 'waiting-v47';
  }

  new THREE.TextureLoader().load(
    EXTERIOR_BG_URL,
    texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      exteriorTexture = texture;
      restoreExteriorBackground();
    },
    undefined,
    error => {
      document.body.dataset.exteriorBackgroundHotfix = 'failed-v47';
      document.body.dataset.exteriorBackgroundHotfixError = String(error?.message || error);
    },
  );

  function sync() {
    hideLaboratoryCards();
    syncVideoPlayback();
    if (mode() === 'laboratory') {
      if (!boundVideoMeshes.length) bindLaboratoryVideo();
    } else if (mode() === 'exterior') {
      setTimeout(restoreExteriorBackground, 120);
      setTimeout(restoreExteriorBackground, 300);
    }
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-scene-mode', 'data-laboratory-ready'] });
  window.addEventListener('castleRuntimeReady', sync);
  setInterval(() => {
    if (mode() === 'laboratory') {
      hideLaboratoryCards();
      if (!boundVideoMeshes.length) bindLaboratoryVideo();
    }
  }, 750);
  sync();
}
