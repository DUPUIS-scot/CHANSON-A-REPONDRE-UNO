import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
const circusYoutube = document.querySelector('#circus-youtube');
const bandcamp = document.querySelector('#bandcamp');

const scene = new THREE.Scene();
const exteriorBackground = new THREE.Color(0x0d1018);
const exteriorFogColor = new THREE.Color(0x101018);
scene.background = exteriorBackground.clone();
scene.fog = new THREE.FogExp2(exteriorFogColor, 0.0024);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.03, 1200);
let yaw = 0;
let pitch = -0.04;
let movementBounds = null;
let environmentSize = null;
let dragonRoot = null;
let dragonMixer = null;
let exteriorRoot = null;
let fallbackRoot = null;
let circusInterior = null;
let circusSetRoot = null;
let circusSetPromise = null;
let worldMode = 'exterior';
let transitionLockUntil = 0;
const circusGate = new THREE.Vector3(12, 2, -9);
const exteriorReturn = { position: new THREE.Vector3(), yaw: 0, pitch: 0 };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  host.appendChild(renderer.domElement);
} catch (error) {
  console.error('LUBIAK WebGL bootstrap failed.', error);
  status.textContent = '3D UNAVAILABLE';
  throw error;
}

const ambient = new THREE.AmbientLight(0xffead7, 1.15);
const hemi = new THREE.HemisphereLight(0x9bb8e8, 0x6b321b, 2.35);
const moon = new THREE.DirectionalLight(0xbfd6ff, 2.15);
moon.position.set(-24, 48, 30);
const moonFill = new THREE.DirectionalLight(0x7795c9, 1.05);
moonFill.position.set(30, 22, -34);
const circus = new THREE.PointLight(0xffb06a, 155, 210, 1.25);
circus.position.set(0, 14, 0);
const streetFillA = new THREE.PointLight(0xff8a45, 78, 135, 1.35);
streetFillA.position.set(-18, 9, 30);
const streetFillB = new THREE.PointLight(0xffd09a, 66, 125, 1.35);
streetFillB.position.set(18, 8, -28);
const dragonLight = new THREE.PointLight(0xff5a24, 92, 95, 1.4);
scene.add(ambient, hemi, moon, moonFill, circus, streetFillA, streetFillB, dragonLight);

function setStatus(label, pct) {
  status.textContent = label;
  if (Number.isFinite(pct)) bar.style.width = `${THREE.MathUtils.clamp(pct, 0, 100)}%`;
}

function showStatus(label, hideAfter = 1200) {
  status.style.opacity = '1';
  progress.style.opacity = '1';
  setStatus(label, 100);
  if (hideAfter > 0) setTimeout(() => {
    if (status.textContent === label) {
      status.style.opacity = '0';
      progress.style.opacity = '0';
    }
  }, hideAfter);
}

function finishLoad(label = 'ENTER LUBIAK') {
  showStatus(label, 900);
}

function setExteriorVisibility(visible) {
  if (exteriorRoot) exteriorRoot.visible = visible;
  if (fallbackRoot) fallbackRoot.visible = visible;
  if (dragonRoot) dragonRoot.visible = visible;
  moon.visible = visible;
  moonFill.visible = visible;
  circus.visible = visible;
  streetFillA.visible = visible;
  streetFillB.visible = visible;
  dragonLight.visible = visible;
}

function setCircusMediaVisible(visible) {
  if (circusYoutube) circusYoutube.classList.toggle('is-visible', visible);
  if (bandcamp) {
    bandcamp.style.opacity = visible ? '0' : '1';
    bandcamp.style.pointerEvents = visible ? 'none' : 'auto';
  }
}

