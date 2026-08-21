import * as THREE from 'three';

// Final scene-grade owner for the Search castle experience.
// Runs after the legacy atmosphere observer so the castle interior is not
// overexposed, and gives the Bureau/laboratory an independent lighting rig.
if (!window.__castleSceneLightingFixInstalled) {
  window.__castleSceneLightingFixInstalled = true;

  const LAB_ENV_URL = new URL(
    '../assets/assets/images/laboratory_environment.png',
    document.baseURI,
  ).href;

  let runtime = null;
  let laboratoryRig = null;
  let laboratoryEnvironment = null;
  let exteriorBackground = null;
  let exteriorFog = null;
  let exteriorExposure = null;
  let exteriorLights = [];
  const exteriorIntensities = new Map();
  let attempts = 0;

  const currentMode = () => document.body.dataset.sceneMode || 'exterior';

  function createLaboratoryRig() {
    if (!runtime?.scene || laboratoryRig) return laboratoryRig;
    const scene = runtime.scene;
    const rig = new THREE.Group();
    rig.name = 'bureau-laboratory-lighting-v1';
    rig.visible = false;

    const add = light => {
      rig.add(light);
      return light;
    };
    const addTargeted = (light, position) => {
      const target = new THREE.Object3D();
      target.position.copy(position);
      rig.add(target);
      light.target = target;
      rig.add(light);
      return light;
    };

    // Dark scholarly base: cool stone/steel ambience, with restrained warm
    // pools around the bureau rather than the exterior castle lighting.
    add(new THREE.AmbientLight(0x526371, 0.46));
    add(new THREE.HemisphereLight(0x8aa6ba, 0x1a120d, 0.68));

    const coolKey = new THREE.DirectionalLight(0x9ec5df, 1.05);
    coolKey.position.set(-12, 20, 16);
    addTargeted(coolKey, new THREE.Vector3(0, 4.5, 0));

    const softFill = new THREE.DirectionalLight(0x718da4, 0.52);
    softFill.position.set(14, 11, 8);
    addTargeted(softFill, new THREE.Vector3(0, 3.5, -2));

    const bureauWarm = new THREE.SpotLight(
      0xe4a45f,
      26,
      34,
      Math.PI / 5.2,
      0.74,
      1.7,
    );
    bureauWarm.position.set(0, 11, 7);
    addTargeted(bureauWarm, new THREE.Vector3(0, 2.7, 0));

    const leftWarm = new THREE.PointLight(0xc77a3e, 12, 18, 1.8);
    leftWarm.position.set(-6, 4.2, 1.5);
    add(leftWarm);

    const rightWarm = new THREE.PointLight(0xc77a3e, 10, 18, 1.8);
    rightWarm.position.set(6, 4.2, 1.5);
    add(rightWarm);

    scene.add(rig);
    laboratoryRig = rig;
    return rig;
  }

  function loadLaboratoryEnvironment() {
    if (laboratoryEnvironment || !runtime?.renderer) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      LAB_ENV_URL,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        laboratoryEnvironment = texture;
        document.body.dataset.laboratoryEnvironment = 'ready-v1';
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

  function balanceInteriorRig() {
    const rig = window.__castleInteriorLightingRig?.group;
    if (!rig) return;
    rig.traverse(object => {
      if (!object?.isLight) return;
      if (object.userData.__balancedBaseIntensity == null) {
        object.userData.__balancedBaseIntensity = object.intensity;
      }
      const base = object.userData.__balancedBaseIntensity;
      if (object.isAmbientLight || object.isHemisphereLight) {
        object.intensity = base * 0.62;
      } else if (object.isDirectionalLight) {
        object.intensity = base * 0.30;
      } else if (object.isSpotLight) {
        object.intensity = base * 0.24;
      } else if (object.isPointLight) {
        object.intensity = base * 0.30;
      }
    });
  }

  function setExteriorLights(enabled) {
    exteriorLights.forEach(light => {
      light.intensity = enabled ? (exteriorIntensities.get(light) ?? light.intensity) : 0;
    });
  }

  function sync() {
    if (!runtime?.scene || !runtime?.renderer) return;
    const scene = runtime.scene;
    const renderer = runtime.renderer;
    const canvas = renderer.domElement;
    const mode = currentMode();
    const mobile = matchMedia('(max-width: 700px)').matches;

    createLaboratoryRig();

    if (mode === 'laboratory') {
      setExteriorLights(false);
      if (window.__castleInteriorLightingRig?.group) {
        window.__castleInteriorLightingRig.group.visible = false;
      }
      laboratoryRig.visible = true;
      renderer.toneMappingExposure = mobile ? 1.42 : 1.34;
      scene.fog = new THREE.FogExp2(0x0b1117, 0.0027);
      if (laboratoryEnvironment) scene.background = laboratoryEnvironment;
      if (canvas) canvas.style.filter = 'contrast(1.04) saturate(.90) brightness(1.00)';
      document.body.dataset.laboratoryLighting = mobile
        ? 'scholarly-cool-warm-balanced-mobile-v1'
        : 'scholarly-cool-warm-balanced-v1';
      document.body.dataset.sceneExposureOwner = 'castle-scene-lighting-fix-v1';
      return;
    }

    laboratoryRig.visible = false;
    delete document.body.dataset.laboratoryLighting;

    if (mode === 'interior') {
      setExteriorLights(false);
      balanceInteriorRig();
      renderer.toneMappingExposure = mobile ? 1.52 : 1.45;
      scene.background = exteriorBackground;
      scene.fog = new THREE.FogExp2(0x0b1824, 0.0032);
      if (canvas) canvas.style.filter = 'contrast(1.03) saturate(.92) brightness(1.00)';
      document.body.dataset.interiorLightingBalance = mobile
        ? 'texture-detail-mobile-v5'
        : 'texture-detail-v5';
      document.body.dataset.sceneExposureOwner = 'castle-scene-lighting-fix-v1';
      return;
    }

    // Exterior: hand ownership back to the original castle scene.
    setExteriorLights(true);
    renderer.toneMappingExposure = exteriorExposure;
    scene.background = exteriorBackground;
    scene.fog = exteriorFog;
    if (canvas) canvas.style.filter = '';
    delete document.body.dataset.interiorLightingBalance;
    delete document.body.dataset.sceneExposureOwner;
  }

  function scheduleSync() {
    // The legacy interior atmosphere observer also reacts to sceneMode. Apply
    // this final grade on the next task so these values remain authoritative.
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

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
    });

    window.addEventListener('resize', scheduleSync);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleSync();
    });

    document.body.dataset.sceneLightingFix = 'installed-v1';
    scheduleSync();
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
