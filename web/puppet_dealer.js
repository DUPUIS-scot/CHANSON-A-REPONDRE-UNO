import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const dealers = new Map();
const pendingMounts = new Map();
const MODEL_REVISION = 'play-jester-rigged-20260816i-torso-only';
const MODEL_URLS = [
  new URL('assets/assets/models/play_jester_rigged.glb', document.baseURI).href,
];
const MODEL_FACING_Y = 0;
const DEAL_DURATION = 2350;
const RECEIVE_DURATION = 1650;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const smoother = (value) => {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const segment = (value, start, end) => smooth((value - start) / (end - start));
const pulse = (value, start, peak, end) => segment(value, start, peak) * (1 - segment(value, peak, end));
const lerp = THREE.MathUtils.lerp;

function cubicBezier(out, a, b, c, d, t) {
  const u = 1 - clamp01(t);
  const tt = t * t;
  const uu = u * u;
  out.set(0, 0, 0)
    .addScaledVector(a, uu * u)
    .addScaledVector(b, 3 * uu * t)
    .addScaledVector(c, 3 * u * tt)
    .addScaledVector(d, tt * t);
  return out;
}

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
  material.dispose?.();
}

function disposeObject(root) {
  root?.traverse((object) => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
    else disposeMaterial(object.material);
  });
}

function makeCard() {
  const edge = new THREE.MeshStandardMaterial({ color: 0xe8d9b8, roughness: 0.54, metalness: 0.02 });
  const back = new THREE.MeshStandardMaterial({ color: 0x77151d, roughness: 0.68 });
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 1.02, 0.035),
    [edge, edge, edge, edge, back, back],
  );
  card.castShadow = true;
  card.visible = false;
  card.userData.edgeMaterial = edge;
  card.userData.fallbackMaterial = back;
  card.userData.faceMaterial = null;
  card.userData.texture = null;
  return card;
}

