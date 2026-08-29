import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080d);
scene.fog = new THREE.FogExp2(0x07101a, 0.0022);

const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.03, 2200);
let yaw = 0;
let pitch = -0.03;
let movementBounds = null;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xb7d8ff, 0x24170b, 1.35));
const key = new THREE.DirectionalLight(0xffcf7a, 2.2);
key.position.set(-18, 46, 26);
scene.add(key);
const cyan = new THREE.PointLight(0x72d9ff, 85, 220, 1.65);
cyan.position.set(0, 20, -12);
scene.add(cyan);

function setStatus(label, pct) {
  status.textContent = label;
  if (Number.isFinite(pct)) bar.style.width = `${THREE.MathUtils.clamp(pct, 0, 100)}%`;
}

function finishLoad() {
  setStatus('MEGAPOLE OPEN', 100);
  setTimeout(() => {
    status.style.opacity = '0';
    progress.style.opacity = '0';
  }, 850);
}

function frameEnvironment(root) {
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
      material.depthTest = true;
      material.depthWrite = true;
      material.needsUpdate = true;
    }
  });

  const eye = Math.max(1.8, Math.min(size.y * 0.1, 6));
  const distance = Math.max(size.z * 0.78, maxDim * 0.68, 22);
  camera.position.set(0, eye, distance);
  camera.near = Math.max(0.02, maxDim / 50000);
  camera.far = Math.max(900, maxDim * 10);
  camera.updateProjectionMatrix();
  movementBounds = new THREE.Box3(
    new THREE.Vector3(-size.x * 0.75, 1.55, -size.z * 0.78),
    new THREE.Vector3(size.x * 0.75, Math.max(20, size.y * 1.2), size.z * 0.92),
  );
  cyan.position.set(size.x * 0.05, Math.max(8, size.y * 0.3), -size.z * 0.1);
  return true;
}

async function getMeshoptDecoder() {
  try {
    const module = await import('../vendor/meshopt_decoder.module.js');
    const decoder = module.MeshoptDecoder;
    if (!decoder) return null;
    await decoder.ready;
    return decoder;
  } catch (_) {
    return null;
  }
}

function loadGlb(url, decoder) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    if (decoder) loader.setMeshoptDecoder(decoder);
    loader.load(
      url,
      resolve,
      (xhr) => {
        if (xhr.total) setStatus('LOADING SILMARI\'LLION MEGAPOLE', Math.min(99, xhr.loaded / xhr.total * 100));
      },
      reject,
    );
  });
}

async function installEnvironment() {
  setStatus('ENTERING THE DRAGON', 4);
  const decoder = await getMeshoptDecoder();
  const candidates = [
    '/assets/assets/models/SILMARI_LLION_MEGAPOLE.glb?v=20260829-megapole-v1',
    '/assets/assets/models/ChatGPT_Image_Aug_29_2026_07_3_Futuristic_cityscape_with_elaborate_architecture_Prism_31_e7e2df31.glb?v=20260829-megapole-v1',
  ];

  let lastError;
  for (const url of candidates) {
    try {
      const gltf = await loadGlb(url, decoder);
      const root = gltf.scene;
      root.name = 'SILMARI_LLION_MEGAPOLE';
      scene.add(root);
      if (!frameEnvironment(root)) throw new Error('Invalid megapole bounds');
      finishLoad();
      return;
    } catch (error) {
      lastError = error;
      console.warn('Megapole candidate failed', url, error);
    }
  }
  console.error('Megapole GLB unavailable.', lastError);
  setStatus('MEGAPOLE MODEL NOT YET INSTALLED', 100);
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
  camera.position.addScaledVector(forward, -Math.sign(event.deltaY) * 1.8);
}, { passive: true });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  const speed = 10.5 * dt;
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

installEnvironment();
