import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

if (!window.__castleNavigationOverlayInstalled) {
  window.__castleNavigationOverlayInstalled = true;

  const MOVE_SLOP_PX = 5;
  const LABORATORY_URL = new URL(
    '../assets/assets/models/laboratory_interior.glb',
    document.baseURI,
  ).href;
  const LABORATORY_TARGET_SPAN = 50;
  const LABORATORY_LOAD_TIMEOUT_MS = 26000;
  const touches = new Map();
  const keys = new Set();
  let runtime = null;
  let canvas = null;
  let pointerDown = null;
  let pinch = null;
  let keyboardFrame = 0;
  let previousTime = performance.now();
  let laboratoryRoot = null;
  let laboratoryLoadPromise = null;
  let laboratoryBounds = null;
  let sceneObserver = null;

  const sceneMode = () => {
    const mode = document.body.dataset.sceneMode;
    return mode === 'interior' || mode === 'laboratory' ? mode : 'exterior';
  };

  function publishSceneState(mode) {
    document.body.dataset.sceneMode = mode;
    document.body.dataset.castleNavigationScene = mode;
    document.body.dataset.castleSubscene = mode === 'laboratory' ? 'laboratory' : '';
  }

  function limits() {
    if (sceneMode() === 'laboratory') {
      return { minDistance: 3, maxDistance: 82, targetXZ: 32, minY: 0.4, maxY: 24 };
    }
    return sceneMode() === 'interior'
      ? { minDistance: 4.5, maxDistance: 42, targetXZ: 14, minY: 0.5, maxY: 14 }
      : { minDistance: 20, maxDistance: 95, targetXZ: 32, minY: 0, maxY: 26 };
  }

  function clampTarget() {
    if (!runtime?.orbit?.target) return;
    const bounds = limits();
    runtime.orbit.target.x = THREE.MathUtils.clamp(runtime.orbit.target.x, -bounds.targetXZ, bounds.targetXZ);
    runtime.orbit.target.y = THREE.MathUtils.clamp(runtime.orbit.target.y, bounds.minY, bounds.maxY);
    runtime.orbit.target.z = THREE.MathUtils.clamp(runtime.orbit.target.z, -bounds.targetXZ, bounds.targetXZ);
  }

  function refreshCamera() {
    clampTarget();
    runtime?.updateOrbit?.();
  }

  function findCardGroup() {
    return runtime?.scene?.children?.find(
      child => child?.isGroup && child.children?.some(item => item?.userData?.card),
    ) || null;
  }

  function setLaboratoryVisible(visible) {
    if (laboratoryRoot) laboratoryRoot.visible = visible;
  }

  function restoreExterior() {
    if (!runtime) return false;
    setLaboratoryVisible(false);
    if (typeof runtime.switchToExterior === 'function' && runtime.switchToExterior()) {
      publishSceneState('exterior');
      syncBureauControl();
      return true;
    }
    if (runtime.castleRoot) runtime.castleRoot.visible = true;
    if (runtime.interiorRoot) runtime.interiorRoot.visible = false;
    const cardGroup = findCardGroup();
    if (cardGroup) cardGroup.visible = true;
    publishSceneState('exterior');
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.14;
    runtime.orbit.distance = 58;
    runtime.orbit.target.set(0, 6.2, 5.5);
    refreshCamera();
    syncBureauControl();
    return true;
  }

  function restoreInterior() {
    if (!runtime?.interiorRoot) return false;
    setLaboratoryVisible(false);
    if (runtime.castleRoot) runtime.castleRoot.visible = false;
    runtime.interiorRoot.visible = true;
    const cardGroup = findCardGroup();
    if (cardGroup) cardGroup.visible = false;
    publishSceneState('interior');
    if (typeof runtime.setInteriorStartingView === 'function') {
      runtime.setInteriorStartingView();
    } else {
      runtime.orbit.yaw = 0;
      runtime.orbit.pitch = 0.10;
      runtime.orbit.distance = 24;
      runtime.orbit.target.set(0, 7.9, -1.8);
      refreshCamera();
    }
    syncBureauControl();
    return true;
  }

  function createLaboratoryLoader() {
    const loader = new GLTFLoader();
    const DracoLoader = window.DRACOLoader;
    const sharedDraco = window.__castleSharedDraco;
    if (DracoLoader && sharedDraco) {
      const draco = new DracoLoader();
      draco.setDecoderPath(sharedDraco.decoderPath);
      draco.setDecoderConfig({ type: sharedDraco.decoderType });
      if (sharedDraco.workerLimit) draco.setWorkerLimit(sharedDraco.workerLimit);
      loader.setDRACOLoader(draco);
    }
    return loader;
  }

  function normalizeLaboratory(root) {
    root.updateMatrixWorld(true);
    let bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const horizontalSpan = Math.max(size.x, size.z, 0.001);
    const scale = LABORATORY_TARGET_SPAN / horizontalSpan;
    root.scale.multiplyScalar(scale);
    root.updateMatrixWorld(true);

    bounds = new THREE.Box3().setFromObject(root);
    const center = bounds.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.y -= bounds.min.y;
    root.position.z -= center.z;
    root.updateMatrixWorld(true);

    laboratoryBounds = new THREE.Box3().setFromObject(root);
    const normalizedSize = laboratoryBounds.getSize(new THREE.Vector3());
    root.userData.laboratoryNormalized = true;
    root.userData.laboratoryNormalizationScale = scale;
    document.body.dataset.laboratoryNormalization = 'center-floor-span-v46';
    document.body.dataset.laboratoryNormalizationScale = scale.toFixed(5);
    document.body.dataset.laboratoryNormalizedSize = [
      normalizedSize.x.toFixed(2),
      normalizedSize.y.toFixed(2),
      normalizedSize.z.toFixed(2),
    ].join('x');
  }

  async function ensureLaboratoryReady() {
    if (laboratoryRoot) return true;
    if (!runtime?.scene) return false;
    if (!laboratoryLoadPromise) {
      document.body.dataset.laboratoryReady = 'loading';
      document.body.dataset.laboratoryProgress = '0';
      delete document.body.dataset.laboratoryError;
      document.body.dataset.laboratoryAsset = LABORATORY_URL;
      syncBureauControl();
      laboratoryLoadPromise = new Promise((resolve, reject) => {
        let settled = false;
        const fail = error => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          reject(error instanceof Error ? error : new Error(String(error || 'laboratory-load-failed-v74')));
        };
        const timeout = setTimeout(
          () => fail(new Error('laboratory-load-timeout-v74')),
          LABORATORY_LOAD_TIMEOUT_MS,
        );
        createLaboratoryLoader().load(
          LABORATORY_URL,
          gltf => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            document.body.dataset.laboratoryProgress = '100';
            window.__castleSetSceneLoaderProgress?.(100);
            resolve(gltf.scene);
          },
          event => {
            if (settled || !event?.total) return;
            const ratio = Math.min(1, event.loaded / event.total);
            document.body.dataset.laboratoryProgress = String(Math.round(ratio * 100));
            window.__castleSetSceneLoaderProgress?.(12 + ratio * 78);
          },
          fail,
        );
      })
        .then(root => {
          laboratoryRoot = root;
          laboratoryRoot.name = 'BureauOfAI';
          laboratoryRoot.visible = false;
          normalizeLaboratory(laboratoryRoot);
          runtime.scene.add(laboratoryRoot);
          laboratoryBounds = new THREE.Box3().setFromObject(laboratoryRoot);
          document.body.dataset.laboratoryReady = 'true';
          delete document.body.dataset.laboratoryError;
          return true;
        })
        .catch(error => {
          laboratoryLoadPromise = null;
          document.body.dataset.laboratoryReady = 'false';
          document.body.dataset.laboratoryError = String(error?.message || error);
          console.error('Bureau of AI laboratory failed to load.', error);
          return false;
        })
        .finally(syncBureauControl);
    }
    return laboratoryLoadPromise;
  }

  function setLaboratoryStartingView() {
    if (!runtime?.orbit || !laboratoryRoot) return;
    laboratoryBounds = new THREE.Box3().setFromObject(laboratoryRoot);
    const sphere = laboratoryBounds.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center.clone();
    const size = laboratoryBounds.getSize(new THREE.Vector3());
    center.y = THREE.MathUtils.clamp(center.y, 2.2, Math.max(3.5, size.y * 0.56));
    runtime.orbit.target.copy(center);
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.10;
    runtime.orbit.distance = THREE.MathUtils.clamp(
      Math.max(12, Math.max(size.x, size.z) * 0.68),
      12,
      62,
    );
    refreshCamera();
    document.body.dataset.laboratoryStartingView = 'normalized-bounds-v46';
  }

  async function switchToLaboratory() {
    if (!runtime || sceneMode() !== 'interior') return false;
    const ready = await ensureLaboratoryReady();
    if (!ready || !laboratoryRoot) return false;
    if (runtime.castleRoot) runtime.castleRoot.visible = false;
    if (runtime.interiorRoot) runtime.interiorRoot.visible = false;
    const cardGroup = findCardGroup();
    if (cardGroup) cardGroup.visible = false;
    laboratoryRoot.visible = true;
    publishSceneState('laboratory');
    setLaboratoryStartingView();
    syncBureauControl();
    return true;
  }

  function startKeyboardLoop() {
    if (keyboardFrame || !keys.size || !runtime?.camera) return;
    previousTime = performance.now();
    const frame = now => {
      keyboardFrame = 0;
      if (!keys.size || !runtime?.camera || document.hidden) return;
      const delta = Math.min(0.1, Math.max(0, (now - previousTime) / 1000));
      previousTime = now;
      const forward = new THREE.Vector3();
      runtime.camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 0) forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, runtime.camera.up).normalize();
      const move = new THREE.Vector3();
      if (keys.has('w')) move.add(forward);
      if (keys.has('s')) move.sub(forward);
      if (keys.has('d')) move.add(right);
      if (keys.has('a')) move.sub(right);
      if (move.lengthSq()) {
        const speed = sceneMode() === 'exterior' ? 11.5 : sceneMode() === 'laboratory' ? 7.2 : 6.2;
        runtime.orbit.target.add(move.normalize().multiplyScalar(speed * delta));
        refreshCamera();
      }
      keyboardFrame = requestAnimationFrame(frame);
    };
    keyboardFrame = requestAnimationFrame(frame);
  }

  function installPointerNavigation(targetCanvas) {
    if (!targetCanvas || targetCanvas.dataset.castleNavigationBound === 'true') return;
    targetCanvas.dataset.castleNavigationBound = 'true';
    targetCanvas.style.touchAction = 'none';

    targetCanvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') {
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touches.size === 2) {
          const [a, b] = [...touches.values()];
          pinch = {
            distance: Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)),
            orbitDistance: runtime.orbit.distance,
            center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            target: runtime.orbit.target.clone(),
          };
        }
      }
      pointerDown = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        yaw: runtime.orbit.yaw,
        pitch: runtime.orbit.pitch,
        target: runtime.orbit.target.clone(),
        panning: event.button === 1 || event.button === 2 || event.shiftKey,
        moved: false,
      };
      try { targetCanvas.setPointerCapture(event.pointerId); } catch (_) {}
    });

    targetCanvas.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' && touches.has(event.pointerId)) {
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touches.size === 2 && pinch) {
          const [a, b] = [...touches.values()];
          const distance = Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
          const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const bounds = limits();
          runtime.orbit.distance = THREE.MathUtils.clamp(
            pinch.orbitDistance * pinch.distance / distance,
            bounds.minDistance,
            bounds.maxDistance,
          );
          const scale = runtime.orbit.distance * 0.0018;
          const right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 0);
          const up = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 1);
          runtime.orbit.target.copy(pinch.target)
            .addScaledVector(right, -(center.x - pinch.center.x) * scale)
            .addScaledVector(up, (center.y - pinch.center.y) * scale);
          refreshCamera();
          document.body.dataset.castleNavigationGesture = 'pinch-pan-zoom';
          event.preventDefault();
          return;
        }
      }

      const down = pointerDown;
      if (!down || down.pointerId !== event.pointerId || touches.size > 1) return;
      const dx = event.clientX - down.x;
      const dy = event.clientY - down.y;
      if (Math.hypot(dx, dy) > MOVE_SLOP_PX) down.moved = true;
      if (!down.moved) return;

      if (down.panning) {
        const scale = runtime.orbit.distance * 0.0018;
        const right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 1);
        runtime.orbit.target.copy(down.target)
          .addScaledVector(right, -dx * scale)
          .addScaledVector(up, dy * scale);
        document.body.dataset.castleNavigationGesture = 'pan';
      } else {
        runtime.orbit.yaw = down.yaw - dx * 0.008;
        runtime.orbit.pitch = THREE.MathUtils.clamp(down.pitch + dy * 0.006, 0.04, 1.24);
        document.body.dataset.castleNavigationGesture = 'orbit';
      }
      refreshCamera();
      event.preventDefault();
    });

    const release = event => {
      if (event.pointerType === 'touch') {
        touches.delete(event.pointerId);
        if (touches.size < 2) pinch = null;
      }
      if (pointerDown?.pointerId === event.pointerId) pointerDown = null;
    };
    targetCanvas.addEventListener('pointerup', release);
    targetCanvas.addEventListener('pointercancel', release);

    targetCanvas.addEventListener('wheel', event => {
      const bounds = limits();
      runtime.orbit.distance = THREE.MathUtils.clamp(
        runtime.orbit.distance + event.deltaY * 0.025,
        bounds.minDistance,
        bounds.maxDistance,
      );
      refreshCamera();
      document.body.dataset.castleNavigationGesture = 'wheel-zoom';
      event.preventDefault();
    }, { passive: false });

    targetCanvas.addEventListener('contextmenu', event => event.preventDefault());
  }

  function ensureBureauControl() {
    let button = document.getElementById('bureau-of-ai');
    if (button) return button;
    const returnButton = document.getElementById('return-exterior');
    const group = returnButton?.parentElement || document.querySelector('.castle-toolbar-group');
    if (!group) return null;
    button = document.createElement('button');
    button.id = 'bureau-of-ai';
    button.className = 'castle-control';
    button.type = 'button';
    button.setAttribute('aria-label', 'Bureau of AI');
    button.innerHTML = '<span class="control-medallion">AI</span><span class="control-copy"><span class="control-title">BUREAU OF AI</span><span class="control-subtitle">Entrer dans le laboratoire</span></span>';
    group.appendChild(button);
    return button;
  }

  function syncBureauControl() {
    const button = ensureBureauControl();
    if (!button) return;
    const mode = sceneMode();
    // Compatibility event target only. The rotating medallion owns entry
    // and the dedicated laboratory Back control owns return navigation.
    button.hidden = true;
    button.style.display = 'none';
    button.setAttribute('aria-hidden', 'true');
    document.body.dataset.castleNavigationControls = 'single-authority-v76';
    const medallion = button.querySelector('.control-medallion');
    const title = button.querySelector('.control-title');
    const subtitle = button.querySelector('.control-subtitle');
    const loading = document.body.dataset.laboratoryReady === 'loading';
    button.disabled = loading;
    button.setAttribute('aria-busy', loading ? 'true' : 'false');
    if (mode === 'laboratory') {
      button.setAttribute('aria-label', 'Retour au château intérieur');
      if (medallion) medallion.textContent = '←';
      if (title) title.textContent = 'CHÂTEAU';
      if (subtitle) subtitle.textContent = 'Retour à l’intérieur';
    } else {
      button.setAttribute('aria-label', loading ? 'Chargement du Bureau of AI' : 'Bureau of AI');
      if (medallion) medallion.textContent = loading ? '…' : 'AI';
      if (title) title.textContent = loading ? 'CHARGEMENT…' : 'BUREAU OF AI';
      if (subtitle) subtitle.textContent = loading ? 'Laboratoire en cours de chargement' : 'Entrer dans le laboratoire';
    }
  }

  function installControls() {
    const returnButton = document.getElementById('return-exterior');
    if (returnButton && returnButton.dataset.castleNavigationBound !== 'true') {
      returnButton.dataset.castleNavigationBound = 'true';
      returnButton.addEventListener('click', event => {
        event.preventDefault();
        restoreExterior();
      });
    }

    const bureauButton = ensureBureauControl();
    if (bureauButton && bureauButton.dataset.castleNavigationBound !== 'true') {
      bureauButton.dataset.castleNavigationBound = 'true';
      bureauButton.addEventListener('click', async event => {
        event.preventDefault();
        if (sceneMode() === 'laboratory') {
          restoreInterior();
          return;
        }
        await switchToLaboratory();
      });
    }
    syncBureauControl();

    if (!sceneObserver) {
      sceneObserver = new MutationObserver(syncBureauControl);
      sceneObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
      });
    }
  }

  function install(nextRuntime) {
    if (!nextRuntime?.camera || !nextRuntime?.renderer || !nextRuntime?.orbit) return false;
    runtime = nextRuntime;
    canvas = runtime.renderer.domElement;
    installPointerNavigation(canvas);
    installControls();
    document.body.dataset.castleNavigation = 'orbit-pan-zoom-wasd-bureau-v46';
    document.body.dataset.exteriorNavigation = 'orbit-pan-zoom-wasd';
    document.body.dataset.interiorNavigation = 'orbit-pan-zoom-wasd-bureau';
    document.body.dataset.laboratoryNavigation = 'orbit-pan-zoom-wasd-normalized';
    return true;
  }

  window.addEventListener('keydown', event => {
    const target = event.target;
    if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '')) return;
    if (event.key === 'Escape') {
      if (sceneMode() === 'laboratory' && restoreInterior()) {
        event.preventDefault();
        return;
      }
      if (sceneMode() === 'interior' && restoreExterior()) {
        event.preventDefault();
        return;
      }
    }
    const key = event.key.toLowerCase();
    if (!['w', 'a', 's', 'd'].includes(key)) return;
    keys.add(key);
    startKeyboardLoop();
    event.preventDefault();
  }, true);

  window.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    if (keys.delete(key) && !keys.size && keyboardFrame) {
      cancelAnimationFrame(keyboardFrame);
      keyboardFrame = 0;
    }
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && keyboardFrame) {
      cancelAnimationFrame(keyboardFrame);
      keyboardFrame = 0;
    } else if (!document.hidden && keys.size) {
      startKeyboardLoop();
    }
  });

  // Publish the core laboratory entry for desktop and Android. The dedicated
  // iOS resilience owner is imported first and remains authoritative there.
  window.__castleOpenLaboratory ??= switchToLaboratory;
  window.__castleRestoreInteriorFromLaboratory ??= restoreInterior;

  window.addEventListener('castleRuntimeReady', () => install(window.__castleSearchRuntime));
  if (!install(window.__castleSearchRuntime)) {
    let attempts = 0;
    const timer = setInterval(() => {
      if (install(window.__castleSearchRuntime) || attempts++ > 180) clearInterval(timer);
    }, 100);
  }
}
