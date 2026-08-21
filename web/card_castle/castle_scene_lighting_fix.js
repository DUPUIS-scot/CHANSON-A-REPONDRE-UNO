import * as THREE from 'three';

// Final lighting owner for Search castle modes.
// Interior is handled by interior_atmosphere_overlay.js.
// Laboratory gets a readable scholarly cool/warm grade without crushing blacks.
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
    const count = matchMedia('(max-width: 700px)').matches ? 260 : 520;
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
      color: 0xc8d5df,
      size: 0.024,
      transparent: true,
      opacity: 0.10,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(geometry, material);
    dust.name = 'laboratory-readable-dust-v3';
    dust.frustumCulled = false;
    rig.add(dust);
    return dust;
  }

  function createLaboratoryRig() {
    if (!runtime?.scene || laboratoryRig) return laboratoryRig;

    const rig = new THREE.Group();
    rig.name = 'bureau-laboratory-readable-scholarly-v3';
    rig.visible = false;

    // Readable cool base: preserve dark mood while exposing stone, wood and steel.
    rig.add(new THREE.AmbientLight(0x526575, 0.44));
    rig.add(new THREE.HemisphereLight(0x90aec1, 0x1b130e, 0.60));

    const coolKey = new THREE.DirectionalLight(0xa5cadd, 1.45);
    coolKey.position.set(-10, 14, -7);
    addTargeted(rig, coolKey, new THREE.Vector3(0, 4.2, 0));

    const coolFill = new THREE.DirectionalLight(0x7598ad, 0.72);
    coolFill.position.set(11, 9, 9);
    addTargeted(rig, coolFill, new THREE.Vector3(0, 3.4, -1));

    const bureauSpot = new THREE.SpotLight(
      0xb7d8e8,
      24,
      34,
      Math.PI / 6.4,
      0.82,
      1.45,
    );
    bureauSpot.position.set(-4, 12, 8);
    addTargeted(rig, bureauSpot, new THREE.Vector3(0, 2.8, 0));

    const edison = new THREE.PointLight(0xffb66e, 15, 12, 2);
    edison.position.set(0, 3.5, 0);
    rig.add(edison);
    flickerLights.push({ light:edison, base:15, phase:0.4, speed:4.8, amount:0.35 });

    [
      [-5.0, 3.2, 1.5, 11, 10, 1.2],
      [5.0, 3.0, 0.8, 10, 10, 2.6],
      [-2.0, 3.6, -5.4, 11, 11, 4.1],
      [4.2, 2.8, -4.0, 9, 9, 5.3],
    ].forEach(([x, y, z, intensity, distance, phase]) => {
      const warm = new THREE.PointLight(0xe18d52, intensity, distance, 2);
      warm.position.set(x, y, z);
      rig.add(warm);
      flickerLights.push({ light:warm, base:intensity, phase, speed:5.2 + phase * 0.2, amount:0.25 });
    });

    const rearRim = new THREE.PointLight(0x7696a9, 8, 12, 2);
    rearRim.position.set(3.5, 4.0, -5.5);
    rig.add(rearRim);

    if (runtime.renderer.shadowMap.enabled) {
      [coolKey, bureauSpot].forEach(light => {
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.near = 0.8;
        light.shadow.camera.far = 60;
        light.shadow.bias = -0.00035;
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
        document.body.dataset.laboratoryEnvironment = 'ready-readable-v3';
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

  function updateAtmosphere(now) {
    const delta = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    const t = now / 1000;

    if (currentMode() === 'laboratory' && laboratoryRig?.visible) {
      flickerLights.forEach(item => {
        const organic =
          Math.sin(t * item.speed + item.phase) * 0.60 +
          Math.sin(t * item.speed * 2.1 + item.phase * 1.4) * 0.25 +
          Math.sin(t * item.speed * 0.5 + item.phase * 2.5) * 0.15;
        item.light.intensity = item.base + organic * item.amount;
      });

      if (laboratoryDust) {
        const attribute = laboratoryDust.geometry.attributes.position;
        const positions = attribute.array;
        const seeds = laboratoryDust.geometry.userData.seeds;
        for (let i = 0; i < seeds.length; i += 1) {
          const i3 = i * 3;
          const seed = seeds[i];
          positions[i3] += Math.sin(t * 0.18 + seed * 9) * delta * 0.007;
          positions[i3 + 1] += delta * (0.010 + seed * 0.008);
          positions[i3 + 2] += Math.cos(t * 0.14 + seed * 7) * delta * 0.006;
          if (positions[i3 + 1] > 10) positions[i3 + 1] = 0;
        }
        attribute.needsUpdate = true;
      }
    }

    requestAnimationFrame(updateAtmosphere);
  }

  function startAnimation() {
    if (animationStarted) return;
    animationStarted = true;
    previousTime = performance.now();
    requestAnimationFrame(updateAtmosphere);
  }

  function sync() {
    if (!runtime?.scene || !runtime?.renderer) return;
    const scene = runtime.scene;
    const renderer = runtime.renderer;
    const canvas = renderer.domElement;
    const mode = currentMode();

    createLaboratoryRig();

    if (mode === 'laboratory') {
      setExteriorLights(false);
      if (window.__castleInteriorLightingRig?.group) {
        window.__castleInteriorLightingRig.group.visible = false;
      }
      laboratoryRig.visible = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.36;
      scene.fog = new THREE.FogExp2(0x101820, 0.0035);
      if (laboratoryEnvironment) scene.background = laboratoryEnvironment;
      if (canvas) canvas.style.filter = 'contrast(1.01) saturate(.96)';
      document.body.dataset.laboratoryLighting = 'readable-scholarly-cool-warm-v3';
      document.body.dataset.sceneExposureOwner = 'laboratory-readable-v3';
      return;
    }

    laboratoryRig.visible = false;
    delete document.body.dataset.laboratoryLighting;

    if (mode === 'interior') {
      setExteriorLights(false);
      window.__castleInteriorLightingRig?.sync?.();
      document.body.dataset.sceneExposureOwner = 'castle-readable-gothic-v6';
      return;
    }

    // Exterior atmosphere/background/fog are owned by the exterior environment module.
    setExteriorLights(true);
    if (window.__castleInteriorLightingRig?.group) {
      window.__castleInteriorLightingRig.group.visible = false;
    }
    if (canvas) canvas.style.filter = '';
    delete document.body.dataset.sceneExposureOwner;
  }

  function scheduleSync() {
    setTimeout(sync, 0);
    setTimeout(sync, 100);
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.scene || !runtime?.renderer) {
      if (attempts++ < 180) setTimeout(install, 100);
      return;
    }

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

    document.body.dataset.sceneLightingFix = 'readable-interior-lab-v3';
    scheduleSync();
  }

  window.addEventListener('castleRuntimeReady', install, { once:true });
  install();
}
