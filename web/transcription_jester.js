import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const AUTO_SCENE_ID = 'transcription-jester-route-auto';
const MODEL_FACING_Y = 0;
const JESTER_MODEL = new URL(
  'assets/assets/models/transcription_jester.glb',
  document.baseURI,
).href;
const BACKGROUND_CHUNKS = Array.from({ length: 6 }, (_, i) =>
  new URL(`transcription_assets/bg_${String(i).padStart(2, '0')}.txt`, document.baseURI).href,
);

let sharedScene = null;
const sceneOwners = new Set();

function routeText() {
  return decodeURIComponent(`${window.location.pathname || ''}${window.location.hash || ''}`);
}

function isTranscriptionRoute() {
  return /\/cards\/[^/?#]+\/transcription(?:[/?#]|$)/i.test(routeText());
}

function currentCardId() {
  return routeText().match(/\/cards\/([^/?#]+)\/transcription(?:[/?#]|$)/i)?.[1] || null;
}

async function blobUrlFromChunks(urls, mime) {
  const parts = await Promise.all(urls.map(async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load transcription asset chunk: ${url}`);
    return (await response.text()).trim();
  }));
  const binary = atob(parts.join(''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
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
  for (const source of [
    'assets/assets/json/cards.json',
    'assets/assets/decks/chanson_a_repondre_brio/deck.json',
  ]) {
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

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  const width = window.innerWidth;
  const height = window.innerHeight;
  return mobile
    ? { left: -width * 0.08, top: 26, width: width * 1.16, height: Math.min(610, height * 0.60) }
    : { left: Math.max(0, width * 0.04), top: 16, width: Math.min(800, width * 0.64), height: Math.min(720, height * 0.68) };
}

class TranscriptionJester {
  constructor(host) {
    this.host = host;
    this.disposed = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.selectedCardId = currentCardId();
    this.host.dataset.transcriptionJester = 'loading';
    this.host.dataset.sourceModel = 'assets/models/transcription_jester.glb';
    if (this.selectedCardId) this.host.dataset.selectedCardId = this.selectedCardId;

    this.previousBody = {
      backgroundImage: document.body.style.backgroundImage,
      backgroundSize: document.body.style.backgroundSize,
      backgroundPosition: document.body.style.backgroundPosition,
      backgroundRepeat: document.body.style.backgroundRepeat,
      backgroundAttachment: document.body.style.backgroundAttachment,
      backgroundColor: document.body.style.backgroundColor,
    };
    this.installReferenceBackground();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(31, 1, 0.01, 200);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    Object.assign(this.renderer.domElement.style, {
      display: 'block', position: 'fixed', pointerEvents: 'none', background: 'transparent',
      zIndex: '2147483000', opacity: '1',
      filter: 'drop-shadow(0 18px 24px rgba(0,0,0,.78))', transform: 'translateZ(0)',
    });
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.dataset.transcriptionJesterCanvas = 'true';
    document.body.appendChild(this.renderer.domElement);

    this.pivot = new THREE.Group();
    this.pivot.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.pivot);
    this.scene.add(new THREE.HemisphereLight(0xffe5bd, 0x160607, 4.2));
    const key = new THREE.DirectionalLight(0xffb35b, 8.2);
    key.position.set(-3.2, 5.5, 6.2);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 3.0);
    fill.position.set(3.5, 2.2, 5.5);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xc51e16, 4.8);
    rim.position.set(4.5, 3.5, -2.5);
    this.scene.add(rim);

    this.onWindowResize = () => this.resize();
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', this.onWindowResize);
    this.resize();
    this.loadModel();
  }

  async installReferenceBackground() {
    try {
      this.backgroundObjectUrl = await blobUrlFromChunks(BACKGROUND_CHUNKS, 'image/jpeg');
      if (this.disposed) return URL.revokeObjectURL(this.backgroundObjectUrl);
      Object.assign(document.body.style, {
        backgroundImage: `url("${this.backgroundObjectUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#050201',
      });
      this.host.dataset.referenceBackground = 'user-provided-theatrical-image';
    } catch (error) {
      console.error('Unable to install transcription reference background.', error);
    }
  }

  loadModel() {
    this.host.dataset.modelAsset = JESTER_MODEL;
    new GLTFLoader().load(JESTER_MODEL, (gltf) => {
      if (this.disposed) return disposeObject(gltf.scene);
      this.model = gltf.scene;
      let meshCount = 0;
      this.model.traverse((object) => {
        // This dedicated transcription model may itself be named "marionette".
        // Keep the entire imported hierarchy visible; hiding by node name can
        // suppress the root and make the successfully loaded jester disappear.
        object.visible = true;
        if (object.isMesh) {
          meshCount += 1;
          if (!object.geometry.getAttribute('normal')) object.geometry.computeVertexNormals();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.filter(Boolean).forEach((material) => {
            material.side = THREE.DoubleSide;
            material.transparent = false;
            material.opacity = 1;
            material.depthWrite = true;
            material.needsUpdate = true;
          });
        }
      });

      this.model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(this.model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
      this.model.position.sub(center);
      this.model.scale.setScalar(6.6 / maxDimension);
      this.model.position.set(0.15, -0.15, 0);
      this.pivot.add(this.model);
      this.pivot.updateMatrixWorld(true);

      this.fitCamera();
      this.attachSelectedCard();
      this.host.dataset.transcriptionJester = 'ready';
      this.host.dataset.modelAsset = 'assets/models/transcription_jester.glb';
      this.host.dataset.modelFacingAngle = String(MODEL_FACING_Y);
      this.host.dataset.modelFallback = 'false';
      this.host.dataset.modelMeshes = String(meshCount);
      this.host.dataset.modelSize = `${size.x.toFixed(3)},${size.y.toFixed(3)},${size.z.toFixed(3)}`;
      this.host.dataset.behavior = 'laughing-at-viewer-with-selected-card';
      this.resume();
    }, (event) => {
      if (event.total) this.host.dataset.modelProgress = String(Math.round((event.loaded / event.total) * 100));
    }, (error) => {
      this.host.dataset.transcriptionJester = 'failed';
      this.host.dataset.modelError = String(error?.message || error);
      console.error('Unable to load transcription_jester.glb.', error);
    });
  }

  fitCamera() {
    if (!this.model) return;
    this.pivot.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(this.pivot);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z, 0.001) * 0.5;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(this.camera.aspect, 0.2));
    const limitingFov = Math.max(0.2, Math.min(verticalFov, horizontalFov));
    const distance = radius / Math.tan(limitingFov / 2) * 1.18;
    this.camera.position.set(center.x, center.y + size.y * 0.03, center.z + Math.max(distance, 3.5));
    this.camera.near = Math.max(0.01, distance / 100);
    this.camera.far = Math.max(100, distance * 20);
    this.camera.lookAt(center.x, center.y + size.y * 0.03, center.z);
    this.camera.updateProjectionMatrix();
  }

  async attachSelectedCard() {
    const imageUrl = await resolveSelectedCardImage(this.selectedCardId);
    if (this.disposed || !imageUrl) return;
    new THREE.TextureLoader().load(imageUrl, (texture) => {
      if (this.disposed) return texture.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      const anchor = new THREE.Group();
      const backing = new THREE.Mesh(
        new THREE.PlaneGeometry(1.70, 2.55),
        new THREE.MeshStandardMaterial({ color: 0x211008, roughness: 0.72, side: THREE.DoubleSide }),
      );
      backing.position.z = -0.024;
      anchor.add(backing);
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(1.60, 2.40),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, side: THREE.DoubleSide }),
      );
      card.position.z = 0.006;
      anchor.add(card);
      anchor.rotation.set(0.02, -0.10, -0.08);
      anchor.position.set(-2.05, 0.55, 1.15);
      this.cardAnchor = anchor;
      this.pivot.add(anchor);
      this.host.dataset.selectedCard = 'ready';
    }, undefined, (error) => console.warn('Unable to load selected card texture.', error));
  }

  resize() {
    const rect = stageRect();
    Object.assign(this.renderer.domElement.style, {
      left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    });
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.fov = rect.width < 560 ? 36 : 31;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
  }

  update(time) {
    if (!this.model) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.16 : 1;
    const cycle = (time % 4.4) / 4.4;
    const envelope = Math.sin(Math.PI * cycle);
    const pulses = Math.pow(Math.max(0, Math.sin(cycle * Math.PI * 8)), 1.3);
    this.pivot.rotation.x = -envelope * 0.08 * amount - pulses * 0.045 * amount;
    this.pivot.rotation.y = MODEL_FACING_Y + Math.sin(time * 0.7) * 0.032 * amount;
    this.pivot.rotation.z = Math.sin(time * 1.45) * 0.016 * amount + pulses * 0.02 * amount;
    this.pivot.position.y = Math.sin(time) * 0.04 * amount + pulses * 0.05 * amount;
    this.pivot.position.z = envelope * 0.18 * amount + pulses * 0.07 * amount;
    this.host.dataset.laughPhase = pulses > 0.32 ? 'laughing-at-viewer' : 'smirking';
  }

  tick = () => {
    if (this.disposed || document.hidden) return;
    this.clock.getDelta();
    this.update(this.clock.elapsedTime);
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
    disposeObject(this.cardAnchor);
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    if (this.backgroundObjectUrl) URL.revokeObjectURL(this.backgroundObjectUrl);
    Object.assign(document.body.style, this.previousBody);
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
    console.error('Unable to create transcription jester scene.', error);
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
document.addEventListener('visibilitychange', () => { if (!document.hidden) sharedScene?.resume(); });
queueMicrotask(syncAutonomousRouteScene);
setTimeout(syncAutonomousRouteScene, 250);
setTimeout(syncAutonomousRouteScene, 1000);
