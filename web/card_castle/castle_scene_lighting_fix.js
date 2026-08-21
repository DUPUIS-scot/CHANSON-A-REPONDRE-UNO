import * as THREE from 'three';

// Scene lighting owner for Search castle modes.
// Interior castle = Gothic theatrical rig (owned by interior_atmosphere_overlay.js).
// Laboratory = independent steampunk theatrical rig with warm practicals,
// cool electric/moonlight key, flicker, dust and industrial fog.
if (!window.__castleSceneLightingFixInstalled) {
  window.__castleSceneLightingFixInstalled = true;

  const LAB_ENV_URL = new URL(
    '../assets/assets/images/laboratory_environment.png',
    document.baseURI,
  ).href;

  let runtime = null;
  let laboratoryRig = null;
  let laboratoryDust = null;
  let laboratoryEnvironment = null;
  let exteriorBackground = null;
  let exteriorFog = null;
  let exteriorExposure = null;
  let exteriorLights = [];
  const exteriorIntensities = new Map();
  const flickerLights = [];
  let attempts = 0;
  let animationStarted = false;
  let previousTime = performance.now();

  const currentMode = () => document.body.dataset.sceneMode || 'exterior';

  function addTargeted(rig, light, position) {
    const target = new THREE.Object3D();
    target.position.copy(position);
    rig.add(target);
    light.target = target;
    rig.add(light);
    return light;
  }

  function createLaboratoryDust(rig) {
    const count = matchMedia('(max-width: 700px)').matches ? 420 : 900;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      positions[i3] = THREE.MathUtils.randFloatSpread(24);
      positions[i3 + 1] = Math.random() * 10;
      positions[i3 + 2] = THREE.MathUtils.randFloatSpread(24);
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData.seeds = seeds;

    const material = new THREE.PointsMaterial({
      color: 0xd4b68c,
      size: 0.028,
      transparent: true,
      opacity: 0.20,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const dust = new THREE.Points(geometry, material);
    dust.name = 'laboratory-steampunk-dust-v2';
    dust.frustumCulled = false;
    rig.add(dust);
    return dust;
  }

  function createLaboratoryRig() {
    if (!runtime?.scene || laboratoryRig) return laboratoryRig;

    const rig = new THREE.Group();
    rig.name = 'bureau-laboratory-steampunk-theatrical-v2';
    rig.visible = false;

    // Dim Victorian base: enough to read ironwork and stone without flattening it.
    rig.add(new THREE.AmbientLight(0x26303a, 0.20));
    rig.add(new THREE.HemisphereLight(0x526b78, 0x120b07, 0.26));

    // Cool early-electric / moonlight key.
    const coolKey = new THREE.DirectionalLight(0x78b7c7, 2.05);
    coolKey.position.set(-9, 11, -8);
    addTargeted(rig, coolKey, new THREE.Vector3(0, 3.8, 0));

    // Narrow teal theatrical shaft across bureau/machinery.
    const electricSpot = new THREE.SpotLight(
      0x95cbd5,
      58,
      30,
      Math.PI / 8.2,
      0.72,
      1.35,
    );
    electricSpot.position.set(-5, 12, 8);
    addTargeted(rig, electricSpot, new THREE.Vector3(0, 2.6, 0));

    // Central Edison practical: warm, local, bright enough to bloom only at source.
    const edison = new THREE.PointLight(0xffb766, 38, 10, 2);
    edison.position.set(0, 3.4, 0);
    rig.add(edison);
    flickerLights.push({ light:edison, base:38, phase:0.4, speed:5.2, amount:0.95 });

    // Gaslamp pools around brass fixtures/pipes.
    [
      [-5.2, 3.2, 1.5, 27, 9, 1.2],
      [5.0, 3.0, 0.8, 24, 9, 2.6],
      [-2.0, 3.6, -5.4, 29, 10, 4.1],
      [4.2, 2.8, -4.0, 22, 8, 5.3],
    ].forEach(([x, y, z, intensity, distance, phase]) => {
      const gas = new THREE.PointLight(0xff8f3f, intensity, distance, 2);
      gas.position.set(x, y, z);
      rig.add(gas);
      flickerLights.push({
        light:gas,
        base:intensity,
        phase,
        speed:6.2 + phase * 0.35,
        amount:0.85,
      });
    });

    // Copper/red rear rim for silhouettes and machinery edges.
    const copperRim = new THREE.PointLight(0xa9472e, 15, 9, 2);
    copperRim.position.set(3.5, 2.5, -4.8);
    rig.add(copperRim);

    if (runtime.renderer.shadowMap.enabled) {
      [coolKey, electricSpot, edison].forEach(light => {
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.near = 0.8;
        light.shadow.camera.far = 60;
        light.shadow.bias = -0.0004;
      });
    }

    laboratoryDust = createLaboratoryDust(rig);
    runtime.scene.add(rig);
    laboratoryRig = rig;
    return rig;
  }

  function loadLaboratoryEnvironment() {
    if (laboratoryEnvironment || !runtime?.renderer) return;
    new THREE.TextureLoader().load(
      LAB_ENV_URL,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        laboratoryEnvironment = texture;
        document.body.dataset.laboratoryEnvironment = 'ready-steampunk-v2';
        document.body.dataset.laboratoryEnvironmentAsset = LAB_ENV_URL;
        scheduleSync();
      },
      undefined,
      error => {
        document.body.dataset.laboratoryEnvironment = 'failed';
        document.body.dataset.laboratoryEnvironmentError = String(error?.message || error);
      },
    );
  }

  function setExteriorLights(enabled) {
    exteriorLights.forEach(light => {
      light.intensity = enabled ? (exteriorIntensities.get(light) ?? light.intensity) : 0;
    });
  }

  function updateSteampunkAtmosphere(now) {
    const delta = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    const t = now / 1000;

    if (currentMode() === 'laboratory' && laboratoryRig?.visible) {
      flickerLights.forEach(item => {
        const organic =
          Math.sin(t * item.speed + item.phase) * 0.55 +
          Math.sin(t * item.speed * 2.67 + item.phase * 1.7) * 0.25 +
          Math.sin(t * item.speed * 0.43 + item.phase * 3.1) * 0.20;
        item.light.intensity = item.base + organic * item.amount;
      });

      if (laboratoryDust) {
        const attribute = laboratoryDust.geometry.attributes.position;
        const positions = attribute.array;
        const seeds = laboratoryDust.geometry.userData.seeds;
        for (let i = 0; i < seeds.length; i += 1) {
          const i3 = i * 3;
          const seed = seeds[i];
          positions[i3] += Math.sin(t * 0.20 + seed * 9) * delta * 0.010;
          positions[i3 + 1] += delta * (0.014 + seed * 0.012);
          positions[i3 + 2] += Math.cos(t * 0.15 + seed * 7) * delta * 0.008;
          if (positions[i3 + 1] > 10) positions[i3 + 1] = 0;
        }
        attribute.needsUpdate = true;
      }
    }

    requestAnimationFrame(updateSteampunkAtmosphere);
  }

  function startAnimation() {
    if (animationStarted) return;
    animationStarted = true;
    previousTime = performance.now();
    requestAnimationFrame(updateSteampunkAtmosphere);
  }

  function sync() {
    if (!runtime?.scene || !runtime?.renderer) return;

    const scene = runtime.scene;
    const renderer = runtime.renderer;
    const canvas = renderer.domElement;
    const mode = currentMode();

    createLaboratoryRig();

    // Laboratory owns the full steampunk grade.
    if (mode === 'laboratory') {
      setExteriorLights(false);
      if (window.__castleInteriorLightingRig?.group) {
        window.__castleInteriorLightingRig.group.visible = false;
      }
      laboratoryRig.visible = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.76;
      scene.fog = new THREE.FogExp2(0x080b0d, 0.0090);
      if (laboratoryEnvironment) scene.background = laboratoryEnvironment;
      if (canvas) canvas.style.filter = 'contrast(1.09) saturate(.88) brightness(.97)';
      document.body.dataset.laboratoryLighting = 'steampunk-theatrical-gas-electric-dust-v2';
      document.body.dataset.sceneExposureOwner = 'laboratory-steampunk-v2';
      return;
    }

    laboratoryRig.visible = false;
    delete document.body.dataset.laboratoryLighting;

    // Interior is deliberately left to the dedicated Gothic rig.
    if (mode === 'interior') {
      setExteriorLights(false);
      window.__castleInteriorLightingRig?.sync?.();
      document.body.dataset.sceneExposureOwner = 'castle-gothic-theatrical-v5';
      return;
    }

    // Exterior: restore original scene state.
    setExteriorLights(true);
    if (window.__castleInteriorLightingRig?.group) {
      window.__castleInteriorLightingRig.group.visible = false;
    }
    renderer.toneMappingExposure = exteriorExposure;
    scene.background = exteriorBackground;
    scene.fog = exteriorFog;
    if (canvas) canvas.style.filter = '';
    delete document.body.dataset.sceneExposureOwner;
  }

  function scheduleSync() {
    setTimeout(sync, 0);
    setTimeout(sync, 80);
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.scene || !runtime?.renderer) {
      if (attempts++ < 180) setTimeout(install, 100);
      return;
    }

    exteriorBackground = runtime.scene.background;
    exteriorFog = runtime.scene.fog;
    exteriorExposure = runtime.renderer.toneMappingExposure;
    exteriorLights = runtime.scene.children.filter(object => object?.isLight);
    exteriorLights.forEach(light => exteriorIntensities.set(light, light.intensity));

    createLaboratoryRig();
    loadLaboratoryEnvironment();
    startAnimation();

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
    });

    window.addEventListener('resize', scheduleSync);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleSync();
    });

    document.body.dataset.sceneLightingFix = 'castle-gothic-lab-steampunk-v2';
    scheduleSync();
  }

  window.addEventListener('castleRuntimeReady', install, { once:true });
  install();
}
