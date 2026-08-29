import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140e12);
scene.fog = new THREE.FogExp2(0x1a1116, 0.00045);

const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.03, 5000);
let yaw = 0;
let pitch = 0;
let movementBounds = null;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
host.appendChild(renderer.domElement);

const dragonBellyAmbient = new THREE.AmbientLight(0x7a3a22, 1.2);
const skyHemi = new THREE.HemisphereLight(0xaed8ff, 0x3a170f, 1.5);
const monumentKey = new THREE.DirectionalLight(0xffd89a, 2.5);
monumentKey.position.set(-26, 52, 28);
const coldPeakFill = new THREE.DirectionalLight(0x89d8ff, 1.6);
coldPeakFill.position.set(34, 30, -38);
const dragonCoreGlow = new THREE.PointLight(0xff7a3c, 120, 320, 1.5);
const aiFountainGlowA = new THREE.PointLight(0x4de1d4, 105, 220, 1.6);
const aiFountainGlowB = new THREE.PointLight(0x7ee6ff, 90, 210, 1.6);
const glassPeakGlowA = new THREE.PointLight(0xdff6ff, 100, 260, 1.25);
const glassPeakGlowB = new THREE.PointLight(0x9fd7ff, 90, 260, 1.25);
const policeWashA = new THREE.PointLight(0xffffff, 42, 100, 2.0);
const policeWashB = new THREE.PointLight(0xbfd8ff, 34, 95, 2.0);
scene.add(
  dragonBellyAmbient,
  skyHemi,
  monumentKey,
  coldPeakFill,
  dragonCoreGlow,
  aiFountainGlowA,
  aiFountainGlowB,
  glassPeakGlowA,
  glassPeakGlowB,
  policeWashA,
  policeWashB,
  monumentKey.target,
  coldPeakFill.target,
);

function setStatus(label, pct) {
  status.textContent = label;
  if (Number.isFinite(pct)) bar.style.width = `${THREE.MathUtils.clamp(pct, 0, 100)}%`;
}

function finishLoad(meshes) {
  setStatus(`MEGAPOLE OPEN · ${meshes} MESH${meshes === 1 ? '' : 'ES'}`, 100);
  setTimeout(() => {
    status.style.opacity = '0';
    progress.style.opacity = '0';
  }, 1400);
}

async function getMeshoptDecoder() {
  try {
    const module = await import('../vendor/meshopt_decoder.module.js');
    const decoder = module.MeshoptDecoder;
    if (!decoder) return null;
    await decoder.ready;
    return decoder;
  } catch (error) {
    console.warn('MEGAPOLE Meshopt decoder unavailable.', error);
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

function forceVisibleMaterial(mesh) {
  const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const map = source?.map || null;
  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
  }
  mesh.material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
    toneMapped: true,
  });
  mesh.visible = true;
  mesh.frustumCulled = false;
}

function frameEnvironment(root) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return 0;

  let size = box.getSize(new THREE.Vector3());
  let maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return 0;

  const rawMaxDim = maxDim;
  if (maxDim < 25) {
    const boost = 120 / maxDim;
    root.scale.multiplyScalar(boost);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
    maxDim = Math.max(size.x, size.y, size.z);
  }

  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  size = box.getSize(new THREE.Vector3());

  let meshes = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    meshes += 1;
    forceVisibleMaterial(object);
  });
  if (!meshes) return 0;

  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 1);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const fitDistance = radius / Math.sin(vFov / 2);
  const distance = fitDistance * 1.18;
  const eye = THREE.MathUtils.clamp(size.y * 0.06, 2.5, 10);

  camera.position.set(0, eye, distance);
  camera.near = Math.max(0.03, distance - radius * 1.6);
  camera.far = Math.max(1000, distance + radius * 8);
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  yaw = 0;
  pitch = 0;

  movementBounds = new THREE.Box3(
    new THREE.Vector3(-size.x * 0.8, -size.y * 0.5, -size.z * 0.8),
    new THREE.Vector3(size.x * 0.8, size.y * 0.7, Math.max(distance, size.z)),
  );

  dragonCoreGlow.position.set(0, Math.max(10, size.y * 0.18), size.z * 0.14);
  aiFountainGlowA.position.set(-size.x * 0.18, Math.max(4, size.y * 0.08), size.z * 0.06);
  aiFountainGlowB.position.set(size.x * 0.14, Math.max(4, size.y * 0.09), -size.z * 0.02);
  glassPeakGlowA.position.set(-size.x * 0.22, Math.max(12, size.y * 0.42), -size.z * 0.18);
  glassPeakGlowB.position.set(size.x * 0.24, Math.max(14, size.y * 0.48), -size.z * 0.22);
  policeWashA.position.set(-size.x * 0.08, 3.2, size.z * 0.18);
  policeWashB.position.set(size.x * 0.09, 3.0, size.z * 0.22);
  monumentKey.target.position.set(0, size.y * 0.16, 0);
  coldPeakFill.target.position.set(0, size.y * 0.32, -size.z * 0.12);

  console.info('MEGAPOLE environment ready', {
    rawMaxDim,
    finalSize: size.toArray(),
    sphereRadius: radius,
    fitDistance: distance,
    meshCount: meshes,
    camera: camera.position.toArray(),
  });
  return meshes;
}

async function installEnvironment() {
  setStatus('ENTERING THE DRAGON', 4);
  const decoder = await getMeshoptDecoder();
  const url = '/assets/assets/models/SILMARI_LLION_MEGAPOLE_LUBIAK.glb?v=20260829-megapole-visible-v5';
  try {
    const gltf = await loadGlb(url, decoder);
    const root = gltf.scene;
    root.name = 'SILMARI_LLION_MEGAPOLE';
    scene.add(root);
    const meshes = frameEnvironment(root);
    if (!meshes) throw new Error('Megapole scene contains no renderable mesh');
    finishLoad(meshes);
  } catch (error) {
    console.error('Megapole GLB failed to render.', error);
    setStatus('MEGAPOLE MODEL FAILED TO RENDER', 100);
  }
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
  camera.position.addScaledVector(forward, -Math.sign(event.deltaY) * 2.6);
}, { passive: true });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  const t = performance.now() * 0.001;
  const speed = 12 * dt;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));

  if (keys.has('w') || keys.has('arrowup')) camera.position.addScaledVector(forward, speed);
  if (keys.has('s') || keys.has('arrowdown')) camera.position.addScaledVector(forward, -speed);
  if (keys.has('a') || keys.has('arrowleft')) camera.position.addScaledVector(right, -speed);
  if (keys.has('d') || keys.has('arrowright')) camera.position.addScaledVector(right, speed);
  if (movementBounds) camera.position.clamp(movementBounds.min, movementBounds.max);

  dragonCoreGlow.intensity = 115 + Math.sin(t * 0.9) * 9;
  aiFountainGlowA.intensity = 100 + Math.sin(t * 1.8) * 15;
  aiFountainGlowB.intensity = 86 + Math.sin(t * 2.1 + 1.2) * 14;
  glassPeakGlowA.intensity = 96 + Math.sin(t * 0.8 + 0.6) * 8;
  glassPeakGlowB.intensity = 88 + Math.sin(t * 0.95 + 1.7) * 7;

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