function makeCircusInterior() {
  if (circusInterior) return circusInterior;

  const group = new THREE.Group();
  group.name = 'LUBIAK_CIRCUS_INTERIOR';
  group.visible = false;

  const cream = new THREE.MeshStandardMaterial({ color: 0xf2d5ad, roughness: 0.78, side: THREE.DoubleSide });
  const orange = new THREE.MeshStandardMaterial({ color: 0xd55b24, roughness: 0.74, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x351712, roughness: 0.92, side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffb25f, emissive: 0x8c2e09, emissiveIntensity: 0.6, roughness: 0.55 });

  const floor = new THREE.Mesh(new THREE.CircleGeometry(23, 64), dark);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  group.add(floor);

  const ring = new THREE.Mesh(new THREE.RingGeometry(6.5, 9.4, 64), orange);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.025;
  group.add(ring);

  const innerRing = new THREE.Mesh(new THREE.CircleGeometry(6.5, 64), cream);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.03;
  group.add(innerRing);

  const wallRadius = 22;
  const panels = 32;
  for (let i = 0; i < panels; i += 1) {
    const a = (i / panels) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.45, 9.5, 0.24), i % 2 ? orange : cream);
    panel.position.set(Math.sin(a) * wallRadius, 4.75, Math.cos(a) * wallRadius);
    panel.rotation.y = a;
    group.add(panel);
  }

  const roof = new THREE.Mesh(new THREE.ConeGeometry(22.3, 17, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0xc85324, roughness: 0.78, side: THREE.BackSide }));
  roof.position.y = 17.7;
  group.add(roof);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 20, 18), gold);
  mast.position.y = 10;
  group.add(mast);

  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const lamp = new THREE.PointLight(i % 2 ? 0xff783d : 0xffd09c, 42, 28, 1.6);
    lamp.position.set(Math.sin(a) * 13.5, 6.5 + (i % 3), Math.cos(a) * 13.5);
    group.add(lamp);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), gold);
    bulb.position.copy(lamp.position);
    group.add(bulb);
  }

  const centreGlow = new THREE.PointLight(0xffa25d, 105, 50, 1.4);
  centreGlow.position.set(0, 12, 0);
  group.add(centreGlow);

  const entryGlow = new THREE.PointLight(0xffd2a0, 68, 24, 1.4);
  entryGlow.position.set(0, 4, 19);
  group.add(entryGlow);

  const exitLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5, 0.45), gold);
  exitLeft.position.set(-2.2, 2.5, 21.4);
  const exitRight = exitLeft.clone();
  exitRight.position.x = 2.2;
  const exitTop = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.45), gold);
  exitTop.position.set(0, 5, 21.4);
  group.add(exitLeft, exitRight, exitTop);

  scene.add(group);
  circusInterior = group;
  return group;
}

async function getMeshoptDecoder() {
  try {
    const module = await import('../vendor/meshopt_decoder.module.js');
    const decoder = module.MeshoptDecoder;
    if (!decoder) throw new Error('MeshoptDecoder export missing');
    await decoder.ready;
    return decoder;
  } catch (error) {
    console.warn('LUBIAK Meshopt decoder unavailable; uncompressed fallback remains enabled.', error);
    return null;
  }
}

function loadGlb(url, decoder, label, reportProgress = true) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    if (decoder) loader.setMeshoptDecoder(decoder);
    loader.load(url, resolve, (xhr) => {
      if (reportProgress && xhr.total) {
        const local = Math.min(99, (xhr.loaded / xhr.total) * 100);
        setStatus(label, local);
      }
    }, reject);
  });
}

async function installCircusSet() {
  if (circusSetRoot) return circusSetRoot;
  if (circusSetPromise) return circusSetPromise;

  circusSetPromise = (async () => {
    try {
      showStatus('LOADING CIRCUS STAGE', 0);
      const decoder = await getMeshoptDecoder();
      const gltf = await loadGlb(
        '/assets/assets/models/lubiak_scene11_web_ultralight.glb?v=20260829-circus-scene11-v1',
        decoder,
        'LOADING CIRCUS STAGE',
        true,
      );
      const root = gltf.scene;
      root.name = 'LUBIAK_CIRCUS_SCENE11';
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      if (box.isEmpty()) throw new Error('Scene 11 GLB has empty bounds');
      const center = box.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -box.min.y + 0.04, -center.z);
      root.rotation.y = 0;
      root.traverse((object) => {
        if (!object.isMesh) return;
        object.frustumCulled = false;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          material.side = THREE.DoubleSide;
          material.needsUpdate = true;
        }
      });
      makeCircusInterior().add(root);
      circusSetRoot = root;
      console.info('LUBIAK Scene 11 installed inside circus', {
        bounds: box.getSize(new THREE.Vector3()).toArray(),
        position: root.position.toArray(),
      });
      if (worldMode === 'circus') showStatus('CIRCUS STAGE READY', 850);
      return root;
    } catch (error) {
      console.warn('LUBIAK optimized circus stage unavailable; procedural circus remains active.', error);
      if (worldMode === 'circus') showStatus('CIRCUS INTERIOR READY', 850);
      return null;
    } finally {
      circusSetPromise = null;
    }
  })();

  return circusSetPromise;
}

