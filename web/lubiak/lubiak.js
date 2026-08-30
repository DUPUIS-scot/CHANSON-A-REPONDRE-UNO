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

let playerRoot = null;
let playerVisual = null;
let broomRoot = null;
let playerReady = false;
let playerMode = 'walk';
let playerVelocity = new THREE.Vector3();
let playerHeading = Math.PI;
let playerBaseY = 0;
let followYaw = 0;
let followPitch = -0.12;
let followDistance = 6.6;
// LUBIAK_AERIAL_CAMERA_V1
let cameraMode = 'follow';
let aerialYaw = 0;
let aerialPitch = -0.28;
let aerialSpeed = 18;
let aerialReturnBlend = 0;
const aerialSaved = { followYaw: 0, followPitch: -0.12, followDistance: 6.6 };
let walkPhase = 0;
let walkBlend = 0;
let mountTransition = 0;
let playerBoneCache = null;
const playerGateClicks = [];
const PLAYER_GATE_MAX_GAP = 650;
const PLAYER_GATE_MAX_TRAVEL = 72;

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
  if (playerRoot) playerRoot.visible = visible;
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
        '/assets/assets/models/lubiak_scene11_web_ultralight.glb?v=20260829-djinn-player-v1',
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
  exteriorReturn.position.copy(playerReady ? playerRoot.position : camera.position);
  exteriorReturn.yaw = playerReady ? followYaw : yaw;
  exteriorReturn.pitch = playerReady ? followPitch : pitch;

  worldMode = 'circus';
  transitionLockUntil = performance.now() + 1400;
  setExteriorVisibility(false);
  circusInterior.visible = true;
  if (playerRoot) playerRoot.visible = true;
  scene.background = new THREE.Color(0x160b08);
  scene.fog = new THREE.FogExp2(0x1e0d09, 0.012);
  renderer.toneMappingExposure = 1.45;
  if (playerReady) {
    playerRoot.position.set(0, 0, 14.5);
    playerBaseY = 0;
  } else {
    camera.position.set(0, 2.1, 14.5);
    yaw = 0;
    pitch = -0.02;
  }
  movementBounds = new THREE.Box3(new THREE.Vector3(-19, 0, -19), new THREE.Vector3(19, 8, 22.5));
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
  if (playerReady) {
    playerRoot.position.copy(exteriorReturn.position);
    playerBaseY = playerRoot.position.y;
    followYaw = exteriorReturn.yaw;
    followPitch = exteriorReturn.pitch;
  } else {
    camera.position.copy(exteriorReturn.position);
    yaw = exteriorReturn.yaw;
    pitch = exteriorReturn.pitch;
  }
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  movementBounds = new THREE.Box3(
    new THREE.Vector3(-env.x * 0.7, 0, -env.z * 0.7),
    new THREE.Vector3(env.x * 0.7, Math.max(18, env.y * 1.15), env.z * 0.9),
  );
  showStatus('BACK TO FREAK STREET', 900);
}

