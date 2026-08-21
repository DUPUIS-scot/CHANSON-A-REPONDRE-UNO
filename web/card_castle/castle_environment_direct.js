(() => {
  if (window.__castleDirectEnvironmentInstalled) return;
  window.__castleDirectEnvironmentInstalled = true;

  let castleLoadingCompleteSent = false;
  function notifyCastleLoadingComplete() {
    if (castleLoadingCompleteSent) return;
    castleLoadingCompleteSent = true;
    try {
      window.parent.postMessage(
        JSON.stringify({ type: 'castleLoadingComplete' }),
        location.origin,
      );
    } catch (_) {}
  }

  function watchCastleLoaderCompletion() {
    const loaderRoot = document.getElementById('castle-jester-loader');
    if (!loaderRoot) {
      notifyCastleLoadingComplete();
      return;
    }
    const observer = new MutationObserver(() => {
      if (!loaderRoot.classList.contains('is-done')) return;
      observer.disconnect();
      notifyCastleLoadingComplete();
    });
    observer.observe(loaderRoot, { attributes: true, attributeFilter: ['class'] });
  }
  watchCastleLoaderCompletion();

  const GROUND_URL = new URL('../assets/assets/images/castle_exterior_ground.png', document.baseURI).href;
  const ATMOSPHERE_URL = new URL('../assets/assets/images/castle_exterior_atmosphere.png', document.baseURI).href;
  const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let attempts = 0;

  function install() {
    const THREE = window.THREE;
    const runtime = window.__castleSearchRuntime;
    if (!THREE || !runtime?.scene || !runtime?.renderer || !runtime?.castleRoot) {
      if (attempts++ < 240) setTimeout(install, 100);
      return;
    }
    if (document.getElementById('castle-direct-environment-marker')) return;

    const marker = document.createElement('meta');
    marker.id = 'castle-direct-environment-marker';
    document.head.appendChild(marker);

    const scene = runtime.scene;
    const generatedGround = [];
    const generatedSky = [];

    for (const child of [...scene.children]) {
      if (!child?.isMesh || child === runtime.castleRoot) continue;
      const type = child.geometry?.type || '';
      if (type === 'CircleGeometry' || type === 'CylinderGeometry' || type === 'TorusGeometry') {
        child.visible = false;
        child.userData.castleGeneratedGroundHidden = true;
        generatedGround.push(child);
      }
      if (type === 'SphereGeometry') {
        child.visible = false;
        child.userData.castleGeneratedSkyHidden = true;
        generatedSky.push(child);
      }
    }

    const group = new THREE.Group();
    group.name = 'castle-direct-exterior-ground';
    scene.add(group);
    window.__castleDirectExteriorEnvironment = group;

    document.body.dataset.exteriorAtmosphere = 'loading-fullscreen-v46';
    document.body.dataset.exteriorEnvironment = 'loading-ground-and-atmosphere-v46';

    const loader = new THREE.TextureLoader();
    let atmosphereTexture = null;
    let groundReady = false;
    let atmosphereReady = false;

    function isExterior() {
      return document.body.dataset.sceneMode !== 'interior' &&
        document.body.dataset.sceneMode !== 'laboratory';
    }

    function applyIOSReferenceExteriorView() {
      if (!isIOS || innerHeight <= innerWidth || !isExterior()) return;
      const orbit = runtime.orbit;
      if (!orbit?.target || typeof runtime.updateOrbit !== 'function') return;
      orbit.yaw = 0;
      orbit.pitch = 0.14;
      orbit.distance = 58;
      orbit.target.set(0, 6.2, 5.5);
      runtime.updateOrbit();
      document.body.dataset.exteriorStartingView = 'ios-portrait-reference-v46';
    }

    function syncSceneMode() {
      const mode = document.body.dataset.sceneMode || 'exterior';
      const exterior = mode !== 'interior' && mode !== 'laboratory';
      group.visible = exterior;

      if (!exterior) {
        generatedSky.forEach(mesh => { mesh.visible = false; });
        scene.background = new THREE.Color(0x010307);
        scene.fog = mode === 'laboratory'
          ? new THREE.FogExp2(0x06101a, 0.0085)
          : new THREE.FogExp2(0x07101a, 0.0075);
        runtime.renderer.toneMappingExposure = mode === 'laboratory' ? 1.15 : 1.25;
        document.body.dataset.directEnvironmentInteriorFog = `owned-${mode}-v46`;
        document.body.dataset.directEnvironmentScene = `${mode}-environment-owned-v46`;
      } else {
        generatedSky.forEach(mesh => { mesh.visible = !atmosphereTexture; });
        scene.background = atmosphereTexture || new THREE.Color(0x02060b);
        scene.fog = new THREE.FogExp2(0x08131e, 0.0062);
        runtime.renderer.toneMappingExposure = 2.05;
        delete document.body.dataset.directEnvironmentInteriorFog;
        document.body.dataset.directEnvironmentScene = atmosphereTexture
          ? 'exterior-fullscreen-atmosphere-v46'
          : 'exterior-fallback-v46';
      }
    }

    const finishIfReady = () => {
      if (!groundReady || !atmosphereReady) return;
      document.body.dataset.exteriorEnvironment = 'ready';
      document.body.dataset.exteriorEnvironmentMode = 'ground-plus-fullscreen-atmosphere-v46';
      syncSceneMode();
      applyIOSReferenceExteriorView();
      window.dispatchEvent(new CustomEvent('castleExteriorEnvironmentReady'));
    };

    loader.load(
      ATMOSPHERE_URL,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        atmosphereTexture = texture;
        atmosphereReady = true;
        document.body.dataset.exteriorAtmosphere = 'fullscreen-ready-v46';
        syncSceneMode();
        finishIfReady();
      },
      undefined,
      error => {
        console.warn('Castle exterior atmosphere failed to load.', error);
        atmosphereReady = true;
        document.body.dataset.exteriorAtmosphere = 'failed';
        if (isExterior()) generatedSky.forEach(mesh => { mesh.visible = true; });
        finishIfReady();
      },
    );

    loader.load(
      GROUND_URL,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(runtime.renderer.capabilities.getMaxAnisotropy(), 4);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;

        const image = texture.image;
        const aspect = image?.width && image?.height ? image.width / image.height : 4 / 3;
        const width = 58;
        const depth = width / Math.max(0.75, aspect);
        const geometry = new THREE.CircleGeometry(width / 2, 96);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          depthWrite: true,
          toneMapped: false,
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.name = 'castle-uploaded-exterior-ground';
        ground.scale.set(1, depth / width, 1);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -0.47, 18);
        ground.renderOrder = -1;
        group.add(ground);

        groundReady = true;
        document.body.dataset.exteriorGround = 'reference-ellipse-v46';
        finishIfReady();
      },
      undefined,
      error => {
        console.warn('Castle exterior ground failed to load.', error);
        groundReady = true;
        document.body.dataset.exteriorGround = 'failed';
        if (isExterior()) generatedGround.forEach(mesh => { mesh.visible = true; });
        finishIfReady();
      },
    );

    document.getElementById('castle-reset')?.addEventListener('click', () => {
      requestAnimationFrame(applyIOSReferenceExteriorView);
    });

    const observer = new MutationObserver(() => {
      syncSceneMode();
      if (isExterior()) requestAnimationFrame(applyIOSReferenceExteriorView);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-scene-mode'] });
    syncSceneMode();
  }

  const start = () => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(install)));
  if (document.body.dataset.rendererStatus === 'ready') start();
  else window.addEventListener('message', event => {
    let message = event.data;
    try { if (typeof message === 'string') message = JSON.parse(message); } catch (_) { return; }
    if (message?.type === 'rendererReady') start();
  });
  setTimeout(install, 1200);
})();

