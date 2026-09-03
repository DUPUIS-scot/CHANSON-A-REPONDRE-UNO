import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

if (!window.__castleReconstructionPatchV83Installed) {
  window.__castleReconstructionPatchV83Installed = true;

  const VERSION = 'v83';
  const INTERIOR_TOKEN = 'castle_interior_textured.glb';
  const LABORATORY_TOKEN = 'laboratory_interior_book_videos.glb';
  const VIDEO_NODE_NAMES = [
    'VideoBookPage_Left',
    'VideoBookPage_Right',
    'VideoScreen_Left',
    'VideoScreen_Right',
  ];

  const activeMixers = new Map();
  let frame = 0;
  let previousTime = performance.now();

  const sceneMode = () => document.body.dataset.sceneMode || 'exterior';

  function startMixerLoop() {
    if (frame) return;
    previousTime = performance.now();
    const tick = now => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
      previousTime = now;
      const mode = sceneMode();
      for (const [key, state] of activeMixers) {
        if (!state?.mixer) continue;
        if (key === 'interior' && mode === 'interior') state.mixer.update(delta);
        if (key === 'laboratory' && mode === 'laboratory') state.mixer.update(delta);
      }
    };
    frame = requestAnimationFrame(tick);
  }

  function stopMixer(key) {
    const state = activeMixers.get(key);
    if (!state) return;
    try { state.mixer.stopAllAction(); } catch (_) {}
    activeMixers.delete(key);
  }

  function chooseClip(clips, preferredTokens) {
    if (!Array.isArray(clips) || !clips.length) return null;
    const preferred = clips.filter(clip => {
      const name = String(clip?.name || '').toLowerCase();
      return preferredTokens.some(token => name.includes(token));
    });
    const candidates = preferred.length ? preferred : clips;
    return candidates.slice().sort((a, b) => (b?.duration || 0) - (a?.duration || 0))[0] || null;
  }

  function restoreInteriorJester(gltf) {
    const root = gltf?.scene;
    if (!root) return;
    const jester = root.getObjectByName('castle_jester_double_mock_taunt_stairs_return_v4.glb') ||
      (() => {
        let found = null;
        root.traverse(object => {
          if (!found && /jester/i.test(object?.name || '')) found = object;
        });
        return found;
      })();
    const clip = chooseClip(gltf.animations, ['jester', 'stairs', 'stair', 'descent', 'throne', 'return']);
    if (!jester || !clip) {
      document.body.dataset.interiorJesterReconstruction = 'missing-node-or-clip';
      return;
    }

    stopMixer('interior');
    const mixer = new THREE.AnimationMixer(root);
    const action = mixer.clipAction(clip);
    action.enabled = true;
    action.clampWhenFinished = false;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().play();
    activeMixers.set('interior', { mixer, root, clip, actor: jester });
    startMixerLoop();

    document.body.dataset.interiorJesterReconstruction = `ready-${VERSION}`;
    document.body.dataset.interiorJesterNode = jester.name || 'jester';
    document.body.dataset.interiorJesterClip = clip.name || 'unnamed';
    document.body.dataset.interiorJesterPlacement = 'model-native-preserved';
  }

  function restoreLaboratory(gltf) {
    const root = gltf?.scene;
    if (!root) return;

    const videoNodes = VIDEO_NODE_NAMES.map(name => root.getObjectByName(name)).filter(Boolean);
    for (const node of videoNodes) {
      node.visible = true;
      node.userData.laboratoryReconstructionPlacement = 'model-native-preserved';
    }
    document.body.dataset.laboratoryVideoMeshReconstruction =
      videoNodes.length === VIDEO_NODE_NAMES.length ? `four-ready-${VERSION}` : `found-${videoNodes.length}-${VERSION}`;
    document.body.dataset.laboratoryVideoMeshNodes = videoNodes.map(node => node.name).join('|');

    const figure = root.getObjectByName('OrbitFigure_Scale') ||
      (() => {
        let found = null;
        root.traverse(object => {
          if (!found && /(?:statue|figure|dee|walker|walking)/i.test(object?.name || '')) found = object;
        });
        return found;
      })();
    const clip = chooseClip(gltf.animations, ['figure', 'dance', 'orbit', 'video', 'statue']);
    if (!figure || !clip) {
      document.body.dataset.laboratoryStatueReconstruction = 'missing-node-or-clip';
      return;
    }

    stopMixer('laboratory');
    const mixer = new THREE.AnimationMixer(root);
    const action = mixer.clipAction(clip);
    action.enabled = true;
    action.clampWhenFinished = false;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset().play();
    activeMixers.set('laboratory', { mixer, root, clip, actor: figure });
    startMixerLoop();

    document.body.dataset.laboratoryStatueReconstruction = `ready-${VERSION}`;
    document.body.dataset.laboratoryStatueNode = figure.name || 'animated-figure';
    document.body.dataset.laboratoryStatueClip = clip.name || 'unnamed';
    document.body.dataset.laboratoryStatuePlacement = 'model-native-preserved';
  }

  if (!GLTFLoader.prototype.__castleReconstructionV83Patched) {
    GLTFLoader.prototype.__castleReconstructionV83Patched = true;
    const originalLoad = GLTFLoader.prototype.load;
    GLTFLoader.prototype.load = function(url, onLoad, onProgress, onError) {
      const source = String(url || '');
      const isInterior = source.includes(INTERIOR_TOKEN);
      const isLaboratory = source.includes(LABORATORY_TOKEN);
      if (!isInterior && !isLaboratory) {
        return originalLoad.call(this, url, onLoad, onProgress, onError);
      }
      return originalLoad.call(this, url, gltf => {
        if (isInterior) restoreInteriorJester(gltf);
        if (isLaboratory) restoreLaboratory(gltf);
        onLoad?.(gltf);
      }, onProgress, onError);
    };
  }

  document.body.dataset.castleReconstructionPatch = VERSION;

  window.addEventListener('beforeunload', () => {
    for (const key of [...activeMixers.keys()]) stopMixer(key);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }, { once: true });
}