function updateCircusTransition() {
  if (performance.now() < transitionLockUntil) return;
  const p = playerReady ? playerRoot.position : camera.position;
  if (worldMode === 'exterior') {
    const dx = p.x - circusGate.x;
    const dz = p.z - circusGate.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 11 && p.y < 9) enterCircus();
  } else if (p.z > 21.2) {
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
  movementBounds = new THREE.Box3(new THREE.Vector3(-38, 0, -58), new THREE.Vector3(38, 18, 72));
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

  // LUBIAK_PLAZA_DATUM_V2
  // Centre X/Z first, then infer the authored plaza height from mesh bases instead
  // of trusting the scene's absolute minimum (which may be foundations/stray geo).
  root.position.set(-center.x, 0, -center.z);
  root.updateMatrixWorld(true);
  const meshBaseSamples = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    const meshBox = new THREE.Box3().setFromObject(object);
    if (meshBox.isEmpty()) return;
    const h = meshBox.max.y - meshBox.min.y;
    if (!Number.isFinite(meshBox.min.y) || !Number.isFinite(h)) return;
    meshBaseSamples.push(meshBox.min.y);
  });
  meshBaseSamples.sort((a,b) => a-b);
  const q = (arr,p) => arr.length ? arr[Math.max(0, Math.min(arr.length-1, Math.floor((arr.length-1)*p)))] : 0;
  const authoredPlazaY = meshBaseSamples.length >= 6 ? q(meshBaseSamples, 0.35) : box.min.y;
  const PLAZA_Y = 0;
  root.position.y = PLAZA_Y - authoredPlazaY;
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

  // LUBIAK_CIRCUS_GROUND_ZERO_V2
  // Resolve a stable circus branch from labelled descendants, then lift that
  // compact branch as one rigid object to the same plaza datum used everywhere.
  const circusTerms = /circus|big[ _-]?top|bigtop|tent|marquee|foetus|fetus/i;
  const circusRoots = [];
  const maxFootprintX = size.x * 0.48;
  const maxFootprintZ = size.z * 0.48;
  root.traverse((object) => {
    if (object === root || !circusTerms.test(object.name || '')) return;
    let candidate = object;
    let parent = object.parent;
    while (parent && parent !== root) {
      const parentBox = new THREE.Box3().setFromObject(parent);
      const parentSize = parentBox.getSize(new THREE.Vector3());
      if (parentSize.x > maxFootprintX || parentSize.z > maxFootprintZ) break;
      candidate = parent;
      parent = parent.parent;
    }
    if (!circusRoots.includes(candidate)) circusRoots.push(candidate);
  });
  if (circusRoots.length) {
    const uniqueRoots = circusRoots.filter((candidate, index, arr) =>
      !arr.some((other, otherIndex) => otherIndex !== index && candidate.parent && other === candidate.parent)
    );
    const circusBox = new THREE.Box3();
    for (const object of uniqueRoots) circusBox.expandByObject(object);
    if (!circusBox.isEmpty() && circusBox.min.y < PLAZA_Y - 0.03) {
      const lift = PLAZA_Y - circusBox.min.y + 0.04;
      for (const object of uniqueRoots) object.position.y += lift;
      root.updateMatrixWorld(true);
      console.info('LUBIAK circus aligned to plaza datum', { lift, roots: uniqueRoots.map(o => o.name) });
    }
  }

  const eyeHeight = Math.max(1.7, Math.min(size.y * 0.12, 5));
  const distance = Math.max(maxDim * 0.72, size.z * 0.72, 18);
  camera.position.set(0, eyeHeight, distance);
  camera.near = Math.max(0.02, maxDim / 50000);
  camera.far = Math.max(500, maxDim * 8);
  camera.updateProjectionMatrix();
  yaw = 0;
  pitch = -0.035;

  movementBounds = new THREE.Box3(
    new THREE.Vector3(-size.x * 0.7, 0, -size.z * 0.7),
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
    const gltf = await loadGlb('/assets/assets/models/lubiak_dragon_guardian_web.glb?v=20260829-djinn-player-v1', decoder, 'SUMMONING DRAGON GUARDIAN', false);
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
    }
  } catch (error) {
    dragonRoot = null;
    dragonMixer = null;
    console.warn('LUBIAK dragon guardian unavailable; circus remains accessible.', error);
  }
}

function findBone(root, patterns) {
  let hit = null;
  root.traverse((object) => {
    if (hit || !object.isBone) return;
    const name = (object.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (patterns.some((pattern) => name.includes(pattern))) hit = object;
  });
  return hit;
}

function cachePlayerBones() {
  if (!playerVisual) return null;
  playerBoneCache = {
    hips: findBone(playerVisual, ['hips', 'pelvis']),
    chest: findBone(playerVisual, ['upperchest', 'chest', 'spine2', 'spine02', 'spine1']),
    leftLeg: findBone(playerVisual, ['leftupleg', 'leftthigh', 'thighl', 'upperlegl']),
    rightLeg: findBone(playerVisual, ['rightupleg', 'rightthigh', 'thighr', 'upperlegr']),
    leftLowerLeg: findBone(playerVisual, ['leftleg', 'leftcalf', 'calfl', 'lowerlegl']),
    rightLowerLeg: findBone(playerVisual, ['rightleg', 'rightcalf', 'calfr', 'lowerlegr']),
    leftArm: findBone(playerVisual, ['leftarm', 'leftupperarm', 'upperarml']),
    rightArm: findBone(playerVisual, ['rightarm', 'rightupperarm', 'upperarmr']),
    leftForeArm: findBone(playerVisual, ['leftforearm', 'leftlowerarm', 'forearml']),
    rightForeArm: findBone(playerVisual, ['rightforearm', 'rightlowerarm', 'forearmr']),
    leftHand: findBone(playerVisual, ['lefthand', 'handl']),
    rightHand: findBone(playerVisual, ['righthand', 'handr']),
  };
  return playerBoneCache;
}

let broomShoulderSocket = null;
let broomRideStart = null;

function attachBroomToShoulder() {
  if (!playerVisual || !broomRoot) return;
  const bones = playerBoneCache || cachePlayerBones();
  broomShoulderSocket = new THREE.Group();
  broomShoulderSocket.name = 'DA_NOBLE_Y2K_SHOULDER_SOCKET';
  (bones?.chest || playerVisual).add(broomShoulderSocket);

  // Canonical walk pose: shaft physically rests on the right shoulder,
  // engine extending to the rider's left and brush to the right.
  broomShoulderSocket.position.set(0.16, 0.24, -0.02);
  broomShoulderSocket.rotation.set(-0.03, 0.02, -0.07);
  broomShoulderSocket.add(broomRoot);

  broomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(broomRoot);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.001);
  broomRoot.scale.setScalar(2.65 / longest);
  broomRoot.rotation.set(0.03, Math.PI * 0.5, -0.02);
  broomRoot.position.set(-1.08, 0.01, -0.03);
}

