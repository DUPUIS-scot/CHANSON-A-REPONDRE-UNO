import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

// Flutter remains the source of truth for cards and deck state. This module
// only mirrors each real draw/play action with a synchronized 3D performance.
const dealers = new Map();
const pendingMounts = new Map();
const MODEL_REVISION = 'jester-player-reupload-20260816';
const MODEL_URLS = [
  new URL('assets/assets/models/jester_player_reupload.glb', document.baseURI).href,
  new URL('assets/assets/models/jester_player.glb', document.baseURI).href,
];
// The supplied Tripo jester is a static single-mesh GLB facing +X. Rotate that
// axis toward the Play camera (+Z) and animate the performance procedurally.
const MODEL_FACING_Y = -Math.PI / 2;
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
      this.host.dataset.modelError = 'No 3D jester asset could be loaded.';
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
        this.host.dataset.modelFallback = index === 0 ? 'false' : 'true';
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
        console.warn('Unable to load 3D jester candidate.', {
          url: modelUrl,
          error,
        });
        if (index + 1 < MODEL_URLS.length) {
          this.host.dataset.modelFallback = 'loading';
          this.loadModel(index + 1);
          return;
        }
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
      const corners = [
        new THREE.Vector3(min.x, min.y, min.z),
        new THREE.Vector3(min.x, min.y, max.z),
        new THREE.Vector3(min.x, max.y, min.z),
        new THREE.Vector3(min.x, max.y, max.z),
        new THREE.Vector3(max.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, max.z),
        new THREE.Vector3(max.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, max.z),
      ];
      const edgeLimit = narrow ? 0.965 : 0.975;
      const frontDepth = Math.max(0.1, max.z - center.z);
      let low = frontDepth + 0.12;
      let high = Math.max(10, low * 2);

      const fitsAt = (distance) => {
        this.camera.position.set(center.x, center.y, center.z + distance);
        this.camera.lookAt(center);
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld(true);
        return corners.every((corner) => {
          const projected = corner.clone().project(this.camera);
          return (
            projected.z >= -1 &&
            projected.z <= 1 &&
            Math.abs(projected.x) <= edgeLimit &&
            Math.abs(projected.y) <= edgeLimit
          );
        });
      };

      while (!fitsAt(high) && high < 100) high *= 1.5;
      for (let index = 0; index < 28; index += 1) {
        const middle = (low + high) / 2;
        if (fitsAt(middle)) high = middle;
        else low = middle;
      }
      fitsAt(high);
      this.host.dataset.puppetFit = 'full-body-maximized';
      this.host.dataset.puppetCameraDistance = high.toFixed(3);
      this.host.dataset.puppetEdgeLimit = String(edgeLimit);
    } else {
      this.camera.position.set(0, 0, narrow ? 9.7 : 12.4);
      this.camera.lookAt(0, 0, 0);
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
    this.gestureRoot.scale.set(1 + squash * 0.04, 1 - squash * 0.055, 1 + squash * 0.04);
  }

  updateIdle(time) {
    if (!this.model) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.25 : 1;
    this.resetGesture();
    this.modelRoot.position.y +=
      (Math.sin(time * 1.15) * 0.025 * amount - this.modelRoot.position.y) * 0.05;
    this.modelRoot.rotation.x = Math.sin(time * 0.44) * 0.006 * amount;
    this.modelRoot.rotation.y = Math.sin(time * 0.38) * 0.018 * amount;
    this.modelRoot.rotation.z = Math.sin(time * 0.52) * 0.008 * amount;
  }

  updateDeal(progress) {
    const notice = pulse(progress, 0.00, 0.08, 0.18);
    const reach = segment(progress, 0.08, 0.28);
    const lift = segment(progress, 0.25, 0.43);
    const present = segment(progress, 0.40, 0.62);
    const flick = segment(progress, 0.60, 0.86);
    const settle = segment(progress, 0.84, 1.00);
    const recoil = pulse(progress, 0.62, 0.74, 0.92);

    if (progress < 0.08) this.setPhase('noticeDeck');
    else if (progress < 0.28) this.setPhase('reachForDeck');
    else if (progress < 0.43) this.setPhase('liftCard');
    else if (progress < 0.62) this.setPhase('presentCard');
    else if (progress < 0.86) this.setPhase('flickCardToPlayer');
    else this.setPhase('returnToIdle');

    const leftLean = reach * (1 - settle);
    const forwardLean = present * (1 - settle);
    this.setGesturePose({
      x: -0.34 * leftLean + 0.14 * recoil,
      y: -0.12 * leftLean + 0.10 * recoil,
      z: 0.28 * forwardLean + 0.16 * recoil,
      rx: -0.10 * forwardLean + 0.055 * recoil,
      ry: 0.11 * leftLean - 0.08 * recoil,
      rz: 0.085 * leftLean - 0.045 * recoil + 0.02 * notice,
      squash: 0.9 * reach - 0.6 * recoil,
    });

    const deck = new THREE.Vector3(-2.35, -2.15, 2.4);
    const deckLift = new THREE.Vector3(-2.25, -1.1, 2.75);
    const hand = new THREE.Vector3(-0.78, -0.62, 2.92);
    const show = new THREE.Vector3(-0.10, -1.42, 3.28);
    const player = new THREE.Vector3(0, -4.25, 3.25);

    if (progress < 0.25) {
      this.card.position.copy(deck);
    } else if (progress < 0.43) {
      const t = smoother((progress - 0.25) / 0.18);
      cubicBezier(this.card.position, deck, deckLift, hand.clone().add(new THREE.Vector3(-0.32, 0.25, 0)), hand, t);
    } else if (progress < 0.62) {
      const t = smoother((progress - 0.43) / 0.19);
      cubicBezier(this.card.position, hand, hand.clone().add(new THREE.Vector3(0.20, 0.55, 0.20)), show.clone().add(new THREE.Vector3(-0.15, 0.30, 0.25)), show, t);
    } else {
      const t = smoother((progress - 0.62) / 0.24);
      const c1 = show.clone().add(new THREE.Vector3(0.45, -0.50, 0.55));
      const c2 = player.clone().add(new THREE.Vector3(-0.40, 1.10, 0.70));
      cubicBezier(this.card.position, show, c1, c2, player, t);
    }

    this.card.rotation.x = lerp(-0.30, -0.56, lift);
    this.card.rotation.y = lerp(Math.PI, 0, present);
    this.card.rotation.z =
      lerp(-0.10, 0.02, lift) + Math.sin(flick * Math.PI * 2) * 0.30 * flick;
    const flyScale = 1 + Math.sin(flick * Math.PI) * 0.08;
    this.card.scale.setScalar(flyScale);
  }

  updateReceive(progress) {
    const catchCard = segment(progress, 0.00, 0.30);
    const pullIn = segment(progress, 0.26, 0.47);
    const sweep = segment(progress, 0.44, 0.80);
    const drop = segment(progress, 0.78, 0.91);
    const settle = segment(progress, 0.89, 1.00);
    const accent = pulse(progress, 0.45, 0.62, 0.84);

    if (progress < 0.30) this.setPhase('catchPlayerCard');
    else if (progress < 0.47) this.setPhase('pullCardToChest');
    else if (progress < 0.80) this.setPhase('sweepCardToDiscard');
    else if (progress < 0.91) this.setPhase('dropOnDiscard');
    else this.setPhase('returnToIdle');

    const active = Math.max(catchCard * (1 - settle), sweep * (1 - settle));
    this.setGesturePose({
      x: 0.26 * sweep - 0.10 * catchCard,
      y: -0.10 * catchCard + 0.08 * accent,
      z: 0.24 * active,
      rx: -0.08 * active,
      ry: -0.15 * sweep + 0.055 * catchCard,
      rz: -0.07 * sweep + 0.035 * catchCard,
      squash: 0.55 * catchCard - 0.35 * accent,
    });

    const player = new THREE.Vector3(0, -4.25, 3.25);
    const catchPoint = new THREE.Vector3(0.72, -1.28, 3.20);
    const chest = new THREE.Vector3(0.36, -0.48, 2.84);
    const discard = new THREE.Vector3(2.40, -2.15, 2.40);

    if (progress < 0.30) {
      const t = smoother(progress / 0.30);
      const c1 = player.clone().add(new THREE.Vector3(0.20, 1.20, 0.62));
      const c2 = catchPoint.clone().add(new THREE.Vector3(-0.18, -0.10, 0.36));
      cubicBezier(this.card.position, player, c1, c2, catchPoint, t);
    } else if (progress < 0.47) {
      const t = smoother((progress - 0.30) / 0.17);
      cubicBezier(
        this.card.position,
        catchPoint,
        catchPoint.clone().add(new THREE.Vector3(-0.10, 0.35, 0.05)),
        chest.clone().add(new THREE.Vector3(0.18, 0.24, 0.10)),
        chest,
        t,
      );
    } else if (progress < 0.91) {
      const t = smoother((progress - 0.47) / 0.44);
      const c1 = chest.clone().add(new THREE.Vector3(0.60, 0.38, 0.48));
      const c2 = discard.clone().add(new THREE.Vector3(-0.44, 0.78, 0.54));
      cubicBezier(this.card.position, chest, c1, c2, discard, t);
    } else {
      this.card.position.copy(discard);
      this.card.position.y += Math.sin((progress - 0.91) / 0.09 * Math.PI) * 0.08 * (1 - settle);
    }

    this.card.rotation.x = lerp(-0.50, -0.28, pullIn);
    this.card.rotation.y = Math.sin(sweep * Math.PI) * 0.35;
    this.card.rotation.z = Math.sin(sweep * Math.PI * 1.6) * 0.22;
    this.card.scale.setScalar(1 + Math.sin(drop * Math.PI) * 0.045);
  }

  finishAnimation() {
    this.card.visible = false;
    this.card.scale.setScalar(1);
    this.animation = null;
    this.resetGesture();
    this.modelRoot.rotation.set(0, 0, 0);
    this.modelRoot.position.set(0, 0, 0);
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
