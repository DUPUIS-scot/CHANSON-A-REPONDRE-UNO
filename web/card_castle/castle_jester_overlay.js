import * as THREE from 'three';
import { CastleJesterGatekeeper } from './castle_jester_gatekeeper.js';

const modelUrl = new URL(
  '../assets/assets/models/castle_jester_rigged.glb',
  document.baseURI,
).href;
const MOVE_SLOP_PX = 9;

document.body.dataset.castleJesterAsset = modelUrl;
document.body.dataset.castleEntranceTrigger = 'rigged-jester-single-click';
document.body.dataset.castleJesterIntegration = 'waiting-for-runtime';
document.body.dataset.castleJesterRotationOwner = 'castle-jester-overlay-v60';

let gatekeeper = null;
let frame = 0;
let previousTime = performance.now();
let pointerDown = null;
let activeRuntime = null;
let interiorFocusFrame = 0;

const isExterior = () => document.body.dataset.sceneMode === 'exterior';

function isWorldVisible(object) {
  for (let current = object; current; current = current.parent) {
    if (current.visible === false) return false;
  }
  return true;
}

function labelFor(object) {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return [object.name, ...materials.filter(Boolean).map(material => material.name)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function findConstructionPanel(runtime) {
  const camera = runtime?.camera;
  const scene = runtime?.scene;
  if (!camera || !scene) return null;
  camera.updateMatrixWorld(true);
  const keyword = /construction|panel|sign|dupuis|exhibition|preparation|préparation/;
  let named = null;
  let namedScore = -Infinity;
  let geometric = null;
  let geometricScore = -Infinity;
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  scene.traverse(object => {
    if (!object.isMesh || !isWorldVisible(object)) return;
    box.setFromObject(object);
    if (box.isEmpty()) return;
    box.getSize(size);
    box.getCenter(center);
    const dims = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)].sort((a, b) => a - b);
    const thin = dims[0];
    const mid = dims[1];
    const long = dims[2];
    if (long < 0.45 || mid < 0.28) return;
    const projected = center.clone().project(camera);
    if (
      projected.z < -1.2 ||
      projected.z > 1.2 ||
      Math.abs(projected.x) > 1.35 ||
      Math.abs(projected.y) > 1.35
    ) return;
    const distance = camera.position.distanceTo(center);
    const screenPenalty = Math.hypot(projected.x, projected.y * 0.8);
    const label = labelFor(object);
    if (keyword.test(label)) {
      const score = 1000 - distance * 2 - screenPenalty * 20 + Math.min(long * mid, 30);
      if (score > namedScore) {
        namedScore = score;
        named = { object, center: center.clone(), size: size.clone(), label };
      }
      return;
    }
    const flatness = thin / Math.max(mid, 0.001);
    const ratio = long / Math.max(mid, 0.001);
    if (flatness > 0.34 || ratio < 1.15 || ratio > 4.8 || long > 14 || mid > 8) return;
    const score = 120 - distance * 2.4 - screenPenalty * 28 - flatness * 35 - Math.abs(ratio - 1.9) * 5;
    if (score > geometricScore) {
      geometricScore = score;
      geometric = { object, center: center.clone(), size: size.clone(), label };
    }
  });
  return named || geometric;
}

function focusInteriorOnConstructionPanel(runtime) {
  if (!runtime?.camera) return false;
  const match = findConstructionPanel(runtime);
  let target;
  if (match) {
    target = match.center.clone();
    target.y += Math.max(0.15, Math.min(match.size.y * 0.08, 0.55));
    document.body.dataset.castleInteriorEntryTarget =
      match.label || match.object.name || 'construction-panel-geometry';
  } else {
    target = new THREE.Vector3(-3.6, 2.8, 5);
    document.body.dataset.castleInteriorEntryTarget = 'construction-panel-fallback';
  }
  if (runtime.orbit?.target) {
    runtime.orbit.target.copy(target);
    runtime.updateOrbit?.();
  } else {
    runtime.camera.lookAt(target);
  }
  document.body.dataset.castleInteriorEntryCamera = 'construction-panel-v1';
  return true;
}

function armInteriorEntryFocus(runtime) {
  if (interiorFocusFrame) cancelAnimationFrame(interiorFocusFrame);
  let attempts = 0;
  const apply = () => {
    if (document.body.dataset.sceneMode === 'interior') {
      focusInteriorOnConstructionPanel(runtime);
      interiorFocusFrame = 0;
      return;
    }
    if (attempts++ < 1200) interiorFocusFrame = requestAnimationFrame(apply);
    else interiorFocusFrame = 0;
  };
  interiorFocusFrame = requestAnimationFrame(apply);
}