function applyWalkCarryPose(blend = 1) {
  const b = playerBoneCache;
  if (!b) return;
  if (b.chest) b.chest.rotation.z = -0.03 * blend;
  if (b.rightArm) {
    b.rightArm.rotation.x = -0.12 * blend;
    b.rightArm.rotation.z = -1.02 * blend;
  }
  if (b.rightForeArm) {
    b.rightForeArm.rotation.x = -0.28 * blend;
    b.rightForeArm.rotation.y = 0.18 * blend;
    b.rightForeArm.rotation.z = -0.74 * blend;
  }
  if (b.rightHand) b.rightHand.rotation.z = -0.18 * blend;
}

function prepareBroomForRide() {
  if (!broomRoot || !playerRoot) return;
  playerRoot.attach(broomRoot);
  broomRideStart = {
    position: broomRoot.position.clone(),
    quaternion: broomRoot.quaternion.clone(),
  };
}

function applyRidePose(t) {
  const b = playerBoneCache;
  if (!b) return;
  const s = THREE.MathUtils.smoothstep(t, 0, 1);
  if (b.chest) {
    b.chest.rotation.x = THREE.MathUtils.lerp(0, -0.22, s);
    b.chest.rotation.z = THREE.MathUtils.lerp(-0.03, 0, s);
  }
  if (b.leftLeg) {
    b.leftLeg.rotation.x = THREE.MathUtils.lerp(0, -0.92, s);
    b.leftLeg.rotation.z = THREE.MathUtils.lerp(0, -0.34, s);
  }
  if (b.rightLeg) {
    b.rightLeg.rotation.x = THREE.MathUtils.lerp(0, -0.92, s);
    b.rightLeg.rotation.z = THREE.MathUtils.lerp(0, 0.34, s);
  }
  if (b.leftLowerLeg) b.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.18, s);
  if (b.rightLowerLeg) b.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.18, s);
  if (b.leftArm) {
    b.leftArm.rotation.x = THREE.MathUtils.lerp(0, -0.72, s);
    b.leftArm.rotation.z = THREE.MathUtils.lerp(0, -0.34, s);
  }
  if (b.rightArm) {
    b.rightArm.rotation.x = THREE.MathUtils.lerp(-0.12, -0.78, s);
    b.rightArm.rotation.z = THREE.MathUtils.lerp(-1.02, 0.30, s);
  }
  if (b.leftForeArm) b.leftForeArm.rotation.x = THREE.MathUtils.lerp(0, -0.78, s);
  if (b.rightForeArm) b.rightForeArm.rotation.x = THREE.MathUtils.lerp(-0.28, -0.84, s);

  if (broomRoot && broomRideStart) {
    const targetPos = new THREE.Vector3(0, 0.88, 0.12);
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.02, 0, 0.03));
    broomRoot.position.lerpVectors(broomRideStart.position, targetPos, s);
    broomRoot.quaternion.slerpQuaternions(broomRideStart.quaternion, targetQuat, s);
  }
}

function preparePlayer(root) {
  playerRoot = new THREE.Group();
  playerRoot.name = 'LUBIAK_DJINN_PLAYER_ROOT';
  playerVisual = root;
  root.name = 'LUBIAK_DJINN_PLAYER';
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) throw new Error('Djinn GLB has empty bounds');
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 1.72 / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    object.userData.isLubiakPlayer = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    }
  });
  playerRoot.add(root);
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  playerRoot.position.set(0, 0.08, Math.min(env.z * 0.34, 42));
  playerBaseY = playerRoot.position.y;
  playerHeading = Math.PI;
  playerRoot.rotation.y = playerHeading;
  scene.add(playerRoot);
  cachePlayerBones();
  playerReady = true;
}

async function installPlayer(decoder) {
  try {
    const gltf = await loadGlb('/assets/assets/models/lubiak_djinn_player_ultralight.glb?v=20260829-djinn-player-v1', decoder, 'CALLING DJINN', false);
    preparePlayer(gltf.scene);
    try {
      const broomGltf = await loadGlb('/assets/assets/models/lubiak_da_noble_y2k_broom_ultralight.glb?v=20260829-djinn-player-v1', decoder, 'PREPARING DA NOBLE Y2K', false);
      broomRoot = broomGltf.scene;
      attachBroomToShoulder();
    } catch (broomError) {
      console.warn('DA NOBLE Y2K broom unavailable; player remains active without broom.', broomError);
    }
    showStatus('DJINN PLAYER READY', 850);
  } catch (error) {
    playerReady = false;
    console.warn('Djinn player unavailable; original free-camera navigation remains active.', error);
  }
}

