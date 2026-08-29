import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);
scene.fog = new THREE.FogExp2(0x111827, 0.0011);

const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.05, 5000);
let yaw = 0;
let pitch = -0.035;
let movementBounds = null;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
host.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 1.8);
const hemi = new THREE.HemisphereLight(0xd7ecff, 0x5a321e, 2.1);
const key = new THREE.DirectionalLight(0xffe2a6, 3.4);
key.position.set(-40, 80, 55);
const fill = new THREE.DirectionalLight(0x9bdfff, 2.2);
fill.position.set(55, 42, -65);
const cyan = new THREE.PointLight(0x72d9ff, 180, 360, 1.35);
const warm = new THREE.PointLight(0xffb15f, 160, 320, 1.4);
scene.add(ambient, hemi, key, fill, cyan, warm, key.target, fill.target);

function setStatus(label, pct) {
  status.textContent = label;
  if (Number.isFinite(pct)) bar.style.width = `${THREE.MathUtils.clamp(pct, 0, 100)}%`;
}

function finishLoad() {
  setStatus('MEGAPOLE OPEN', 100);
  setTimeout(() => {
    status.style.opacity = '0';
    progress.style.opacity = '0';
  }, 1000);
}

function visibleMeshCount(root) {
  let count = 0;
  root.traverse((object) => { if (object.isMesh) count += 1; });
  return count;
}

function frameEnvironment(root) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return false;

  let size = box.getSize(new THREE.Vector3());
  let maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return false;

  // AI/quantized GLBs can arrive in normalized ~1-unit coordinates. Promote
  // those to a stable world scale before camera framing and navigation.
  const rawMaxDim = maxDim;
  if (maxDim < 25) {
    const targetWorldSize = 120;
    const boost = targetWorldSize / maxDim;
    root.scale.multiplyScalar(boost);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
    maxDim = Math.max(size.x, size.y, size.z);
  }

  // Recenter only after final scale is established.
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  size = box.getSize(new THREE.Vector3());
  maxDim = Math.max(size.x, size.y, size.z);

  let meshes = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    meshes += 1;
    object.visible = true;
    object.frustumCulled = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.visible = true;
      material.side = THREE.DoubleSide;
      material.depthTest = true;
      material.depthWrite = true;
      material.transparent = false;
      material.opacity = 1;
      if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0, 0.08);
      if ('roughness' in material) material.roughness = Math.max(material.roughness ?? 0.7, 0.68);
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
      }
      if ('emissive' in material) {
        material.emissive.setHex(0xffffff);
        material.emissiveIntensity = 0.28;
        if (material.map) material.emissiveMap = material.map;
      }
      material.needsUpdate = true;
    }
  });
  if (!meshes) return false;

  const eye = THREE.MathUtils.clamp(size.y * 0.08, 2.2, 8);
  const distance = Math.max(size.z * 0.68, maxDim * 0.62, 35);
  camera.position.set(0, eye, distance);
  camera.near = Math.max(0.03, maxDim / 100000);
  camera.far = Math.max(1500, maxDim * 18);
  camera.updateProjectionMatrix();
  yaw = 0;
  pitch = -0.035;

  movementBounds = new THREE.Box3(
    new THREE.Vector3(-size.x * 0.72, -size.y * 0.42, -size.z * 0.72),
    new THREE.Vector3(size.x * 0.72, size.y * 0.55, size.z * 0.82),
  );

  cyan.position.set(size.x * 0.12, Math.max(8, size.y * 0.35), -size.z * 0.12);
  warm.position.set(-size.x * 0.18, Math.max(7, size.y * 0.22), size.z * 0.18);
  key.target.position.set(0, size.y * 0.05, 0);
  fill.target.position.set(0, size.y * 0.02, 0);

  console.info('MEGAPOLE environment ready', {
    rawMaxDim,
    finalSize: size.toArray(),
    meshCount: meshes,
    camera: camera.position.toArray(),
    bounds: [movementBounds.min.toArray(), movementBounds.max.toArray()],
  });
  return true;
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

async function installEnvironment() {
  setStatus('ENTERING THE DRAGON', 4);
  const decoder = await getMeshoptDecoder();
  const url = '/assets/assets/models/SILMARI_LLION_MEGAPOLE_LUBIAK.glb?v=20260829-megapole-frame-v3';
  try {
    const gltf = await loadGlb(url, decoder);
    const root = gltf.scene;
    root.name = 'SILMARI_LLION_MEGAPOLE';
    scene.add(root);
    if (!frameEnvironment(root)) throw new Error(`Invalid Megapole scene: ${visibleMeshCount(root)} meshes`);
    finishLoad();
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
  camera.position.addScaledVector(forward, -Math.sign(event.deltaY) * 2.2);
}, { passive: true });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  const speed = 12 * dt;
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
