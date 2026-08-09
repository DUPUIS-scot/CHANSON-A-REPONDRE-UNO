import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

// The Flutter game owns every card and deck mutation. This module only renders
// the supplied jester and mirrors the deal/receive animation requested by Dart.
const dealers = new Map();
const pendingMounts = new Map();
const MODEL_URL = new URL(
  'assets/assets/models/jester_player.glb',
  document.baseURI,
).href;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const segment = (value, start, end) => smooth((value - start) / (end - start));
const lerp = THREE.MathUtils.lerp;

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
    roughness: 0.58,
  });
  const back = new THREE.MeshStandardMaterial({
    color: 0x77151d,
    roughness: 0.7,
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
    this.disposed = false;
    this.visible = true;
    this.frame = 0;
    this.animation = null;
    this.clock = new THREE.Clock();
    this.modelRoot = new THREE.Group();
    this.scene = new THREE.Scene();
    this.scene.add(this.modelRoot);

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 0.15, 9.4);
    this.camera.lookAt(0, -0.15, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: quality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
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
    this.loadModel();
  }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xffe1b5, 0x130c16, 2.1));
    const key = new THREE.DirectionalLight(0xffbd78, 3.4);
    key.position.set(-4, 6, 7);
    this.scene.add(key);
    this.keyLight = key;
    const fill = new THREE.DirectionalLight(0xb9d7ff, 2.0);
    fill.position.set(5, 2, 6);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff4058, 2.5);
    rim.position.set(3, 5, -4);
    this.scene.add(rim);
  }

  loadModel() {
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (this.disposed) {
          disposeObject(gltf.scene);
          return;
        }
        this.model = gltf.scene;
        // Never reveal any explicitly named rig/string helpers if a later
        // export adds them. The supplied GLB is a single string-free mesh.
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
        this.modelRoot.add(this.model);

        if (gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(this.model);
          this.clips = gltf.animations;
          const idle = gltf.animations.find((clip) => /idle/i.test(clip.name));
          this.idleAction = this.mixer.clipAction(idle || gltf.animations[0]);
          this.idleAction.play();
        }

        this.host.dataset.dealerStatus = 'ready';
        this.host.dataset.modelAsset = MODEL_URL;
        this.host.dataset.modelAnimations = String(gltf.animations.length);
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
        this.host.dataset.dealerStatus = 'failed';
        console.error('Unable to load the 3D jester GLB.', error);
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
    this.camera.fov = narrow ? 38 : 30;
    this.camera.position.set(0, narrow ? 0.05 : 0.15, narrow ? 10.6 : 9.4);
    this.camera.lookAt(0, narrow ? -0.25 : -0.15, 0);
    this.modelRoot.scale.setScalar(narrow ? 0.88 : 1);
    this.modelRoot.position.y = narrow ? 0.3 : 0;
    this.camera.updateProjectionMatrix();
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
          roughness: 0.58,
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
      duration: receive ? 1650 : 2350,
    };
    this.card.visible = true;
    this.card.position.set(receive ? 0 : -2.35, receive ? -3.8 : -2.15, 2.4);
    this.card.rotation.set(-0.3, receive ? 0 : Math.PI, receive ? 0 : -0.1);
    this.playEmbeddedAction(receive ? /receive|take|collect/i : /deal|reach|pick/i);
    this.setPhase(receive ? 'reachForCard' : 'reachForDeck');
    this.resume();
    return true;
  }

  setPhase(phase) {
    if (this.host.dataset.dealerAnimation !== phase) {
      this.host.dataset.dealerAnimation = phase;
    }
  }

  updateIdle(time) {
    if (!this.model) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.25 : 1;
    this.modelRoot.position.y +=
      (Math.sin(time * 1.15) * 0.025 * amount - this.modelRoot.position.y) * 0.05;
    this.modelRoot.rotation.y = Math.sin(time * 0.38) * 0.018 * amount;
    this.modelRoot.rotation.z = Math.sin(time * 0.52) * 0.008 * amount;
  }

  updateDeal(progress) {
    const reach = segment(progress, 0.00, 0.22);
    const pick = segment(progress, 0.18, 0.36);
    const forward = segment(progress, 0.34, 0.66);
    const release = segment(progress, 0.64, 0.82);
    const back = segment(progress, 0.80, 1.00);
    const action = Math.sin(clamp01(progress) * Math.PI);

    if (progress < 0.22) this.setPhase('reachForDeck');
    else if (progress < 0.36) this.setPhase('pickUpCard');
    else if (progress < 0.66) this.setPhase('moveCardForward');
    else if (progress < 0.82) this.setPhase('releaseCard');
    else this.setPhase('returnToIdle');

    this.modelRoot.rotation.x = -0.055 * action;
    this.modelRoot.rotation.z = 0.045 * reach * (1 - back);
    this.modelRoot.position.z = 0.22 * action;

    const deck = new THREE.Vector3(-2.35, -2.15, 2.4);
    const hand = new THREE.Vector3(-1.1, -0.9, 2.65);
    const forwardPoint = new THREE.Vector3(0, -2.35, 3.0);
    const player = new THREE.Vector3(0, -4.25, 3.25);
    if (progress < 0.36) this.card.position.lerpVectors(deck, hand, pick);
    else if (progress < 0.66) this.card.position.lerpVectors(hand, forwardPoint, forward);
    else this.card.position.lerpVectors(forwardPoint, player, release);
    this.card.rotation.x = lerp(-0.3, -0.52, forward);
    this.card.rotation.y = lerp(Math.PI, 0, release);
    this.card.rotation.z = lerp(-0.1, 0, forward);
  }

  updateReceive(progress) {
    const reach = segment(progress, 0.00, 0.32);
    const pick = segment(progress, 0.26, 0.43);
    const carry = segment(progress, 0.40, 0.74);
    const back = segment(progress, 0.74, 1.00);
    if (progress < 0.32) this.setPhase('reachForCard');
    else if (progress < 0.43) this.setPhase('pickUpCard');
    else if (progress < 0.74) this.setPhase('moveCardToDiscard');
    else this.setPhase('returnToIdle');

    const action = Math.sin(clamp01(progress) * Math.PI);
    this.modelRoot.rotation.x = -0.05 * action;
    this.modelRoot.rotation.z = -0.04 * reach * (1 - back);
    this.modelRoot.position.z = 0.18 * action;
    const player = new THREE.Vector3(0, -4.25, 3.25);
    const hand = new THREE.Vector3(1.1, -0.9, 2.65);
    const discard = new THREE.Vector3(2.4, -2.15, 2.4);
    if (progress < 0.43) this.card.position.lerpVectors(player, hand, pick);
    else this.card.position.lerpVectors(hand, discard, carry);
    this.card.rotation.x = lerp(-0.5, -0.3, carry);
  }

  finishAnimation() {
    this.card.visible = false;
    this.animation = null;
    this.modelRoot.rotation.set(0, 0, 0);
    this.modelRoot.position.z = 0;
    this.activeAction?.fadeOut(0.15);
    this.idleAction?.reset().fadeIn(0.15).play();
    this.activeAction = null;
    this.setPhase('idle');
  }

  render = () => {
    this.frame = 0;
    if (this.disposed || !this.visible || document.hidden) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    this.mixer?.update(delta);
    if (this.animation) {
      const progress = clamp01(
        (performance.now() - this.animation.started) / this.animation.duration,
      );
      if (this.animation.kind === 'deal') this.updateDeal(progress);
      else this.updateReceive(progress);
      if (progress >= 1) this.finishAnimation();
    } else {
      this.updateIdle(time);
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.render);
  };

  resume() {
    if (this.disposed || !this.visible || document.hidden || this.frame) return;
    this.clock.getDelta();
    this.frame = requestAnimationFrame(this.render);
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
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.mixer?.stopAllAction();
    if (this.model) this.mixer?.uncacheRoot(this.model);
    disposeObject(this.model);
    this.card.userData.texture?.dispose();
    this.card.userData.faceMaterial?.dispose();
    this.card.userData.fallbackMaterial?.dispose();
    this.card.userData.edgeMaterial?.dispose();
    this.card.geometry.dispose();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}

