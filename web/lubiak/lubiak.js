import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/meshopt_decoder.module.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050303);
scene.fog = new THREE.FogExp2(0x070405, 0.0035);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.03, 1200);
let yaw = 0;
let pitch = -0.04;
let movementBounds = null;
let districtSize = new THREE.Vector3(80, 30, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.78;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x33445d, 0x170b06, 0.72));
const moon = new THREE.DirectionalLight(0x7890b6, 0.62);
moon.position.set(-24, 48, 30);
scene.add(moon);
const circus = new THREE.PointLight(0xff9848, 48, 120, 1.7);
circus.position.set(0, 12, 0);
scene.add(circus);

let dragonRoot = null;
let dragonMixer = null;
let dragonAction = null;
const dragonLoopSeconds = 45;
const dragonCurrent = new THREE.Vector3();
const dragonAhead = new THREE.Vector3();
const dragonForward = new THREE.Vector3();
const dragonLook = new THREE.Vector3();
const dragonTargetQuat = new THREE.Quaternion();
const dragonBasis = new THREE.Matrix4();
const dragonWorldUp = new THREE.Vector3(0, 1, 0);
let dragonRoute = null;

function finishLoad(label = 'ENTER LUBIAK') {
  status.textContent = label;
  bar.style.width = '100%';
  setTimeout(() => {
    status.style.opacity = '0';
    progress.style.opacity = '0';
  }, 850);
}

function makeFallbackDistrict() {
  const group = new THREE.Group();
  group.name = 'LUBIAK_FALLBACK_DISTRICT';
  const wall = new THREE.MeshStandardMaterial({ color: 0x553022, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d1110, roughness: 0.94 });
  const brick = new THREE.MeshStandardMaterial({ color: 0x7b3f28, roughness: 0.9 });
  const canvas = new THREE.MeshStandardMaterial({ color: 0xd9c7a2, roughness: 0.86 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xb85625, roughness: 0.82 });
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
  camera.position.set(0, 3.2, 64);
  districtSize.set(54, 20, 112);
  createDragonRoute();
  loadDragon();
  finishLoad('ENTER LUBIAK · LIGHT MODE');
}

function frameLoadedEnvironment(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return false;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

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

  districtSize.copy(size);
  const eyeHeight = Math.max(1.7, Math.min(size.y * 0.12, 5.0));
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

  circus.position.set(size.x * 0.08, Math.max(6, size.y * 0.25), -size.z * 0.08);
  createDragonRoute();
  console.info('LUBIAK bounds', { size: size.toArray(), maxDim, camera: camera.position.toArray() });
  return true;
}

function createDragonRoute() {
  const sx = Math.max(28, districtSize.x * 0.42);
  const sz = Math.max(52, districtSize.z * 0.44);
  const high = Math.max(18, districtSize.y * 0.9);
  const medium = Math.max(10, districtSize.y * 0.52);
  const low = Math.max(4.8, districtSize.y * 0.22);

  dragonRoute = {
    start: new THREE.Vector3(0, high, sz),
    descend: new THREE.Vector3(-sx * 0.26, medium, sz * 0.54),
    streetA: new THREE.Vector3(-sx * 0.10, low + 2.0, sz * 0.30),
    streetB: new THREE.Vector3(sx * 0.05, low, sz * 0.04),
    streetC: new THREE.Vector3(0, low + 0.4, -sz * 0.20),
    perch: new THREE.Vector3(-sx * 0.34, Math.max(7.5, districtSize.y * 0.36), -sz * 0.34),
    takeoff: new THREE.Vector3(-sx * 0.24, medium, -sz * 0.28),
    orbitA: new THREE.Vector3(sx * 0.28, medium + 2, -sz * 0.26),
    orbitB: new THREE.Vector3(sx * 0.38, high * 0.95, -sz * 0.06),
    orbitC: new THREE.Vector3(0, high, sz * 0.10),
    orbitD: new THREE.Vector3(-sx * 0.22, high * 0.92, sz * 0.34),
  };
}

