import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const dealers = new Map();
const MODEL_REVISION = 'play-jester-work-fixed-20260831-v2';
const MODEL_URL = new URL(`assets/assets/models/play_jester_rigged.glb?rev=${MODEL_REVISION}`, document.baseURI).href;
const MODEL_FACING_Y = Math.PI * 1.5;
const DEAL_DURATION = 4200;
const RECEIVE_DURATION = 2600;
const REST_POSE_ONLY = true;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = THREE.MathUtils.lerp;
const smoother = (v) => { const t = clamp01(v); return t * t * t * (t * (t * 6 - 15) + 10); };
const segment = (v, a, b) => smoother((v - a) / Math.max(b - a, 0.0001));

function cubicBezier(out, a, b, c, d, t) {
  const x = clamp01(t), u = 1 - x, xx = x * x, uu = u * u;
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
  Object.assign(card.userData, { edgeMaterial: edge, frontFallback, backFallback });
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
  constructor(host, quality = 'medium') {
    this.host = host;
    this.quality = quality;
    this.disposed = false;
    this.visible = true;
    this.frame = 0;
    this.animation = null;
    this.bones = new Map();
    this.skinnedMeshes = [];

    host.dataset.dealerStatus = 'loading';
    host.dataset.dealerAnimation = 'IDLE';
    host.dataset.modelRevision = MODEL_REVISION;
    host.dataset.poseMode = REST_POSE_ONLY ? 'rest-only' : 'procedural';
    host.dataset.bindPosePolicy = 'preserve-imported-inverse-bind-matrices';
    host.dataset.animationVocabulary = 'IDLE,LOOK_PLAYER,REACH_DECK,DRAW_CARD,HOLD_VERSO,FLIP_CARD,PRESENT_RECTO,TAKE_CARD,DISCARD,RETURN_IDLE';

    this.status = document.createElement('div');
    this.status.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;font:600 14px Georgia,serif;letter-spacing:.04em;color:#f0c56b;background:rgba(5,3,2,.28);pointer-events:none;opacity:0;transition:opacity .2s ease;z-index:2';
    host.appendChild(this.status);

    this.scene = new THREE.Scene();
    this.modelRoot = new THREE.Group();
    this.puppetRoot = new THREE.Group();
    this.puppetRoot.rotation.y = MODEL_FACING_Y;
    this.modelRoot.add(this.puppetRoot);
    this.scene.add(this.modelRoot);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.id = `${host.id}-canvas`;
    this.renderer.domElement.dataset.renderer = 'three.js-gltf';
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;touch-action:none';
    host.insertBefore(this.renderer.domElement, this.status);

    this.card = makeCard();
    this.scene.add(this.card);
    this.setupLights();
    this.setQuality(quality);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.resume(); else this.pause();
    });
    this.intersectionObserver.observe(host);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.loadModel();
    this.resize();
  }

  showError(message) { this.status.textContent = message; this.status.style.opacity = '1'; }
  clearError() { this.status.textContent = ''; this.status.style.opacity = '0'; }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xffe1b5, 0x130c16, 2.0));
    const key = new THREE.DirectionalLight(0xffbd78, 3.7); key.position.set(-4, 6, 7); this.scene.add(key); this.keyLight = key;
    const fill = new THREE.DirectionalLight(0xb9d7ff, 1.8); fill.position.set(5, 2, 6); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff4058, 2.4); rim.position.set(3, 5, -4); this.scene.add(rim);
  }

  preserveImportedBindPose() {
    this.model.updateMatrixWorld(true);
    for (const mesh of this.skinnedMeshes) {
      mesh.skeleton.pose();
      mesh.skeleton.update();
    }
    this.model.updateMatrixWorld(true);
  }

  cacheRig() {
    const required = ['Head', 'Spine02', 'L_Upperarm', 'L_Forearm', 'L_Hand', 'R_Upperarm', 'R_Forearm', 'R_Hand'];
    this.bones.clear();
    for (const name of required) {
      const bone = this.model.getObjectByName(name);
      if (bone?.isBone) this.bones.set(name, bone);
    }
    const allBones = [];
    this.model.traverse((object) => { if (object.isBone) allBones.push(object); });
    this.host.dataset.dealerBoneCount = String(allBones.length);
    this.host.dataset.requiredBones = `${this.bones.size}/${required.length}`;
    this.host.dataset.rigged = String(allBones.length === 41 && this.bones.size === required.length);
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
    this.model.scale.multiplyScalar(2.45 / rawSpan);
    this.puppetRoot.updateMatrixWorld(true);
    let h = this.boneWorld('Head');
    let s = this.boneWorld('Spine02');
    if (h && s && h.y < s.y) {
      this.model.rotation.z += Math.PI;
      this.puppetRoot.updateMatrixWorld(true);
      h = this.boneWorld('Head'); s = this.boneWorld('Spine02');
      this.host.dataset.rigOrientation = 'auto-upright';
    } else {
      this.host.dataset.rigOrientation = 'upright';
    }
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
    this.camera.aspect = width / height;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const visibleHeight = rigSpan * (narrow ? 1.72 : 1.62);
    const visibleWidth = Math.max(shoulderSpan * (narrow ? 1.30 : 1.22), rigSpan * 1.38);
    const dh = (visibleHeight * 0.5) / Math.max(Math.tan(vfov / 2), 0.001);
    const dw = (visibleWidth * 0.5) / Math.max(Math.tan(hfov / 2), 0.001);
    const distance = Math.max(dh, dw, 3.0);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.puppetRoot.getWorldQuaternion(new THREE.Quaternion()));
    this.camera.position.copy(target).addScaledVector(forward, distance);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    this.host.dataset.puppetFit = 'rest-rig-bust';
    this.host.dataset.puppetCameraDistance = distance.toFixed(3);
    return true;
  }

  loadModel() {
    this.host.dataset.modelAsset = MODEL_URL;
    new GLTFLoader().load(MODEL_URL, (gltf) => {
      if (this.disposed) return disposeObject(gltf.scene);
      this.model = gltf.scene;
      this.skinnedMeshes = [];
      this.model.traverse((object) => {
        if (/string|marionette|control[_ -]?line/i.test(object.name)) object.visible = false;
        if (object.isMesh || object.isSkinnedMesh) {
          object.castShadow = this.quality !== 'low';
          object.receiveShadow = this.quality !== 'low';
          object.frustumCulled = false;
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) material.side = THREE.DoubleSide;
          }
        }
        if (object.isSkinnedMesh && object.skeleton) this.skinnedMeshes.push(object);
      });
      this.puppetRoot.add(this.model);
      this.puppetRoot.updateMatrixWorld(true);
      this.cacheRig();
      this.preserveImportedBindPose();
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
      this.host.dataset.skinCount = String(this.skinnedMeshes.length);
      this.host.dataset.bindPose = 'imported-rest-verified';
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
    this.keyLight.castShadow = this.quality !== 'low';
    this.resize();
  }

  resize() {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    if (!this.model || !this.updateBustFrame()) {
      this.camera.position.set(0, 0.3, width < 720 ? 6.0 : 5.3);
      this.camera.lookAt(0, 0.3, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  async updateCardTextures(rectoUrl, versoUrl) {
    try {
      this.host.dataset.cardTexture = 'loading';
      const [rectoTexture, versoTexture] = await Promise.all([
        loadTexture(rectoUrl, this.quality),
        loadTexture(versoUrl || rectoUrl, this.quality),
      ]);
      if (this.disposed) { rectoTexture.dispose(); versoTexture.dispose(); return; }
      this.card.userData.frontTexture?.dispose();
      this.card.userData.backTexture?.dispose();
      this.card.userData.frontMaterial?.dispose();
      this.card.userData.backMaterial?.dispose();
      const front = new THREE.MeshStandardMaterial({ map: rectoTexture, roughness: 0.5 });
      const back = new THREE.MeshStandardMaterial({ map: versoTexture, roughness: 0.54 });
      const edge = this.card.userData.edgeMaterial;
      this.card.material = [edge, edge, edge, edge, front, back];
      Object.assign(this.card.userData, {
        frontTexture: rectoTexture, backTexture: versoTexture,
        frontMaterial: front, backMaterial: back,
      });
      this.host.dataset.cardTexture = 'ready';
    } catch (error) {
      this.host.dataset.cardTexture = 'failed';
      console.warn('Unable to load dealer card textures.', error);
    }
  }

  setPhase(phase) { this.host.dataset.dealerAnimation = phase; }

  startDeal(versoUrl, rectoUrl, receive = false) {
    if (this.animation || !this.model) return false;
    this.updateCardTextures(rectoUrl || versoUrl, versoUrl);
    this.animation = {
      kind: receive ? 'receive' : 'deal',
      started: performance.now(),
      duration: receive ? RECEIVE_DURATION : DEAL_DURATION,
    };
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
    const deck = new THREE.Vector3(-2.35, -1.05, 2.55);
    const hold = new THREE.Vector3(-0.38, 0.34, 2.72);
    const player = new THREE.Vector3(0.10, -2.25, 2.75);
    if (t < 0.10) this.setPhase('LOOK_PLAYER');
    else if (t < 0.27) this.setPhase('REACH_DECK');
    else if (t < 0.44) this.setPhase('DRAW_CARD');
    else if (t < 0.52) this.setPhase('HOLD_VERSO');
    else if (t < 0.69) this.setPhase('FLIP_CARD');
    else if (t < 0.92) this.setPhase('PRESENT_RECTO');
    else this.setPhase('RETURN_IDLE');
    if (t < 0.44) {
      cubicBezier(this.card.position, deck, new THREE.Vector3(-1.8, -0.55, 2.62), new THREE.Vector3(-1.0, 0.10, 2.66), hold, t / 0.44);
    } else if (t < 0.72) {
      this.card.position.lerp(hold, 0.38);
    } else {
      cubicBezier(this.card.position, hold, hold.clone().add(new THREE.Vector3(0.20, -0.14, 0.05)), new THREE.Vector3(0.12, -1.25, 2.72), player, pass);
    }
    this.card.rotation.x = lerp(-0.18, -0.03, lift);
    this.card.rotation.y = lerp(Math.PI, 0, flip);
    this.card.rotation.z = Math.sin(t * Math.PI) * -0.05;
    if (t > 0.96) this.card.visible = false;
  }

  updateReceive(t) {
    const lift = segment(t, 0.18, 0.50);
    const throwPhase = segment(t, 0.54, 0.86);
    const player = new THREE.Vector3(0.10, -2.25, 2.75);
    const catchPoint = new THREE.Vector3(0.42, 0.28, 2.65);
    const discard = new THREE.Vector3(2.35, -1.05, 2.55);
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

  update() {
    if (this.animation) {
      const t = clamp01((performance.now() - this.animation.started) / this.animation.duration);
      if (this.animation.kind === 'receive') this.updateReceive(t); else this.updateDeal(t);
      if (t >= 1) {
        this.animation = null;
        this.card.visible = false;
        this.setPhase('IDLE');
      }
    } else {
      this.setPhase('IDLE');
    }
  }

  render = () => {
    if (this.disposed || !this.visible || document.hidden) return;
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.render);
  };

  resume() {
    if (!this.disposed && this.visible && !this.frame && !document.hidden) this.frame = requestAnimationFrame(this.render);
  }

  pause() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  onVisibilityChange = () => { if (document.hidden) this.pause(); else this.resume(); };

  dispose() {
    this.disposed = true;
    this.pause();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    disposeObject(this.model);
    disposeObject(this.card);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.status.remove();
  }
}

window.puppetDealerCreate = async (id, container, quality = 'medium') => {
  if (!id || !container) return false;
  dealers.get(id)?.dispose();
  const dealer = new JesterDealer(container, quality);
  dealers.set(id, dealer);
  return true;
};

window.puppetDealerDeal = (id, versoUrl, rectoUrl) => dealers.get(id)?.startDeal(versoUrl, rectoUrl, false) ?? false;
window.puppetDealerReceive = (id, cardUrl) => dealers.get(id)?.startDeal(cardUrl, cardUrl, true) ?? false;
window.puppetDealerSetQuality = (id, quality) => { dealers.get(id)?.setQuality(quality); };
window.puppetDealerDestroy = (id) => { dealers.get(id)?.dispose(); dealers.delete(id); };