function requestEntrance() {
  if (!isExterior()) return;
  document.body.dataset.castleJesterState = 'opening-gate';
  gatekeeper?.setVisible(false);
  armInteriorEntryFocus(activeRuntime);
  window.dispatchEvent(new CustomEvent('castleJesterEnter'));
}

function rotateExistingCardAnchorsWithCastle(scene, castleRoot, angle) {
  if (!scene || !castleRoot) return;
  scene.updateMatrixWorld(true);
  const axis = new THREE.Vector3(0, 1, 0);
  const turn = new THREE.Quaternion().setFromAxisAngle(axis, angle);
  const pivot = castleRoot.getWorldPosition(new THREE.Vector3());
  let rotated = 0;
  for (const group of scene.children) {
    if (!group?.isGroup || group === castleRoot) continue;
    const cardMeshes = group.children?.filter(item => item?.userData?.card) || [];
    if (!cardMeshes.length) continue;
    for (const mesh of cardMeshes) {
      const parent = mesh.parent;
      if (!parent) continue;
      const worldPosition = mesh.getWorldPosition(new THREE.Vector3())
        .sub(pivot)
        .applyQuaternion(turn)
        .add(pivot);
      const worldQuaternion = mesh.getWorldQuaternion(new THREE.Quaternion()).premultiply(turn);
      mesh.position.copy(parent.worldToLocal(worldPosition));
      const parentWorldQuaternion = parent.getWorldQuaternion(new THREE.Quaternion());
      mesh.quaternion.copy(parentWorldQuaternion.invert().multiply(worldQuaternion));
      mesh.updateMatrixWorld(true);
      rotated++;
    }
  }
  if (rotated) {
    document.body.dataset.castleAnchorAlignment = 'cards-follow-castle-pivot-270deg-v41';
    document.body.dataset.castleAnchorRotatedCount = String(rotated);
    document.body.dataset.castleAnchorPivot = [pivot.x.toFixed(3), pivot.y.toFixed(3), pivot.z.toFixed(3)].join(',');
  }
}

function alignCastleToPlaza(castleRoot) {
  if (!castleRoot || castleRoot.userData.unoPlazaAligned) return;
  const angle = Math.PI * 1.5;
  castleRoot.rotation.y += angle;
  castleRoot.updateMatrixWorld(true);
  rotateExistingCardAnchorsWithCastle(castleRoot.parent, castleRoot, angle);
  castleRoot.userData.unoPlazaAligned = true;
  document.body.dataset.castleExteriorAlignment = 'gate-to-uno-plaza-right-270deg-v41';
}

function faceCamera() {
  if (!gatekeeper?.root || !activeRuntime?.camera) return;
  const p = gatekeeper.root.position;
  const c = activeRuntime.camera.position;
  // This is the only runtime writer of the exterior gatekeeper's Y rotation.
  // The source rig's visible forward axis is opposite Three.js +Z.
  gatekeeper.root.rotation.y = Math.atan2(c.x - p.x, c.z - p.z) + Math.PI;
  document.body.dataset.castleJesterFacing = 'camera-single-owner-v60';
}

function placeAtGate(castleRoot) {
  if (!gatekeeper || !castleRoot || gatekeeper.clicked || !isExterior()) return;
  alignCastleToPlaza(castleRoot);
  const box = new THREE.Box3().setFromObject(castleRoot);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  gatekeeper.root.position.set(
    center.x,
    box.min.y + 0.04,
    box.max.z + Math.max(1.05, size.z * 0.038),
  );
  faceCamera();
  document.body.dataset.castleJesterPlacement = 'front-gate-facing-camera-v60';
  document.body.dataset.castleJesterGatePosition = [
    gatekeeper.root.position.x.toFixed(2),
    gatekeeper.root.position.y.toFixed(2),
    gatekeeper.root.position.z.toFixed(2),
  ].join(',');
}