function smooth01(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function segment(a, b, t, out) {
  return out.copy(a).lerp(b, smooth01(t));
}

function sampleDragonPosition(seconds, out) {
  if (!dragonRoute) return out.set(0, 18, 40);
  const t = ((seconds % dragonLoopSeconds) + dragonLoopSeconds) % dragonLoopSeconds;

  if (t < 7) return segment(dragonRoute.start, dragonRoute.descend, t / 7, out);
  if (t < 14) return segment(dragonRoute.descend, dragonRoute.streetA, (t - 7) / 7, out);
  if (t < 17.5) return segment(dragonRoute.streetA, dragonRoute.streetB, (t - 14) / 3.5, out);
  if (t < 21) return segment(dragonRoute.streetB, dragonRoute.streetC, (t - 17.5) / 3.5, out);
  if (t < 23) return segment(dragonRoute.streetC, dragonRoute.perch, (t - 21) / 2, out);
  if (t < 29) return out.copy(dragonRoute.perch);
  if (t < 34) return segment(dragonRoute.perch, dragonRoute.takeoff, (t - 29) / 5, out);
  if (t < 35.75) return segment(dragonRoute.takeoff, dragonRoute.orbitA, (t - 34) / 1.75, out);
  if (t < 37.5) return segment(dragonRoute.orbitA, dragonRoute.orbitB, (t - 35.75) / 1.75, out);
  if (t < 39.25) return segment(dragonRoute.orbitB, dragonRoute.orbitC, (t - 37.5) / 1.75, out);
  if (t < 41) return segment(dragonRoute.orbitC, dragonRoute.orbitD, (t - 39.25) / 1.75, out);
  return segment(dragonRoute.orbitD, dragonRoute.start, (t - 41) / 4, out);
}

function orientDragon(seconds, dt) {
  if (!dragonRoot || !dragonRoute) return;
  const t = ((seconds % dragonLoopSeconds) + dragonLoopSeconds) % dragonLoopSeconds;

  if (t >= 23 && t < 29) {
    dragonLook.set(0, Math.max(4, districtSize.y * 0.22), -districtSize.z * 0.10);
  } else {
    sampleDragonPosition(seconds + 0.22, dragonAhead);
    dragonLook.copy(dragonAhead);
  }

  dragonForward.copy(dragonLook).sub(dragonRoot.position);
  if (dragonForward.lengthSq() < 0.00001) return;
  dragonForward.normalize();

  dragonBasis.lookAt(dragonRoot.position, dragonLook, dragonWorldUp);
  dragonTargetQuat.setFromRotationMatrix(dragonBasis);
  dragonTargetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(dragonWorldUp, Math.PI));
  dragonRoot.quaternion.slerp(dragonTargetQuat, 1 - Math.exp(-dt * 5.5));

  if (!(t >= 23 && t < 29)) {
    const bank = THREE.MathUtils.clamp(-dragonForward.x * 0.30, -0.42, 0.42);
    dragonRoot.rotateZ(bank * (1 - Math.exp(-dt * 3.5)));
  }
}

function loadDragon() {
  if (dragonRoot) return;
  const dragonUrl = '/assets/assets/models/lubiak_dragon_guardian_web.glb?v=20260829-guardian-45s-v1';
  const dragonLoader = new GLTFLoader();
  dragonLoader.setMeshoptDecoder(MeshoptDecoder);
  dragonLoader.load(
    dragonUrl,
    (gltf) => {
      dragonRoot = gltf.scene;
      dragonRoot.name = 'LUBIAK_DRAGON_GUARDIAN';
      dragonRoot.traverse((object) => {
        if (!object.isMesh && !object.isSkinnedMesh) return;
        object.frustumCulled = false;
        object.castShadow = false;
        object.receiveShadow = false;
      });

      const dragonBox = new THREE.Box3().setFromObject(dragonRoot);
      const dragonSize = dragonBox.getSize(new THREE.Vector3());
      const targetLength = Math.max(7, Math.min(16, districtSize.x * 0.13));
      const sourceLength = Math.max(dragonSize.x, dragonSize.y, dragonSize.z, 0.001);
      dragonRoot.scale.setScalar(targetLength / sourceLength);
      sampleDragonPosition(0, dragonRoot.position);
      scene.add(dragonRoot);

      if (gltf.animations?.length) {
        const clip = gltf.animations.find((item) => item.name === 'guardian_45s') || gltf.animations[0];
        dragonMixer = new THREE.AnimationMixer(dragonRoot);
        dragonAction = dragonMixer.clipAction(clip);
        dragonAction.setLoop(THREE.LoopRepeat, Infinity);
        dragonAction.clampWhenFinished = false;
        dragonAction.enabled = true;
        dragonAction.play();
        console.info('LUBIAK dragon animation', { clip: clip.name, duration: clip.duration });
      } else {
        console.warn('LUBIAK dragon loaded without animation clips.');
      }
    },
    undefined,
    (error) => {
      console.warn('LUBIAK guardian dragon unavailable; district remains fully usable.', error);
    },
  );
}

const modelUrl = '/assets/assets/models/LUBIAK_master_optimized.glb?v=20260829-master-runtime-v2';
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load(
  modelUrl,
  (gltf) => {
    const root = gltf.scene;
    root.name = 'LUBIAK_ENVIRONMENT';
    scene.add(root);
    if (!frameLoadedEnvironment(root)) {
      scene.remove(root);
      makeFallbackDistrict();
      return;
    }
    loadDragon();
    finishLoad('ENTER LUBIAK');
  },
  (xhr) => {
    if (xhr.total) bar.style.width = `${Math.min(99, (xhr.loaded / xhr.total) * 100)}%`;
  },
  (error) => {
    console.error('LUBIAK master GLB failed to load; using lightweight district fallback.', error);
    makeFallbackDistrict();
  },
);

const keys = new Set();
addEventListener('keydown', (event) => keys.add(event.key.toLowerCase()));
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
let drag = null;
renderer.domElement.addEventListener('pointerdown', (event) => {
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
let worldElapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  worldElapsed += dt;
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

  if (dragonRoot) {
    if (dragonMixer) dragonMixer.update(dt);
    sampleDragonPosition(worldElapsed, dragonCurrent);
    dragonRoot.position.copy(dragonCurrent);
    orientDragon(worldElapsed, dt);
  }

  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