window.puppetDealerCreate = function (id, quality) {
  if (dealers.has(id) || pendingMounts.has(id)) return;
  const pending = { cancelled: false, frame: 0, started: performance.now() };
  pendingMounts.set(id, pending);
  const mount = () => {
    if (pending.cancelled) return;
    const host = document.getElementById(id);
    if (host?.isConnected && host.clientWidth > 0 && host.clientHeight > 0) {
      pendingMounts.delete(id);
      try {
        dealers.set(id, new JesterDealer(host, quality));
      } catch (error) {
        host.dataset.dealerStatus = 'failed';
        console.error('Unable to create the 3D jester dealer.', error);
      }
      return;
    }
    if (performance.now() - pending.started > 8000) {
      pendingMounts.delete(id);
      if (host) host.dataset.dealerStatus = 'failed';
      return;
    }
    pending.frame = requestAnimationFrame(mount);
  };
  pending.frame = requestAnimationFrame(mount);
};

window.puppetDealerDeal = (id, imageUrl) =>
  dealers.get(id)?.deal(imageUrl, 'deal') || false;
window.puppetDealerReceive = (id, imageUrl) =>
  dealers.get(id)?.deal(imageUrl, 'receive') || false;
window.puppetDealerSetQuality = (id, quality) =>
  dealers.get(id)?.setQuality(quality);
window.puppetDealerDestroy = function (id) {
  const pending = pendingMounts.get(id);
  if (pending) {
    pending.cancelled = true;
    cancelAnimationFrame(pending.frame);
    pendingMounts.delete(id);
  }
  dealers.get(id)?.dispose();
  dealers.delete(id);
};
