import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';

if (!window.__castleInteriorDracoBridgeInstalled) {
  window.__castleInteriorDracoBridgeInstalled = true;

  const root = document.getElementById('scene');
  const video = document.getElementById('castle-entrance-video');
  const transition = document.getElementById('castle-entrance-transition');
  const resetButton = document.getElementById('castle-reset');
  const interiorUrl = new URL(
    '../assets/assets/models/textured-glb-comparison/castle_interior_textured.glb',
    document.baseURI,
  ).href;
  const decoderPath =
    'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/';

  if (root && video && transition) {
    const exteriorCanvas = root.querySelector('canvas');
    const interiorCanvas = document.createElement('canvas');
    interiorCanvas.id = 'castle-interior-draco-canvas';
    interiorCanvas.setAttribute('aria-label', '3D Castle interior');
    Object.assign(interiorCanvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'none',
      zIndex: '1',
      touchAction: 'none',
      background: '#080604',
    });
    root.appendChild(interiorCanvas);

    const renderer = new THREE.WebGLRenderer({
      canvas: interiorCanvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.36;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080604);
    scene.fog = new THREE.FogExp2(0x0c0906, 0.009);

    const camera = new THREE.PerspectiveCamera(49, 1, 0.05, 220);
    const target = new THREE.Vector3(0, 2.75, 0.9);
    const home = {
      target: new THREE.Vector3(0, 2.75, 0.9),
      yaw: 0,
      pitch: 0.028,
      distance: 15.2,
    };
    let yaw = home.yaw;
    let pitch = home.pitch;
    let distance = home.distance;
    let active = false;
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startYaw = 0;
    let startPitch = 0;
    let panning = false;
    let startTarget = target.clone();
    const touches = new Map();
    let pinch = null;
    const keys = new Set();
    let frame = 0;
    let lastFrame = 0;

    scene.add(new THREE.HemisphereLight(0xd5deea, 0x24170e, 2.4));
    scene.add(new THREE.AmbientLight(0xa48668, 0.9));
    const key = new THREE.PointLight(0xffb45f, 52, 34, 1.7);
    key.position.set(0, 7, 8);
    scene.add(key);
    const left = new THREE.PointLight(0xff7b31, 28, 28, 1.9);
    left.position.set(-8, 4, 1);
    scene.add(left);
    const right = new THREE.PointLight(0xffca84, 25, 28, 1.9);
    right.position.set(8, 5, -1);
    scene.add(right);

    function clampTarget() {
      target.x = THREE.MathUtils.clamp(target.x, -12, 12);
      target.y = THREE.MathUtils.clamp(target.y, 0.8, 12);
      target.z = THREE.MathUtils.clamp(target.z, -12, 12);
    }

    function updateCamera() {
      const cp = Math.cos(pitch);
      camera.position.set(
        target.x + Math.sin(yaw) * cp * distance,
        target.y + Math.sin(pitch) * distance,
        target.z + Math.cos(yaw) * cp * distance,
      );
      camera.lookAt(target);
    }

    function renderInterior() {
      if (!active) return;
      updateCamera();
      renderer.render(scene, camera);
    }

    function resize() {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      camera.aspect = width / height;
      const portrait = height > width * 1.08;
      camera.fov = portrait ? 62 : width < 700 ? 55 : 47;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (active) renderer.render(scene, camera);
    }

    function resetInteriorView() {
      target.copy(home.target);
      yaw = home.yaw;
      pitch = home.pitch;
      distance = home.distance;
      renderInterior();
    }

    function animate(now = performance.now()) {
      frame = 0;
      if (!active || document.hidden) return;
      const delta = Math.min(0.25, Math.max(0, (now - (lastFrame || now)) / 1000));
      lastFrame = now;
      if (keys.size) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        const move = new THREE.Vector3();
        if (keys.has('w')) move.add(forward);
        if (keys.has('s')) move.sub(forward);
        if (keys.has('d')) move.add(right);
        if (keys.has('a')) move.sub(right);
        if (move.lengthSq()) {
          target.add(move.normalize().multiplyScalar(Math.max(0.08, delta * 8.4)));
          clampTarget();
        }
      }
      updateCamera();
      renderer.render(scene, camera);
      if (keys.size || dragging || touches.size) frame = requestAnimationFrame(animate);
    }

    function resume() {
      if (!active || document.hidden || frame) return;
      lastFrame = performance.now();
      frame = requestAnimationFrame(animate);
    }

    function pause() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    updateCamera();
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);

    document.body.dataset.interiorModelAsset = interiorUrl;
    document.body.dataset.interiorReady = 'false';
    document.body.dataset.interiorDraco = 'loading';

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(decoderPath);
    dracoLoader.setWorkerLimit(2);
    dracoLoader.preload();
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const interiorPromise = new Promise((resolve, reject) => {
      loader.load(
        interiorUrl,
        (gltf) => {
          const interiorRoot = gltf.scene;
          interiorRoot.traverse((object) => {
            if (!object.isMesh) return;
            object.frustumCulled = false;
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.filter(Boolean).forEach((material) => {
              material.side = THREE.DoubleSide;
              if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                material.roughness = THREE.MathUtils.clamp(
                  material.roughness ?? 0.82,
                  0.58,
                  0.96,
                );
                material.metalness = THREE.MathUtils.clamp(
                  material.metalness ?? 0,
                  0,
                  0.14,
                );
              }
              material.needsUpdate = true;
            });
          });

          const bounds = new THREE.Box3().setFromObject(interiorRoot);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const scale = 34 / Math.max(size.x, size.z, 0.001);
          interiorRoot.scale.setScalar(scale);
          interiorRoot.position.set(
            -center.x * scale,
            -bounds.min.y * scale,
            -center.z * scale,
          );
          interiorRoot.updateMatrixWorld(true);
          const fitted = new THREE.Box3().setFromObject(interiorRoot);
          const fittedSize = fitted.getSize(new THREE.Vector3());
          home.target.set(
            0,
            Math.max(2.05, Math.min(3.15, fittedSize.y * 0.155)),
            Math.min(1.6, fittedSize.z * 0.05),
          );
          home.pitch = 0.028;
          home.distance = Math.max(
            13.8,
            Math.min(18.2, Math.max(fittedSize.x, fittedSize.z) * 0.43),
          );
          target.copy(home.target);
          yaw = home.yaw;
          pitch = home.pitch;
          distance = home.distance;
          updateCamera();
          scene.add(interiorRoot);
          dracoLoader.dispose();
          document.body.dataset.interiorReady = 'true';
          document.body.dataset.interiorDraco = 'ready';
          document.body.dataset.interiorNavigation = 'orbit-pan-zoom-wasd';
          document.body.dataset.interiorHomeView = 'portrait-reference-entrance-aisle';
          document.body.dataset.interiorBounds =
            `${fittedSize.x.toFixed(2)}x${fittedSize.y.toFixed(2)}x${fittedSize.z.toFixed(2)}`;
          resolve(interiorRoot);
        },
        undefined,
        (error) => {
          dracoLoader.dispose();
          document.body.dataset.interiorReady = 'false';
          document.body.dataset.interiorDraco = 'failed';
          document.body.dataset.interiorError = String(error?.message || error);
          reject(error);
        },
      );
    });

    async function showInterior() {
      if (active) return;
      document.body.dataset.sceneMode = 'interior-loading';
      try {
        await interiorPromise;
      } catch (error) {
        console.error('Castle interior Draco preload failed.', error);
        document.body.dataset.sceneMode = 'exterior';
        return;
      }
      if (exteriorCanvas) exteriorCanvas.style.display = 'none';
      interiorCanvas.style.display = 'block';
      document.body.classList.remove('castle-door-hover');
      document.body.dataset.castleDoorHover = 'false';
      document.body.dataset.sceneMode = 'interior';
      active = true;
      resetInteriorView();
      resize();
      renderInterior();
    }

    function showExterior() {
      if (!active) return;
      active = false;
      pause();
      keys.clear();
      touches.clear();
      pinch = null;
      interiorCanvas.style.display = 'none';
      if (exteriorCanvas) exteriorCanvas.style.display = '';
      document.body.dataset.sceneMode = 'exterior';
    }

    video.addEventListener('ended', () => void showInterior(), true);
    transition.addEventListener('click', () => void showInterior(), true);
    resetButton?.addEventListener(
      'click',
      (event) => {
        if (!active) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        resetInteriorView();
      },
      true,
    );

    window.addEventListener(
      'keydown',
      (event) => {
        if (!active) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          showExterior();
          return;
        }
        const keyName = event.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(keyName)) {
          keys.add(keyName);
          resume();
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
    window.addEventListener(
      'keyup',
      (event) => {
        if (!active) return;
        const keyName = event.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(keyName)) {
          keys.delete(keyName);
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else if (active) renderInterior();
    });

    interiorCanvas.addEventListener('pointerdown', (event) => {
      if (!active) return;
      if (event.pointerType === 'touch') {
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touches.size === 2) {
          const [a, b] = [...touches.values()];
          pinch = {
            distance: Math.hypot(a.x - b.x, a.y - b.y),
            orbitDistance: distance,
            center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            target: target.clone(),
          };
        }
      }
      dragging = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startYaw = yaw;
      startPitch = pitch;
      startTarget = target.clone();
      panning = event.button === 1 || event.button === 2 || event.shiftKey;
      interiorCanvas.setPointerCapture(event.pointerId);
      resume();
      event.preventDefault();
    });

    interiorCanvas.addEventListener('pointermove', (event) => {
      if (!active) return;
      if (event.pointerType === 'touch' && touches.has(event.pointerId)) {
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touches.size === 2 && pinch) {
          const [a, b] = [...touches.values()];
          const pinchDistance = Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
          const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          distance = THREE.MathUtils.clamp(
            pinch.orbitDistance * pinch.distance / pinchDistance,
            4,
            26,
          );
          const scale = distance * 0.0018;
          const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
          const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
          target.copy(pinch.target)
            .addScaledVector(right, -(center.x - pinch.center.x) * scale)
            .addScaledVector(up, (center.y - pinch.center.y) * scale);
          clampTarget();
          renderInterior();
          event.preventDefault();
          return;
        }
      }
      if (!dragging || pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (panning) {
        const scale = distance * 0.0018;
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
        target.copy(startTarget)
          .addScaledVector(right, -dx * scale)
          .addScaledVector(up, dy * scale);
        clampTarget();
      } else {
        yaw = startYaw - dx * 0.008;
        pitch = THREE.MathUtils.clamp(startPitch + dy * 0.006, 0.06, 1.18);
      }
      renderInterior();
      event.preventDefault();
    });

    function releasePointer(event) {
      if (event.pointerType === 'touch') {
        touches.delete(event.pointerId);
        if (touches.size < 2) pinch = null;
      }
      if (pointerId !== event.pointerId) return;
      dragging = false;
      pointerId = null;
    }

    interiorCanvas.addEventListener('pointerup', releasePointer);
    interiorCanvas.addEventListener('pointercancel', releasePointer);
    interiorCanvas.addEventListener(
      'wheel',
      (event) => {
        if (!active) return;
        distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.025, 4, 26);
        renderInterior();
        event.preventDefault();
      },
      { passive: false },
    );
    interiorCanvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }
}