async function installEnvironment() {
  setStatus('STARTING 3D ENGINE', 4);
  const decoder = await getMeshoptDecoder();
  const candidates = [
    { url: '/assets/assets/models/LUBIAK_master_optimized.glb?v=20260829-djinn-player-v1', label: 'LOADING LUBIAK MASTER', finish: 'ENTER LUBIAK' },
    { url: '/assets/assets/models/LUBIAK.glb?v=20260829-djinn-player-v1', label: 'LOADING LUBIAK FALLBACK', finish: 'ENTER LUBIAK · RECOVERY MODEL' },
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
      await Promise.all([installDragon(decoder), installPlayer(decoder)]);
      finishLoad(candidate.finish);
      return;
    } catch (error) {
      console.error(`${candidate.label} failed.`, error);
    }
  }

  makeFallbackDistrict();
  await Promise.all([installDragon(decoder), installPlayer(decoder)]);
}

const joystick = document.createElement('div');
joystick.id = 'lubiak-sphere-control';
joystick.innerHTML = '<div class="sphere-shell" aria-hidden="true"><div class="sphere-knob"></div></div><span>MOVE</span>';
joystick.setAttribute('role', 'application');
joystick.setAttribute('aria-label', 'LUBIAK spherical movement control');
document.body.appendChild(joystick);
const joystickStyle = document.createElement('style');
joystickStyle.textContent = `
#lubiak-sphere-control{position:fixed;left:22px;bottom:20px;width:118px;height:136px;z-index:60;display:grid;place-items:center;touch-action:none;user-select:none;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.18em;text-shadow:0 1px 4px #0008;opacity:.94}
#lubiak-sphere-control .sphere-shell{position:relative;width:104px;height:104px;border-radius:50%;border:1px solid #f6c28b88;background:radial-gradient(circle at 32% 27%,#fff7 0 4%,#efad6d55 5% 17%,#6d3018bb 48%,#190a06ee 100%);box-shadow:inset -15px -18px 28px #000a,inset 9px 10px 22px #ffb76b2a,0 8px 28px #000a}
#lubiak-sphere-control .sphere-shell:after{content:'';position:absolute;inset:10px;border-radius:50%;border:1px solid #ffd5a72b;box-shadow:inset 0 0 18px #ffb0671f}
#lubiak-sphere-control .sphere-knob{position:absolute;left:50%;top:50%;width:38px;height:38px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 28%,#fff8,#f2ae68 24%,#7c3415 66%,#210b04);box-shadow:0 4px 12px #000b,inset -5px -6px 8px #0008;border:1px solid #ffd7a1aa;will-change:transform}
#lubiak-sphere-control span{position:absolute;bottom:2px;opacity:.78}
@media (max-width:600px){#lubiak-sphere-control{left:12px;bottom:10px;transform:scale(.88);transform-origin:left bottom}}
`;
document.head.appendChild(joystickStyle);

const aerialToggle = document.createElement('button');
aerialToggle.id = 'lubiak-aerial-toggle';
aerialToggle.type = 'button';
aerialToggle.textContent = 'AERIAL';
aerialToggle.setAttribute('aria-label', 'Toggle aerial observation camera');
aerialToggle.style.cssText = 'position:fixed;right:18px;bottom:22px;z-index:70;border:1px solid #f6c28b88;border-radius:999px;padding:10px 14px;background:#160b08dd;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.14em;box-shadow:0 6px 20px #0009;cursor:pointer';
aerialToggle.addEventListener('click', () => setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow'));
document.body.appendChild(aerialToggle);

const joystickVector = new THREE.Vector2();
let joystickPointer = null;
function updateJoystick(event) {
  const shell = joystick.querySelector('.sphere-shell');
  const knob = joystick.querySelector('.sphere-knob');
  const rect = shell.getBoundingClientRect();
  const radius = rect.width * 0.34;
  let x = event.clientX - (rect.left + rect.width / 2);
  let y = event.clientY - (rect.top + rect.height / 2);
  const length = Math.hypot(x, y);
  if (length > radius) {
    x *= radius / length;
    y *= radius / length;
  }
  joystickVector.set(x / radius, -y / radius);
  knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
}

joystick.addEventListener('pointerdown', (event) => {
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
  event.preventDefault();
});
joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystickPointer) updateJoystick(event);
});
function releaseJoystick(event) {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null;
  joystickVector.set(0, 0);
  joystick.querySelector('.sphere-knob').style.transform = 'translate(-50%,-50%)';
}
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);

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

function pointerHitsPlayer(event) {
  if (!playerReady || !playerRoot) return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  return raycaster.intersectObject(playerRoot, true).length > 0;
}

function beginMountTransition() {
  if (!playerReady || playerMode !== 'walk') return;
  playerMode = 'mounting';
  mountTransition = 0;
  playerVelocity.set(0, 0, 0);
  prepareBroomForRide();
  showStatus('DA NOBLE Y2K · MOUNTING', 1100);
}

