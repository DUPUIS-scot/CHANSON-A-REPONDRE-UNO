import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const dealers = new Map();
const pendingMounts = new Map();
const MODEL_REVISION = 'play-jester-rigged-20260829-torso-card-flip-live';
const MODEL_URLS = [
  new URL('assets/assets/models/play_jester_rigged.glb', document.baseURI).href,
];
const MODEL_FACING_Y = Math.PI * 1.5;
const DEAL_DURATION = 3300;
const RECEIVE_DURATION = 1850;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const smoother = (value) => {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const segment = (value, start, end) => smoother((value - start) / (end - start));
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
  const fallbackFront = new THREE.MeshStandardMaterial({ color: 0x22100f, roughness: 0.65 });
  const fallbackBack = new THREE.MeshStandardMaterial({ color: 0x77151d, roughness: 0.68 });
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 1.08, 0.035),
    [edge, edge, edge, edge, fallbackFront, fallbackBack],
  );
  card.castShadow = true;
  card.visible = false;
  card.userData.edgeMaterial = edge;
  card.userData.fallbackFront = fallbackFront;
  card.userData.fallbackBack = fallbackBack;
  card.userData.frontMaterial = null;
  card.userData.backMaterial = null;
  card.userData.frontTexture = null;
  card.userData.backTexture = null;
  return card;
}

