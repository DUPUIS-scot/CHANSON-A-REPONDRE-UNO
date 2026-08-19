(() => {
  if (window.__castleDirectEnvironmentInstalled) return;
  window.__castleDirectEnvironmentInstalled = true;

  const GROUND_URL = new URL('../assets/assets/images/castle_exterior_ground.png', document.baseURI).href;
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
    // renderer. Keep the procedural night sky and every GLB object untouched.
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

    const group = new THREE.Group();
    group.name = 'castle-direct-exterior-ground';
    scene.add(group);
    window.__castleDirectExteriorEnvironment = group;

    document.body.dataset.exteriorAtmosphere = 'procedural-sky-only';
    document.body.dataset.exteriorEnvironment = 'loading-ground-only-v33';

    const loader = new THREE.TextureLoader();
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
        const geometry = new THREE.PlaneGeometry(width, depth, 1, 1);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          depthWrite: true,
          toneMapped: false,
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.name = 'castle-uploaded-exterior-ground';
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -0.47, 18);
        ground.renderOrder = -1;
        group.add(ground);

        document.body.dataset.exteriorGround = 'reference-2-ground-only';
        document.body.dataset.exteriorEnvironment = 'ready';
        document.body.dataset.exteriorEnvironmentMode = 'ground-only-direct-v33';
        syncSceneMode();
        window.dispatchEvent(new CustomEvent('castleExteriorEnvironmentReady'));
      },
      undefined,
      error => {
        console.warn('Castle exterior ground failed to load.', error);
        document.body.dataset.exteriorGround = 'failed';
        document.body.dataset.exteriorEnvironment = 'ready';
        generatedGround.forEach(mesh => { mesh.visible = true; });
        window.dispatchEvent(new CustomEvent('castleExteriorEnvironmentReady'));
      },
    );

    function syncSceneMode() {
      const interior = document.body.dataset.sceneMode === 'interior';
      group.visible = !interior;
      if (interior) {
        scene.background = new THREE.Color(0x010307);
        scene.fog = new THREE.FogExp2(0x02060b, 0.012);
      } else {
        // Do not install an exterior atmosphere image. The base renderer's
        // procedural night sky remains the only exterior atmosphere.
        scene.background = new THREE.Color(0x02060b);
        scene.fog = new THREE.FogExp2(0x08131e, 0.0062);
      }
      document.body.dataset.directEnvironmentScene = interior ? 'interior-hidden' : 'exterior-ground-visible';
    }

    const observer = new MutationObserver(syncSceneMode);
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