import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

// Flutter remains the source of truth for cards and deck state. This module
// only mirrors each real draw/play action with a synchronized 3D performance.
const dealers = new Map();
const pendingMounts = new Map();
const MODEL_REVISION = 'play-jester-rigged-20260816';
const MODEL_URLS = [
  new URL('assets/assets/models/play_jester_rigged.glb', document.baseURI).href,
];
// Rigged Play jester. Use embedded animation clips when available.
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
const pulse = (value, start, peak, end) =>
  segment(value, start, peak) * (1 - segment(value, peak, end));
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
  const edge = new THREE.MeshStandardMaterial({
    color: 0xe8d9b8,
    roughness: 0.54,
    metalness: 0.02,
  });
  const back = new THREE.MeshStandardMaterial({
    color: 0x77151d,
    roughness: 0.68,
  });
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
    this.tmp = new THREE.Vector3();

    this.modelRoot = new THREE.Group();
    this.gestureRoot = new THREE.Group();
    this.puppetRoot = new THREE.Group();
    this.puppetRoot.rotation.y = MODEL_FACING_Y;
    this.gestureRoot.add(this.puppetRoot);
    this.modelRoot.add(this.gestureRoot);

    this.scene = new THREE.Scene();
    this.scene.add(this.modelRoot);

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 0.15, 9.4);
    this.camera.lookAt(0, 0.65, 0);

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
    this.renderer.domElement.style.cssText =
      'display:block;width:100%;height:100%;pointer-events:none';
    host.appendChild(this.renderer.domElement);

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
    if (!modelUrl) {
      this.host.dataset.dealerStatus = 'failed';
      this.host.dataset.modelError = 'No rigged Play jester asset could be loaded.';
      return;
    }

    this.host.dataset.modelAsset = modelUrl;
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        if (this.disposed) {
          disposeObject(gltf.scene);
          return;
        }
        this.model = gltf.scene;
        this.model.traverse((object) => {
          if (/string|marionette|control[_ -]?line/i.test(object.name)) {
            object.visible = false;
          }
          if (object.isMesh) {
            object.castShadow = this.quality !== 'low';
            object.receiveShadow = this.quality !== 'low';
          }
        });

        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        const scale = 6.25 / Math.max(size.y, 0.001);
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
        this.host.dataset.modelAsset = modelUrl;
        this.host.dataset.modelAnimations = String(gltf.animations.length);
        this.host.dataset.modelFacingAngle = String(MODEL_FACING_Y);
        this.host.dataset.modelFallback = 'false';
        this.resume();
      },
      (event) => {
        if (event.total) {
          this.host.dataset.modelProgress = String(
            Math.round((event.loaded / event.total) * 100),
          );
        }
      },
      (error) => {
        console.warn('Unable to load rigged Play jester.', { url: modelUrl, error });
        this.host.dataset.dealerStatus = 'failed';
        this.host.dataset.modelAsset = modelUrl;
        this.host.dataset.modelError = String(error?.message || error);
      },
    );
  }

  setQuality(value) {
    this.quality = ['low', 'medium', 'high'].includes(value) ? value : 'medium';
    const ratios = { low: 0.8, medium: 1.25, high: 1.8 };
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, ratios[this.quality]),
    );
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.keyLight.castShadow = this.quality !== 'low';
    if (this.model) {
      this.model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = this.quality !== 'low';
          object.receiveShadow = this.quality !== 'low';
        }
      });
    }
    this.resize();
  }

  resize() {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const narrow = width < 720;
    this.camera.fov = narrow ? 36 : 30;
    this.modelRoot.scale.setScalar(1);
    this.modelRoot.position.set(0, 0, 0);

    if (this.puppetBounds && !this.puppetBounds.isEmpty()) {
      const center = this.puppetBounds.getCenter(new THREE.Vector3());
      const min = this.puppetBounds.min;
      const max = this.puppetBounds.max;
      const upperCenterY = lerp(min.y, max.y, 0.70);
      const upperHeight = Math.max(0.001, max.y - upperCenterY);
      const targetCenter = new THREE.Vector3(center.x, upperCenterY, center.z);
      const halfWidth = Math.max(Math.abs(max.x - center.x), Math.abs(min.x - center.x));
      const halfHeight = Math.max(upperHeight, (max.y - min.y) * 0.24);
      const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
      const distanceForHeight = halfHeight / Math.tan(verticalFov / 2);
      const distanceForWidth = halfWidth / Math.max(Math.tan(horizontalFov / 2), 0.001);
      const distance = Math.max(distanceForHeight, distanceForWidth) * (narrow ? 1.08 : 1.02);
      this.camera.position.set(targetCenter.x, targetCenter.y, targetCenter.z + distance + 0.35);
      this.camera.lookAt(targetCenter);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld(true);
      this.host.dataset.puppetFit = 'upper-torso';
      this.host.dataset.puppetCameraDistance = distance.toFixed(3);
    } else {
      this.camera.position.set(0, 1.25, narrow ? 7.4 : 8.6);
      this.camera.lookAt(0, 1.2, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  updateCardTexture(imageUrl) {
    this.host.dataset.cardTexture = 'loading';
    new THREE.TextureLoader().load(
      imageUrl,
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.quality === 'high' ? 8 : 4;
        this.card.userData.texture?.dispose();
        this.card.userData.faceMaterial?.dispose();
        const face = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.54,
        });
        const edge = this.card.userData.edgeMaterial;
        this.card.material = [edge, edge, edge, edge, face, face];
        this.card.userData.texture = texture;
        this.card.userData.faceMaterial = face;
        this.host.dataset.cardTexture = 'ready';
      },
      undefined,
      (error) => {
        this.host.dataset.cardTexture = 'failed';
        console.warn('Unable to load dealer card texture.', error);
      },
    );
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

  deal(imageUrl, kind) {
    if (this.animation || !this.model) return false;
    const receive = kind === 'receive';
    this.updateCardTexture(imageUrl);
    this.animation = {
      kind: receive ? 'receive' : 'deal',
      started: performance.now(),
      duration: receive ? RECEIVE_DURATION : DEAL_DURATION,
    };
    this.card.visible = true;
    this.card.scale.setScalar(1);
    this.card.position.set(receive ? 0 : -2.35, receive ? -4.25 : -2.15, 3.0);
    this.card.rotation.set(-0.3, receive ? 0 : Math.PI, receive ? 0 : -0.1);
    this.playEmbeddedAction(receive ? /receive|take|collect|catch/i : /deal|reach|pick|give/i);
    this.setPhase(receive ? 'catchPlayerCard' : 'noticeDeck');
    this.host.dataset.lastCardAction = receive ? 'discard' : 'draw';
    this.resume();
    return true;
  }

  setPhase(phase) {
    if (this.host.dataset.dealerAnimation !== phase) {
      this.host.dataset.dealerAnimation = phase;
    }
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

  updateDeal(t) {
    const reach = smoother(segment(t, 0.04, 0.28));
    const lift = smoother(segment(t, 0.20, 0.48));
    const present = smoother(segment(t, 0.42, 0.72));
    const release = smoother(segment(t, 0.68, 0.92));
    const settle = smoother(segment(t, 0.86, 1.0));

    if (t < 0.28) this.setPhase('reachDrawPile');
    else if (t < 0.48) this.setPhase('liftCard');
    else if (t < 0.72) this.setPhase('presentCard');
    else this.setPhase('releaseCard');

    const a = new THREE.Vector3(-2.35, -2.15, 3.0);
    const b = new THREE.Vector3(-1.25, -0.65, 2.2);
    const c = new THREE.Vector3(-0.4, 0.15, 1.5);
    const d = new THREE.Vector3(0.0, -2.9, 3.4);
    cubicBezier(this.card.position, a, b, c, d, present);
    this.card.position.y += lift * 0.8;
    this.card.rotation.x = lerp(-0.35, -0.08, present);
    this.card.rotation.y = lerp(Math.PI, 0.05, present);
    this.card.rotation.z = -0.12 + pulse(t, 0.18, 0.48, 0.78) * 0.16;
    this.card.scale.setScalar(1 - release * 0.10);
    this.card.visible = release < 0.98;

    const lean = pulse(t, 0.03, 0.25, 0.58);
    const offer = pulse(t, 0.36, 0.62, 0.90);
    this.setGesturePose({
      x: -0.38 * lean + 0.10 * offer,
      y: -0.08 * lean + 0.16 * offer,
      z: 0.12 * offer,
      rx: -0.06 * offer,
      ry: 0.12 * lean - 0.04 * offer,
      rz: 0.08 * lean - 0.03 * offer,
      squash: lean * 0.35,
    });

    if (settle > 0) {
      this.gestureRoot.position.multiplyScalar(1 - settle);
      this.gestureRoot.rotation.x *= 1 - settle;
      this.gestureRoot.rotation.y *= 1 - settle;
      this.gestureRoot.rotation.z *= 1 - settle;
    }
  }

  updateReceive(t) {
    const catchCard = smoother(segment(t, 0.03, 0.36));
    const carry = smoother(segment(t, 0.28, 0.72));
    const release = smoother(segment(t, 0.66, 0.96));

    if (t < 0.36) this.setPhase('catchPlayerCard');
    else if (t < 0.72) this.setPhase('carryToDiscard');
    else this.setPhase('discardCard');

    const a = new THREE.Vector3(0.0, -4.25, 3.0);
    const b = new THREE.Vector3(0.0, -1.0, 2.0);
    const c = new THREE.Vector3(1.3, -0.35, 1.6);
    const d = new THREE.Vector3(2.45, -2.15, 3.0);
    cubicBezier(this.card.position, a, b, c, d, carry);
    this.card.position.y += catchCard * 0.5;
    this.card.rotation.x = lerp(-0.30, -0.08, carry);
    this.card.rotation.y = lerp(0.0, -Math.PI, carry);
    this.card.rotation.z = pulse(t, 0.18, 0.54, 0.84) * -0.16;
    this.card.scale.setScalar(1 - release * 0.08);
    this.card.visible = release < 0.98;

    const receiveLean = pulse(t, 0.04, 0.28, 0.56);
    const discardLean = pulse(t, 0.38, 0.68, 0.94);
    this.setGesturePose({
      x: 0.16 * receiveLean + 0.42 * discardLean,
      y: -0.05 * receiveLean + 0.03 * discardLean,
      z: 0.08 * receiveLean,
      rx: -0.04 * discardLean,
      ry: -0.06 * receiveLean - 0.14 * discardLean,
      rz: -0.03 * receiveLean - 0.08 * discardLean,
      squash: receiveLean * 0.24,
    });
  }

  updateAnimation(now) {
    if (!this.animation) return;
    const t = clamp01((now - this.animation.started) / this.animation.duration);
    if (this.animation.kind === 'receive') this.updateReceive(t);
    else this.updateDeal(t);

    if (t >= 1) {
      this.animation = null;
      this.card.visible = false;
      this.resetGesture();
      this.setPhase('idle');
      if (this.activeAction) {
        this.activeAction.fadeOut(0.15);
        this.activeAction = null;
      }
      this.idleAction?.reset().fadeIn(0.15).play();
    }
  }

  render = (now) => {
    if (this.disposed || !this.visible || document.hidden) {
      this.frame = 0;
      return;
    }
    this.frame = requestAnimationFrame(this.render);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.mixer?.update(delta);
    this.updateAnimation(now);
    this.renderer.render(this.scene, this.camera);
  };

  resume() {
    if (!this.frame && !this.disposed && this.visible && !document.hidden) {
      this.clock.getDelta();
      this.frame = requestAnimationFrame(this.render);
    }
  }

  pause() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  onVisibilityChange = () => {
    if (document.hidden) this.pause();
    else this.resume();
  };

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
  }
}

function createDealer(id, quality = 'medium') {
  const host = document.getElementById(id);
  if (!host || dealers.has(id)) return;
  const dealer = new JesterDealer(host, quality);
  dealers.set(id, dealer);
}

window.puppetDealerCreate = (id, quality) => {
  if (document.getElementById(id)) createDealer(id, quality);
  else pendingMounts.set(id, quality);
};

window.puppetDealerDeal = (id, imageUrl) => dealers.get(id)?.deal(imageUrl, 'deal');
window.puppetDealerReceive = (id, imageUrl) => dealers.get(id)?.deal(imageUrl, 'receive');
window.puppetDealerSetQuality = (id, quality) => dealers.get(id)?.setQuality(quality);
window.puppetDealerDestroy = (id) => {
  dealers.get(id)?.dispose();
  dealers.delete(id);
  pendingMounts.delete(id);
};

const mountObserver = new MutationObserver(() => {
  for (const [id, quality] of pendingMounts.entries()) {
    if (document.getElementById(id)) {
      pendingMounts.delete(id);
      createDealer(id, quality);
    }
  }
});
mountObserver.observe(document.documentElement, { childList: true, subtree: true });
