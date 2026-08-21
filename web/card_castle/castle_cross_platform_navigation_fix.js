import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

// Final cross-platform navigation correction for the castle interior and
// Bureau/laboratory. Loaded after the existing navigation and regression
// layers so it can safely override only the behaviours that need correction.
if (!window.__castleCrossPlatformNavigationFixInstalled) {
  window.__castleCrossPlatformNavigationFixInstalled = true;

  const LAB_TOKEN = 'laboratory_interior.glb';
  const INTERIOR_MAX_DISTANCE = 78;
  const PASSAGE_PATTERN = /(?:laboratory|laboratoire|bureau|passage|portal|door|doorway|gate|arch|corridor|entrance|entry|tunnel)/i;
  const STATUE_PATTERN = /(?:walking|walker|statue|figure|robed|metallic|character|human|dee)/i;

  let runtime = null;
  let canvas = null;
  let attempts = 0;
  const touchPointers = new Map();
  let pinch = null;
  let pointerDown = null;

  const mode = () => document.body.dataset.sceneMode || 'exterior';

  // The previous regression layer applies an unconditional X+180° rotation to
  // this GLB. Undo that forced transform before the navigation loader receives
  // the model, preserving the source model's own upright/world orientation.
  if (!GLTFLoader.prototype.__laboratoryOrientationSourceV48) {
    GLTFLoader.prototype.__laboratoryOrientationSourceV48 = true;
    const previousLoad = GLTFLoader.prototype.load;
    GLTFLoader.prototype.load = function(url, onLoad, onProgress, onError) {
      if (!String(url || '').includes(LAB_TOKEN)) {
        return previousLoad.call(this, url, onLoad, onProgress, onError);
      }
      return previousLoad.call(this, url, gltf => {
        const root = gltf?.scene;
        if (root?.userData?.laboratoryUprightV47 && !root.userData.laboratorySourceOrientationV48) {
          root.rotation.x -= Math.PI;
          root.updateMatrixWorld(true);
          root.userData.laboratorySourceOrientationV48 = true;
          document.body.dataset.laboratoryOrientation = 'source-world-orientation-v48';
        }
        onLoad?.(gltf);
      }, onProgress, onError);
    };
  }

  function objectLabel(object) {
    const materials = object?.material
      ? (Array.isArray(object.material) ? object.material : [object.material])
          .map(material => material?.name || '')
          .join(' ')
      : '';
    const ancestors = [];
    let current = object;
    for (let i = 0; current && i < 5; i += 1, current = current.parent) {
      ancestors.push(current.name || '');
    }
    return `${ancestors.join(' ')} ${materials}`.trim();
  }

  function findWalkingStatue(root) {
    if (!root) return null;
    let best = null;
    let bestScore = -Infinity;
    root.traverse(object => {
      if (!(object.isObject3D || object.isMesh || object.isSkinnedMesh)) return;
      const label = objectLabel(object);
      let score = 0;
      if (/walking|walker/i.test(label)) score += 120;
      if (/statue/i.test(label)) score += 100;
      if (/robed|metallic/i.test(label)) score += 75;
      if (/figure|character|human|dee/i.test(label)) score += 50;
      if (object.isSkinnedMesh) score += 65;
      if (object.skeleton) score += 30;
      if (STATUE_PATTERN.test(label)) score += 20;
      if (score > bestScore) {
        bestScore = score;
        best = object;
      }
    });
    return bestScore > 20 ? best : null;
  }

  function focusLaboratoryOnWalkingStatue() {
    if (mode() !== 'laboratory' || !runtime?.orbit || !runtime?.scene) return false;
    const labRoot = runtime.scene.getObjectByName('BureauOfAI');
    if (!labRoot?.visible) return false;

    const statue = findWalkingStatue(labRoot);
    if (!statue) {
      document.body.dataset.laboratoryFocus = 'walking-statue-not-found-v48';
      return false;
    }

    statue.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(statue);
    const target = box.isEmpty()
      ? statue.getWorldPosition(new THREE.Vector3())
      : box.getCenter(new THREE.Vector3());
    const statueSize = box.isEmpty() ? new THREE.Vector3(2, 5, 2) : box.getSize(new THREE.Vector3());

    // Aim directly at the animated figure. Orbit yaw chooses the camera side;
    // the target itself guarantees the first view faces the walking statue.
    runtime.orbit.target.copy(target);
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.10;
    runtime.orbit.distance = THREE.MathUtils.clamp(
      Math.max(12, statueSize.y * 2.2, statueSize.x * 2.8),
      12,
      34,
    );
    runtime.updateOrbit?.();

    document.body.dataset.laboratoryStartingView = 'walking-statue-focus-v48';
    document.body.dataset.laboratoryFocus = statue.name || 'walking-statue-v48';
    return true;
  }

  function scheduleStatueFocus() {
    if (mode() !== 'laboratory') return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!focusLaboratoryOnWalkingStatue()) {
        setTimeout(focusLaboratoryOnWalkingStatue, 180);
        setTimeout(focusLaboratoryOnWalkingStatue, 500);
      }
    }));
  }

  function enterLaboratoryFromPassage() {
    if (mode() !== 'interior') return false;
    const button = document.getElementById('bureau-of-ai');
    if (!button || button.disabled) return false;
    button.click();
    document.body.dataset.laboratoryPassageEntry = 'spatial-hit-v48';
    return true;
  }

  function raycastInteriorPassage(clientX, clientY) {
    if (mode() !== 'interior' || !runtime?.camera || !runtime?.interiorRoot || !canvas) return false;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, runtime.camera);
    const hits = raycaster.intersectObject(runtime.interiorRoot, true);
    for (const hit of hits.slice(0, 8)) {
      if (PASSAGE_PATTERN.test(objectLabel(hit.object))) {
        return enterLaboratoryFromPassage();
      }
    }
    return false;
  }

  function bindCrossPlatformNavigation(targetCanvas) {
    if (!targetCanvas || targetCanvas.dataset.castleCrossPlatformV48 === 'true') return;
    targetCanvas.dataset.castleCrossPlatformV48 = 'true';
    targetCanvas.style.touchAction = 'none';

    // Windows/desktop: intercept interior wheel zoom before the legacy handler,
    // extending the maximum distance from 42 to 78 while preserving direction.
    targetCanvas.addEventListener('wheel', event => {
      if (mode() !== 'interior' || !runtime?.orbit) return;
      runtime.orbit.distance = THREE.MathUtils.clamp(
        runtime.orbit.distance + event.deltaY * 0.025,
        4.5,
        INTERIOR_MAX_DISTANCE,
      );
      runtime.updateOrbit?.();
      document.body.dataset.castleNavigationGesture = 'wheel-zoom-v48';
      document.body.dataset.interiorMaxDistance = String(INTERIOR_MAX_DISTANCE);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });

    // iOS/iPadOS: own two-finger PointerEvent pinch in capture phase so the
    // old 42-unit clamp cannot overwrite the new 78-unit interior range.
    targetCanvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') {
        touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touchPointers.size === 2 && runtime?.orbit) {
          const [a, b] = [...touchPointers.values()];
          pinch = {
            distance: Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)),
            orbitDistance: runtime.orbit.distance,
            center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            target: runtime.orbit.target.clone(),
          };
        }
      }
      pointerDown = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
    }, { capture: true, passive: false });

    targetCanvas.addEventListener('pointermove', event => {
      if (pointerDown?.id === event.pointerId && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 7) {
        pointerDown.moved = true;
      }
      if (event.pointerType !== 'touch' || !touchPointers.has(event.pointerId)) return;
      touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchPointers.size !== 2 || !pinch || mode() !== 'interior' || !runtime?.orbit) return;

      const [a, b] = [...touchPointers.values()];
      const distance = Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      runtime.orbit.distance = THREE.MathUtils.clamp(
        pinch.orbitDistance * pinch.distance / distance,
        4.5,
        INTERIOR_MAX_DISTANCE,
      );

      if (runtime.camera && runtime.orbit.target) {
        const scale = runtime.orbit.distance * 0.0018;
        const right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 1);
        runtime.orbit.target.copy(pinch.target)
          .addScaledVector(right, -(center.x - pinch.center.x) * scale)
          .addScaledVector(up, (center.y - pinch.center.y) * scale);
      }
      runtime.updateOrbit?.();
      document.body.dataset.castleNavigationGesture = 'ios-pinch-pan-zoom-v48';
      document.body.dataset.interiorMaxDistance = String(INTERIOR_MAX_DISTANCE);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });

    const release = event => {
      if (event.pointerType === 'touch') {
        touchPointers.delete(event.pointerId);
        if (touchPointers.size < 2) pinch = null;
      }
      const down = pointerDown;
      if (down?.id === event.pointerId) {
        if (!down.moved && mode() === 'interior') {
          raycastInteriorPassage(event.clientX, event.clientY);
        }
        pointerDown = null;
      }
    };
    targetCanvas.addEventListener('pointerup', release, { capture: true, passive: false });
    targetCanvas.addEventListener('pointercancel', release, { capture: true, passive: false });

    // Safari gesture events can otherwise zoom the page instead of the scene.
    targetCanvas.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
    targetCanvas.addEventListener('gesturechange', event => event.preventDefault(), { passive: false });

    // Desktop spatial inspection: double-clicking a named doorway/passage is a
    // second explicit route into the laboratory, in addition to the toolbar.
    targetCanvas.addEventListener('dblclick', event => {
      if (raycastInteriorPassage(event.clientX, event.clientY)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, { capture: true });

    document.body.dataset.castleCrossPlatformNavigation = 'ios-windows-v48';
  }

  function sync() {
    if (!runtime) runtime = window.__castleSearchRuntime;
    if (!runtime?.renderer?.domElement) return;
    canvas = runtime.renderer.domElement;
    bindCrossPlatformNavigation(canvas);
    if (mode() === 'laboratory') scheduleStatueFocus();
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.renderer?.domElement || !runtime?.orbit) {
      if (attempts++ < 180) setTimeout(install, 100);
      return;
    }
    canvas = runtime.renderer.domElement;
    bindCrossPlatformNavigation(canvas);

    const observer = new MutationObserver(() => {
      sync();
      if (mode() === 'laboratory') scheduleStatueFocus();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
    });

    window.addEventListener('resize', sync);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) sync();
    });

    document.body.dataset.interiorMaxDistance = String(INTERIOR_MAX_DISTANCE);
    sync();
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
