import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';

const dealers = new Map();
const MODEL_REVISION = 'play-jester-v2-clean-web-20260902-v1';
const MODEL_URL = new URL(
  `assets/assets/models/textured-glb-comparison/play_jester_v2_rigged_clean_web.glb?rev=${MODEL_REVISION}`,
  document.baseURI,
).href;
const MODEL_FACING_Y = 3 * Math.PI / 2;
const DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/';
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value?.isTexture) value.dispose();
  }
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
  const edge = new THREE.MeshStandardMaterial({ color: 0xe8d9b8, roughness: 0.54 });
  const front = new THREE.MeshStandardMaterial({ color: 0x22100f });
  const back = new THREE.MeshStandardMaterial({ color: 0x77151d });
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 1.24, 0.04),
    [edge, edge, edge, edge, front, back],
  );
  card.visible = false;
  card.renderOrder = 30;
  card.userData = { edgeMaterial: edge };
  return card;
}

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

function normalizedName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function dealerLocalPose(name) {
  const n = normalizedName(name);
  if (n.includes('lupperarm')) return { rx: 0.12, ry: 0.06, rz: -0.38 };
  if (n.includes('rupperarm')) return { rx: 0.12, ry: -0.06, rz: 0.38 };
  if (n.includes('lforearm')) return { rx: 0.34, ry: 0.04, rz: 0.72 };
  if (n.includes('rforearm')) return { rx: 0.34, ry: -0.04, rz: -0.72 };
  if (n.includes('lhand')) return { rx: -0.06, ry: -0.10, rz: 0.08 };
  if (n.includes('rhand')) return { rx: -0.06, ry: 0.10, rz: -0.08 };
  return null;
}

function cloneStaticVisual(source) {
  const visual = new THREE.Group();
  let count = 0;
  source.updateMatrixWorld(true);
  source.traverse((object) => {
    if (!(object.isMesh || object.isSkinnedMesh)) return;
    if (/string|marionette|control[_ -]?line/i.test(object.name)) return;
    const geometry = object.geometry?.clone();
    if (!geometry) return;
    const materials = (Array.isArray(object.material) ? object.material : [object.material]).map(
      (material) => {
        const copy = material?.clone?.() || new THREE.MeshStandardMaterial({ color: 0xffffff });
        copy.side = THREE.DoubleSide;
        copy.transparent = false;
        copy.opacity = 1;
        copy.depthWrite = true;
        copy.visible = true;
        copy.needsUpdate = true;
        return copy;
      },
    );
    const mesh = new THREE.Mesh(
      geometry,
      Array.isArray(object.material) ? materials : materials[0],
    );
    object.updateWorldMatrix(true, false);
    mesh.matrix.copy(object.matrixWorld);
    mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    visual.add(mesh);
    count += 1;
  });
  return { visual, count };
}

class JesterDealer {
  constructor(host, quality = 'medium') {
    this.host = host;
    this.quality = quality;
    this.disposed = false;
    this.visible = true;
    this.frame = 0;
    this.animation = null;
    this.pendingAnimation = null;
    this.model = null;
    this.mixer = null;
    this.lastFrameTime = performance.now();
    this.idleBones = [];
    this.idleOrigin = null;
    this.handBone = null;
    this.handSocket = null;
    this.modelScale = 1;
    this.modelCenter = new THREE.Vector3();
    this.tmpVector = new THREE.Vector3();

    host.dataset.dealerStatus = 'loading';
    host.dataset.modelRevision = MODEL_REVISION;
    host.dataset.poseMode = 'rigged-natural-dealer-pose';
    host.dataset.modelFacingAngle = String(MODEL_FACING_Y);

    this.status = document.createElement('div');
    this.status.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:22;color:#f0c56b;background:rgba(5,3,2,.22);font:600 14px Georgia,serif;pointer-events:none;opacity:0';
    host.appendChild(this.status);

    this.scene = new THREE.Scene();
    this.root = new THREE.Group();
    this.root.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.root);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.dataset.renderer = 'three.js-gltf';
    this.renderer.domElement.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    host.insertBefore(this.renderer.domElement, this.status);