(() => {
  if (window.__castleInteriorCameraAnimationPatchInstalled) return;
  window.__castleInteriorCameraAnimationPatchInstalled = true;

  let interiorMixer = null;
  let animationFrame = 0;
  let lastAnimationTime = performance.now();
  const INTERIOR_ENLARGE_FACTOR = 56 / 34;

  function normalizeName(value) {
    return String(value || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function findNamed(root, preferred, fallback) {
    let exact = null;
    let loose = null;
    root?.traverse?.(object => {
      if (exact) return;
      const name = normalizeName(object.name);
      if (!name) return;
      if (preferred.some(token => name.includes(token))) exact = object;
      else if (!loose && fallback.some(token => name.includes(token))) loose = object;
    });
    return exact || loose;
  }

  function enlargeInteriorOnce() {
    const THREE = window.THREE;
    const runtime = window.__castleSearchRuntime;
    const root = runtime?.interiorRoot;
    if (!THREE || !root || root.userData.castleEnvironmentEnlarged) return;

    root.updateMatrixWorld(true);
    root.scale.multiplyScalar(INTERIOR_ENLARGE_FACTOR);
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const center = bounds.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.y -= bounds.min.y;
    root.position.z -= center.z;
    root.updateMatrixWorld(true);

    root.userData.castleEnvironmentEnlarged = true;
    document.body.dataset.interiorEnvironmentScale = '56-normalized-v46';
    document.body.dataset.interiorEnvironmentScaleFactor = INTERIOR_ENLARGE_FACTOR.toFixed(4);
  }

  function applyBoundsFallbackView(THREE, runtime, root) {
    const bounds = new THREE.Box3().setFromObject(root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const target = sphere.center.clone();
    target.y = THREE.MathUtils.clamp(target.y, 3.2, 9.5);
    runtime.orbit.target.copy(target);
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.12;
    runtime.orbit.distance = THREE.MathUtils.clamp(Math.max(16, sphere.radius * 1.15), 16, 38);
    runtime.updateOrbit();
    document.body.dataset.interiorStartingView = 'bounds-fallback-v46';
    document.body.dataset.interiorCameraAnchor = 'bounds-fallback';
  }

  function applyInteriorReferenceView() {
    if (document.body.dataset.sceneMode !== 'interior') return;
    const THREE = window.THREE;
    const runtime = window.__castleSearchRuntime;
    const root = runtime?.interiorRoot;
    if (!THREE || !runtime?.orbit || !root) return;

    enlargeInteriorOnce();
    root.updateMatrixWorld(true);
    const compressed = findNamed(root, ['compressed (e)', 'compressed(e)', 'compressed e'], ['compressed']);
    const throne = findNamed(root, ['throne', 'trône', 'trone'], ['chair']);
    if (!compressed || !throne) {
      applyBoundsFallbackView(THREE, runtime, root);
      return;
    }

    const compressedPos = new THREE.Vector3();
    const thronePos = new THREE.Vector3();
    compressed.getWorldPosition(compressedPos);
    throne.getWorldPosition(thronePos);
    const horizontalAxis = thronePos.clone().sub(compressedPos);
    horizontalAxis.y = 0;
    if (horizontalAxis.lengthSq() < 1e-5) {
      applyBoundsFallbackView(THREE, runtime, root);
      return;
    }

    const span = horizontalAxis.length();
    horizontalAxis.normalize();
    const target = thronePos.clone();
    target.y = Math.max(compressedPos.y + 1.6, Math.min(thronePos.y + 1.1, compressedPos.y + 4.2));
    const cameraPosition = compressedPos
      .clone()
      .addScaledVector(horizontalAxis, -Math.max(5.5, Math.min(11, span * 0.42)));
    cameraPosition.y = Math.max(1.55, compressedPos.y + 1.35);

    const offset = cameraPosition.clone().sub(target);
    const distance = Math.max(1, offset.length());
    runtime.orbit.target.copy(target);
    runtime.orbit.distance = distance;
    runtime.orbit.pitch = Math.asin(THREE.MathUtils.clamp(offset.y / distance, -0.98, 0.98));
    runtime.orbit.yaw = Math.atan2(offset.x, offset.z);
    runtime.updateOrbit();
    document.body.dataset.interiorStartingView = 'compressed-to-throne-v46';
    document.body.dataset.interiorCameraAnchor = `${compressed.name || 'compressed'} -> ${throne.name || 'throne'}`;
  }

  function selectPrimaryClip(clips) {
    if (!Array.isArray(clips) || !clips.length) return null;
    const preferredTokens = ['jester', 'descent', 'stairs', 'stair', 'walk', 'action', 'take'];
    const preferred = clips.filter(clip => {
      const name = normalizeName(clip?.name);
      return preferredTokens.some(token => name.includes(token));
    });
    const candidates = preferred.length ? preferred : clips;
    return candidates.slice().sort((a, b) => (b?.duration || 0) - (a?.duration || 0))[0] || clips[0];
  }

  function startAnimationLoop() {
    if (animationFrame) return;
    lastAnimationTime = performance.now();
    const tick = now => {
      animationFrame = requestAnimationFrame(tick);
      const delta = Math.min(0.05, Math.max(0, (now - lastAnimationTime) / 1000));
      lastAnimationTime = now;
      if (interiorMixer && document.body.dataset.sceneMode === 'interior') interiorMixer.update(delta);
    };
    animationFrame = requestAnimationFrame(tick);
  }

  async function patchInteriorLoader() {
    try {
      const moduleUrl = new URL('../vendor/GLTFLoader.js', document.baseURI).href;
      const { GLTFLoader } = await import(moduleUrl);
      if (GLTFLoader.prototype.__castleInteriorLoopPatched) return;
      GLTFLoader.prototype.__castleInteriorLoopPatched = true;
      const originalLoad = GLTFLoader.prototype.load;
      GLTFLoader.prototype.load = function(url, onLoad, onProgress, onError) {
        const isInterior = String(url || '').includes('castle_interior_jester_camera_aligned.glb');
        if (!isInterior) return originalLoad.call(this, url, onLoad, onProgress, onError);
        return originalLoad.call(this, url, gltf => {
          onLoad?.(gltf);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const THREE = window.THREE;
            const runtime = window.__castleSearchRuntime;
            const root = runtime?.interiorRoot;
            const primaryClip = selectPrimaryClip(gltf.animations);
            if (THREE && root && primaryClip) {
              interiorMixer?.stopAllAction?.();
              interiorMixer = new THREE.AnimationMixer(root);
              const action = interiorMixer.clipAction(primaryClip);
              action.enabled = true;
              action.clampWhenFinished = false;
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.reset().play();
              document.body.dataset.interiorAnimationPlayback = 'single-primary-loop-v46';
              document.body.dataset.interiorAnimationCount = String(gltf.animations.length);
              document.body.dataset.interiorAnimationSelected = primaryClip.name || 'unnamed-longest';
              startAnimationLoop();
            } else {
              document.body.dataset.interiorAnimationPlayback = 'no-clips';
            }
            enlargeInteriorOnce();
            if (document.body.dataset.sceneMode === 'interior') applyInteriorReferenceView();
          }));
        }, onProgress, onError);
      };
      document.body.dataset.interiorRuntimePatch = 'camera-single-animation-enlarged-v46';
    } catch (error) {
      console.warn('Interior camera/animation patch failed to install.', error);
      document.body.dataset.interiorRuntimePatch = 'failed';
    }
  }

  const sceneObserver = new MutationObserver(() => {
    if (document.body.dataset.sceneMode !== 'interior') return;
    requestAnimationFrame(() => requestAnimationFrame(applyInteriorReferenceView));
  });
  sceneObserver.observe(document.body, { attributes: true, attributeFilter: ['data-scene-mode'] });

  document.getElementById('castle-reset')?.addEventListener('click', () => {
    if (document.body.dataset.sceneMode !== 'interior') return;
    requestAnimationFrame(() => requestAnimationFrame(applyInteriorReferenceView));
  });

  patchInteriorLoader();
})();

