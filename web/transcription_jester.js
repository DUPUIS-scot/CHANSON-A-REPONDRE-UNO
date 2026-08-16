import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const scenes = new Map();
const MODEL_URL = new URL(
  'assets/assets/models/transcription_jester.glb',
  document.baseURI,
).href;
const MODEL_FACING_Y = -Math.PI / 2;

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

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  return mobile
    ? {
        left: 0,
        top: 150,
        width: Math.min(310, window.innerWidth * 0.48),
        height: Math.min(620, window.innerHeight * 0.72),
      }
    : {
        left: 10,
        top: 104,
        width: Math.min(445, window.innerWidth * 0.34),
        height: Math.max(540, window.innerHeight - 130),
      };
}

function ensureHost(id) {
  let host = document.getElementById(id);
  if (host) return host;
  host = document.createElement('div');
  host.id = id;
  host.dataset.generatedBy = 'transcription-jester';
  Object.assign(host.style, {
    position: 'fixed',
    width: '1px',
    height: '1px',
    left: '-9999px',
    top: '-9999px',
    pointerEvents: 'none',
    overflow: 'hidden',
  });
  document.body.appendChild(host);
  return host;
}

function currentCardId() {
  const hash = decodeURIComponent(window.location.hash || '');
  const match = hash.match(/\/cards\/([^/?#]+)\/transcription(?:[/?#]|$)/i);
  return match?.[1] || null;
}

function flutterAssetUrl(path) {
  if (!path) return null;
  const normalized = String(path).replace(/^\/+/, '');
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return new URL(
    normalized.startsWith('assets/') ? `assets/${normalized}` : normalized,
    document.baseURI,
  ).href;
}

async function resolveSelectedCardImage(cardId) {
  if (!cardId) return null;
  const wanted = cardId.toLowerCase();

  try {
    const catalogUrl = new URL(
      'assets/assets/json/cards.json',
      document.baseURI,
    ).href;
    const response = await fetch(catalogUrl);
    if (response.ok) {
      const catalog = await response.json();
      for (const deck of catalog.decks || []) {
        const card = (deck.cards || []).find(
          (entry) => String(entry.id || '').toLowerCase() === wanted,
        );
        if (card) return flutterAssetUrl(card.path || card.image);
      }
    }
  } catch (error) {
    console.warn('Unable to resolve selected UNO card artwork.', error);
  }

  try {
    const brioUrl = new URL(
      'assets/assets/decks/chanson_a_repondre_brio/deck.json',
      document.baseURI,
    ).href;
    const response = await fetch(brioUrl);
    if (response.ok) {
      const deck = await response.json();
      const card = (deck.cards || []).find(
        (entry) => String(entry.id || '').toLowerCase() === wanted,
      );
      if (card) return flutterAssetUrl(card.path || card.image);
    }
  } catch (error) {
    console.warn('Unable to resolve selected BRIO card artwork.', error);
  }

  return null;
}

class TranscriptionJester {
  constructor(host) {
    this.host = host;
    this.host.dataset.transcriptionJester = 'loading';
    this.disposed = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.selectedCardId = currentCardId();
    if (this.selectedCardId) {
      this.host.dataset.selectedCardId = this.selectedCardId;
    }

    // Render directly on document.body so the puppet remains visible on Flutter
    // web/Safari even though the Dart widget itself is only a logical mount.
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
    this.camera.position.set(0, 0.08, 7.9);
    this.camera.lookAt(0, 0.5, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    Object.assign(this.renderer.domElement.style, {
      display: 'block',
      position: 'fixed',
      pointerEvents: 'none',
      background: 'transparent',
      zIndex: '2147482500',
      opacity: '0.94',
      filter: 'drop-shadow(0 18px 20px rgba(0,0,0,.72))',
      transform: 'translateZ(0)',
    });
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.renderer.domElement);

    this.pivot = new THREE.Group();
    this.pivot.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.pivot);

    this.scene.add(new THREE.HemisphereLight(0xffd6a1, 0x12070a, 2.55));
    const key = new THREE.DirectionalLight(0xff9a3b, 5.4);
    key.position.set(-3.6, 5.2, 5.8);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3115, 3.5);
    rim.position.set(4, 4, -3);
    this.scene.add(rim);
    const face = new THREE.PointLight(0xffc05f, 2.5, 9);
    face.position.set(0.2, 1.7, 4);
    this.scene.add(face);

    this.onWindowResize = () => this.resize();
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', this.onWindowResize);
    this.onVisibility = () => {
      if (document.hidden) this.pause();
      else this.resume();
    };
    document.addEventListener('visibilitychange', this.onVisibility);

    this.resize();
    this.loadModel();
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
        this.model.traverse((object) => {
          if (/string|marionette|control[_ -]?line/i.test(object.name)) {
            object.visible = false;
          }
          if (object.isMesh) {
            if (!object.geometry.getAttribute('normal')) {
              object.geometry.computeVertexNormals();
            }
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        this.model.scale.setScalar(7.0 / Math.max(size.y, 0.001));
        this.pivot.add(this.model);

        if (gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const laugh = gltf.animations.find((clip) =>
            /laugh|giggle|chuckle|taunt|mock/i.test(clip.name),
          );
          const idle = gltf.animations.find((clip) => /idle/i.test(clip.name));
          this.idleAction = this.mixer.clipAction(idle || gltf.animations[0]);
          this.idleAction.play();
          if (laugh) this.laughAction = this.mixer.clipAction(laugh);
        }

        this.attachSelectedCard();
        this.host.dataset.transcriptionJester = 'ready';
        this.host.dataset.modelAsset = MODEL_URL;
        this.host.dataset.modelAnimations = String(gltf.animations.length);
        this.host.dataset.sourceModel = 'user-uploaded-glb-web-optimized';
        this.host.dataset.behavior =
          'laughing-arrogantly-at-viewer-holding-selected-card';
        this.resume();
      },
      undefined,
      (error) => {
        this.host.dataset.transcriptionJester = 'failed';
        this.host.dataset.modelError = String(error?.message || error);
        console.error('Unable to load transcription jester.', error);
      },
    );
  }

  async attachSelectedCard() {
    const imageUrl = await resolveSelectedCardImage(this.selectedCardId);
    if (this.disposed || !imageUrl) {
      this.host.dataset.selectedCard = 'unresolved';
      return;
    }

    new THREE.TextureLoader().load(
      imageUrl,
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(
          8,
          this.renderer.capabilities.getMaxAnisotropy(),
        );

        const anchor = new THREE.Group();
        anchor.name = 'SelectedTranscriptionCard';

        const backing = new THREE.Mesh(
          new THREE.PlaneGeometry(1.86, 2.78),
          new THREE.MeshStandardMaterial({
            color: 0x1a0d06,
            roughness: 0.7,
            metalness: 0.05,
            side: THREE.DoubleSide,
          }),
        );
        backing.position.z = -0.018;
        anchor.add(backing);

        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(1.76, 2.64),
          new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.56,
            metalness: 0.02,
            side: THREE.DoubleSide,
          }),
        );
        card.position.z = 0.004;
        anchor.add(card);

        // The model is rotated 90 degrees inside the pivot. Counter-rotate the
        // card so its recto faces the viewer, then place it where the raised
        // left hand visually grips its lower edge.
        anchor.rotation.y = Math.PI / 2;
        anchor.rotation.z = -0.08;
        anchor.position.set(0.14, 0.62, 2.08);

        this.cardAnchor = anchor;
        this.pivot.add(anchor);
        this.host.dataset.selectedCard = 'ready';
        this.host.dataset.selectedCardAsset = imageUrl;
      },
      undefined,
      (error) => {
        this.host.dataset.selectedCard = 'failed';
        console.warn('Unable to load selected card into jester hand.', error);
      },
    );
  }

  resize() {
    const rect = stageRect();
    Object.assign(this.renderer.domElement.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.fov = rect.width < 330 ? 31 : 29;
    this.camera.position.z = rect.width < 330 ? 7.35 : 7.9;
    this.camera.updateProjectionMatrix();
  }

  update(time, delta) {
    this.mixer?.update(delta);
    if (!this.model) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.22 : 1;
    const cycle = (time % 4.8) / 4.8;
    const active = cycle > 0.04 && cycle < 0.88;
    const local = active ? (cycle - 0.04) / 0.84 : 0;
    const envelope = active ? Math.sin(Math.PI * local) : 0;
    const pulses = active
      ? Math.pow(Math.max(0, Math.sin(local * Math.PI * 9.0)), 1.25)
      : 0;

    // A smug, viewer-directed laugh: the puppet leans toward the camera,
    // rocks its shoulders/body and bounces through repeated laugh pulses.
    this.pivot.rotation.x =
      -envelope * 0.13 * amount - pulses * 0.075 * amount;
    this.pivot.rotation.y =
      MODEL_FACING_Y + Math.sin(time * 0.62) * 0.05 * amount;
    this.pivot.rotation.z =
      Math.sin(time * 1.4) * 0.02 * amount + pulses * 0.032 * amount;
    this.pivot.position.y =
      Math.sin(time * 1.05) * 0.06 * amount + pulses * 0.095 * amount;
    this.pivot.position.z =
      envelope * 0.46 * amount + pulses * 0.14 * amount;
    const squash = 1 + pulses * 0.03 * amount;
    this.pivot.scale.set(1 - pulses * 0.016 * amount, squash, 1);

    if (this.cardAnchor) {
      this.cardAnchor.rotation.z =
        -0.08 + Math.sin(time * 0.9) * 0.018 * amount;
      this.cardAnchor.position.y =
        0.62 + Math.sin(time * 1.05) * 0.018 * amount;
    }

    if (active && this.laughAction && !this.laughing) {
      this.laughing = true;
      this.idleAction?.fadeOut(0.1);
      this.laughAction.reset().setLoop(THREE.LoopRepeat, 3).fadeIn(0.1).play();
    } else if (!active && this.laughing) {
      this.laughing = false;
      this.laughAction?.fadeOut(0.16);
      this.idleAction?.reset().fadeIn(0.16).play();
    }

    this.host.dataset.laughPhase = active
      ? pulses > 0.3
        ? 'laughing-at-viewer'
        : 'smirking'
      : 'idle';
  }

  tick = () => {
    if (this.disposed || document.hidden) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    this.update(time, delta);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  pause() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  resume() {
    if (this.disposed || this.frame || document.hidden) return;
    this.clock.getDelta();
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    this.pause();
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('orientationchange', this.onWindowResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.mixer?.stopAllAction();
    disposeObject(this.cardAnchor);
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    if (this.host.dataset.generatedBy === 'transcription-jester') {
      this.host.remove();
    }
  }
}

window.transcriptionJesterCreate = (id) => {
  if (scenes.has(id)) return;
  const host = ensureHost(id);
  scenes.set(id, new TranscriptionJester(host));
};

window.transcriptionJesterDestroy = (id) => {
  scenes.get(id)?.dispose();
  scenes.delete(id);
};