function handlePlayerGatePointer(event) {
  if (!event.shiftKey || event.button !== 0 || !pointerHitsPlayer(event)) {
    playerGateClicks.length = 0;
    return false;
  }
  const now = performance.now();
  while (playerGateClicks.length && now - playerGateClicks[0].t > PLAYER_GATE_MAX_GAP * 2) playerGateClicks.shift();
  const first = playerGateClicks[0];
  if (first && Math.hypot(event.clientX - first.x, event.clientY - first.y) > PLAYER_GATE_MAX_TRAVEL) playerGateClicks.length = 0;
  playerGateClicks.push({ t: now, x: event.clientX, y: event.clientY });
  if (playerGateClicks.length < 3) return true;
  const a = playerGateClicks[playerGateClicks.length - 3];
  const b = playerGateClicks[playerGateClicks.length - 2];
  const c = playerGateClicks[playerGateClicks.length - 1];
  if (b.t - a.t <= PLAYER_GATE_MAX_GAP && c.t - b.t <= PLAYER_GATE_MAX_GAP) {
    playerGateClicks.length = 0;
    beginMountTransition();
  }
  return true;
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
function setCameraMode(nextMode) {
  if (!playerReady || !playerRoot || nextMode === cameraMode) return;
  if (nextMode === 'aerial') {
    aerialSaved.followYaw = followYaw;
    aerialSaved.followPitch = followPitch;
    aerialSaved.followDistance = followDistance;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    aerialYaw = Math.atan2(-dir.x, -dir.z);
    aerialPitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    cameraMode = 'aerial';
    aerialReturnBlend = 0;
    showStatus('AERIAL OBSERVATION · V TO RETURN', 1200);
  } else {
    cameraMode = 'follow';
    followYaw = aerialSaved.followYaw;
    followPitch = aerialSaved.followPitch;
    followDistance = aerialSaved.followDistance;
    aerialReturnBlend = 1;
    showStatus('RETURNING TO DJINN', 800);
  }
  if (aerialToggle) aerialToggle.textContent = cameraMode === 'aerial' ? 'RETURN' : 'AERIAL';
}

addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'v' && !event.repeat) {
    setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow');
    event.preventDefault();
    return;
  }
  keys.add(key);
});
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
let drag = null;
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (cameraMode === 'follow' && (handlePlayerGatePointer(event) || handleDragonGatePointer(event))) {
    event.preventDefault();
    return;
  }
  drag = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!drag) return;
  if (playerReady && cameraMode === 'aerial') {
    aerialYaw -= (event.clientX - drag.x) * 0.0042;
    aerialPitch -= (event.clientY - drag.y) * 0.0032;
    aerialPitch = THREE.MathUtils.clamp(aerialPitch, -1.32, 1.20);
  } else if (playerReady) {
    followYaw -= (event.clientX - drag.x) * 0.0042;
    followPitch -= (event.clientY - drag.y) * 0.0032;
    followPitch = THREE.MathUtils.clamp(followPitch, -0.58, 0.38);
  } else {
    yaw -= (event.clientX - drag.x) * 0.0042;
    pitch -= (event.clientY - drag.y) * 0.0032;
    pitch = THREE.MathUtils.clamp(pitch, -0.78, 0.62);
  }
  drag = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('pointerup', () => { drag = null; });
renderer.domElement.addEventListener('pointercancel', () => { drag = null; });
renderer.domElement.addEventListener('wheel', (event) => {
  if (playerReady && cameraMode === 'aerial') {
    aerialSpeed = THREE.MathUtils.clamp(aerialSpeed + Math.sign(event.deltaY) * 2.2, 5, 48);
  } else if (playerReady) {
    followDistance = THREE.MathUtils.clamp(followDistance + Math.sign(event.deltaY) * 0.55, 3.4, 11);
  } else {
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    camera.position.addScaledVector(forward, -Math.sign(event.deltaY) * 1.7);
  }
}, { passive: true });

const collisionRaycaster = new THREE.Raycaster();
const collisionOrigins = [
  new THREE.Vector3(0,0.28,0), new THREE.Vector3(0,0.92,0), new THREE.Vector3(0,1.48,0),
];
const PLAYER_COLLISION_RADIUS = 0.34;
const BROOM_COLLISION_RADIUS = 0.28;

function activeCollisionRoots() {
  const roots=[];
  if(worldMode==='exterior') {
    if(exteriorRoot?.visible) roots.push(exteriorRoot);
    if(fallbackRoot?.visible) roots.push(fallbackRoot);
    if(dragonRoot?.visible) roots.push(dragonRoot);
  } else if(worldMode==='circus' && circusInterior?.visible) {
    roots.push(circusInterior);
  }
  return roots;
}