(() => {
  if (window.__castleSceneBackgroundsInstalled) return;
  window.__castleSceneBackgroundsInstalled = true;

  const CASTLE_INTERIOR_BACKGROUND_URL = new URL(
    '../assets/assets/images/castle_interior_environment.jpg',
    document.baseURI,
  ).href;
  const LABORATORY_BACKGROUND_URL = new URL(
    '../assets/assets/images/laboratory_environment.png',
    document.baseURI,
  ).href;

  let attempts = 0;
  function installBackgrounds() {
    const THREE = window.THREE;
    const runtime = window.__castleSearchRuntime;
    if (!THREE || !runtime?.scene) {
      if (attempts++ < 240) setTimeout(installBackgrounds, 100);
      return;
    }

    const loader = new THREE.TextureLoader();
    let castleInteriorTexture = null;
    let laboratoryTexture = null;

    function prepare(texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    }

    function apply() {
      const mode = document.body.dataset.sceneMode || 'exterior';
      if (mode === 'laboratory') {
        runtime.scene.background = laboratoryTexture || new THREE.Color(0x010307);
        document.body.dataset.sceneEnvironmentBackground = laboratoryTexture
          ? 'laboratory-environment-v46'
          : 'laboratory-environment-loading-v46';
        return;
      }
      if (mode === 'interior') {
        runtime.scene.background = castleInteriorTexture || new THREE.Color(0x010307);
        document.body.dataset.sceneEnvironmentBackground = castleInteriorTexture
          ? 'castle-interior-environment-v46'
          : 'castle-interior-environment-loading-v46';
      }
    }

    loader.load(
      CASTLE_INTERIOR_BACKGROUND_URL,
      texture => {
        castleInteriorTexture = prepare(texture);
        document.body.dataset.castleInteriorEnvironment = 'ready';
        apply();
      },
      undefined,
      error => {
        console.warn('Castle interior environment background failed to load.', error);
        document.body.dataset.castleInteriorEnvironment = 'failed';
      },
    );

    loader.load(
      LABORATORY_BACKGROUND_URL,
      texture => {
        laboratoryTexture = prepare(texture);
        document.body.dataset.laboratoryEnvironment = 'ready';
        apply();
      },
      undefined,
      error => {
        console.warn('Laboratory environment background failed to load.', error);
        document.body.dataset.laboratoryEnvironment = 'failed';
      },
    );

    const observer = new MutationObserver(() => requestAnimationFrame(apply));
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-scene-mode'] });
    apply();
  }

  setTimeout(installBackgrounds, 100);
})();
