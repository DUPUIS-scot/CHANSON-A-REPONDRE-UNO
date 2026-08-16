import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const AUTO_SCENE_ID = 'transcription-jester-route-auto';
const MODEL_URL = new URL('assets/assets/models/transcription_jester.glb', document.baseURI).href;
const MODEL_FACING_Y = -Math.PI / 2;

let sharedScene = null;
const sceneOwners = new Set();

function routeText() {
  return decodeURIComponent(`${window.location.pathname || ''}${window.location.hash || ''}`);
}

function isTranscriptionRoute() {
  return /\/cards\/[^/?#]+\/transcription(?:[/?#]|$)/i.test(routeText());
}

function currentCardId() {
  const match = routeText().match(/\/cards\/([^/?#]+)\/transcription(?:[/?#]|$)/i);
  return match?.[1] || null;
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

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  if (mobile) {
    return {
      left: -45,
      top: 56,
      width: Math.max(420, window.innerWidth + 90),
      height: Math.min(560, Math.max(430, window.innerHeight * 0.57)),
    };
  }
  return {
    left: Math.max(-40, Math.round(window.innerWidth * -0.01)),
    top: 52,
    width: Math.min(820, Math.max(610, window.innerWidth * 0.62)),
    height: Math.min(690, Math.max(530, window.innerHeight * 0.66)),
  };
}

function ensureHost() {
  let host = document.getElementById(AUTO_SCENE_ID);
  if (host) return host;
  host = document.createElement('div');
  host.id = AUTO_SCENE_ID;
  host.dataset.generatedBy = 'transcription-jester';
  Object.assign(host.style, {
    position: 'fixed', width: '1px', height: '1px', left: '-9999px', top: '-9999px',
    pointerEvents: 'none', overflow: 'hidden',
  });
  document.body.appendChild(host);
  return host;
}

function flutterAssetUrl(path) {
  if (!path) return null;
  const normalized = String(path).replace(/^\/+/, '');
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return new URL(normalized.startsWith('assets/') ? `assets/${normalized}` : normalized, document.baseURI).href;
}

function findCardInCatalog(catalog, wanted) {
  if (!catalog) return null;
  const cards = Array.isArray(catalog) ? catalog : catalog.cards;
  if (Array.isArray(cards)) {
    const found = cards.find((entry) => String(entry?.id || '').toLowerCase() === wanted);
    if (found) return found;
  }
  for (const deck of catalog.decks || []) {
    const found = (deck.cards || []).find((entry) => String(entry?.id || '').toLowerCase() === wanted);
    if (found) return found;
  }
  return null;
}

async function resolveSelectedCardImage(cardId) {
  if (!cardId) return null;
  const wanted = cardId.toLowerCase();
  const sources = [
    'assets/assets/json/cards.json',
    'assets/assets/decks/chanson_a_repondre_brio/deck.json',
  ];
  for (const source of sources) {
    try {
      const response = await fetch(new URL(source, document.baseURI).href, { cache: 'no-store' });
      if (!response.ok) continue;
      const card = findCardInCatalog(await response.json(), wanted);
      if (card) return flutterAssetUrl(card.path || card.image);
    } catch (error) {
      console.warn('Unable to resolve selected card artwork.', error);
    }
  }
  return null;
}

class TranscriptionJester {
  constructor(host) {
    this.host = host;
    this.disposed = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.selectedCardId = currentCardId();
    this.host.dataset.transcriptionJester = 'loading';
    if (this.selectedCardId) this.host.dataset.selectedCardId = this.selectedCardId;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    this.camera.position.set(0, 0.1, 10.8);
    this.camera.lookAt(0, 0.1, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    Object.assign(this.renderer.domElement.style, {
      display: 'block', position: 'fixed', pointerEvents: 'none', background: 'transparent',
      zIndex: '2147483000', opacity: '1',
      filter: 'drop-shadow(0 22px 26px rgba(0,0,0,.82))', transform: 'translateZ(0)',
    });
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.dataset.transcriptionJesterCanvas = 'true';
    document.body.appendChild(this.renderer.domElement);

    this.pivot = new THREE.Group();
    this.pivot.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.pivot);

    this.scene.add(new THREE.HemisphereLight(0xffdeb0, 0x16070a, 3.5));
    const key = new THREE.DirectionalLight(0xffa64e, 6.8);
    key.position.set(-3.6, 5.2, 5.8);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3f1d, 4.6);
    rim.position.set(4, 4, -3);
    this.scene.add(rim);
    const face = new THREE.PointLight(0xffca78, 3.5, 12);
    face.position.set(0.2, 1.7, 4.5);
    this.scene.add(face);

    this.onWindowResize = () => this.resize();
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', this.onWindowResize);
    this.resize();
    this.loadModel();
  }

  loadModel() {
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (this.disposed) return disposeObject(gltf.scene);
        this.model = gltf.scene;
        this.model.traverse((object) => {
          if (/string|marionette|control[_ -]?line/i.test(object.name)) object.visible = false;
          if (object.isMesh && !object.geometry.getAttribute('normal')) object.geometry.computeVertexNormals();
        });
        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        this.model.scale.setScalar(6.8 / Math.max(size.y, 0.001));
        this.pivot.add(this.model);

        if (gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const laugh = gltf.animations.find((clip) => /laugh|giggle|chuckle|taunt|mock/i.test(clip.name));
          const idle = gltf.animations.find((clip) => /idle/i.test(clip.name));
          this.idleAction = this.mixer.clipAction(idle || gltf.animations[0]);
          this.idleAction.play();
          if (laugh) this.laughAction = this.mixer.clipAction(laugh);
        }

        this.fitCamera();
        this.attachSelectedCard();
        this.host.dataset.transcriptionJester = 'ready';
        this.host.dataset.modelAsset = MODEL_URL;
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

  fitCamera() {
    if (!this.model) return;
    const bounds = new THREE.Box3().setFromObject(this.pivot);
    const size = bounds.getSize(new THREE.Vector3());
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(this.camera.aspect, 0.2));
    const distance = Math.max(
      (size.y * 0.5) / Math.max(Math.tan(verticalFov / 2), 0.01),
      (size.x * 0.5) / Math.max(Math.tan(horizontalFov / 2), 0.01),
    ) * 1.03;
    this.camera.position.set(0, 0.08, Math.max(8.8, distance));
    this.camera.lookAt(0, 0.08, 0);
    this.camera.updateProjectionMatrix();
  }

  async attachSelectedCard() {
    const imageUrl = await resolveSelectedCardImage(this.selectedCardId);
    if (this.disposed || !imageUrl) return;
    new THREE.TextureLoader().load(imageUrl, (texture) => {
      if (this.disposed) return texture.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      const anchor = new THREE.Group();
      const backing = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 2.52), new THREE.MeshStandardMaterial({ color: 0x1a0d06, roughness: 0.7, side: THREE.DoubleSide }));
      backing.position.z = -0.018;
      anchor.add(backing);
      const card = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 2.38), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55, side: THREE.DoubleSide }));
      card.position.z = 0.004;
      anchor.add(card);
      anchor.rotation.y = Math.PI / 2;
      anchor.rotation.z = -0.08;
      anchor.position.set(0.10, 0.62, 2.03);
      this.cardAnchor = anchor;
      this.pivot.add(anchor);
      this.host.dataset.selectedCard = 'ready';
    });
  }

  resize() {
    const rect = stageRect();
    Object.assign(this.renderer.domElement.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.fov = rect.width < 520 ? 36 : 33;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
  }

  update(time, delta) {
    this.mixer?.update(delta);
    if (!this.model) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.2 : 1;
    const cycle = (time % 4.8) / 4.8;
    const active = cycle > 0.04 && cycle < 0.88;
    const local = active ? (cycle - 0.04) / 0.84 : 0;
    const envelope = active ? Math.sin(Math.PI * local) : 0;
    const pulses = active ? Math.pow(Math.max(0, Math.sin(local * Math.PI * 9)), 1.25) : 0;
    this.pivot.rotation.x = -envelope * 0.11 * amount - pulses * 0.06 * amount;
    this.pivot.rotation.y = MODEL_FACING_Y + Math.sin(time * 0.62) * 0.045 * amount;
    this.pivot.rotation.z = Math.sin(time * 1.4) * 0.018 * amount + pulses * 0.025 * amount;
    this.pivot.position.y = Math.sin(time * 1.05) * 0.05 * amount + pulses * 0.07 * amount;
    this.pivot.position.z = envelope * 0.32 * amount + pulses * 0.1 * amount;
  }

  tick = () => {
    if (this.disposed || document.hidden) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(this.clock.elapsedTime, delta);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  resume() {
    if (this.disposed || this.frame || document.hidden) return;
    this.clock.getDelta();
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    if (this.frame) cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('orientationchange', this.onWindowResize);
    this.mixer?.stopAllAction();
    disposeObject(this.cardAnchor);
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    if (this.host.dataset.generatedBy === 'transcription-jester') this.host.remove();
  }
}

window.transcriptionJesterCreate = (id) => {
  sceneOwners.add(id || AUTO_SCENE_ID);
  if (sharedScene) return;
  try {
    sharedScene = new TranscriptionJester(ensureHost());
  } catch (error) {
    const host = ensureHost();
    host.dataset.transcriptionJester = 'failed';
    host.dataset.modelError = String(error?.message || error);
    console.error('Unable to create transcription jester WebGL scene.', error);
  }
};

window.transcriptionJesterDestroy = (id) => {
  sceneOwners.delete(id || AUTO_SCENE_ID);
  if (sharedScene && sceneOwners.size === 0) {
    sharedScene.dispose();
    sharedScene = null;
  }
};

function syncAutonomousRouteScene() {
  if (isTranscriptionRoute()) window.transcriptionJesterCreate(AUTO_SCENE_ID);
  else window.transcriptionJesterDestroy(AUTO_SCENE_ID);
}

window.addEventListener('hashchange', syncAutonomousRouteScene);
window.addEventListener('popstate', syncAutonomousRouteScene);
queueMicrotask(syncAutonomousRouteScene);
setTimeout(syncAutonomousRouteScene, 250);
setTimeout(syncAutonomousRouteScene, 1200);