function rayBlocked(origin, direction, distance) {
  if(direction.lengthSq()<1e-8) return false;
  collisionRaycaster.set(origin, direction.clone().normalize());
  collisionRaycaster.near=0;
  collisionRaycaster.far=distance;
  for(const root of activeCollisionRoots()) {
    const hits=collisionRaycaster.intersectObject(root,true);
    if(hits.some(h=>h.distance<=distance)) return true;
  }
  return false;
}

function resolvePlayerCollision(from, to, includeBroom=false) {
  const delta=to.clone().sub(from);
  const dist=delta.length();
  if(dist<1e-6) return to;
  const dir=delta.clone().normalize();
  const probe=dist + PLAYER_COLLISION_RADIUS + (includeBroom?BROOM_COLLISION_RADIUS:0);
  for(const local of collisionOrigins) {
    const origin=from.clone().add(local);
    if(rayBlocked(origin,dir,probe)) return from.clone();
  }
  if(includeBroom && broomRoot) {
    broomRoot.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(broomRoot);
    if(!box.isEmpty()) {
      const c=box.getCenter(new THREE.Vector3());
      if(rayBlocked(c,dir,dist+BROOM_COLLISION_RADIUS)) return from.clone();
    }
  }
  return to;
}

function movePlayerWithCollision(delta, includeBroom=false) {
  if(!playerRoot || delta.lengthSq()<1e-10) return;
  const start=playerRoot.position.clone();
  const desired=start.clone().add(delta);
  const solved=resolvePlayerCollision(start,desired,includeBroom);
  if(solved.equals(start)) {
    // Try axis-separated sliding so walls feel physical instead of sticky.
    const xTry=resolvePlayerCollision(start,start.clone().add(new THREE.Vector3(delta.x,0,0)),includeBroom);
    playerRoot.position.copy(xTry);
    const zStart=playerRoot.position.clone();
    const zTry=resolvePlayerCollision(zStart,zStart.clone().add(new THREE.Vector3(0,delta.y,delta.z)),includeBroom);
    playerRoot.position.copy(zTry);
    if(playerRoot.position.distanceTo(start)<1e-5) playerVelocity.multiplyScalar(0.15);
  } else playerRoot.position.copy(solved);
}

// LUBIAK_GROUND_GRAVITY_V2
// Walk mode stays upright and attached only to walkable ground surfaces.
// Walls and ceilings remain collision surfaces, never walking surfaces.
const surfaceRaycaster = new THREE.Raycaster();
const WORLD_UP = new THREE.Vector3(0,1,0);
const WALKABLE_NORMAL_Y = 0.42;

function activeSurfaceRoots(){
  const roots=[];
  if(worldMode==='exterior'){
    if(exteriorRoot?.visible) roots.push(exteriorRoot);
    if(fallbackRoot?.visible) roots.push(fallbackRoot);
  } else if(worldMode==='circus' && circusInterior?.visible) roots.push(circusInterior);
  return roots;
}

function worldHitNormal(hit){
  if(!hit?.face || !hit?.object) return null;
  const normalMatrix=new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  return hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
}

function groundSurfaceBelow(point, maxDistance=8){
  const roots=activeSurfaceRoots();
  if(!roots.length) return null;
  const origin=point.clone().add(new THREE.Vector3(0,2.2,0));
  surfaceRaycaster.set(origin,new THREE.Vector3(0,-1,0));
  surfaceRaycaster.near=0;
  surfaceRaycaster.far=maxDistance+2.2;
  let best=null;
  for(const root of roots){
    const hits=surfaceRaycaster.intersectObject(root,true);
    for(const hit of hits){
      const normal=worldHitNormal(hit);
      if(!normal || normal.dot(WORLD_UP)<WALKABLE_NORMAL_Y) continue;
      if(hit.point.y>origin.y+0.05) continue;
      if(!best || hit.point.y>best.hit.point.y) best={hit,normal};
    }
  }
  return best;
}

function groundMoveVector(input){
  const forward=new THREE.Vector3(Math.sin(followYaw),0,-Math.cos(followYaw));
  const right=new THREE.Vector3(Math.cos(followYaw),0,Math.sin(followYaw));
  const desired=forward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
  if(desired.lengthSq()>1e-6) desired.normalize();
  return desired;
}

function applyGroundGravity(dt, clearance=0.045){
  if(!playerRoot || playerMode!=='walk') return;
  const ground=groundSurfaceBelow(playerRoot.position,6.5);
  if(ground){
    const targetY=ground.hit.point.y+clearance;
    playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*24));
    if (Math.abs(playerRoot.position.y-targetY) < 0.0015) playerRoot.position.y=targetY;
    playerBaseY=targetY;
  }

  // Keep the djinn upright in world gravity. Only yaw follows travel direction.
  const targetQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,playerHeading,0,'YXZ'));
  playerRoot.quaternion.slerp(targetQ,1-Math.exp(-dt*14));
}

