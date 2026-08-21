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
    observer.observe(loaderRoot, {
      attributes: true,
      attributeFilter: ['class'],
    });
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

    // Remove only the generated exterior floor/plaza primitives from the base
    // renderer. Keep every GLB object untouched.
    const generatedGround = [];
    for (const child of [...scene.children]) {
      if (!child?.isMesh || child === runtime.castleRoot) continue;
      const type = child.geometry?.type || '';
      const isGeneratedFloor =
        type === 'CircleGeometry' ||
        type === 'CylinderGeometry' ||
        type === 'TorusGeometry';
      if (!isGeneratedFloor) continue;
      child.visible = false;
      child.userData.castleGeneratedGroundHidden = true;
      generatedGround.push(child);
    }

    // The base renderer also creates one opaque BackSide SphereGeometry sky.
    // Hide only that generated sky so the uploaded atmosphere scene.background
    // is visible. GLB groups/meshes, cards and the jester are untouched.
    const generatedSky = [];
    for (const child of [...scene.children]) {
      if (!child?.isMesh || child === runtime.castleRoot) continue;
      if ((child.geometry?.type || '') !== 'SphereGeometry') continue;
      child.visible = false;
      child.userData.castleGeneratedSkyHidden = true;
      generatedSky.push(child);
    }

    const group = new THREE.Group();
    group.name = 'castle-direct-exterior-ground';
    scene.add(group);
    window.__castleDirectExteriorEnvironment = group;

    document.body.dataset.exteriorAtmosphere = 'loading-fullscreen-v42';
    document.body.dataset.exteriorEnvironment = 'loading-ground-and-atmosphere-v42';

    const loader = new THREE.TextureLoader();
    let atmosphereTexture = null;
    let groundReady = false;
    let atmosphereReady = false;

    // The later iOS portrait override moved the bridge back across the curved
    // CHANSON A REPONDRE title. Restore the authoritative exterior camera used
    // by the reference composition, without changing the ground position.
    function applyIOSReferenceExteriorView() {
      if (!isIOS || innerHeight <= innerWidth) return;
      if (document.body.dataset.sceneMode === 'interior') return;
      const orbit = runtime.orbit;
      if (!orbit?.target || typeof runtime.updateOrbit !== 'function') return;
      orbit.yaw = 0;
      orbit.pitch = 0.14;
      orbit.distance = 58;
      orbit.target.set(0, 6.2, 5.5);
      runtime.updateOrbit();
      document.body.dataset.exteriorStartingView = 'ios-portrait-reference-2-v42';
    }

    const finishIfReady = () => {
      if (!groundReady || !atmosphereReady) return;
      document.body.dataset.exteriorEnvironment = 'ready';
      document.body.dataset.exteriorEnvironmentMode = 'ground-plus-fullscreen-atmosphere-v42-ellipse';
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
        document.body.dataset.exteriorAtmosphere = 'fullscreen-ready-v42';
        syncSceneMode();
        finishIfReady();
      },
      undefined,
      error => {
        console.warn('Castle exterior atmosphere failed to load.', error);
        atmosphereReady = true;
        document.body.dataset.exteriorAtmosphere = 'failed';
        generatedSky.forEach(mesh => { mesh.visible = true; });
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

        // The uploaded ground artwork has black rectangular corners around its
        // oval. Clip the mesh itself to an ellipse so those corners can never
        // mask the full-screen cloud atmosphere behind the Castle.
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
        document.body.dataset.exteriorGround = 'reference-2-ellipse-v42';
        finishIfReady();
      },
      undefined,
      error => {
        console.warn('Castle exterior ground failed to load.', error);
        groundReady = true;
        document.body.dataset.exteriorGround = 'failed';
        generatedGround.forEach(mesh => { mesh.visible = true; });
        finishIfReady();
      },
    );

    function syncSceneMode() {
      const interior = document.body.dataset.sceneMode === 'interior';
      group.visible = !interior;
      if (interior) {
        generatedSky.forEach(mesh => { mesh.visible = false; });
        scene.background = new THREE.Color(0x010307);
        // Interior fog is intentionally owned by interior_atmosphere_overlay.js.
        // Do not assign it here: both runtimes observe the same scene-mode
        // mutation and competing fog writes made iOS interiors unpredictably dark.
        document.body.dataset.directEnvironmentInteriorFog = 'owned-by-interior-lighting';
      } else {
        generatedSky.forEach(mesh => { mesh.visible = !atmosphereTexture; });
        scene.background = atmosphereTexture || new THREE.Color(0x02060b);
        scene.fog = new THREE.FogExp2(0x08131e, 0.0062);
        delete document.body.dataset.directEnvironmentInteriorFog;
      }
      document.body.dataset.directEnvironmentScene = interior
        ? 'interior-hidden'
        : (atmosphereTexture ? 'exterior-fullscreen-atmosphere-sky-hidden' : 'exterior-fallback');
    }

    // The base reset button still invokes the old injected iOS portrait view.
    // Re-apply the reference camera on the next frame after that handler runs.
    document.getElementById('castle-reset')?.addEventListener('click', () => {
      requestAnimationFrame(applyIOSReferenceExteriorView);
    });

    const observer = new MutationObserver(() => {
      syncSceneMode();
      if (document.body.dataset.sceneMode !== 'interior') {
        requestAnimationFrame(applyIOSReferenceExteriorView);
      }
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

  function applyInteriorReferenceView() {
    if (document.body.dataset.sceneMode !== 'interior') return;
    const THREE = window.THREE;
    const runtime = window.__castleSearchRuntime;
    const root = runtime?.interiorRoot;
    if (!THREE || !runtime?.orbit || !root) return;

    root.updateMatrixWorld(true);
    const compressed = findNamed(
      root,
      ['compressed (e)', 'compressed(e)', 'compressed e'],
      ['compressed'],
    );
    const throne = findNamed(root, ['throne', 'trône', 'trone'], ['chair']);
    if (!compressed || !throne) {
      document.body.dataset.interiorStartingView = 'compressed-e-throne-anchor-missing';
      return;
    }

    const compressedPos = new THREE.Vector3();
    const thronePos = new THREE.Vector3();
    compressed.getWorldPosition(compressedPos);
    throne.getWorldPosition(thronePos);

    const horizontalAxis = thronePos.clone().sub(compressedPos);
    horizontalAxis.y = 0;
    if (horizontalAxis.lengthSq() < 1e-5) return;
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
    document.body.dataset.interiorStartingView = 'compressed-e-to-throne-world-axis-v43';
    document.body.dataset.interiorCameraAnchor = `${compressed.name || 'compressed'} -> ${throne.name || 'throne'}`;
  }

  function startAnimationLoop() {
    if (animationFrame) return;
    lastAnimationTime = performance.now();
    const tick = now => {
      animationFrame = requestAnimationFrame(tick);
      const delta = Math.min(0.05, Math.max(0, (now - lastAnimationTime) / 1000));
      lastAnimationTime = now;
      if (interiorMixer && document.body.dataset.sceneMode === 'interior') {
        interiorMixer.update(delta);
      }
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
            if (THREE && root && Array.isArray(gltf.animations) && gltf.animations.length) {
              interiorMixer?.stopAllAction?.();
              interiorMixer = new THREE.AnimationMixer(root);
              gltf.animations.forEach(clip => {
                const action = interiorMixer.clipAction(clip);
                action.enabled = true;
                action.clampWhenFinished = false;
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.reset().play();
              });
              document.body.dataset.interiorAnimationPlayback = 'loop-repeat-v43';
              document.body.dataset.interiorAnimationCount = String(gltf.animations.length);
              startAnimationLoop();
            } else {
              document.body.dataset.interiorAnimationPlayback = 'no-clips';
            }
            if (document.body.dataset.sceneMode === 'interior') applyInteriorReferenceView();
          }));
        }, onProgress, onError);
      };
      document.body.dataset.interiorRuntimePatch = 'camera-plus-loop-v43';
    } catch (error) {
      console.warn('Interior camera/animation patch failed to install.', error);
      document.body.dataset.interiorRuntimePatch = 'failed';
    }
  }

  const sceneObserver = new MutationObserver(() => {
    if (document.body.dataset.sceneMode !== 'interior') return;
    requestAnimationFrame(() => requestAnimationFrame(applyInteriorReferenceView));
  });
  sceneObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-scene-mode'],
  });

  document.getElementById('castle-reset')?.addEventListener('click', () => {
    if (document.body.dataset.sceneMode !== 'interior') return;
    requestAnimationFrame(() => requestAnimationFrame(applyInteriorReferenceView));
  });

  patchInteriorLoader();
})();
