(() => {
  if (window.__castleDirectEnvironmentInstalled) return;
  window.__castleDirectEnvironmentInstalled = true;

  const GROUND_URL = new URL('../assets/assets/images/castle_exterior_ground.png', document.baseURI).href;
  const ATMOSPHERE_URL = new URL('../assets/assets/images/castle_exterior_atmosphere.png', document.baseURI).href;
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
    const group = new THREE.Group();
    group.name = 'castle-direct-exterior-environment';
    group.renderOrder = -5;
    scene.add(group);
    window.__castleDirectExteriorEnvironment = group;

    const loader = new THREE.TextureLoader();
    let atmosphereTexture = null;
    let remaining = 2;
    document.body.dataset.exteriorEnvironment = 'loading-direct-v31';

    const finishOne = () => {
      remaining -= 1;
      if (remaining > 0) return;
      document.body.dataset.exteriorEnvironment = 'ready';
      document.body.dataset.exteriorEnvironmentMode = 'direct-runtime-v31';
      window.dispatchEvent(new CustomEvent('castleExteriorEnvironmentReady'));
      syncSceneMode();
    };

    loader.load(
      ATMOSPHERE_URL,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        atmosphereTexture = texture;
        document.body.dataset.exteriorAtmosphere = 'uploaded-direct';
        finishOne();
      },
      undefined,
      () => {
        document.body.dataset.exteriorAtmosphere = 'failed';
        finishOne();
      },
    );

    loader.load(
      GROUND_URL,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(runtime.renderer.capabilities.getMaxAnisotropy(), 4);
        texture.needsUpdate = true;
        const geometry = new THREE.PlaneGeometry(82, 62, 1, 1);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          depthWrite: true,
          toneMapped: false,
        });
        const groundMesh = new THREE.Mesh(geometry, material);
        groundMesh.name = 'castle-uploaded-exterior-ground';
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.rotation.z = Math.PI;
        groundMesh.position.set(0, -0.06, 14);
        groundMesh.renderOrder = -2;
        group.add(groundMesh);
        document.body.dataset.exteriorGround = 'uploaded-direct-exterior-only';
        finishOne();
      },
      undefined,
      () => {
        document.body.dataset.exteriorGround = 'failed';
        finishOne();
      },
    );

    function syncSceneMode() {
      const interior = document.body.dataset.sceneMode === 'interior';
      group.visible = !interior;
      if (interior) {
        scene.background = new THREE.Color(0x010307);
        scene.fog = new THREE.FogExp2(0x02060b, 0.012);
      } else {
        if (atmosphereTexture) scene.background = atmosphereTexture;
        scene.fog = new THREE.FogExp2(0x08131e, 0.0062);
      }
      document.body.dataset.directEnvironmentScene = interior ? 'interior-hidden' : 'exterior-visible';
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