    this.scene.add(new THREE.HemisphereLight(0xffe4bd, 0x17101b, 2.4));
    const key = new THREE.DirectionalLight(0xffbf79, 4);
    key.position.set(-4, 6, 7);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xc9ddff, 2.2);
    fill.position.set(5, 2, 5);
    this.scene.add(fill);

    this.card = makeCard();
    this.scene.add(this.card);

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
    this.loadModel();
  }

  showError(message) {
    this.status.textContent = message;
    this.status.style.opacity = '1';
  }

  clearError() {
    this.status.style.opacity = '0';
    this.status.textContent = '';
  }

  configureRig(source) {
    let renderableCount = 0;
    let skinnedCount = 0;
    let leftHand = null;
    let rightHand = null;

    source.traverse((object) => {
      const name = normalizedName(object.name);
      if (name.includes('lhand') && !leftHand) leftHand = object;
      if (name.includes('rhand') && !rightHand) rightHand = object;

      const pose = dealerLocalPose(object.name);
      if (pose) {
        object.rotation.x += pose.rx;
        object.rotation.y += pose.ry;
        object.rotation.z += pose.rz;
      }
      if (object.isBone && /head|neck|upperarm|forearm|hand|spine|chest/.test(name)) {
        this.idleBones.push({ object, name, rotation: object.rotation.clone() });
      }

      if (!(object.isMesh || object.isSkinnedMesh)) return;
      if (/string|marionette|control[_ -]?line/i.test(object.name)) {
        object.visible = false;
        return;
      }
      renderableCount += 1;
      if (object.isSkinnedMesh) skinnedCount += 1;
      object.frustumCulled = false;
      object.renderOrder = 5;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        material.side = THREE.DoubleSide;
        material.transparent = false;
        material.opacity = 1;
        material.depthWrite = true;
        material.visible = true;
        material.needsUpdate = true;
      }
    });

    source.updateMatrixWorld(true);
    this.handBone = leftHand || rightHand;
    if (this.handBone) {
      this.handSocket = new THREE.Group();
      this.handSocket.name = 'PLAY_DEALER_HAND_SOCKET';
      this.handSocket.position.set(0, 0, 0);
      this.handBone.add(this.handSocket);
      this.handBone.updateMatrixWorld(true);
    }

    return { renderableCount, skinnedCount };
  }

  loadModel() {
    this.host.dataset.modelAsset = MODEL_URL;
    const manager = new THREE.LoadingManager();
    const draco = new DRACOLoader(manager);
    draco.setDecoderPath(DRACO_PATH);
    draco.setWorkerLimit(/iP(?:hone|ad|od)/.test(navigator.userAgent) ? 1 : 2);
    const loader = new GLTFLoader(manager);
    loader.setDRACOLoader(draco);

    loader.load(
      MODEL_URL,
      (gltf) => {
        draco.dispose();
        if (this.disposed) return;

        const source = gltf.scene;
        const { renderableCount, skinnedCount } = this.configureRig(source);
        if (!renderableCount) {
          this.host.dataset.dealerStatus = 'failed';
          this.showError('3D jester has no renderable mesh.');
          return;
        }

        if (skinnedCount > 0 && this.handBone) {
          this.model = source;
          this.root.add(source);
          this.host.dataset.renderMode = 'imported-skinned-rig';
          this.host.dataset.skinnedMeshCount = String(skinnedCount);
          this.host.dataset.handSocket = this.handBone.name || 'hand';
        } else {
          const fallback = cloneStaticVisual(source);
          this.model = fallback.visual;
          this.handBone = null;
          this.handSocket = null;
          this.root.add(this.model);
          this.host.dataset.renderMode = 'static-emergency-fallback';
          this.host.dataset.visualMeshCount = String(fallback.count);
        }

        this.frameModel();
        this.startLiveMotion(gltf.animations || []);
        this.host.dataset.dealerStatus = 'ready';
        this.clearError();
        this.flushPendingAnimation();
        this.resume();
      },
      (event) => {
        if (event?.total) {
          this.host.dataset.modelProgress = String(
            Math.round((event.loaded / event.total) * 100),
          );
        }
      },
      (error) => {
        draco.dispose();
        this.host.dataset.dealerStatus = 'failed';
        this.host.dataset.dealerAnimation = 'failed';
        this.pendingAnimation = null;
        this.host.dataset.modelError = String(error?.message || error);
        this.showError('3D jester failed to load.');
        console.error('PLAY Jester load failed', error);
      },
    );
  }

  frameModel() {
    if (!this.model) return;
    this.model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(this.model);
    if (box.isEmpty()) return;

    let size = box.getSize(new THREE.Vector3());
    const scale = 4.65 / Math.max(size.y, 0.001);
    this.modelScale = scale;
    this.model.scale.setScalar(scale);
    this.model.updateMatrixWorld(true);

    box = new THREE.Box3().setFromObject(this.model);
    let center = box.getCenter(new THREE.Vector3());
    this.model.position.sub(center);
    this.model.position.y += 0.55;
    this.model.updateMatrixWorld(true);

    box = new THREE.Box3().setFromObject(this.model);
    size = box.getSize(new THREE.Vector3());
    center = box.getCenter(new THREE.Vector3());
    this.modelCenter.copy(center);

    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.fov = width < 720 ? 36 : 32;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const distance = Math.max(
      (size.y * 0.54) / Math.tan(vfov / 2),
      (size.x * 0.54) / Math.tan(hfov / 2),
      3.4,
    );
    this.camera.position.set(center.x, center.y + 0.18, distance);
    this.camera.lookAt(center.x, center.y + 0.18, center.z);
    this.camera.updateProjectionMatrix();
    this.host.dataset.modelBounds = `${size.x.toFixed(2)},${size.y.toFixed(2)},${size.z.toFixed(2)}`;
  }

  resize() {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio || 1,
        this.quality === 'high' ? 1.6 : this.quality === 'low' ? 0.8 : 1.2,
      ),
    );
    this.renderer.setSize(width, height, false);
    if (this.model) this.frameModel();
    else {
      this.camera.aspect = width / height;
      this.camera.position.set(0, 0.2, 6);
      this.camera.lookAt(0, 0.2, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  startLiveMotion(clips) {
    this.lastFrameTime = performance.now();
    this.host.dataset.animationClipCount = String(clips.length);
    const clip = clips.find((candidate) => /idle|breath|wave|present/i.test(candidate.name)) || clips[0];
    if (clip) {
      this.mixer = new THREE.AnimationMixer(this.model);
      this.mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat, Infinity).play();
      this.host.dataset.liveMotion = `gltf:${clip.name || 'unnamed'}`;
      return;
    }
    this.idleOrigin = {
      y: this.model.position.y,
      rx: this.model.rotation.x,
      rz: this.model.rotation.z,
    };
    // The held cards are skinned to the hand bones in this asset. Keep their
    // geometry intact by animating the complete jester instead of its bones.
    this.host.dataset.liveMotion = 'procedural-root-idle';
  }

  updateLiveMotion(now) {
    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    if (this.mixer) {
      this.mixer.update(delta);
      return;
    }
    const phase = now / 1000;
    if (this.idleOrigin && this.model) {
      this.model.position.y = this.idleOrigin.y + Math.sin(phase * 1.7) * 0.035;
      this.model.rotation.x = this.idleOrigin.rx + Math.sin(phase * 1.2) * 0.018;
      this.model.rotation.z = this.idleOrigin.rz + Math.sin(phase * 1.5) * 0.014;
    }
  }

  handPoint() {
    if (this.handSocket) {
      this.handSocket.updateWorldMatrix(true, false);
      this.handSocket.getWorldPosition(this.tmpVector);
      return this.tmpVector.clone();
    }
    return new THREE.Vector3(-0.75, -0.2, 1.9);
  }

  async updateCardTextures(recto, verso) {
    this.host.dataset.cardTexture = 'loading';
    try {
      const [frontTexture, backTexture] = await Promise.all([
        loadTexture(recto),
        loadTexture(verso || recto),
      ]);
      const front = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.5 });
      const back = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.54 });
      const edge = this.card.userData.edgeMaterial;
      this.card.material = [edge, edge, edge, edge, front, back];
      this.host.dataset.cardTexture = 'ready';
    } catch (error) {
      this.host.dataset.cardTexture = 'failed';
      console.error('PLAY card texture failed', error);
    }
  }

  startDeal(verso, recto, receive = false) {
    if (this.disposed || this.animation || this.host.dataset.dealerStatus === 'failed') return false;
    if (!this.model) {
      if (this.pendingAnimation) return false;
      this.pendingAnimation = { verso, recto, receive };
      this.host.dataset.dealerAnimation = receive ? 'receive-queued' : 'deal-queued';
      return true;
    }
    this.updateCardTextures(recto || verso, verso);
    this.animation = {
      started: performance.now(),
      duration: receive ? 2100 : 3300,
      receive,
    };
    this.host.dataset.dealerAnimation = receive ? 'receive' : 'deal';
    this.card.scale.setScalar(0.78);
    this.card.visible = true;
    return true;
  }

  flushPendingAnimation() {
    if (!this.pendingAnimation || !this.model || this.animation || this.disposed) return;
    const { verso, recto, receive } = this.pendingAnimation;
    this.pendingAnimation = null;
    this.startDeal(verso, recto, receive);
  }

  update() {
    const now = performance.now();
    this.updateLiveMotion(now);
    if (!this.animation) return;
    const t = clamp01((now - this.animation.started) / this.animation.duration);
    const progress = smooth(t);
    const hand = this.handPoint();

    if (this.animation.receive) {
      const start = new THREE.Vector3(0, -1.55, 2.45);
      this.card.position.lerpVectors(start, hand, progress);
      this.card.position.y += Math.sin(Math.PI * progress) * 0.18;
      this.card.rotation.set(-0.03, -0.18 * progress, 0.04 * (1 - progress));
    } else {
      const present = hand.clone();
      present.x += hand.x < 0 ? -0.28 : 0.28;
      present.y += 0.12;
      present.z += 0.38;
      const move = smooth(t / 0.38);
      this.card.position.lerpVectors(hand, present, move);
      this.card.position.y += Math.sin(Math.PI * move) * 0.10;
      const flip = smooth((t - 0.30) / 0.30);
      this.card.rotation.set(-0.04, Math.PI * (1 - flip), hand.x < 0 ? -0.05 : 0.05);
    }

    if (t >= 1) {
      this.animation = null;
      this.card.visible = false;
      this.host.dataset.dealerAnimation = 'idle';
    }
  }

  render = () => {
    if (this.disposed || !this.visible || document.hidden) return;
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.render);
  };

  resume() {
    if (!this.disposed && this.visible && !this.frame && !document.hidden) {
      this.frame = requestAnimationFrame(this.render);
    }
  }

  pause() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  onVisibilityChange = () => (document.hidden ? this.pause() : this.resume());

  setQuality(value) {
    this.quality = ['low', 'medium', 'high'].includes(value) ? value : 'medium';
    this.resize();
  }

  dispose() {
    this.disposed = true;
    this.pendingAnimation = null;
    this.pause();
    this.mixer?.stopAllAction();
    this.mixer = null;
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

window.puppetDealerCreate = async (id, containerOrQuality, quality = 'medium') => {
  const suppliedContainer =
    containerOrQuality &&
    typeof containerOrQuality === 'object' &&
    containerOrQuality.nodeType === 1
      ? containerOrQuality
      : null;
  if (!suppliedContainer && typeof containerOrQuality === 'string') quality = containerOrQuality;
  let container = suppliedContainer || document.getElementById(id);
  for (let frame = 0; id && !container && frame < 120; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    container = document.getElementById(id);
  }
  if (!id || !container) {
    console.error('PLAY Jester container not found after mount wait', { id });
    return false;
  }
  dealers.get(id)?.dispose();
  const dealer = new JesterDealer(container, quality);
  dealers.set(id, dealer);
  return true;
};

window.puppetDealerDeal = (id, verso, recto) =>
  dealers.get(id)?.startDeal(verso, recto, false) ?? false;
window.puppetDealerReceive = (id, card) =>
  dealers.get(id)?.startDeal(card, card, true) ?? false;
window.puppetDealerSetQuality = (id, quality) => dealers.get(id)?.setQuality(quality);
window.puppetDealerAnimationState = (id) => {
  const dealer = dealers.get(id);
  if (!dealer) return 'unavailable';
  return (
    dealer.host.dataset.dealerAnimation ||
    (dealer.host.dataset.dealerStatus === 'failed'
      ? 'failed'
      : dealer.model
        ? 'idle'
        : 'loading')
  );
};
window.puppetDealerDestroy = (id) => {
  dealers.get(id)?.dispose();
  dealers.delete(id);
};
