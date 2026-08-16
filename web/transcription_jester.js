import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const AUTO_SCENE_ID = 'transcription-jester-route-auto';
const MODEL_FACING_Y = -Math.PI / 2;
const JESTER_MODEL = new URL(
  'assets/assets/models/transcription_jester_rigged.glb',
  document.baseURI,
).href;

let sharedScene = null;
const sceneOwners = new Set();
let pendingSelectedCard = null;

function routeText() {
  return decodeURIComponent(`${window.location.pathname || ''}${window.location.hash || ''}`);
}

function currentCardId() {
  return routeText().match(/\/cards\/([^/?#]+)\/transcription(?:[/?#]|$)/i)?.[1] || null;
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
  const raw = String(path).trim();
  if (/^data:/i.test(raw)) return raw;

  try {
    const parsed = new URL(raw, document.baseURI);
    if (parsed.origin === window.location.origin) {
      const normalizedPath = parsed.pathname.replace(/^\/+/, '');
      if (normalizedPath.startsWith('assets/assets/')) {
        return new URL(normalizedPath, document.baseURI).href;
      }
      if (normalizedPath.startsWith('assets/')) {
        return new URL(`assets/${normalizedPath}`, document.baseURI).href;
      }
    }
    if (/^https?:/i.test(raw)) return parsed.href;
  } catch (_) {
    // Fall through to asset-key normalization below.
  }

  const normalized = raw.replace(/^\/+/, '');
  if (normalized.startsWith('assets/assets/')) {
    return new URL(normalized, document.baseURI).href;
  }
  if (normalized.startsWith('assets/')) {
    return new URL(`assets/${normalized}`, document.baseURI).href;
  }
  return new URL(`assets/${normalized}`, document.baseURI).href;
}

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const stageWidth = mobile ? Math.min(viewportWidth * 0.90, 660) : Math.min(viewportWidth * 0.66, 860);
  const stageHeight = mobile ? Math.min(viewportHeight * 0.52, 560) : Math.min(viewportHeight * 0.66, 700);
  return {
    left: (viewportWidth - stageWidth) * 0.5,
    top: mobile ? Math.max(34, viewportHeight * 0.07) : Math.max(20, viewportHeight * 0.035),
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
    this.cardLoadSerial = 0;
    this.host.dataset.transcriptionJester = 'loading';
    this.host.dataset.sourceModel = 'assets/models/transcription_jester_rigged.glb';
    this.host.dataset.framing = 'reference-card-presentation-cross-platform';
    if (this.selectedCardId) this.host.dataset.selectedCardId = this.selectedCardId;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(31, 1, 0.01, 200);
    this.camera.position.set(0, 1, 8);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    Object.assign(this.renderer.domElement.style, {
      display: 'block', position: 'fixed', pointerEvents: 'none', background: 'transparent',
      zIndex: '2', opacity: '1',
      filter: 'drop-shadow(0 18px 24px rgba(0,0,0,.78))', transform: 'translateZ(0)',
    });
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.dataset.transcriptionJesterCanvas = 'true';
    document.body.appendChild(this.renderer.domElement);

    this.pivot = new THREE.Group();
    this.pivot.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.pivot);
    this.scene.add(new THREE.HemisphereLight(0xffe5bd, 0x160607, 3.8));
    const key = new THREE.DirectionalLight(0xffb35b, 6.8);
    key.position.set(-3.2, 5.5, 6.2);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 2.4);
    fill.position.set(3.5, 2.2, 5.5);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xc51e16, 3.6);
    rim.position.set(4.5, 3.5, -2.5);
    this.scene.add(rim);

    this.onWindowResize = () => this.resize();
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', this.onWindowResize);
    this.resize();
    this.loadModel();
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
      this.model.scale.setScalar(5.1 / maxDimension);
      this.model.position.set(-0.16, 0.04, 0);
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
      this.host.dataset.behavior = 'reference-framed-jester-selected-card-right-hand-cross-platform';
      this.resume();
    }, undefined, (error) => {
      this.host.dataset.transcriptionJester = 'failed';
      this.host.dataset.modelError = String(error?.message || error);
      console.error('Unable to load transcription_jester_rigged.glb.', error);
    });
  }

  modelBounds() {
    if (!this.model) return null;
    this.pivot.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.pivot);
  }

  fitCamera() {
    const bounds = this.modelBounds();
    if (!bounds) return;
    const size = bounds.getSize(new THREE.Vector3());
    const target = new THREE.Vector3(
      (bounds.min.x + bounds.max.x) * 0.5 + size.x * 0.03,
      bounds.min.y + size.y * 0.69,
      (bounds.min.z + bounds.max.z) * 0.5,
    );
    const visibleHeight = Math.max(size.y * 0.72, 0.5);
    const visibleWidth = Math.max(size.x * 1.12, 0.5);
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(this.camera.aspect, 0.2));
    const verticalDistance = (visibleHeight * 0.5) / Math.tan(verticalFov * 0.5);
    const horizontalDistance = (visibleWidth * 0.5) / Math.tan(Math.max(horizontalFov, 0.2) * 0.5);
    const distance = Math.max(verticalDistance, horizontalDistance, 4.4) * 1.16;
    this.camera.position.set(target.x, target.y, target.z + distance);
    this.camera.near = Math.max(0.01, distance / 100);
    this.camera.far = Math.max(100, distance * 20);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
  }

  positionCardAnchor() {
    if (!this.cardAnchor) return;
    const bounds = this.modelBounds();
    if (!bounds) return;
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    this.cardAnchor.position.set(
      center.x + size.x * 0.24,
      bounds.min.y + size.y * 0.72,
      bounds.max.z + Math.max(size.z * 0.06, 0.14),
    );
    this.cardAnchor.lookAt(this.camera.position);
    this.cardAnchor.rotation.z = 0.035;
  }

  createFallbackCard() {
    if (this.cardAnchor) {
      this.scene.remove(this.cardAnchor);
      disposeObject(this.cardAnchor);
      this.cardAnchor = null;
      this.cardFace = null;
    }

    const anchor = new THREE.Group();
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.81, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x211008, roughness: 0.72 }),
    );
    anchor.add(backing);

    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0x7b241d,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.75), faceMaterial);
    card.position.z = 0.027;
    anchor.add(card);

    this.cardAnchor = anchor;
    this.cardFace = card;
    this.scene.add(anchor);
    this.positionCardAnchor();
    this.host.dataset.selectedCard = 'held-in-right-hand';
    this.host.dataset.selectedCardTexture = 'fallback';
    this.host.dataset.selectedCardAnchor = 'scene-space-reference-right-hand';
  }

  applyCardTexture(texture, imageUrl, serial) {
    if (this.disposed || serial !== this.cardLoadSerial) return texture.dispose();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = true;
    texture.needsUpdate = true;
    if (!this.cardFace) return texture.dispose();
    const oldMaterial = this.cardFace.material;
    this.cardFace.material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    disposeMaterial(oldMaterial);
    this.host.dataset.selectedCard = 'held-in-right-hand';
    this.host.dataset.selectedCardImage = imageUrl;
    this.host.dataset.selectedCardTexture = 'ready';
  }

  loadTextureDirect(imageUrl, serial) {
    new THREE.TextureLoader().load(imageUrl, (texture) => {
      this.applyCardTexture(texture, imageUrl, serial);
    }, undefined, (error) => {
      if (serial !== this.cardLoadSerial) return;
      this.host.dataset.selectedCard = 'held-in-right-hand-fallback';
      this.host.dataset.selectedCardTexture = 'failed-fallback-visible';
      console.warn('Unable to load selected card texture.', { imageUrl, error });
    });
  }

  drawSourceToTexture(source, width, height, imageUrl, serial, decodeMode) {
    if (this.disposed || serial !== this.cardLoadSerial) {
      source.close?.();
      return;
    }
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(width || 1, height || 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((width || 1) * scale));
    canvas.height = Math.max(1, Math.round((height || 1) * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      source.close?.();
      this.loadTextureDirect(imageUrl, serial);
      return;
    }
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    source.close?.();
    const texture = new THREE.CanvasTexture(canvas);
    this.applyCardTexture(texture, imageUrl, serial);
    this.host.dataset.selectedCardDecode = decodeMode;
  }

  loadTextureViaImageElement(imageUrl, serial) {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      this.drawSourceToTexture(
        image,
        image.naturalWidth || 1,
        image.naturalHeight || 1,
        imageUrl,
        serial,
        'html-image-canvas',
      );
    };
    image.onerror = (error) => {
      if (serial !== this.cardLoadSerial) return;
      this.host.dataset.selectedCardDecode = 'html-image-failed';
      console.warn('HTML image decode failed; retrying Three.js loader.', { imageUrl, error });
      this.loadTextureDirect(imageUrl, serial);
    };
    image.src = imageUrl;
  }

  async loadTextureViaImageBitmap(imageUrl, serial) {
    if (typeof createImageBitmap !== 'function') {
      this.loadTextureViaImageElement(imageUrl, serial);
      return;
    }
    try {
      const response = await fetch(imageUrl, { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (this.disposed || serial !== this.cardLoadSerial) return;
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: 'from-image',
        resizeWidth: 600,
        resizeHeight: 900,
        resizeQuality: 'high',
      });
      this.drawSourceToTexture(bitmap, bitmap.width, bitmap.height, imageUrl, serial, 'image-bitmap-canvas');
    } catch (error) {
      if (serial !== this.cardLoadSerial) return;
      this.host.dataset.selectedCardDecode = 'image-bitmap-failed';
      console.warn('createImageBitmap decode failed; retrying HTML image.', { imageUrl, error });
      this.loadTextureViaImageElement(imageUrl, serial);
    }
  }

  loadSelectedCardTexture(imageUrl, serial) {
    this.host.dataset.selectedCardDecode = 'image-bitmap-loading';
    this.loadTextureViaImageBitmap(imageUrl, serial);
  }

  attachSelectedCard() {
    const imageUrl = flutterAssetUrl(this.selectedCardImage);
    if (this.disposed) return;
    this.createFallbackCard();
    const serial = ++this.cardLoadSerial;
    if (!imageUrl) {
      this.host.dataset.selectedCardImage = '';
      this.host.dataset.selectedCardTexture = 'fallback-no-image';
      return;
    }
    this.host.dataset.selectedCardImage = imageUrl;
    this.host.dataset.selectedCardResolvedUrl = imageUrl;
    this.host.dataset.selectedCardTexture = 'loading';
    this.loadSelectedCardTexture(imageUrl, serial);
  }

  setSelectedCard(cardId, imagePath) {
    const nextId = cardId || null;
    const nextImage = imagePath || null;
    const changed = nextId !== this.selectedCardId || nextImage !== this.selectedCardImage;
    this.selectedCardId = nextId;
    this.selectedCardImage = nextImage;
    if (this.selectedCardId) this.host.dataset.selectedCardId = this.selectedCardId;
    if (this.model && (changed || !this.cardAnchor)) this.attachSelectedCard();
  }

  resize() {
    const rect = stageRect();
    Object.assign(this.renderer.domElement.style, {
      left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    });
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.fov = rect.width < 560 ? 35 : 31;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
    this.positionCardAnchor();
  }

  update(time) {
    if (!this.model) return;
    const delta = this.clock.getDelta();
    this.mixer?.update(delta);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.12 : 1;
    this.pivot.rotation.y = MODEL_FACING_Y + Math.sin(time * 0.55) * 0.014 * amount;
    this.pivot.rotation.z = Math.sin(time * 0.8) * 0.006 * amount;
    this.pivot.position.y = Math.sin(time * 0.7) * 0.010 * amount;
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
    this.cardLoadSerial += 1;
    if (this.frame) cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('orientationchange', this.onWindowResize);
    this.mixer?.stopAllAction();
    disposeObject(this.cardAnchor);
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
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