function enterCircus() {
  if (worldMode !== 'exterior' || performance.now() < transitionLockUntil) return;
  makeCircusInterior();
  exteriorReturn.position.copy(camera.position);
  exteriorReturn.yaw = yaw;
  exteriorReturn.pitch = pitch;

  worldMode = 'circus';
  transitionLockUntil = performance.now() + 1400;
  setExteriorVisibility(false);
  circusInterior.visible = true;
  scene.background = new THREE.Color(0x160b08);
  scene.fog = new THREE.FogExp2(0x1e0d09, 0.012);
  renderer.toneMappingExposure = 1.45;
  camera.position.set(0, 2.1, 14.5);
  yaw = 0;
  pitch = -0.02;
  movementBounds = new THREE.Box3(new THREE.Vector3(-19, 1.55, -19), new THREE.Vector3(19, 8, 22.5));
  setCircusMediaVisible(true);
  installCircusSet();
  showStatus('INSIDE LUBIAK CIRCUS', 1100);
}

function exitCircus() {
  if (worldMode !== 'circus' || performance.now() < transitionLockUntil) return;
  worldMode = 'exterior';
  transitionLockUntil = performance.now() + 1400;
  if (circusInterior) circusInterior.visible = false;
  setCircusMediaVisible(false);
  setExteriorVisibility(true);
  scene.background = exteriorBackground.clone();
  scene.fog = new THREE.FogExp2(exteriorFogColor, 0.0024);
  renderer.toneMappingExposure = 1.55;
  camera.position.copy(exteriorReturn.position);
  yaw = exteriorReturn.yaw;
  pitch = exteriorReturn.pitch;
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  movementBounds = new THREE.Box3(
    new THREE.Vector3(-env.x * 0.7, 1.55, -env.z * 0.7),
    new THREE.Vector3(env.x * 0.7, Math.max(18, env.y * 1.15), env.z * 0.9),
  );
  showStatus('BACK TO FREAK STREET', 900);
}

function updateCircusTransition() {
  if (performance.now() < transitionLockUntil) return;
  if (worldMode === 'exterior') {
    const dx = camera.position.x - circusGate.x;
    const dz = camera.position.z - circusGate.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 11 && camera.position.y < 9) enterCircus();
  } else if (camera.position.z > 21.2) {
    exitCircus();
  }
}

function makeFallbackDistrict() {
  if (scene.getObjectByName('LUBIAK_FALLBACK_DISTRICT')) return;
  const group = new THREE.Group();
  group.name = 'LUBIAK_FALLBACK_DISTRICT';
  const wall = new THREE.MeshStandardMaterial({ color: 0x70412f, roughness: 0.88 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x261513, roughness: 0.94 });
  const brick = new THREE.MeshStandardMaterial({ color: 0x934c30, roughness: 0.88 });
  const canvas = new THREE.MeshStandardMaterial({ color: 0xe6d5b6, roughness: 0.82 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xcf622d, roughness: 0.78 });

  const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 112), dark);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, 15);
  group.add(road);

  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i += 1) {
      const h = 7 + (i % 3) * 2.1;
      const box = new THREE.Mesh(new THREE.BoxGeometry(10, h, 9), i % 2 ? brick : wall);
      box.position.set(side * 10.5, h / 2, 51 - i * 10.5);
      group.add(box);
    }
  }

  const square = new THREE.Mesh(new THREE.PlaneGeometry(54, 46), dark);
  square.rotation.x = -Math.PI / 2;
  square.position.set(0, 0.015, -25);
  group.add(square);

  const tent = new THREE.Group();
  const tentBody = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 8.5, 32, 1, true), canvas);
  tentBody.position.y = 4.25;
  tent.add(tentBody);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(13.2, 14, 32), orange);
  roof.position.y = 15;
  tent.add(roof);
  tent.position.set(12, 0, -20);
  group.add(tent);

  scene.add(group);
  fallbackRoot = group;
  camera.position.set(0, 3.2, 64);
  environmentSize = new THREE.Vector3(76, 30, 130);
  circus.position.set(12, 12, -20);
  circusGate.set(12, 2, -8.5);
  movementBounds = new THREE.Box3(new THREE.Vector3(-38, 1.55, -58), new THREE.Vector3(38, 18, 72));
  makeCircusInterior();
  finishLoad('ENTER LUBIAK · SAFE MODE');
}

