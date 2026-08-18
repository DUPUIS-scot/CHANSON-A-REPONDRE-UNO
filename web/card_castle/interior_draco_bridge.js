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
    '../assets/assets/models/castle_interior.glb',
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
    const target = new THREE.Vector3(0, 3.1, 0);
    let yaw = 0;
    let pitch = 0.12;
    let distance = 11;
    let active = false;
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startYaw = 0;
    let startPitch = 0;

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

    function updateCamera() {
      const cp = Math.cos(pitch);
      camera.position.set(
        target.x + Math.sin(yaw) * cp * distance,
        target.y + Math.sin(pitch) * distance,
        target.z + Math.cos(yaw) * cp * distance,
      );
      camera.lookAt(target);
    }

    function resize() {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (active) renderer.render(scene, camera);
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
          target.set(0, Math.max(1.8, Math.min(4.2, fittedSize.y * 0.22)), 0);
          distance = Math.max(7, Math.min(13, Math.min(fittedSize.x, fittedSize.z) * 0.34));
          updateCamera();
          scene.add(interiorRoot);
          dracoLoader.dispose();
          document.body.dataset.interiorReady = 'true';
          document.body.dataset.interiorDraco = 'ready';
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
      resize();
      renderer.render(scene, camera);
    }

    function showExterior() {
      if (!active) return;
      active = false;
      interiorCanvas.style.display = 'none';
      if (exteriorCanvas) exteriorCanvas.style.display = '';
      document.body.dataset.sceneMode = 'exterior';
    }

    video.addEventListener('ended', () => void showInterior(), true);
    transition.addEventListener(
      'click',
      () => void showInterior(),
      true,
    );
    resetButton?.addEventListener('click', () => {
      if (active) showExterior();
    }, true);
    window.addEventListener(
      'keydown',
      (event) => {
        if (active && event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          showExterior();
        }
      },
      true,
    );

    interiorCanvas.addEventListener('pointerdown', (event) => {
      if (!active) return;
      dragging = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startYaw = yaw;
      startPitch = pitch;
      interiorCanvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    interiorCanvas.addEventListener('pointermove', (event) => {
      if (!active || !dragging || pointerId !== event.pointerId) return;
      yaw = startYaw - (event.clientX - startX) * 0.008;
      pitch = THREE.MathUtils.clamp(
        startPitch + (event.clientY - startY) * 0.006,
        -0.18,
        1.12,
      );
      updateCamera();
      renderer.render(scene, camera);
      event.preventDefault();
    });
    function releasePointer(event) {
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
        distance = THREE.MathUtils.clamp(
          distance + event.deltaY * 0.02,
          4,
          26,
        );
        updateCamera();
        renderer.render(scene, camera);
        event.preventDefault();
      },
      { passive: false },
    );
  }
}
