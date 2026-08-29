import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1018);
scene.fog = new THREE.FogExp2(0x101018, 0.0024);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.03, 1200);
let yaw = 0;
let pitch = -0.04;
let movementBounds = null;

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

scene.add(new THREE.AmbientLight(0xffead7, 1.15));
scene.add(new THREE.HemisphereLight(0x9bb8e8, 0x6b321b, 2.35));
const moon = new THREE.DirectionalLight(0xbfd6ff, 2.15);
moon.position.set(-24, 48, 30);
scene.add(moon);
const moonFill = new THREE.DirectionalLight(0x7795c9, 1.05);
moonFill.position.set(30, 22, -34);
scene.add(moonFill);
const circus = new THREE.PointLight(0xffb06a, 155, 210, 1.25);
circus.position.set(0, 14, 0);
scene.add(circus);
const streetFillA = new THREE.PointLight(0xff8a45, 78, 135, 1.35);
streetFillA.position.set(-18, 9, 30);
scene.add(streetFillA);
const streetFillB = new THREE.PointLight(0xffd09a, 66, 125, 1.35);
streetFillB.position.set(18, 8, -28);
scene.add(streetFillB);

function setStatus(label, pct) {
  status.textContent = label;
  if (Number.isFinite(pct)) bar.style.width = `${THREE.MathUtils.clamp(pct, 0, 100)}%`;
}

function finishLoad(label = 'ENTER LUBIAK') {
  setStatus(label, 100);
  setTimeout(() => {
    status.style.opacity = '0';
    progress.style.opacity = '0';
  }, 900);
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
  camera.position.set(0, 3.2, 64);
  movementBounds = new THREE.Box3(new THREE.Vector3(-38, 1.55, -58), new THREE.Vector3(38, 18, 72));
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
  streetFillA.position.set(-size.x * 0.22, Math.max(5, size.y * 0.13), size.z * 0.28);
  streetFillB.position.set(size.x * 0.22, Math.max(5, size.y * 0.13), -size.z * 0.3);
  console.info('LUBIAK environment ready', { size: size.toArray(), camera: camera.position.toArray() });
  return true;
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

function loadGlb(url, decoder, label) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    if (decoder) loader.setMeshoptDecoder(decoder);
    loader.load(
      url,
      (gltf) => resolve(gltf),
      (xhr) => {
        if (xhr.total) {
          const local = Math.min(99, (xhr.loaded / xhr.total) * 100);
          setStatus(label, local);
        }
      },
      reject,
    );
  });
}

async function installEnvironment() {
  setStatus('STARTING 3D ENGINE', 4);
  const decoder = await getMeshoptDecoder();
  const candidates = [
    {
      url: '/assets/assets/models/LUBIAK_master_optimized.glb?v=20260829-lubiak-light-v1',
      label: 'LOADING LUBIAK MASTER',
      finish: 'ENTER LUBIAK',
    },
    {
      url: '/assets/assets/models/LUBIAK.glb?v=20260829-lubiak-light-v1',
      label: 'LOADING LUBIAK FALLBACK',
      finish: 'ENTER LUBIAK · RECOVERY MODEL',
    },
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
      finishLoad(candidate.finish);
      return;
    } catch (error) {
      console.error(`${candidate.label} failed.`, error);
    }
  }

  console.error('All LUBIAK GLB candidates failed; entering procedural safe mode.');
  makeFallbackDistrict();
}

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
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
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