function frameLoadedEnvironment(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return false;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return false;

  root.position.sub(center);
  root.updateMatrixWorld(true);

  root.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      material.depthTest = true;
      material.depthWrite = true;
      material.needsUpdate = true;
    }
  });

  environmentSize = size.clone();
  const eyeHeight = Math.max(1.7, Math.min(size.y * 0.12, 5));
  const distance = Math.max(maxDim * 0.72, size.z * 0.72, 18);
  camera.position.set(0, eyeHeight, distance);
  camera.near = Math.max(0.02, maxDim / 50000);
  camera.far = Math.max(500, maxDim * 8);
  camera.updateProjectionMatrix();
  yaw = 0;
  pitch = -0.035;

  movementBounds = new THREE.Box3(
    new THREE.Vector3(-size.x * 0.7, 1.55, -size.z * 0.7),
    new THREE.Vector3(size.x * 0.7, Math.max(18, size.y * 1.15), size.z * 0.9),
  );
  circus.position.set(size.x * 0.08, Math.max(7, size.y * 0.25), -size.z * 0.08);
  circusGate.set(circus.position.x, 2, circus.position.z + Math.max(9, size.z * 0.075));
  streetFillA.position.set(-size.x * 0.22, Math.max(5, size.y * 0.13), size.z * 0.28);
  streetFillB.position.set(size.x * 0.22, Math.max(5, size.y * 0.13), -size.z * 0.3);
  makeCircusInterior();
  console.info('LUBIAK environment ready', { size: size.toArray(), camera: camera.position.toArray(), circusGate: circusGate.toArray() });
  return true;
}

function prepareDragon(root) {
  root.name = 'LUBIAK_DRAGON_GUARDIAN';
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) throw new Error('Dragon GLB has empty bounds');
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  const targetHeight = Math.max(8, Math.min(env.y * 0.46, env.z * 0.13));
  const scale = targetHeight / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -box.min.y * scale, -env.z * 0.31);
  root.rotation.y = Math.PI;
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    object.userData.isLubiakDragonGuardian = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      material.needsUpdate = true;
    }
  });
  dragonLight.position.set(0, targetHeight * 0.55, root.position.z + targetHeight * 0.35);
}

async function installDragon(decoder) {
  try {
    const gltf = await loadGlb('/assets/assets/models/lubiak_dragon_guardian_web.glb?v=20260829-dragon-anim-v1', decoder, 'SUMMONING DRAGON GUARDIAN', false);
    dragonRoot = gltf.scene;
    prepareDragon(dragonRoot);
    scene.add(dragonRoot);

    dragonMixer = null;
    if (Array.isArray(gltf.animations) && gltf.animations.length > 0) {
      dragonMixer = new THREE.AnimationMixer(dragonRoot);
      for (const clip of gltf.animations) {
        const action = dragonMixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.enabled = true;
        action.play();
      }
      console.info('LUBIAK dragon animation active', gltf.animations.map((clip) => ({ name: clip.name || 'unnamed', duration: clip.duration })));
    } else {
      console.warn('LUBIAK dragon guardian GLB contains no animation clips.');
    }
  } catch (error) {
    dragonRoot = null;
    dragonMixer = null;
    console.warn('LUBIAK dragon guardian unavailable; circus remains accessible.', error);
  }
}