function combinedMoveInput() {
  const input = joystickVector.clone();
  if (keys.has('w') || keys.has('arrowup')) input.y += 1;
  if (keys.has('s') || keys.has('arrowdown')) input.y -= 1;
  if (keys.has('a') || keys.has('arrowleft')) input.x -= 1;
  if (keys.has('d') || keys.has('arrowright')) input.x += 1;
  if (input.length() > 1) input.normalize();
  return input;
}

function proceduralWalk(dt, speed01) {
  if (!playerVisual || !playerBoneCache) return;
  walkBlend += (speed01 - walkBlend) * Math.min(1, dt * 9);
  walkPhase += dt * (3.4 + speed01 * 4.8);
  const swing = Math.sin(walkPhase);
  const bob = Math.sin(walkPhase * 2) * 0.018 * walkBlend;
  playerVisual.position.y = bob;
  if (playerBoneCache.hips) playerBoneCache.hips.rotation.y = swing * 0.045 * walkBlend;
  if (playerBoneCache.leftLeg) playerBoneCache.leftLeg.rotation.x = swing * 0.32 * walkBlend;
  if (playerBoneCache.rightLeg) playerBoneCache.rightLeg.rotation.x = -swing * 0.32 * walkBlend;
  if (playerBoneCache.leftArm) playerBoneCache.leftArm.rotation.x = -swing * 0.16 * walkBlend;
  applyWalkCarryPose(1);
}

function updatePlayer(dt) {
  if (!playerReady || !playerRoot) return;
  const input = combinedMoveInput();

  if (playerMode === 'walk') {
    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);
    if (mag > 0.05) {
      const desired = groundMoveVector(input);
      if (desired.lengthSq() > 0.001) {
        desired.normalize();
        const targetHeading = Math.atan2(desired.x, desired.z) + Math.PI;
        const diff = THREE.MathUtils.euclideanModulo(targetHeading - playerHeading + Math.PI, Math.PI * 2) - Math.PI;
        playerHeading += diff * Math.min(1, dt * 8.5);
        playerRoot.rotation.y = playerHeading;
        playerVelocity.lerp(desired.multiplyScalar(5.0 * mag), Math.min(1, dt * 9));
      }
    } else {
      playerVelocity.multiplyScalar(Math.max(0, 1 - dt * 8));
    }
    movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);
    applyGroundGravity(dt);
    proceduralWalk(dt, THREE.MathUtils.clamp(playerVelocity.length() / 5, 0, 1));
  } else if (playerMode === 'mounting') {
    mountTransition += dt;
    playerVelocity.multiplyScalar(Math.max(0, 1 - dt * 9));
    const t = THREE.MathUtils.smoothstep(mountTransition, 0.15, 1.45);
    applyRidePose(t);
    const mountTarget = playerRoot.position.clone();
    mountTarget.y = playerBaseY + t * 2.6;
    const mountSolved = resolvePlayerCollision(playerRoot.position, mountTarget, true);
    playerRoot.position.y = mountSolved.y;
    playerRoot.rotation.x = -0.08 * t;
    if (mountTransition > 1.65) {
      playerMode = 'flight';
      applyRidePose(1);
      showStatus('FLIGHT MODE · RIDING DA NOBLE Y2K', 900);
    }
  } else if (playerMode === 'flight') {
    // LUBIAK_BROOM_FLIGHT_3D_V1
    // Ride the broom as a true 3D vehicle: forward follows the camera look direction,
    // so looking up/down and pushing forward climbs/dives. Space/PageUp climb; Ctrl/PageDown descend.
    applyRidePose(1);
    const verticalKey = (keys.has(' ') || keys.has('space') || keys.has('pageup') || keys.has('e') ? 1 : 0)
      - (keys.has('control') || keys.has('ctrl') || keys.has('pagedown') || keys.has('q') ? 1 : 0);
    const mag2d = THREE.MathUtils.clamp(input.length(), 0, 1);
    const lookForward = new THREE.Vector3();
    camera.getWorldDirection(lookForward);
    if (lookForward.lengthSq() < 1e-6) lookForward.set(Math.sin(followYaw), 0, -Math.cos(followYaw));
    lookForward.normalize();
    const right = new THREE.Vector3().crossVectors(lookForward, WORLD_UP);
    if (right.lengthSq() < 1e-6) right.set(Math.cos(followYaw), 0, Math.sin(followYaw));
    right.normalize();
    const desired = lookForward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
    desired.y += verticalKey * 0.95;
    const mag3d = THREE.MathUtils.clamp(Math.hypot(mag2d, verticalKey), 0, 1);
    if (desired.lengthSq() > 0.001) desired.normalize();
    playerVelocity.lerp(desired.multiplyScalar(9.5 * mag3d), Math.min(1, dt * 5));
    movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);

    // Terrain is a floor, not an altitude lock: maintain only a minimum clearance from the GLB below.
    const below = nearestSurface(playerRoot.position.clone().add(new THREE.Vector3(0,0.25,0)), WORLD_UP, 18);
    if (below && below.normal.dot(WORLD_UP) > 0.25) {
      const minY = below.hit.point.y + 1.05;
      if (playerRoot.position.y < minY) playerRoot.position.y += (minY - playerRoot.position.y) * Math.min(1, dt * 12);
    }

    if (mag3d > 0.05 && desired.lengthSq() > 0.001) {
      const flat = desired.clone(); flat.y = 0;
      if (flat.lengthSq() > 0.001) {
        const targetHeading = Math.atan2(flat.x, flat.z) + Math.PI;
        const diff = THREE.MathUtils.euclideanModulo(targetHeading - playerHeading + Math.PI, Math.PI * 2) - Math.PI;
        playerHeading += diff * Math.min(1, dt * 4.5);
        playerRoot.rotation.y = playerHeading;
      }
      const pitchTarget = THREE.MathUtils.clamp(-desired.y * 0.34, -0.32, 0.32);
      playerRoot.rotation.x += (pitchTarget - playerRoot.rotation.x) * Math.min(1, dt * 5);
      const bankTarget = THREE.MathUtils.clamp(-input.x * 0.28, -0.28, 0.28);
      playerRoot.rotation.z += (bankTarget - playerRoot.rotation.z) * Math.min(1, dt * 5);
    } else {
      playerRoot.rotation.x += (0 - playerRoot.rotation.x) * Math.min(1, dt * 3);
      playerRoot.rotation.z += (0 - playerRoot.rotation.z) * Math.min(1, dt * 3);
    }
  }

  if (movementBounds) playerRoot.position.clamp(movementBounds.min, movementBounds.max);
}

