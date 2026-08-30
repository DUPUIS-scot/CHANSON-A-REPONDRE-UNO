import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x100708);
scene.fog = new THREE.FogExp2(0x16090a, 0.00042);

const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.02, 5000);
let yaw = 0;
let pitch = 0;
let movementBounds = null;
let worldRadius = 100;

const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_IOS ? 1.18 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
host.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0x5b2116, 0.55);
const hemi = new THREE.HemisphereLight(0x8bd9ff, 0x210705, 0.72);
const warmKey = new THREE.DirectionalLight(0xffa452, 2.1);
warmKey.position.set(-24, 46, 26);
const coldFill = new THREE.DirectionalLight(0x72dfff, 1.25);
coldFill.position.set(32, 28, -34);
const coreGlow = new THREE.PointLight(0xff4e18, 90, 300, 1.55);
const cyanA = new THREE.PointLight(0x2affdf, 88, 190, 1.6);
const cyanB = new THREE.PointLight(0x66dcff, 72, 180, 1.6);
const iceA = new THREE.PointLight(0xe4fbff, 62, 210, 1.35);
const iceB = new THREE.PointLight(0x9edfff, 55, 210, 1.35);
scene.add(ambient, hemi, warmKey, coldFill, coreGlow, cyanA, cyanB, iceA, iceB, warmKey.target, coldFill.target);

function setStatus(label, pct) {
  status.textContent = label;
  status.style.opacity = '1';
  progress.style.opacity = '1';
  if (Number.isFinite(pct)) bar.style.width = `${THREE.MathUtils.clamp(pct, 0, 100)}%`;
}
function finishLoad(meshes) {
  setStatus(`MEGAPOLE OPEN · ${meshes} MESH${meshes === 1 ? '' : 'ES'}`, 100);
  setTimeout(() => { status.style.opacity = '0'; progress.style.opacity = '0'; }, 1350);
}
async function meshopt() {
  try {
    const mod = await import('../vendor/meshopt_decoder.module.js');
    await mod.MeshoptDecoder?.ready;
    return mod.MeshoptDecoder || null;
  } catch (e) {
    console.warn('MEGAPOLE Meshopt unavailable', e);
    return null;
  }
}
function loadGlb(url, decoder) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    if (decoder) loader.setMeshoptDecoder(decoder);
    loader.load(url, resolve, (xhr) => {
      if (xhr.total) setStatus("LOADING SILMARI'LLION MEGAPOLE", Math.min(99, xhr.loaded / xhr.total * 100));
    }, reject);
  });
}
function tuneTexture(texture, srgb = false) {
  if (!texture) return;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
}
function preservePbrMaterial(material) {
  if (!material) return;
  tuneTexture(material.map, true);
  tuneTexture(material.emissiveMap, true);
  tuneTexture(material.normalMap, false);
  tuneTexture(material.roughnessMap, false);
  tuneTexture(material.metalnessMap, false);
  tuneTexture(material.aoMap, false);
  material.side = THREE.DoubleSide;
  material.depthTest = true;
  if (material.transparent || material.opacity < 1) material.depthWrite = false;
  if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
    material.roughness = THREE.MathUtils.clamp(material.roughness ?? 0.72, 0.08, 0.96);
    material.metalness = THREE.MathUtils.clamp(material.metalness ?? 0.12, 0, 0.9);
    if (material.emissiveMap) material.emissiveIntensity = Math.max(material.emissiveIntensity || 1, 1.35);
  }
  material.needsUpdate = true;
}
function fitDistanceForSphere(radius) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const limitingFov = Math.max(0.2, Math.min(vFov, hFov));
  return radius / Math.sin(limitingFov / 2);
}
function frame(root) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return 0;
  let size = box.getSize(new THREE.Vector3());
  let maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return 0;
  if (maxDim < 25) {
    root.scale.multiplyScalar(120 / Math.max(maxDim, 0.001));
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
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
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(preservePbrMaterial);
    object.visible = true;
    object.frustumCulled = IS_IOS;
  });
  if (!meshes) return 0;

  const sphere = box.getBoundingSphere(new THREE.Sphere());
  worldRadius = Math.max(sphere.radius, 1);
  const distance = fitDistanceForSphere(worldRadius) * 1.18;
  const eye = THREE.MathUtils.clamp(size.y * 0.055, 2.5, 10);
  camera.position.set(0, eye, distance);
  camera.near = Math.max(0.02, worldRadius / 5000);
  camera.far = Math.max(1000, worldRadius * 20, distance + worldRadius * 10);
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  camera.rotation.order = 'YXZ';
  yaw = camera.rotation.y;
  pitch = camera.rotation.x;

  movementBounds = new THREE.Box3(
    new THREE.Vector3(-size.x * 0.9, -size.y * 0.55, -size.z * 0.9),
    new THREE.Vector3(size.x * 0.9, size.y * 0.8, Math.max(distance, size.z * 1.15)),
  );

  coreGlow.position.set(0, Math.max(8, size.y * 0.18), size.z * 0.12);
  cyanA.position.set(-size.x * 0.18, Math.max(3, size.y * 0.07), size.z * 0.06);
  cyanB.position.set(size.x * 0.14, Math.max(3, size.y * 0.08), -size.z * 0.01);
  iceA.position.set(-size.x * 0.22, Math.max(11, size.y * 0.43), -size.z * 0.18);
  iceB.position.set(size.x * 0.24, Math.max(12, size.y * 0.47), -size.z * 0.22);
  warmKey.target.position.set(0, size.y * 0.16, 0);
  coldFill.target.position.set(0, size.y * 0.32, -size.z * 0.12);
  return meshes;
}
async function install() {
  setStatus('ENTERING THE DRAGON', 4);
  const decoder = await meshopt();
  try {
    const gltf = await loadGlb('/assets/assets/models/SILMARI_LLION_MEGAPOLE_LUBIAK.glb?v=20260830-megapole-viewer-v9', decoder);
    gltf.scene.name = 'SILMARI_LLION_MEGAPOLE_PBR';
    scene.add(gltf.scene);
    const meshes = frame(gltf.scene);
    if (!meshes) throw new Error('Megapole contains no renderable mesh');
    finishLoad(meshes);
  } catch (error) {
    console.error('Megapole GLB failed', error);
    setStatus('MEGAPOLE MODEL FAILED TO RENDER · RELOAD', 100);
  }
}

