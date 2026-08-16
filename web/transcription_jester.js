import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const AUTO_SCENE_ID = 'transcription-jester-route-auto';
const MODEL_FACING_Y = -Math.PI / 2;
const JESTER_MODEL = new URL(
  'assets/assets/models/transcription_jester_rigged.glb',
  document.baseURI,
).href;
const BACKGROUND_CHUNKS = Array.from({ length: 6 }, (_, i) =>
  new URL(`transcription_assets/bg_${String(i).padStart(2, '0')}.txt`, document.baseURI).href,
);

let sharedScene = null;
const sceneOwners = new Set();
let pendingSelectedCard = null;

function routeText() {
  return decodeURIComponent(`${window.location.pathname || ''}${window.location.hash || ''}`);
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
  return new URL(normalized, document.baseURI).href;
}

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const stageWidth = mobile
    ? Math.min(viewportWidth * 1.12, 760)
    : Math.min(viewportWidth * 0.78, 980);
  const stageHeight = mobile
    ? Math.min(700, viewportHeight * 0.76)
    : Math.min(820, viewportHeight * 0.82);
  return {
    left: (viewportWidth - stageWidth) * 0.5,
    top: mobile ? 10 : 6,
    width: stageWidth,
    height: stageHeight,
  };
}

class TranscriptionJester {
  constructor(host) {
    this.host = host;
    this.disposed = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.selectedCardId = pendingSelectedCard?.cardId || currentCardId();
    this.selectedCardImage = pendingSelectedCard?.imagePath || null;
    this.host.dataset.transcriptionJester = 'loading';
    this.host.dataset.sourceModel = 'assets/models/transcription_jester_rigged.glb';
    this.host.dataset.framing = 'upper-torso';
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
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 200);
    this.camera.position.set(0, 1, 8);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.55;
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
    this.scene.add(new THREE.HemisphereLight(0xffe5bd, 0x160607, 4.1));
    const key = new THREE.DirectionalLight(0xffb35b, 7.5);
    key.position.set(-3.2, 5.5, 6.2);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 2.8);
    fill.position.set(3.5, 2.2, 5.5);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xc51e16, 4.2);
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
      this.model.scale.setScalar(6.8 / maxDimension);
      this.model.position.set(0.15, -0.12, 0);
      this.pivot.add(this.model);
      this.pivot.updateMatrixWorld(true);

      if (gltf.animations?.length) {
        this.mixer = new THREE.AnimationMixer(this.model);
        const idle = gltf.animations.find((clip) => /idle|breath|stand/i.test(clip.name)) || gltf.animations[0];
        this.idleAction = this.mixer.clipAction(idle);
        this.idleAction.play();
      }

      this.fitCamera();
      this.attachSelectedCard();
      this.host.dataset.transcriptionJester = 'ready';
      this.host.dataset.modelAsset = 'assets/models/transcription_jester_rigged.glb';
      this.host.dataset.modelFacingAngle = String(MODEL_FACING_Y);
      this.host.dataset.modelAnimations = String(gltf.animations?.length || 0);
      this.host.dataset.modelMeshes = String(meshCount);
      this.host.dataset.modelSize = `${size.x.toFixed(3)},${size.y.toFixed(3)},${size.z.toFixed(3)}`;
      this.host.dataset.behavior = 'rigged-upper-torso-facing-viewer';
      this.resume();
    }, (event) => {
      if (event.total) this.host.dataset.modelProgress = String(Math.round((event.loaded / event.total) * 100));
    }, (error) => {
      this.host.dataset.transcriptionJester = 'failed';
      this.host.dataset.modelError = String(error?.message || error);
      console.error('Unable to load transcription_jester_rigged.glb.', error);
    });
  }

  fitCamera() {
    if (!this.model) return;
    this.pivot.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(this.pivot);
    const size = bounds.getSize(new THREE.Vector3());
    const target = new THREE.Vector3(
      (bounds.min.x + bounds.max.x) * 0.5,
      bounds.min.y + size.y * 0.72,
      (bounds.min.z + bounds.max.z) * 0.5,
    );

    const visibleHeight = Math.max(size.y * 0.55, 0.5);
    const visibleWidth = Math.max(size.x * 0.86, 0.5);
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(this.camera.aspect, 0.2));
    const verticalDistance = (visibleHeight * 0.5) / Math.tan(verticalFov * 0.5);
    const horizontalDistance = (visibleWidth * 0.5) / Math.tan(Math.max(horizontalFov, 0.2) * 0.5);
    const distance = Math.max(verticalDistance, horizontalDistance, 2.8) * 1.06;

    this.camera.position.set(target.x, target.y, target.z + distance);
    this.camera.near = Math.max(0.01, distance / 100);
    this.camera.far = Math.max(100, distance * 20);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    this.host.dataset.cameraFraming = 'head-shoulders-chest-centered';
  }

  async attachSelectedCard() {
    const imageUrl = flutterAssetUrl(this.selectedCardImage);
    if (this.disposed || !imageUrl) return;
    if (this.cardAnchor) {
      this.pivot.remove(this.cardAnchor);
      disposeObject(this.cardAnchor);
      this.cardAnchor = null;
    }
    new THREE.TextureLoader().load(imageUrl, (texture) => {
      if (this.disposed) return texture.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      const anchor = new THREE.Group();
      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 1.68, 0.055),
        new THREE.MeshStandardMaterial({ color: 0x211008, roughness: 0.72 }),
      );
      anchor.add(backing);
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(1.08, 1.62),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.48, side: THREE.DoubleSide }),
      );
      card.position.z = 0.031;
      anchor.add(card);
      anchor.position.set(-0.54, 0.34, 1.48);
      anchor.rotation.set(0.05, -0.03, -0.04);
      this.cardAnchor = anchor;
      this.pivot.add(anchor);
      this.host.dataset.selectedCard = 'held-in-3d-hand';
    }, undefined, (error) => {
      this.host.dataset.selectedCard = 'failed';
      console.warn('Unable to load selected card texture.', error);
    });
  }

  setSelectedCard(cardId, imagePath) {
    this.selectedCardId = cardId || null;
    this.selectedCardImage = imagePath || null;
    if (this.selectedCardId) this.host.dataset.selectedCardId = this.selectedCardId;
    if (this.model) this.attachSelectedCard();
  }

  resize() {
    const rect = stageRect();
    Object.assign(this.renderer.domElement.style, {
      left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    });
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.fov = rect.width < 560 ? 34 : 29;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
  }

  update(time) {
    if (!this.model) return;
    const delta = this.clock.getDelta();
    this.mixer?.update(delta);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.12 : 1;
    this.pivot.rotation.y = MODEL_FACING_Y + Math.sin(time * 0.55) * 0.018 * amount;
    this.pivot.rotation.z = Math.sin(time * 0.8) * 0.008 * amount;
    this.pivot.position.y = Math.sin(time * 0.7) * 0.018 * amount;
  }

  tick = () => {
    if (this.disposed || document.hidden) return;
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
    this.mixer?.stopAllAction();
    disposeObject(this.cardAnchor);
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    if (this.backgroundObjectUrl) URL.revokeObjectURL(this.backgroundObjectUrl);
  }
}

function ensureScene(ownerId) {
  sceneOwners.add(ownerId);
  if (!sharedScene) sharedScene = new TranscriptionJester(ensureHost());
  return sharedScene;
}

window.transcriptionJesterCreate = function transcriptionJesterCreate(ownerId) {
  ensureScene(ownerId || 'flutter');
};

window.transcriptionJesterDestroy = function transcriptionJesterDestroy(ownerId) {
  sceneOwners.delete(ownerId || 'flutter');
  if (sceneOwners.size || !sharedScene) return;
  sharedScene.dispose();
  sharedScene = null;
};

window.transcriptionJesterSetSelectedCard = function transcriptionJesterSetSelectedCard(cardId, imagePath) {
  pendingSelectedCard = { cardId: String(cardId || ''), imagePath: String(imagePath || '') };
  if (sharedScene) sharedScene.setSelectedCard(pendingSelectedCard.cardId, pendingSelectedCard.imagePath);
};