class JesterDealer {
  constructor(host, quality) {
    this.host = host;
    this.host.dataset.dealerStatus = 'loading';
    this.host.dataset.dealerAnimation = 'idle';
    this.host.dataset.modelRevision = MODEL_REVISION;
    this.disposed = false;
    this.visible = true;
    this.frame = 0;
    this.animation = null;
    this.clock = new THREE.Clock();

    this.status = document.createElement('div');
    this.status.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;font:600 14px Georgia,serif;letter-spacing:.04em;color:#f0c56b;background:rgba(5,3,2,.28);pointer-events:none;opacity:0;transition:opacity .2s ease;z-index:2';
    host.appendChild(this.status);

    this.modelRoot = new THREE.Group();
    this.gestureRoot = new THREE.Group();
    this.puppetRoot = new THREE.Group();
    this.puppetRoot.rotation.y = MODEL_FACING_Y;
    this.gestureRoot.add(this.puppetRoot);
    this.modelRoot.add(this.gestureRoot);

    this.scene = new THREE.Scene();
    this.scene.add(this.modelRoot);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 2.2, 12.2);
    this.camera.lookAt(0, 2.2, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: quality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.id = `${host.id}-canvas`;
    this.renderer.domElement.dataset.renderer = 'three.js-gltf';
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none';
    host.insertBefore(this.renderer.domElement, this.status);

    this.card = makeCard();
    this.scene.add(this.card);
    this.setupLights();
    this.setQuality(quality);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.resume();
      else this.pause();
    });
    this.intersectionObserver.observe(host);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.resize();
    this.loadModel(0);
  }

  showError(message) {
    this.status.textContent = message;
    this.status.style.opacity = '1';
  }

  clearError() {
    this.status.textContent = '';
    this.status.style.opacity = '0';
  }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xffe1b5, 0x130c16, 2.1));
    const key = new THREE.DirectionalLight(0xffbd78, 3.5);
    key.position.set(-4, 6, 7);
    this.scene.add(key);
    this.keyLight = key;
    const fill = new THREE.DirectionalLight(0xb9d7ff, 2.0);
    fill.position.set(5, 2, 6);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff4058, 2.6);
    rim.position.set(3, 5, -4);
    this.scene.add(rim);
  }

  loadModel(index) {
    const modelUrl = MODEL_URLS[index];
    if (!modelUrl) return this.showError('3D jester unavailable.');
    this.host.dataset.modelAsset = modelUrl;
    new GLTFLoader().load(modelUrl, (gltf) => {
      if (this.disposed) return disposeObject(gltf.scene);
      this.model = gltf.scene;
      this.model.traverse((object) => {
        if (/string|marionette|control[_ -]?line/i.test(object.name)) object.visible = false;
        if (object.isMesh) {
          object.castShadow = this.quality !== 'low';
          object.receiveShadow = this.quality !== 'low';
        }
      });

      const bounds = new THREE.Box3().setFromObject(this.model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      this.model.position.sub(center);
      const scale = 4.1 / Math.max(size.y, 0.001);
      this.model.scale.setScalar(scale);
      this.puppetRoot.add(this.model);
      this.puppetRoot.updateMatrixWorld(true);
      this.puppetBounds = new THREE.Box3().setFromObject(this.puppetRoot);
      this.resize();

      if (gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.clips = gltf.animations;
        const idle = gltf.animations.find((clip) => /idle/i.test(clip.name));
        this.idleAction = this.mixer.clipAction(idle || gltf.animations[0]);
        this.idleAction.play();
      }

      this.host.dataset.dealerStatus = 'ready';
      this.host.dataset.modelAnimations = String(gltf.animations.length);
      this.clearError();
      this.resume();
    }, undefined, (error) => {
      this.host.dataset.dealerStatus = 'failed';
      this.host.dataset.modelError = String(error?.message || error);
      this.showError('3D jester failed to load.');
    });
  }

  setQuality(value) {
    this.quality = ['low', 'medium', 'high'].includes(value) ? value : 'medium';
    const ratios = { low: 0.8, medium: 1.25, high: 1.8 };
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ratios[this.quality]));
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.keyLight.castShadow = this.quality !== 'low';
    this.resize();
  }

  resize() {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const narrow = width < 720;
    this.camera.fov = narrow ? 44 : 40;
    this.modelRoot.scale.setScalar(1);
    this.modelRoot.position.set(0, 0, 0);

    if (this.puppetBounds && !this.puppetBounds.isEmpty()) {
      const center = this.puppetBounds.getCenter(new THREE.Vector3());
      const size = this.puppetBounds.getSize(new THREE.Vector3());
      // Deliberately frame only the upper body: belt/waist at the bottom edge,
      // hat fully visible at the top, with both shoulders and forearms retained.
      const targetCenter = new THREE.Vector3(
        center.x,
        this.puppetBounds.min.y + size.y * (narrow ? 0.735 : 0.72),
        center.z,
      );
      const visibleHeight = Math.max(size.y * (narrow ? 0.50 : 0.54), 0.5);
      const visibleWidth = Math.max(size.x * (narrow ? 1.02 : 0.98), 0.5);
      const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
      const distanceForHeight = (visibleHeight * 0.5) / Math.max(Math.tan(verticalFov / 2), 0.001);
      const distanceForWidth = (visibleWidth * 0.5) / Math.max(Math.tan(horizontalFov / 2), 0.001);
      const distance = Math.max(distanceForHeight, distanceForWidth, 4.6) * (narrow ? 1.06 : 1.04);
      this.camera.position.set(targetCenter.x, targetCenter.y, targetCenter.z + distance);
      this.camera.lookAt(targetCenter);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld(true);
      this.host.dataset.puppetFit = 'torso-up-only';
      this.host.dataset.puppetCameraDistance = distance.toFixed(3);
    } else {
      this.camera.position.set(0, 2.8, narrow ? 9.2 : 9.6);
      this.camera.lookAt(0, 2.8, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  updateCardTexture(imageUrl) {
    this.host.dataset.cardTexture = 'loading';
    new THREE.TextureLoader().load(imageUrl, (texture) => {
      if (this.disposed) return texture.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = this.quality === 'high' ? 8 : 4;
      this.card.userData.texture?.dispose();
      this.card.userData.faceMaterial?.dispose();
      const face = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.54 });
      const edge = this.card.userData.edgeMaterial;
      this.card.material = [edge, edge, edge, edge, face, face];
      this.card.userData.texture = texture;
      this.card.userData.faceMaterial = face;