function updateFollowCamera(dt) {
  if (!playerReady || !playerRoot) return;
  const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.45 : 1.25, 0));
  const cp = Math.cos(followPitch);
  const desired = target.clone().add(new THREE.Vector3(
    -Math.sin(followYaw) * cp * followDistance,
    Math.sin(-followPitch) * followDistance + 1.05,
    Math.cos(followYaw) * cp * followDistance,
  ));
  camera.position.lerp(desired, 1 - Math.exp(-dt * 7.5));
  camera.lookAt(target);
}

function updateAerialCamera(dt) {
  if (!playerReady || cameraMode !== 'aerial') return;
  const input = combinedMoveInput();
  const cp = Math.cos(aerialPitch);
  const forward = new THREE.Vector3(-Math.sin(aerialYaw) * cp, Math.sin(aerialPitch), -Math.cos(aerialYaw) * cp).normalize();
  const right = new THREE.Vector3(Math.cos(aerialYaw), 0, -Math.sin(aerialYaw)).normalize();
  const vertical = (keys.has(' ') || keys.has('space') || keys.has('pageup') || keys.has('e') ? 1 : 0)
    - (keys.has('control') || keys.has('ctrl') || keys.has('pagedown') || keys.has('q') ? 1 : 0);
  const delta = new THREE.Vector3();
  delta.addScaledVector(forward, input.y * aerialSpeed * dt);
  delta.addScaledVector(right, input.x * aerialSpeed * dt);
  delta.y += vertical * aerialSpeed * dt;
  camera.position.add(delta);
  if (movementBounds) {
    const pad = Math.max(10, (environmentSize?.y || 30) * 1.5);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, movementBounds.min.x - pad, movementBounds.max.x + pad);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, movementBounds.min.z - pad, movementBounds.max.z + pad);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.8, movementBounds.max.y + pad * 2);
  }
  camera.rotation.order = 'YXZ';
  camera.rotation.y = aerialYaw;
  camera.rotation.x = aerialPitch;
}

function updateFallbackCamera(dt) {
  const speed = 9.5 * dt;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
  if (keys.has('w') || keys.has('arrowup')) camera.position.addScaledVector(forward, speed);
  if (keys.has('s') || keys.has('arrowdown')) camera.position.addScaledVector(forward, -speed);
  if (keys.has('a') || keys.has('arrowleft')) camera.position.addScaledVector(right, -speed);
  if (keys.has('d') || keys.has('arrowright')) camera.position.addScaledVector(right, speed);
  if (movementBounds) camera.position.clamp(movementBounds.min, movementBounds.max);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  if (dragonMixer && worldMode === 'exterior') dragonMixer.update(dt);
  if (playerReady) {
    if (cameraMode === 'aerial') {
      // Freeze the djinn and broom exactly where they are while the detached camera explores LUBIAK.
      updateAerialCamera(dt);
    } else {
      updatePlayer(dt);
      updateFollowCamera(dt);
      if (aerialReturnBlend > 0) aerialReturnBlend = Math.max(0, aerialReturnBlend - dt * 1.4);
    }
  } else {
    updateFallbackCamera(dt);
  }
  updateCircusTransition();
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