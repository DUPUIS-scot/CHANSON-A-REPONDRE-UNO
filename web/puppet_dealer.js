import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const dealers = new Map();
const pendingMounts = new Map();
const MODEL_REVISION = 'play-jester-rigged-20260829-animated-dealer-v1';
const MODEL_URL = new URL('assets/assets/models/play_jester_rigged.glb', document.baseURI).href;
const MODEL_FACING_Y = Math.PI * 1.5;
const DEAL_DURATION = 4200;
const RECEIVE_DURATION = 2600;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = THREE.MathUtils.lerp;
const smoother = (v) => {
  const t = clamp01(v);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const segment = (v, a, b) => smoother((v - a) / Math.max(b - a, 0.0001));
const pulse = (v, a, p, b) => segment(v, a, p) * (1 - segment(v, p, b));

function cubicBezier(out, a, b, c, d, t) {
  const x = clamp01(t);
  const u = 1 - x;
  const xx = x * x;
  const uu = u * u;
  return out.set(0, 0, 0)
    .addScaledVector(a, uu * u)
    .addScaledVector(b, 3 * uu * x)
    .addScaledVector(c, 3 * u * xx)
    .addScaledVector(d, xx * x);
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
  const frontFallback = new THREE.MeshStandardMaterial({ color: 0x22100f, roughness: 0.65 });
  const backFallback = new THREE.MeshStandardMaterial({ color: 0x77151d, roughness: 0.68 });
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 1.24, 0.04),
    [edge, edge, edge, edge, frontFallback, backFallback],
  );
  card.visible = false;
  card.castShadow = true;
  card.userData.edgeMaterial = edge;
  card.userData.frontFallback = frontFallback;
  card.userData.backFallback = backFallback;
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
    this.quality = 'medium';
    this.disposed = false;
    this.visible = true;
    this.frame = 0;
    this.animation = null;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.bones = new Map();
    this.restQuaternions = new Map();
    this.userPose = {
      head: { x: 0, y: 0, z: 0 }, torso: { x: 0, y: 0, z: 0 },
      leftUpper: { x: 0, y: 0, z: 0 }, leftFore: { x: 0, y: 0, z: 0 }, leftHand: { x: 0, y: 0, z: 0 },
      rightUpper: { x: 0, y: 0, z: 0 }, rightFore: { x: 0, y: 0, z: 0 }, rightHand: { x: 0, y: 0, z: 0 },
    };
    this.pointer = null;

    host.dataset.dealerStatus = 'loading';
    host.dataset.dealerAnimation = 'IDLE';
    host.dataset.modelRevision = MODEL_REVISION;
    host.dataset.animationVocabulary = 'IDLE,LOOK_PLAYER,REACH_DECK,DRAW_CARD,HOLD_VERSO,FLIP_CARD,PRESENT_RECTO,TAKE_CARD,DISCARD,RETURN_IDLE';

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
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.id = `${host.id}-canvas`;
    this.renderer.domElement.dataset.renderer = 'three.js-gltf';
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:auto;touch-action:none;cursor:grab';
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
    this.loadModel();
  }

  showError(message) { this.status.textContent = message; this.status.style.opacity = '1'; }
  clearError() { this.status.textContent = ''; this.status.style.opacity = '0'; }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xffe1b5, 0x130c16, 2.0));
    const key = new THREE.DirectionalLight(0xffbd78, 3.7); key.position.set(-4, 6, 7); this.scene.add(key); this.keyLight = key;
    const fill = new THREE.DirectionalLight(0xb9d7ff, 1.8); fill.position.set(5, 2, 6); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff4058, 2.4); rim.position.set(3, 5, -4); this.scene.add(rim);
  }

  cacheRig() {
    const names = ['Head', 'Spine02', 'L_Upperarm', 'L_Forearm', 'L_Hand', 'R_Upperarm', 'R_Forearm', 'R_Hand'];
    this.bones.clear();
    this.restQuaternions.clear();
    for (const name of names) {
      const bone = this.model.getObjectByName(name);
      if (!bone) continue;
      this.bones.set(name, bone);
      this.restQuaternions.set(name, bone.quaternion.clone());
    }
    this.host.dataset.rigged = String(this.bones.size >= 6);
    this.host.dataset.rigControls = 'head,torso,left-arm,left-hand,right-arm,right-hand';
  }

  boneWorld(name) {
    const bone = this.bones.get(name);
    if (!bone) return null;
    this.puppetRoot.updateMatrixWorld(true);
    return bone.getWorldPosition(new THREE.Vector3());
  }

  fitModelFromRig() {
    const head = this.boneWorld('Head');
    const spine = this.boneWorld('Spine02');
    if (!head || !spine) return false;
    const rawSpan = Math.max(head.distanceTo(spine), 0.001);
    const targetSpan = 2.45;
    this.model.scale.multiplyScalar(clamp(targetSpan / rawSpan, 0.01, 100));
    this.puppetRoot.updateMatrixWorld(true);

    let h = this.boneWorld('Head');
    let s = this.boneWorld('Spine02');
    if (!h || !s) return false;
    if (h.y < s.y) {
      this.model.rotation.z += Math.PI;
      this.puppetRoot.updateMatrixWorld(true);
      h = this.boneWorld('Head');
      s = this.boneWorld('Spine02');
      this.host.dataset.rigOrientation = 'auto-upright';
    } else this.host.dataset.rigOrientation = 'upright';

    if (!h || !s) return false;
    const localHead = this.puppetRoot.worldToLocal(h.clone());
    const localSpine = this.puppetRoot.worldToLocal(s.clone());
    const mid = localSpine.clone().lerp(localHead, 0.52);
    this.model.position.add(new THREE.Vector3(0, 0.25, 0).sub(mid));
    this.puppetRoot.updateMatrixWorld(true);
    this.host.dataset.rigAnchor = 'Head+Spine02';
    this.host.dataset.rigSpan = rawSpan.toFixed(4);
    return true;
  }

  updateBustFrame() {
    const head = this.boneWorld('Head');
    const spine = this.boneWorld('Spine02');
    if (!head || !spine) return false;
    const rigSpan = Math.max(head.distanceTo(spine), 0.25);
    const up = head.clone().sub(spine).normalize();
    const target = spine.clone().lerp(head, 0.56).addScaledVector(up, rigSpan * 0.08);
    const ls = this.boneWorld('L_Upperarm');
    const rs = this.boneWorld('R_Upperarm');
    const shoulderSpan = ls && rs ? ls.distanceTo(rs) : rigSpan * 1.35;
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    const narrow = width < 720;
    this.camera.fov = narrow ? 34 : 30;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (width / height));
    const visibleHeight = rigSpan * (narrow ? 1.72 : 1.62);
    const visibleWidth = Math.max(shoulderSpan * (narrow ? 1.30 : 1.22), rigSpan * 1.38);
    const dh = (visibleHeight * 0.5) / Math.max(Math.tan(vfov / 2), 0.001);
    const dw = (visibleWidth * 0.5) / Math.max(Math.tan(hfov / 2), 0.001);
    const distance = Math.max(dh, dw, 3.0);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.puppetRoot.getWorldQuaternion(new THREE.Quaternion()));
    this.camera.position.copy(target).addScaledVector(forward, distance);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
    this.host.dataset.puppetFit = 'animated-rig-bust-large';
    this.host.dataset.puppetCameraDistance = distance.toFixed(3);
    return true;
  }

  loadModel() {
    this.host.dataset.modelAsset = MODEL_URL;
    new GLTFLoader().load(MODEL_URL, (gltf) => {
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
      this.puppetRoot.add(this.model);
      this.puppetRoot.updateMatrixWorld(true);
      this.cacheRig();
      if (!this.fitModelFromRig()) {
        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        this.model.scale.setScalar(5.2 / Math.max(size.y, 0.001));
        this.host.dataset.rigAnchor = 'fallback-bounds';
      }
      this.resize();
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
    this.modelRoot.position.set(0, 0, 0);
    this.modelRoot.scale.setScalar(1);
    if (!this.updateBustFrame()) {
      this.camera.position.set(0, 0.3, width < 720 ? 6.0 : 5.3);
      this.camera.lookAt(0, 0.3, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  async updateCardTextures(frontUrl, backUrl) {
    try {
      this.host.dataset.cardTexture = 'loading';
      const [frontTexture, backTexture] = await Promise.all([loadTexture(frontUrl, this.quality), loadTexture(backUrl || frontUrl, this.quality)]);
      if (this.disposed) { frontTexture.dispose(); backTexture.dispose(); return; }
      this.card.userData.frontTexture?.dispose();
      this.card.userData.backTexture?.dispose();
      this.card.userData.frontMaterial?.dispose();
      this.card.userData.backMaterial?.dispose();
      const front = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.5 });
      const back = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.54 });
      const edge = this.card.userData.edgeMaterial;
      this.card.material = [edge, edge, edge, edge, front, back];
      Object.assign(this.card.userData, { frontTexture, backTexture, frontMaterial: front, backMaterial: back });
      this.host.dataset.cardTexture = 'ready';
    } catch (error) {
      this.host.dataset.cardTexture = 'failed';
      console.warn('Unable to load dealer card textures.', error);
    }
  }

  setPhase(phase) {
    if (this.host.dataset.dealerAnimation !== phase) this.host.dataset.dealerAnimation = phase;
  }

  setGesturePose({ ry = 0, rz = 0, squash = 0 } = {}) {
    this.gestureRoot.position.set(0, 0, 0);
    this.gestureRoot.rotation.set(0, clamp(ry, -0.05, 0.05), clamp(rz, -0.04, 0.04));
    this.gestureRoot.scale.set(1 + squash * 0.015, 1 - squash * 0.015, 1);
  }

  resetGesture() { this.setGesturePose(); }

  poseBone(name, auto = {}, user = {}) {
    const bone = this.bones.get(name);
    const rest = this.restQuaternions.get(name);
    if (!bone || !rest) return;
    const qUser = new THREE.Quaternion().setFromEuler(new THREE.Euler(user.x || 0, user.y || 0, user.z || 0, 'XYZ'));
    const qAuto = new THREE.Quaternion().setFromEuler(new THREE.Euler(auto.x || 0, auto.y || 0, auto.z || 0, 'XYZ'));
    bone.quaternion.copy(rest).multiply(qUser).multiply(qAuto);
  }

  applyRigPose(t = null, receive = false) {
    let reach = 0, lift = 0, present = 0, release = 0, look = 0;
    if (t !== null && !receive) {
      look = segment(t, 0.00, 0.10) * (1 - segment(t, 0.92, 1.0));
      reach = segment(t, 0.10, 0.28);
      lift = segment(t, 0.22, 0.42);
      present = segment(t, 0.56, 0.80);
      release = segment(t, 0.88, 1.0);
    } else if (t !== null) {
      look = segment(t, 0.00, 0.14) * (1 - segment(t, 0.84, 1.0));
      reach = segment(t, 0.08, 0.32);
      lift = segment(t, 0.24, 0.52);
      present = segment(t, 0.46, 0.66);
      release = segment(t, 0.72, 1.0);
    }

    const side = receive ? 'right' : 'left';
    const a = receive ? -1 : 1;
    const autoUpper = t === null ? {} : {
      x: a * lerp(0, -0.52, reach) + a * lerp(0, 0.26, present) - a * lerp(0, 0.20, release),
      y: lerp(0, 0.16, present),
      z: a * lerp(0, -0.58, lift) + a * lerp(0, 0.18, release),
    };
    const autoFore = t === null ? {} : {
      x: a * lerp(0, -0.86, lift) + a * lerp(0, 0.38, present) - a * lerp(0, 0.24, release),
      y: lerp(0, -0.12, present),
      z: a * lerp(0, 0.22, reach),
    };
    const autoHand = t === null ? {} : {
      x: lerp(0, -0.20, present),
      y: a * lerp(0, 0.30, present),
      z: a * lerp(0, -0.14, lift),
    };
    const upper = receive ? 'R_Upperarm' : 'L_Upperarm';
    const fore = receive ? 'R_Forearm' : 'L_Forearm';
    const hand = receive ? 'R_Hand' : 'L_Hand';
    this.poseBone(upper, autoUpper, this.userPose[`${side}Upper`]);
    this.poseBone(fore, autoFore, this.userPose[`${side}Fore`]);
    this.poseBone(hand, autoHand, this.userPose[`${side}Hand`]);

    const other = receive ? 'left' : 'right';
    this.poseBone(receive ? 'L_Upperarm' : 'R_Upperarm', {}, this.userPose[`${other}Upper`]);
    this.poseBone(receive ? 'L_Forearm' : 'R_Forearm', {}, this.userPose[`${other}Fore`]);
    this.poseBone(receive ? 'L_Hand' : 'R_Hand', {}, this.userPose[`${other}Hand`]);
    this.poseBone('Head', t === null ? {} : { x: -0.08 * look, y: (receive ? -0.10 : 0.10) * look, z: 0.035 * Math.sin(t * Math.PI * 2) }, this.userPose.head);
    this.poseBone('Spine02', t === null ? {} : { x: 0.025 * look, y: (receive ? -0.035 : 0.035) * look }, this.userPose.torso);
  }

  applyIdlePose(delta) {
    this.elapsed += delta;
    const breath = Math.sin(this.elapsed * 1.35);
    const glance = Math.sin(this.elapsed * 0.42);
    this.poseBone('Head', { x: -0.025 + breath * 0.012, y: glance * 0.055, z: Math.sin(this.elapsed * 0.31) * 0.018 }, this.userPose.head);
    this.poseBone('Spine02', { x: breath * 0.012, y: glance * -0.015, z: breath * 0.008 }, this.userPose.torso);
    this.poseBone('L_Upperarm', {}, this.userPose.leftUpper);
    this.poseBone('L_Forearm', {}, this.userPose.leftFore);
    this.poseBone('L_Hand', {}, this.userPose.leftHand);
    this.poseBone('R_Upperarm', {}, this.userPose.rightUpper);
    this.poseBone('R_Forearm', {}, this.userPose.rightFore);
    this.poseBone('R_Hand', {}, this.userPose.rightHand);
    this.setPhase('IDLE');
  }

  handWorldPosition(left = true) {
    const hand = this.bones.get(left ? 'L_Hand' : 'R_Hand');
    if (!hand) return null;
    hand.updateWorldMatrix(true, false);
    return hand.getWorldPosition(new THREE.Vector3());
  }

  startDeal(frontUrl, backUrl, receive = false) {
    if (this.animation || !this.model) return false;
    this.updateCardTextures(frontUrl, backUrl || frontUrl);
    this.animation = { kind: receive ? 'receive' : 'deal', started: performance.now(), duration: receive ? RECEIVE_DURATION : DEAL_DURATION };
    this.card.visible = true;
    this.card.scale.setScalar(receive ? 1.0 : 1.08);
    this.card.position.set(receive ? 0.15 : -2.6, receive ? -2.5 : -1.15, 2.6);
    this.card.rotation.set(-0.18, receive ? 0 : Math.PI, 0);
    this.setPhase('LOOK_PLAYER');
    this.resume();
    return true;
  }

  updateDeal(t) {
    const lift = segment(t, 0.20, 0.40);
    const flip = segment(t, 0.50, 0.67);
    const pass = segment(t, 0.72, 0.91);
    const hand = this.handWorldPosition(true);
    const present = hand ? hand.clone().add(new THREE.Vector3(0.05, 0.08, 0.42)) : new THREE.Vector3(-0.30, 0.50, 2.7);
    const deck = new THREE.Vector3(-2.35, -1.05, 2.55);
    const player = new THREE.Vector3(0.10, -2.25, 2.75);

    this.applyRigPose(t, false);
    this.setGesturePose({ ry: lerp(0, 0.04, segment(t, 0.35, 0.60)), squash: pulse(t, 0.14, 0.30, 0.48) });

    if (t < 0.10) this.setPhase('LOOK_PLAYER');
    else if (t < 0.27) this.setPhase('REACH_DECK');
    else if (t < 0.44) this.setPhase('DRAW_CARD');
    else if (t < 0.52) this.setPhase('HOLD_VERSO');
    else if (t < 0.69) this.setPhase('FLIP_CARD');
    else if (t < 0.92) this.setPhase('PRESENT_RECTO');
    else this.setPhase('RETURN_IDLE');

    if (t < 0.44) {
      cubicBezier(this.card.position, deck, new THREE.Vector3(-1.9, -0.55, 2.6), new THREE.Vector3(-1.0, 0.10, 2.55), present, t / 0.44);
    } else if (t < 0.72) {
      this.card.position.lerp(present, 0.38);
    } else {
      cubicBezier(this.card.position, present, present.clone().add(new THREE.Vector3(0.20, -0.14, 0.05)), new THREE.Vector3(0.12, -1.25, 2.72), player, pass);
    }
    this.card.rotation.x = lerp(-0.18, -0.03, lift);
    this.card.rotation.y = lerp(Math.PI, 0, flip);
    this.card.rotation.z = Math.sin(t * Math.PI) * -0.05;
    this.card.scale.setScalar(1.06 + pulse(t, 0.44, 0.66, 0.84) * 0.24);
    if (t > 0.96) this.card.visible = false;
  }

  updateReceive(t) {
    const lift = segment(t, 0.18, 0.50);
    const throwPhase = segment(t, 0.54, 0.86);
    const hand = this.handWorldPosition(false);
    const catchPoint = hand ? hand.clone().add(new THREE.Vector3(-0.05, 0.08, 0.36)) : new THREE.Vector3(0.45, 0.28, 2.65);
    const player = new THREE.Vector3(0.10, -2.25, 2.75);
    const discard = new THREE.Vector3(2.35, -1.05, 2.55);

    this.applyRigPose(t, true);
    this.setGesturePose({ ry: lerp(0, -0.04, lift) });
    if (t < 0.12) this.setPhase('LOOK_PLAYER');
    else if (t < 0.54) this.setPhase('TAKE_CARD');
    else if (t < 0.88) this.setPhase('DISCARD');
    else this.setPhase('RETURN_IDLE');

    if (t < 0.54) {
      cubicBezier(this.card.position, player, new THREE.Vector3(0.12, -1.25, 2.72), new THREE.Vector3(0.42, -0.08, 2.65), catchPoint, t / 0.54);
    } else {
      cubicBezier(this.card.position, catchPoint, catchPoint.clone().add(new THREE.Vector3(0.55, 0.40, 0.12)), new THREE.Vector3(1.85, 0.04, 2.62), discard, throwPhase);
    }
    this.card.rotation.x = lerp(-0.18, -0.04, lift);
    this.card.rotation.y = lerp(0, -0.36, throwPhase);
    this.card.rotation.z = lerp(0, 0.46, throwPhase);
    if (t > 0.96) this.card.visible = false;
  }

  chooseControl(x, y) {
    const w = Math.max(this.renderer.domElement.clientWidth, 1);
    const h = Math.max(this.renderer.domElement.clientHeight, 1);
    const nx = x / w, ny = y / h;
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
      this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, part: this.chooseControl(event.clientX - rect.left, event.clientY - rect.top) };
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grabbing';
      this.host.dataset.userControl = this.pointer.part;
      event.preventDefault();
    };
    this.onPointerMove = (event) => {
      if (!this.pointer || event.pointerId !== this.pointer.id || this.animation) return;
      const dx = (event.clientX - this.pointer.x) / Math.max(canvas.clientWidth, 1);
      const dy = (event.clientY - this.pointer.y) / Math.max(canvas.clientHeight, 1);
      this.pointer.x = event.clientX; this.pointer.y = event.clientY;
      const pose = this.userPose[this.pointer.part];
      if (!pose) return;
      if (this.pointer.part === 'head') {
        pose.y = clamp(pose.y + dx * 2.2, -0.62, 0.62); pose.x = clamp(pose.x + dy * 1.5, -0.42, 0.42);
      } else if (this.pointer.part === 'torso') {
        pose.y = clamp(pose.y + dx * 1.4, -0.38, 0.38); pose.x = clamp(pose.x + dy * 0.9, -0.22, 0.22);
      } else if (/Hand$/.test(this.pointer.part)) {
        pose.z = clamp(pose.z + dx * 2.4, -0.90, 0.90); pose.x = clamp(pose.x + dy * 2.0, -0.75, 0.75);
      } else {
        pose.z = clamp(pose.z + dx * 2.0, -0.95, 0.95); pose.x = clamp(pose.x + dy * 1.8, -0.90, 0.90);
      }
      this.updateBustFrame();
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
    if (this.animation) {
      const t = clamp01((performance.now() - this.animation.started) / this.animation.duration);
      if (this.animation.kind === 'receive') this.updateReceive(t); else this.updateDeal(t);
      if (t >= 1) {
        this.animation = null;
        this.card.visible = false;
        this.resetGesture();
        this.setPhase('IDLE');
      }
    } else {
      this.applyIdlePose(delta);
    }
  }

  render = () => {
    if (this.disposed || !this.visible || document.hidden) return;
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.render);
  };
  resume() { if (!this.disposed && this.visible && !this.frame && !document.hidden) { this.clock.getDelta(); this.frame = requestAnimationFrame(this.render); } }
  pause() { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }
  onVisibilityChange = () => { if (document.hidden) this.pause(); else this.resume(); };

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
    this.card.userData.frontTexture?.dispose(); this.card.userData.backTexture?.dispose();
    this.card.userData.frontMaterial?.dispose(); this.card.userData.backMaterial?.dispose();
    disposeMaterial(this.card.userData.edgeMaterial); disposeMaterial(this.card.userData.frontFallback); disposeMaterial(this.card.userData.backFallback);
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
        const mounted = document.getElementById(id);
        if (mounted) {
          clearInterval(pendingMounts.get(id)); pendingMounts.delete(id);
          dealers.set(id, new JesterDealer(mounted, quality));
        } else if (attempts > 30) { clearInterval(pendingMounts.get(id)); pendingMounts.delete(id); }
      }, 100));
    }
    return;
  }
  dealers.set(id, new JesterDealer(host, quality));
};
window.puppetDealerDeal = (id, versoUrl, rectoUrl) => dealers.get(id)?.startDeal(rectoUrl || versoUrl, versoUrl, false) ?? false;
window.puppetDealerReceive = (id, imageUrl) => dealers.get(id)?.startDeal(imageUrl, imageUrl, true) ?? false;
window.puppetDealerSetQuality = (id, quality) => dealers.get(id)?.setQuality(quality);
window.puppetDealerDestroy = function puppetDealerDestroy(id) {
  if (pendingMounts.has(id)) { clearInterval(pendingMounts.get(id)); pendingMounts.delete(id); }
  const dealer = dealers.get(id);
  if (!dealer) return;
  dealer.dispose(); dealers.delete(id);
};
