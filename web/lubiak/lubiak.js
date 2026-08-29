import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050303);
scene.fog = new THREE.FogExp2(0x070405, 0.0085);

const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.08, 350);
camera.position.set(0, 4.6, 66);
let yaw = 0;
let pitch = -0.035;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x33445d, 0x170b06, 0.55));
const moon = new THREE.DirectionalLight(0x7890b6, 0.72);
moon.position.set(-24, 48, 30);
scene.add(moon);
const circus = new THREE.PointLight(0xff9848, 72, 58, 1.7);
circus.position.set(0, 9, -17);
scene.add(circus);
const streetGlow = new THREE.PointLight(0xffb067, 32, 36, 1.8);
streetGlow.position.set(-4, 5, 24);
scene.add(streetGlow);

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
  const gold = new THREE.MeshStandardMaterial({ color: 0x9d642f, roughness: 0.7 });
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
      for (let f = 0; f < 3; f += 1) {
        const window = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.8), gold);
        window.position.set(side * 5.45, 3 + f * 2, box.position.z + (f - 1) * 2.4);
        window.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        group.add(window);
      }
    }
  }

  const square = new THREE.Mesh(new THREE.PlaneGeometry(54, 46), new THREE.MeshStandardMaterial({ color: 0x2b201b, roughness: 1 }));
  square.rotation.x = -Math.PI / 2;
  square.position.set(0, 0.015, -25);
  group.add(square);

  const templeBase = new THREE.Mesh(new THREE.BoxGeometry(22, 7.5, 15), brick);
  templeBase.position.set(-15, 3.75, -31);
  group.add(templeBase);
  for (let level = 0; level < 3; level += 1) {
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(10 - level * 2.2, 12 - level * 2.2, 2, 4), dark);
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.72;
    roof.position.set(-15, 8.2 + level * 3.1, -31);
    group.add(roof);
  }

  const tent = new THREE.Group();
  const tentBody = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 8.5, 32, 1, true), canvas);
  tentBody.position.y = 4.25;
  tent.add(tentBody);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(13.2, 14, 32), orange);
  roof.position.y = 15;
  tent.add(roof);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 27, 10), gold);
  pole.position.y = 13.5;
  tent.add(pole);
  tent.position.set(12, 0, -20);
  group.add(tent);

  scene.add(group);
  finishLoad('ENTER LUBIAK · LIGHT MODE');
}

const modelUrl = '../assets/assets/models/LUBIAK.glb';
new GLTFLoader().load(
  modelUrl,
  (gltf) => {
    const root = gltf.scene;
    root.name = 'LUBIAK_ENVIRONMENT';
    scene.add(root);
    finishLoad();
  },
  (xhr) => {
    if (xhr.total) bar.style.width = `${Math.min(99, (xhr.loaded / xhr.total) * 100)}%`;
  },
  (error) => {
    console.warn('LUBIAK GLB unavailable; using lightweight district fallback.', error);
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
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.6, 18);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -44, 44);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -70, 76);
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