function loadTexture(url, quality) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = quality === 'high' ? 8 : 4;
      resolve(texture);
    }, undefined, reject);
  });
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
    this.bones = new Map();
    this.restQuaternions = new Map();
    this.userPose = {
      head: { x: 0, y: 0, z: 0 },
      torso: { x: 0, y: 0, z: 0 },
      leftUpper: { x: 0, y: 0, z: 0 },
      leftFore: { x: 0, y: 0, z: 0 },
      leftHand: { x: 0, y: 0, z: 0 },
      rightUpper: { x: 0, y: 0, z: 0 },
      rightFore: { x: 0, y: 0, z: 0 },
      rightHand: { x: 0, y: 0, z: 0 },
    };
    this.pointer = null;

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

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.camera.position.set(0, 2.8, 9.4);
    this.camera.lookAt(0, 2.8, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: quality !== 'low', powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.id = `${host.id}-canvas`;
    this.renderer.domElement.dataset.renderer = 'three.js-gltf';
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:auto;touch-action:none;cursor:grab';
    host.insertBefore(this.renderer.domElement, this.status);

    this.card = makeCard();
    this.scene.add(this.card);
    this.setupLights();
    this.setQuality(quality);
    this.bindPointerControls();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.resume(); else this.pause();
    });
    this.intersectionObserver.observe(host);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.resize();
    this.loadModel(0);
  }

  showError(message) { this.status.textContent = message; this.status.style.opacity = '1'; }
  clearError() { this.status.textContent = ''; this.status.style.opacity = '0'; }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xffe1b5, 0x130c16, 2.1));
    const key = new THREE.DirectionalLight(0xffbd78, 3.5); key.position.set(-4, 6, 7); this.scene.add(key); this.keyLight = key;
    const fill = new THREE.DirectionalLight(0xb9d7ff, 2.0); fill.position.set(5, 2, 6); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff4058, 2.6); rim.position.set(3, 5, -4); this.scene.add(rim);
  }

  cacheRig() {
    const names = [
      'Head', 'Spine02',
      'L_Upperarm', 'L_Forearm', 'L_Hand',
      'R_Upperarm', 'R_Forearm', 'R_Hand',
    ];
    for (const name of names) {
      const bone = this.model.getObjectByName(name);
      if (bone) {
        this.bones.set(name, bone);
        this.restQuaternions.set(name, bone.quaternion.clone());
      }
    }
    this.host.dataset.rigged = String(this.bones.size >= 6);
    this.host.dataset.rigControls = 'head,torso,left-arm,left-hand,right-arm,right-hand';
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
          object.frustumCulled = false;
        }
      });
      const bounds = new THREE.Box3().setFromObject(this.model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      this.model.position.sub(center);
      this.model.scale.setScalar(4.4 / Math.max(size.y, 0.001));
      this.puppetRoot.add(this.model);
      this.cacheRig();
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
    const ratios = { low: 0.75, medium: 1.15, high: 1.6 };
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
    this.camera.fov = narrow ? 41 : 35;
    this.modelRoot.scale.setScalar(narrow ? 0.96 : 1.02);
    this.modelRoot.position.set(0, narrow ? 2.35 : 1.72, 0);

    if (this.puppetBounds && !this.puppetBounds.isEmpty()) {
      const size = this.puppetBounds.getSize(new THREE.Vector3());
      const targetCenter = new THREE.Vector3(
        0,
        this.puppetBounds.min.y + size.y * (narrow ? 0.75 : 0.74),
        this.puppetBounds.getCenter(new THREE.Vector3()).z,
      );
      const visibleHeight = Math.max(size.y * (narrow ? 0.50 : 0.48), 0.5);
      const visibleWidth = Math.max(size.x * (narrow ? 0.94 : 0.90), 0.5);
      const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
      const distanceForHeight = (visibleHeight * 0.5) / Math.max(Math.tan(verticalFov / 2), 0.001);
      const distanceForWidth = (visibleWidth * 0.5) / Math.max(Math.tan(horizontalFov / 2), 0.001);
      const distance = Math.max(distanceForHeight, distanceForWidth, 4.4) * (narrow ? 1.03 : 1.0);
      this.camera.position.set(targetCenter.x, targetCenter.y, targetCenter.z + distance);
      this.camera.lookAt(targetCenter);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld(true);
      this.host.dataset.puppetFit = 'torso-and-up-crop';
      this.host.dataset.puppetCameraDistance = distance.toFixed(3);
    } else {
      this.camera.position.set(0, 3.0, narrow ? 9.8 : 9.2);
      this.camera.lookAt(0, 3.0, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  async updateCardTextures(frontUrl, backUrl) {
    this.host.dataset.cardTexture = 'loading';
    try {
      const [frontTexture, backTexture] = await Promise.all([
        loadTexture(frontUrl, this.quality),
        loadTexture(backUrl || frontUrl, this.quality),
      ]);
      if (this.disposed) {
        frontTexture.dispose();
        backTexture.dispose();
        return;
      }
      this.card.userData.frontTexture?.dispose();
      this.card.userData.backTexture?.dispose();
      this.card.userData.frontMaterial?.dispose();
      this.card.userData.backMaterial?.dispose();
      const front = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.5 });
      const back = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.54 });
      const edge = this.card.userData.edgeMaterial;
      this.card.material = [edge, edge, edge, edge, front, back];
      this.card.userData.frontTexture = frontTexture;
      this.card.userData.backTexture = backTexture;
      this.card.userData.frontMaterial = front;
      this.card.userData.backMaterial = back;
      this.host.dataset.cardTexture = 'ready';
    } catch (error) {
      this.host.dataset.cardTexture = 'failed';
      console.warn('Unable to load dealer card textures.', error);
    }
  }

  playEmbeddedAction(pattern) {
    if (!this.mixer || !this.clips) return;
    const clip = this.clips.find((item) => pattern.test(item.name));
    if (!clip) return;
    const action = this.mixer.clipAction(clip);
    action.reset().setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    this.idleAction?.fadeOut(0.15);
    action.fadeIn(0.15).play();
    this.activeAction = action;
  }

  deal(frontUrl, backUrl, kind) {
    if (this.animation || !this.model) return false;
    const receive = kind === 'receive';
    this.updateCardTextures(frontUrl, backUrl || frontUrl);
    this.animation = {
      kind: receive ? 'receive' : 'deal',
      started: performance.now(),
      duration: receive ? RECEIVE_DURATION : DEAL_DURATION,
    };
    this.card.visible = true;
    this.card.scale.setScalar(receive ? 1.0 : 1.08);
    this.card.position.set(receive ? 0.15 : -2.6, receive ? -3.0 : -1.25, 3.0);
    this.card.rotation.set(-0.20, receive ? 0 : Math.PI, receive ? 0 : -0.10);
    this.playEmbeddedAction(receive ? /receive|take|collect|catch|discard/i : /draw|deal|reach|pick|give/i);
    this.setPhase(receive ? 'catchPlayerCard' : 'drawCategoryVerso');
    this.resume();
    return true;
  }

  setPhase(phase) {
    if (this.host.dataset.dealerAnimation !== phase) this.host.dataset.dealerAnimation = phase;
  }

  resetGesture() {
    this.gestureRoot.position.set(0, 0, 0);
    this.gestureRoot.rotation.set(0, 0, 0);
    this.gestureRoot.scale.setScalar(1);
  }

  setGesturePose({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, squash = 0 }) {
    this.gestureRoot.position.set(x, y, z);
    this.gestureRoot.rotation.set(rx, ry, rz);
    this.gestureRoot.scale.set(1 + squash * 0.04, 1 - squash * 0.05, 1 + squash * 0.03);
  }

  poseBone(name, auto, user) {
    const bone = this.bones.get(name);
    const rest = this.restQuaternions.get(name);
    if (!bone || !rest) return;
    const qUser = new THREE.Quaternion().setFromEuler(new THREE.Euler(user?.x || 0, user?.y || 0, user?.z || 0, 'XYZ'));
    const qAuto = new THREE.Quaternion().setFromEuler(new THREE.Euler(auto?.x || 0, auto?.y || 0, auto?.z || 0, 'XYZ'));
    bone.quaternion.copy(rest).multiply(qUser).multiply(qAuto);
  }

  applyRigPose(t = null, receive = false) {
    let reach = 0, lift = 0, present = 0, release = 0;
    if (t !== null && !receive) {
      reach = segment(t, 0.04, 0.30);
      lift = segment(t, 0.18, 0.46);
      present = segment(t, 0.34, 0.58);
      release = segment(t, 0.88, 1.0);
    } else if (t !== null) {
      reach = segment(t, 0.02, 0.30);
      lift = segment(t, 0.22, 0.56);
      present = segment(t, 0.46, 0.70);
      release = segment(t, 0.78, 1.0);
    }

    const a = receive ? -1 : 1;
    const autoUpper = t === null ? {} : {
      x: a * lerp(0, -0.42, reach) + a * lerp(0, 0.22, present) - a * lerp(0, 0.18, release),
      y: lerp(0, 0.18, present),
      z: a * lerp(0, -0.48, lift) + a * lerp(0, 0.20, release),
    };
    const autoFore = t === null ? {} : {
      x: a * lerp(0, -0.75, lift) + a * lerp(0, 0.34, present) - a * lerp(0, 0.22, release),
      y: lerp(0, -0.10, present),
      z: a * lerp(0, 0.18, reach),
    };
    const autoHand = t === null ? {} : {
      x: lerp(0, -0.18, present),
      y: a * lerp(0, 0.26, present),
      z: a * lerp(0, -0.12, lift),
    };

    const side = receive ? 'right' : 'left';
    const upperName = receive ? 'R_Upperarm' : 'L_Upperarm';
    const foreName = receive ? 'R_Forearm' : 'L_Forearm';
    const handName = receive ? 'R_Hand' : 'L_Hand';
    this.poseBone(upperName, autoUpper, this.userPose[`${side}Upper`]);
    this.poseBone(foreName, autoFore, this.userPose[`${side}Fore`]);
    this.poseBone(handName, autoHand, this.userPose[`${side}Hand`]);

    const other = receive ? 'left' : 'right';
    this.poseBone(receive ? 'L_Upperarm' : 'R_Upperarm', {}, this.userPose[`${other}Upper`]);
    this.poseBone(receive ? 'L_Forearm' : 'R_Forearm', {}, this.userPose[`${other}Fore`]);
    this.poseBone(receive ? 'L_Hand' : 'R_Hand', {}, this.userPose[`${other}Hand`]);
    this.poseBone('Head', {}, this.userPose.head);
    this.poseBone('Spine02', {}, this.userPose.torso);
  }

  handWorldPosition(left = true) {
    const hand = this.bones.get(left ? 'L_Hand' : 'R_Hand');
    if (!hand) return null;
    hand.updateWorldMatrix(true, false);
    return hand.getWorldPosition(new THREE.Vector3());
  }

  updateDeal(t) {
    const reach = segment(t, 0.04, 0.28);
    const lift = segment(t, 0.18, 0.42);
    const hold = segment(t, 0.34, 0.52);
    const flip = segment(t, 0.56, 0.74);
    const pass = segment(t, 0.78, 0.96);
    const settle = segment(t, 0.88, 1.0);

    this.applyRigPose(t, false);
    this.setGesturePose({
      x: lerp(0, -0.18, reach) + lerp(0, 0.18, hold),
      y: lerp(0, 0.10, lift),
      z: lerp(0, 0.18, hold),
      ry: lerp(0, 0.08, hold),
      squash: pulse(t, 0.10, 0.32, 0.52),
    });

    const deck = new THREE.Vector3(-2.65, -1.25, 3.0);
    const hand = this.handWorldPosition(true);
    const present = hand ? hand.clone().add(new THREE.Vector3(0.05, 0.10, 0.45)) : new THREE.Vector3(-0.35, 0.52, 3.15);
    const player = new THREE.Vector3(0.15, -2.95, 3.05);

    if (t < 0.38) {
      const p1 = new THREE.Vector3(-2.0, -0.65, 2.85);
      const p2 = new THREE.Vector3(-1.1, 0.10, 2.75);
      cubicBezier(this.card.position, deck, p1, p2, present, t / 0.38);
      this.setPhase('drawCategoryVerso');
    } else if (t < 0.78) {
      this.card.position.lerp(present, 0.32);
      this.setPhase(flip < 0.02 ? 'holdCategoryVerso' : 'flipToRecto');
    } else {
      const p1 = present.clone().add(new THREE.Vector3(0.25, -0.2, 0.05));
      const p2 = new THREE.Vector3(0.15, -1.65, 3.10);
      cubicBezier(this.card.position, present, p1, p2, player, pass);
      this.setPhase('presentRecto');
    }

    this.card.rotation.x = lerp(-0.20, -0.04, lift);
    this.card.rotation.y = lerp(Math.PI, 0, flip);
    this.card.rotation.z = Math.sin(t * Math.PI) * -0.06;
    this.card.scale.setScalar(1.06 + pulse(t, 0.38, 0.60, 0.82) * 0.23);

    if (t > 0.965) this.card.visible = false;
    if (settle > 0.98) this.resetGesture();
  }

  updateReceive(t) {
    const catchPhase = segment(t, 0.04, 0.34);
    const lift = segment(t, 0.25, 0.58);
    const throwPhase = segment(t, 0.58, 0.92);
    const settle = segment(t, 0.76, 1.0);
    this.applyRigPose(t, true);
    this.setGesturePose({
      x: lerp(0, 0.18, catchPhase),
      y: lerp(0, 0.10, lift),
      z: lerp(0, 0.16, catchPhase),
      ry: lerp(0, -0.10, lift),
    });

    const player = new THREE.Vector3(0.15, -2.95, 3.05);
    const hand = this.handWorldPosition(false);
    const catchPoint = hand ? hand.clone().add(new THREE.Vector3(-0.05, 0.08, 0.38)) : new THREE.Vector3(0.55, 0.30, 3.0);
    const discard = new THREE.Vector3(2.65, -1.20, 2.75);

    if (t < 0.58) {
      const p1 = new THREE.Vector3(0.2, -1.5, 3.0);
      const p2 = new THREE.Vector3(0.55, -0.1, 2.85);
      cubicBezier(this.card.position, player, p1, p2, catchPoint, t / 0.58);
      this.setPhase('catchPlayerCard');
    } else {
      const p1 = catchPoint.clone().add(new THREE.Vector3(0.6, 0.45, 0.15));
      const p2 = new THREE.Vector3(2.1, 0.10, 2.9);
      cubicBezier(this.card.position, catchPoint, p1, p2, discard, throwPhase);
      this.setPhase('discardLive');
    }

    this.card.rotation.x = lerp(-0.18, -0.05, lift);
    this.card.rotation.y = lerp(0, -0.34, throwPhase);
    this.card.rotation.z = lerp(0, 0.44, throwPhase);
    this.card.scale.setScalar(1.0 + pulse(t, 0.12, 0.42, 0.67) * 0.14);
    if (t > 0.965) this.card.visible = false;
    if (settle > 0.98) this.resetGesture();
  }

  chooseControl(x, y) {
    const w = Math.max(this.renderer.domElement.clientWidth, 1);
    const h = Math.max(this.renderer.domElement.clientHeight, 1);
    const nx = x / w;
    const ny = y / h;
    if (ny < 0.38 && nx > 0.30 && nx < 0.70) return 'head';
    if (nx < 0.34) return ny > 0.64 ? 'leftHand' : 'leftUpper';
    if (nx > 0.66) return ny > 0.64 ? 'rightHand' : 'rightUpper';
    return 'torso';
  }

  bindPointerControls() {
    const canvas = this.renderer.domElement;
    this.onPointerDown = (event) => {
      if (this.animation) return;
      const rect = canvas.getBoundingClientRect();
      this.pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        part: this.chooseControl(event.clientX - rect.left, event.clientY - rect.top),
      };
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grabbing';
      this.host.dataset.userControl = this.pointer.part;
      event.preventDefault();
    };
    this.onPointerMove = (event) => {
      if (!this.pointer || event.pointerId !== this.pointer.id || this.animation) return;
      const dx = (event.clientX - this.pointer.x) / Math.max(canvas.clientWidth, 1);
      const dy = (event.clientY - this.pointer.y) / Math.max(canvas.clientHeight, 1);
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      const pose = this.userPose[this.pointer.part];
      if (!pose) return;
      if (this.pointer.part === 'head') {
        pose.y = clamp(pose.y + dx * 2.2, -0.62, 0.62);
        pose.x = clamp(pose.x + dy * 1.5, -0.42, 0.42);
      } else if (this.pointer.part === 'torso') {
        pose.y = clamp(pose.y + dx * 1.4, -0.38, 0.38);
        pose.x = clamp(pose.x + dy * 0.9, -0.22, 0.22);
      } else if (/Hand$/.test(this.pointer.part)) {
        pose.z = clamp(pose.z + dx * 2.4, -0.90, 0.90);
        pose.x = clamp(pose.x + dy * 2.0, -0.75, 0.75);
      } else {
        pose.z = clamp(pose.z + dx * 2.0, -0.95, 0.95);
        pose.x = clamp(pose.x + dy * 1.8, -0.90, 0.90);
      }
      this.applyRigPose();
      this.resume();
      event.preventDefault();
    };
    this.onPointerUp = (event) => {
      if (!this.pointer || event.pointerId !== this.pointer.id) return;
      canvas.releasePointerCapture?.(event.pointerId);
      this.pointer = null;
      canvas.style.cursor = 'grab';
      this.host.dataset.userControl = 'idle';
    };
    this.onDoubleClick = () => {
      for (const pose of Object.values(this.userPose)) pose.x = pose.y = pose.z = 0;
      this.applyRigPose();
      this.host.dataset.userControl = 'reset';
      this.resume();
    };
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('dblclick', this.onDoubleClick);
  }

  update() {
    const delta = this.clock.getDelta();
    this.mixer?.update(delta);
    if (this.animation) {
      const t = clamp01((performance.now() - this.animation.started) / this.animation.duration);
      if (this.animation.kind === 'receive') this.updateReceive(t); else this.updateDeal(t);
      if (t >= 1) {
        this.animation = null;
        this.card.visible = false;
        this.resetGesture();
        this.applyRigPose();
        this.setPhase('idle');
        this.idleAction?.reset().fadeIn(0.15).play();
      }
    } else {
      this.applyRigPose();
    }
  }

  render = () => {
    if (this.disposed || !this.visible || document.hidden) return;
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.render);
  };

  resume() {
    if (this.disposed || !this.visible || this.frame || document.hidden) return;
    this.clock.getDelta();
    this.frame = requestAnimationFrame(this.render);
  }

  pause() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  onVisibilityChange = () => {
    if (document.hidden) this.pause(); else this.resume();
  };

  dispose() {
    this.disposed = true;
    this.pause();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerUp);
    canvas.removeEventListener('dblclick', this.onDoubleClick);
    this.mixer?.stopAllAction();
    this.card.userData.frontTexture?.dispose();
    this.card.userData.backTexture?.dispose();
    this.card.userData.frontMaterial?.dispose();
    this.card.userData.backMaterial?.dispose();
    disposeMaterial(this.card.userData.edgeMaterial);
    disposeMaterial(this.card.userData.fallbackFront);
    disposeMaterial(this.card.userData.fallbackBack);
    disposeObject(this.model);
    this.renderer.dispose();
    this.host.replaceChildren();
  }
}