async function installEnvironment() {
  setStatus('STARTING 3D ENGINE', 4);
  const decoder = await getMeshoptDecoder();
  const candidates = [
    { url: '/assets/assets/models/LUBIAK_master_optimized.glb?v=20260829-circus-scene11-v1', label: 'LOADING LUBIAK MASTER', finish: 'ENTER LUBIAK' },
    { url: '/assets/assets/models/LUBIAK.glb?v=20260829-circus-scene11-v1', label: 'LOADING LUBIAK FALLBACK', finish: 'ENTER LUBIAK · RECOVERY MODEL' },
  ];

  for (const candidate of candidates) {
    try {
      setStatus(candidate.label, 8);
      const gltf = await loadGlb(candidate.url, decoder, candidate.label);
      const root = gltf.scene;
      root.name = 'LUBIAK_ENVIRONMENT';
      scene.add(root);
      if (!frameLoadedEnvironment(root)) {
        scene.remove(root);
        throw new Error('GLB scene has invalid or empty bounds');
      }
      exteriorRoot = root;
      await installDragon(decoder);
      finishLoad(candidate.finish);
      return;
    } catch (error) {
      console.error(`${candidate.label} failed.`, error);
    }
  }

  makeFallbackDistrict();
  await installDragon(decoder);
}

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const dragonGateClicks = [];
const DRAGON_GATE_MAX_GAP = 650;
const DRAGON_GATE_MAX_TRAVEL = 72;

function pointerHitsDragon(event) {
  if (!dragonRoot || worldMode !== 'exterior') return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  return raycaster.intersectObject(dragonRoot, true).length > 0;
}

function handleDragonGatePointer(event) {
  if (!event.shiftKey || event.button !== 0 || !pointerHitsDragon(event)) {
    dragonGateClicks.length = 0;
    return false;
  }
  const now = performance.now();
  while (dragonGateClicks.length && now - dragonGateClicks[0].t > DRAGON_GATE_MAX_GAP * 2) dragonGateClicks.shift();
  const first = dragonGateClicks[0];
  if (first && Math.hypot(event.clientX - first.x, event.clientY - first.y) > DRAGON_GATE_MAX_TRAVEL) dragonGateClicks.length = 0;
  dragonGateClicks.push({ t: now, x: event.clientX, y: event.clientY });
  if (dragonGateClicks.length < 3) return true;
  const a = dragonGateClicks[dragonGateClicks.length - 3];
  const b = dragonGateClicks[dragonGateClicks.length - 2];
  const c = dragonGateClicks[dragonGateClicks.length - 1];
  if (b.t - a.t <= DRAGON_GATE_MAX_GAP && c.t - b.t <= DRAGON_GATE_MAX_GAP) {
    dragonGateClicks.length = 0;
    showStatus('ENTERING SILMARI’LLION MEGAPOLE', 0);
    setTimeout(() => location.assign('../megapole/'), 140);
  }
  return true;
}

const keys = new Set();
addEventListener('keydown', (event) => keys.add(event.key.toLowerCase()));
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
let drag = null;
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (handleDragonGatePointer(event)) {
    event.preventDefault();
    return;
  }
  drag = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!drag) return;
  yaw -= (event.clientX - drag.x) * 0.0042;
  pitch -= (event.clientY - drag.y) * 0.0032;
  pitch = THREE.MathUtils.clamp(pitch, -0.78, 0.62);
  drag = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('pointerup', () => { drag = null; });
renderer.domElement.addEventListener('pointercancel', () => { drag = null; });
renderer.domElement.addEventListener('wheel', (event) => {
  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  camera.position.addScaledVector(forward, -Math.sign(event.deltaY) * 1.7);
}, { passive: true });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  if (dragonMixer && worldMode === 'exterior') dragonMixer.update(dt);
  const speed = 9.5 * dt;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
  if (keys.has('w') || keys.has('arrowup')) camera.position.addScaledVector(forward, speed);
  if (keys.has('s') || keys.has('arrowdown')) camera.position.addScaledVector(forward, -speed);
  if (keys.has('a') || keys.has('arrowleft')) camera.position.addScaledVector(right, -speed);
  if (keys.has('d') || keys.has('arrowright')) camera.position.addScaledVector(right, speed);
  if (movementBounds) camera.position.clamp(movementBounds.min, movementBounds.max);
  updateCircusTransition();
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

installEnvironment().catch((error) => {
  console.error('LUBIAK bootstrap failed unexpectedly.', error);
  makeFallbackDistrict();
});