const keys = new Set();
addEventListener('keydown', e => keys.add(e.key.toLowerCase()));
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => {
  drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  renderer.domElement.setPointerCapture(e.pointerId);
  e.preventDefault();
});
renderer.domElement.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  yaw -= (e.clientX - drag.x) * 0.0042;
  pitch -= (e.clientY - drag.y) * 0.0032;
  pitch = THREE.MathUtils.clamp(pitch, -1.18, 1.05);
  drag.x = e.clientX;
  drag.y = e.clientY;
});
function releasePointer(e) {
  if (!drag || e.pointerId !== drag.id) return;
  try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {}
  drag = null;
}
renderer.domElement.addEventListener('pointerup', releasePointer);
renderer.domElement.addEventListener('pointercancel', releasePointer);
renderer.domElement.addEventListener('wheel', e => {
  const cp = Math.cos(pitch);
  const forward = new THREE.Vector3(Math.sin(yaw) * cp, Math.sin(-pitch), -Math.cos(yaw) * cp).normalize();
  camera.position.addScaledVector(forward, -Math.sign(e.deltaY) * Math.max(1.8, worldRadius * 0.018));
  if (movementBounds) camera.position.clamp(movementBounds.min, movementBounds.max);
}, { passive: true });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  const t = performance.now() * 0.001;
  const speed = Math.max(8, worldRadius * 0.055) * dt;
  const cp = Math.cos(pitch);
  const forward3d = new THREE.Vector3(Math.sin(yaw) * cp, Math.sin(-pitch), -Math.cos(yaw) * cp).normalize();
  const forward = new THREE.Vector3(forward3d.x, 0, forward3d.z).normalize();
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
  if (keys.has('w') || keys.has('arrowup')) camera.position.addScaledVector(forward, speed);
  if (keys.has('s') || keys.has('arrowdown')) camera.position.addScaledVector(forward, -speed);
  if (keys.has('a') || keys.has('arrowleft')) camera.position.addScaledVector(right, -speed);
  if (keys.has('d') || keys.has('arrowright')) camera.position.addScaledVector(right, speed);
  if (keys.has(' ') || keys.has('pageup') || keys.has('e')) camera.position.y += speed;
  if (keys.has('control') || keys.has('pagedown') || keys.has('q')) camera.position.y -= speed;
  if (movementBounds) camera.position.clamp(movementBounds.min, movementBounds.max);

  coreGlow.intensity = 86 + Math.sin(t * 0.9) * 8;
  cyanA.intensity = 82 + Math.sin(t * 1.8) * 13;
  cyanB.intensity = 68 + Math.sin(t * 2.1 + 1.2) * 11;
  iceA.intensity = 58 + Math.sin(t * 0.8 + 0.6) * 6;
  iceB.intensity = 52 + Math.sin(t * 0.95 + 1.7) * 5;

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  renderer.render(scene, camera);
}
animate();
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, IS_IOS ? 1.18 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
});
install();
