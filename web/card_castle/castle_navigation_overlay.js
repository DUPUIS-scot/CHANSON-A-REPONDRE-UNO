import * as THREE from 'three';

if (!window.__castleNavigationOverlayInstalled) {
  window.__castleNavigationOverlayInstalled = true;

  const MOVE_SLOP_PX = 5;
  const touches = new Map();
  const keys = new Set();
  let runtime = null;
  let canvas = null;
  let pointerDown = null;
  let pinch = null;
  let keyboardFrame = 0;
  let previousTime = performance.now();

  const sceneMode = () => {
    const mode = document.body.dataset.sceneMode;
    return mode === 'interior' || mode === 'bureau' ? mode : 'exterior';
  };

  function limits() {
    return sceneMode() !== 'exterior'
      ? { minDistance: 4.5, maxDistance: 42, targetXZ: 14, minY: 0.5, maxY: 14 }
      : { minDistance: 20, maxDistance: 95, targetXZ: 32, minY: 0, maxY: 26 };
  }

  function clampTarget() {
    if (!runtime?.orbit?.target) return;
    const bounds = limits();
    runtime.orbit.target.x = THREE.MathUtils.clamp(
      runtime.orbit.target.x,
      -bounds.targetXZ,
      bounds.targetXZ,
    );
    runtime.orbit.target.y = THREE.MathUtils.clamp(
      runtime.orbit.target.y,
      bounds.minY,
      bounds.maxY,
    );
    runtime.orbit.target.z = THREE.MathUtils.clamp(
      runtime.orbit.target.z,
      -bounds.targetXZ,
      bounds.targetXZ,
    );
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

  function restoreExterior() {
    if (!runtime) return false;
    if (typeof runtime.switchToExterior === 'function') {
      if (runtime.switchToExterior()) return true;
    }
    if (runtime.castleRoot) runtime.castleRoot.visible = true;
    if (runtime.interiorRoot) runtime.interiorRoot.visible = false;
    const cardGroup = findCardGroup();
    if (cardGroup) cardGroup.visible = true;
    document.body.dataset.sceneMode = 'exterior';
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.14;
    runtime.orbit.distance = 58;
    runtime.orbit.target.set(0, 6.2, 5.5);
    refreshCamera();
    document.body.dataset.castleNavigationScene = 'exterior';
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
        const speed = sceneMode() === 'interior' ? 6.2 : 11.5;
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
        runtime.orbit.pitch = THREE.MathUtils.clamp(
          down.pitch + dy * 0.006,
          0.04,
          1.24,
        );
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

  function installControls() {
    const returnButton = document.getElementById('return-exterior');
    if (returnButton && returnButton.dataset.castleNavigationBound !== 'true') {
      returnButton.dataset.castleNavigationBound = 'true';
      returnButton.addEventListener('click', event => {
        event.preventDefault();
        restoreExterior();
      });
    }
  }

  function install(nextRuntime) {
    if (!nextRuntime?.camera || !nextRuntime?.renderer || !nextRuntime?.orbit) return false;
    runtime = nextRuntime;
    canvas = runtime.renderer.domElement;
    installPointerNavigation(canvas);
    installControls();
    document.body.dataset.castleNavigation = 'orbit-pan-zoom-wasd-v27';
    document.body.dataset.exteriorNavigation = 'orbit-pan-zoom-wasd';
    document.body.dataset.interiorNavigation = 'orbit-pan-zoom-wasd';
    document.body.dataset.bureauNavigation = 'orbit-pan-zoom-wasd';
    return true;
  }

  window.addEventListener('keydown', event => {
    const target = event.target;
    if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '')) return;
    if (event.key === 'Escape' && sceneMode() === 'bureau') {
      if (runtime?.switchToInterior?.()) event.preventDefault();
      return;
    }
    if (event.key === 'Escape' && sceneMode() === 'interior') {
      if (restoreExterior()) event.preventDefault();
      return;
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

  window.addEventListener('castleRuntimeReady', () => install(window.__castleSearchRuntime));
  if (!install(window.__castleSearchRuntime)) {
    let attempts = 0;
    const timer = setInterval(() => {
      if (install(window.__castleSearchRuntime) || attempts++ > 180) clearInterval(timer);
    }, 100);
  }
}
