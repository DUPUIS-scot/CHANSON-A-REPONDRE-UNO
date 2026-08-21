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
      if (document.body.dataset.sceneMode !== 'exterior') return;
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
      const exterior = document.body.dataset.sceneMode === 'exterior';
      group.visible = exterior;
      if (!exterior) {
        generatedSky.forEach(mesh => { mesh.visible = false; });
        scene.background = new THREE.Color(0x050506);
        scene.fog = new THREE.FogExp2(0x050506, 0);
        document.body.dataset.directEnvironmentInteriorFog = 'disabled-plain-model-preview';
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
      if (document.body.dataset.sceneMode === 'exterior') {
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