function stop(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

function activateSingleClick(event, canvas) {
  if (!isExterior() || !gatekeeper?.hitTest(event)) return false;
  document.body.dataset.castleJesterGesture = 'single-click';
  if (!gatekeeper.click(event)) return false;
  gatekeeper.enterDispatched = true;
  gatekeeper.clearHover();
  canvas.style.cursor = '';
  requestEntrance();
  return true;
}

function installPointerHandlers(canvas) {
  if (canvas.dataset.castleJesterPointerHandlers === 'true') return;
  canvas.dataset.castleJesterPointerHandlers = 'true';

  canvas.addEventListener('pointerdown', event => {
    if (!isExterior()) return;
    const jester = gatekeeper?.hitTest(event) === true;
    pointerDown = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      jester,
      moved: false,
    };
    if (jester) {
      stop(event);
      canvas.style.cursor = 'pointer';
    }
  }, true);

  canvas.addEventListener('pointermove', event => {
    if (!isExterior()) return;
    if (pointerDown && pointerDown.pointerId === event.pointerId) {
      if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > MOVE_SLOP_PX) {
        pointerDown.moved = true;
      }
      if (pointerDown.jester) {
        stop(event);
        return;
      }
    }
    const hover = gatekeeper?.setHover(event) === true;
    canvas.style.cursor = hover ? 'pointer' : '';
  }, true);

  canvas.addEventListener('pointerup', event => {
    if (!isExterior()) {
      pointerDown = null;
      return;
    }
    const down = pointerDown;
    pointerDown = null;
    if (!down || down.pointerId !== event.pointerId || !down.jester || down.moved) return;
    if (activateSingleClick(event, canvas)) stop(event);
  }, true);

  canvas.addEventListener('pointercancel', () => {
    pointerDown = null;
    gatekeeper?.clearHover();
    canvas.style.cursor = '';
  }, true);
  canvas.addEventListener('pointerleave', () => {
    if (!pointerDown) {
      gatekeeper?.clearHover();
      canvas.style.cursor = '';
    }
  }, true);
  canvas.addEventListener('click', event => {
    if (!isExterior()) return;
    if (activateSingleClick(event, canvas)) stop(event);
  }, true);
}

function animate(now) {
  const delta = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
  previousTime = now;
  if (gatekeeper) {
    const exterior = isExterior();
    gatekeeper.setVisible(exterior);
    if (exterior && !gatekeeper.clicked) {
      placeAtGate(activeRuntime?.castleRoot);
      gatekeeper.update(delta);
      // Gatekeeper pose animation may touch root rotation internally. Reassert
      // the single stable camera-facing orientation once, at frame end.
      faceCamera();
    } else if (exterior) {
      gatekeeper.update(delta);
    }
  }
  frame = requestAnimationFrame(animate);
}

function install(runtime) {
  if (!runtime?.scene || !runtime?.camera || !runtime?.renderer) return;
  if (activeRuntime === runtime && gatekeeper) {
    installPointerHandlers(runtime.renderer.domElement);
    return;
  }
  activeRuntime = runtime;
  alignCastleToPlaza(runtime.castleRoot);
  if (gatekeeper) gatekeeper.dispose();
  gatekeeper = new CastleJesterGatekeeper({
    scene: runtime.scene,
    camera: runtime.camera,
    renderer: runtime.renderer,
    onEnterRequested: requestEntrance,
    modelUrl,
  });
  gatekeeper.setVisible(isExterior());
  installPointerHandlers(runtime.renderer.domElement);
  document.body.dataset.castleJesterIntegration = 'active-single-owner-v60';
  if (!frame) {
    previousTime = performance.now();
    frame = requestAnimationFrame(animate);
  }
}

function tryInstall() {
  const runtime = window.__castleSearchRuntime;
  if (runtime) {
    install(runtime);
    return true;
  }
  return false;
}

window.addEventListener('castleRuntimeReady', () => tryInstall(), { passive: true });
if (!tryInstall()) {
  let attempts = 0;
  const timer = setInterval(() => {
    if (tryInstall() || attempts++ > 160) clearInterval(timer);
  }, 100);
}

let previousSceneMode = document.body.dataset.sceneMode || 'exterior';

function restartExteriorJester() {
  if (!isExterior() || !gatekeeper) return;
  gatekeeper.restartLoop?.();
  placeAtGate(activeRuntime?.castleRoot);
  gatekeeper.setVisible(true);
  faceCamera();
  document.body.dataset.castleJesterRestart = 'exterior-return-v60';
}

const sceneModeObserver = new MutationObserver(() => {
  const currentMode = document.body.dataset.sceneMode || 'exterior';
  if (currentMode === previousSceneMode) return;
  const from = previousSceneMode;
  previousSceneMode = currentMode;
  pointerDown = null;
  if (currentMode !== 'exterior') {
    gatekeeper?.setVisible(false);
    gatekeeper?.clearHover();
    if (activeRuntime?.renderer?.domElement) activeRuntime.renderer.domElement.style.cursor = '';
    return;
  }
  if (from !== 'exterior' && currentMode === 'exterior') {
    requestAnimationFrame(restartExteriorJester);
  }
});
sceneModeObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-scene-mode'],
});

window.addEventListener('beforeunload', () => {
  sceneModeObserver.disconnect();
  if (frame) cancelAnimationFrame(frame);
  if (interiorFocusFrame) cancelAnimationFrame(interiorFocusFrame);
  gatekeeper?.dispose();
}, { once: true });