window.puppetDealerCreate = function puppetDealerCreate(id, quality) {
  if (dealers.has(id)) return;
  const host = document.getElementById(id);
  if (!host) {
    if (!pendingMounts.has(id)) {
      let attempts = 0;
      pendingMounts.set(id, setInterval(() => {
        attempts += 1;
        const mountedHost = document.getElementById(id);
        if (mountedHost) {
          clearInterval(pendingMounts.get(id));
          pendingMounts.delete(id);
          dealers.set(id, new JesterDealer(mountedHost, quality));
        } else if (attempts > 30) {
          clearInterval(pendingMounts.get(id));
          pendingMounts.delete(id);
        }
      }, 100));
    }
    return;
  }
  dealers.set(id, new JesterDealer(host, quality));
};

window.puppetDealerDeal = function puppetDealerDeal(id, versoUrl, rectoUrl) {
  return dealers.get(id)?.deal(rectoUrl || versoUrl, versoUrl, 'deal') ?? false;
};
window.puppetDealerReceive = function puppetDealerReceive(id, imageUrl) {
  return dealers.get(id)?.deal(imageUrl, imageUrl, 'receive') ?? false;
};
window.puppetDealerSetQuality = function puppetDealerSetQuality(id, quality) {
  dealers.get(id)?.setQuality(quality);
};
window.puppetDealerDestroy = function puppetDealerDestroy(id) {
  if (pendingMounts.has(id)) {
    clearInterval(pendingMounts.get(id));
    pendingMounts.delete(id);
  }
  const dealer = dealers.get(id);
  if (!dealer) return;
  dealer.dispose();
  dealers.delete(id);
};
