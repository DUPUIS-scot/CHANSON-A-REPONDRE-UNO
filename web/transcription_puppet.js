import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const MODEL_FACING_Y = -Math.PI / 2;
const JESTER_MODEL = new URL(
  'assets/assets/models/transcription_jester_rigged.glb',
  document.baseURI,
).href;
const PUPPET_CANVAS_ID = 'transcription-jester-puppet-canvas';

let puppet = null;
let requestedEnabled = false;
let pendingCard = null;

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const stageWidth = mobile ? Math.min(width * 0.90, 660) : Math.min(width * 0.66, 860);
  const stageHeight = mobile ? Math.min(height * 0.52, 560) : Math.min(height * 0.66, 700);
  return {
    left: (width - stageWidth) * 0.5,
    top: mobile ? Math.max(34, height * 0.07) : Math.max(20, height * 0.035),
    width: stageWidth,
    height: stageHeight,
  };
}

function assetUrl(path) {
  if (!path) return null;
  const raw = String(path).trim();
  if (/^data:/i.test(raw)) return raw;
  try {
    const parsed = new URL(raw, document.baseURI);
    if (/^https?:/i.test(raw)) return parsed.href;
  } catch (_) {}
  const normalized = raw.replace(/^\/+/, '');
  if (normalized.startsWith('assets/assets/')) return new URL(normalized, document.baseURI).href;
  if (normalized.startsWith('share-previews/')) return new URL(`assets/${normalized}`, document.baseURI).href;
  if (normalized.startsWith('assets/')) return new URL(`assets/${normalized}`, document.baseURI).href;
  return new URL(`assets/${normalized}`, document.baseURI).href;
}

function originalCanvases() {
  return [...document.querySelectorAll('[data-transcription-jester-canvas="true"]')]
    .filter((element) => element.id !== PUPPET_CANVAS_ID);
}

function setOriginalVisible(visible) {
  for (const element of originalCanvases()) {
    element.style.visibility = visible ? 'visible' : 'hidden';
  }
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

function normalizeBoneName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function chooseBone(bones, tests) {
  for (const test of tests) {
    const found = bones.find((bone) => test(normalizeBoneName(bone.name)));
    if (found) return found;
  }
  return null;
}

function discoverBones(model) {
  const bones = [];
  model.traverse((object) => {
    if (object.isBone) bones.push(object);
  });
  const all = (...parts) => (name) => parts.every((part) => name.includes(part));
  const ends = (...parts) => (name) => parts.some((part) => name.endsWith(part));
  return {
    all: bones,
    head: chooseBone(bones, [ends('head'), all('head')]),
    chest: chooseBone(bones, [all('upperchest'), all('spine2'), all('chest'), all('spine1'), all('spine')]),
    leftUpperArm: chooseBone(bones, [all('left', 'upperarm'), all('left', 'arm'), ends('upperarml', 'arml')]),
    rightUpperArm: chooseBone(bones, [all('right', 'upperarm'), all('right', 'arm'), ends('upperarmr', 'armr')]),
    leftForeArm: chooseBone(bones, [all('left', 'forearm'), all('left', 'lowerarm'), ends('forearml', 'lowerarml')]),
    rightForeArm: chooseBone(bones, [all('right', 'forearm'), all('right', 'lowerarm'), ends('forearmr', 'lowerarmr')]),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function interactiveUiTarget(target) {
  return target instanceof Element && Boolean(target.closest(
    'button, a, input, textarea, select, [role="button"], [role="link"]',
  ));
}

class TranscriptionPuppet {
  constructor() {
    this.disposed = false;
    this.frame = 0;
    this.drags = new Map();
    this.restRotations = new Map();
    this.cardLoadSerial = 0;
    this.selectedCard = pendingCard;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(31, 1, 0.01, 200);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));

    this.canvas = this.renderer.domElement;
    this.canvas.id = PUPPET_CANVAS_ID;
    this.canvas.dataset.transcriptionJesterCanvas = 'true';
    this.canvas.dataset.transcriptionPuppet = 'true';
    this.canvas.dataset.puppetInteraction = 'dual-arm-independent';
    this.canvas.setAttribute('aria-hidden', 'true');
    Object.assign(this.canvas.style, {
      display: 'block',
      position: 'fixed',
      pointerEvents: 'none',
      background: 'transparent',
      zIndex: '2',
      opacity: '1',
      filter: 'drop-shadow(0 18px 24px rgba(0,0,0,.78))',
      transform: 'translateZ(0)',
    });
    document.body.appendChild(this.canvas);

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

    this.onResize = () => this.resize();
    this.onPointerDown = (event) => this.pointerDown(event);
    this.onPointerMove = (event) => this.pointerMove(event);
    this.onPointerUp = (event) => this.pointerUp(event);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    window.addEventListener('pointerdown', this.onPointerDown, true);
    window.addEventListener('pointermove', this.onPointerMove, true);
    window.addEventListener('pointerup', this.onPointerUp, true);
    window.addEventListener('pointercancel', this.onPointerUp, true);

    this.resize();
    this.loadModel();
  }

  loadModel() {
    new GLTFLoader().load(JESTER_MODEL, (gltf) => {
      if (this.disposed) return disposeObject(gltf.scene);
      this.model = gltf.scene;
      this.model.traverse((object) => {
        object.visible = true;
        if (!object.isMesh) return;
        if (!object.geometry.getAttribute('normal')) object.geometry.computeVertexNormals();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          material.side = THREE.DoubleSide;
          material.transparent = false;
          material.opacity = 1;
          material.depthWrite = true;
          material.needsUpdate = true;
        });
      });

      this.model.updateMatrixWorld(true);
      const sourceBounds = new THREE.Box3().setFromObject(this.model);
      const size = sourceBounds.getSize(new THREE.Vector3());
      const center = sourceBounds.getCenter(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
      this.model.position.sub(center);
      this.model.scale.setScalar(5.1 / maxDimension);
      this.model.position.set(-0.16, 0.04, 0);
      this.pivot.add(this.model);
      this.pivot.updateMatrixWorld(true);

      if (gltf.animations?.length) {
        this.mixer = new THREE.AnimationMixer(this.model);
        const idle = gltf.animations.find((clip) => /idle|breath|stand/i.test(clip.name)) || gltf.animations[0];
        const action = this.mixer.clipAction(idle);
        action.reset().play();
        this.mixer.setTime(Math.min(idle.duration * 0.16, 0.35));
        action.paused = true;
      }

      this.bones = discoverBones(this.model);
      for (const bone of this.bones.all) this.restRotations.set(bone, bone.rotation.clone());
      this.fitCamera();
      this.attachCardMesh();
      this.canvas.dataset.puppetBones = String(this.bones.all.length);
      this.canvas.dataset.puppetLeftArm = this.bones.leftUpperArm?.name || '';
      this.canvas.dataset.puppetRightArm = this.bones.rightUpperArm?.name || '';
      this.canvas.dataset.puppetCardMesh = 'ready';
      this.canvas.dataset.puppetReady = 'true';
      this.resume();
    }, undefined, (error) => {
      this.canvas.dataset.puppetReady = 'failed';
      this.canvas.dataset.puppetError = String(error?.message || error);
      setOriginalVisible(true);
      console.error('Unable to load transcription puppet jester.', error);
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
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(this.camera.aspect, 0.2));
    const verticalDistance = (Math.max(size.y * 0.72, 0.5) * 0.5) / Math.tan(verticalFov * 0.5);
    const horizontalDistance = (Math.max(size.x * 1.12, 0.5) * 0.5) / Math.tan(Math.max(horizontalFov, 0.2) * 0.5);
    const distance = Math.max(verticalDistance, horizontalDistance, 4.4) * 1.16;
    this.camera.position.set(target.x, target.y, target.z + distance);
    this.camera.near = Math.max(0.01, distance / 100);
    this.camera.far = Math.max(100, distance * 20);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
  }

  createCardMesh() {
    if (this.cardAnchor) {
      this.scene.remove(this.cardAnchor);
      disposeObject(this.cardAnchor);
    }
    const anchor = new THREE.Group();
    anchor.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.93, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1c0e08, roughness: 0.68, metalness: 0.08 }),
    ));
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.87),
      new THREE.MeshBasicMaterial({ color: 0x7b241d, side: THREE.DoubleSide, toneMapped: false }),
    );
    face.position.z = 0.028;
    anchor.add(face);
    this.cardAnchor = anchor;
    this.cardFace = face;
    this.scene.add(anchor);
    this.positionCardMesh();
  }

  positionCardMesh() {
    if (!this.cardAnchor) return;
    const bounds = this.modelBounds();
    if (!bounds) return;
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    this.cardAnchor.position.set(
      center.x + size.x * 0.24,
      bounds.min.y + size.y * 0.68,
      bounds.max.z + Math.max(size.z * 0.06, 0.14),
    );
    this.cardAnchor.lookAt(this.camera.position);
    this.cardAnchor.rotation.z = 0.045;
  }

  attachCardMesh() {
    if (!this.model) return;
    this.createCardMesh();
    const card = this.selectedCard || pendingCard;
    if (!card?.imagePath) {
      this.canvas.dataset.puppetCardTexture = 'fallback';
      return;
    }
    const imageUrl = assetUrl(card.imagePath);
    const serial = ++this.cardLoadSerial;
    this.canvas.dataset.puppetCardId = card.cardId || '';
    this.canvas.dataset.puppetCardTexture = 'loading';
    new THREE.TextureLoader().load(imageUrl, (texture) => {
      if (this.disposed || serial !== this.cardLoadSerial || !this.cardFace) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      const previous = this.cardFace.material;
      this.cardFace.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
      disposeMaterial(previous);
      this.canvas.dataset.puppetCardTexture = 'ready';
    }, undefined, () => {
      if (serial === this.cardLoadSerial) this.canvas.dataset.puppetCardTexture = 'failed-fallback-visible';
    });
  }

  setSelectedCard(cardId, imagePath) {
    this.selectedCard = { cardId: String(cardId || ''), imagePath: String(imagePath || '') };
    if (this.model) this.attachCardMesh();
  }

  resize() {
    const rect = stageRect();
    Object.assign(this.canvas.style, {
      left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    });
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
    this.camera.aspect = rect.width / Math.max(rect.height, 1);
    this.camera.fov = rect.width < 560 ? 35 : 31;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
    this.positionCardMesh();
  }

  containsPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
  }

  targetForPointer(event) {
    if (!this.bones) return { kind: 'body', bone: null, secondaryBone: null };
    const rect = this.canvas.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
    if (y < 0.31 && x > 0.30 && x < 0.70 && this.bones.head) {
      return { kind: 'head', bone: this.bones.head, secondaryBone: null };
    }
    if (x < 0.47 && y < 0.76 && this.bones.leftUpperArm) {
      return { kind: 'leftArm', bone: this.bones.leftUpperArm, secondaryBone: this.bones.leftForeArm };
    }
    if (x > 0.53 && y < 0.76 && this.bones.rightUpperArm) {
      return { kind: 'rightArm', bone: this.bones.rightUpperArm, secondaryBone: this.bones.rightForeArm };
    }
    if (this.bones.chest) return { kind: 'torso', bone: this.bones.chest, secondaryBone: null };
    return { kind: 'body', bone: null, secondaryBone: null };
  }

  refreshTargets() {
    this.canvas.dataset.puppetTargets = [...this.drags.values()].map((drag) => drag.kind).join('|');
  }

  pointerDown(event) {
    if (!this.model || event.button > 0 || !this.containsPointer(event)) return;
    if (interactiveUiTarget(event.target) || event.clientY < 108) return;
    const target = this.targetForPointer(event);
    if ((target.kind === 'leftArm' || target.kind === 'rightArm') &&
        [...this.drags.values()].some((drag) => drag.kind === target.kind)) return;
    const bone = target.bone;
    const secondaryBone = target.secondaryBone;
    this.drags.set(event.pointerId, {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      kind: target.kind,
      bone,
      secondaryBone,
      boneRotation: bone?.rotation.clone() || null,
      secondaryRotation: secondaryBone?.rotation.clone() || null,
      bodyY: this.pivot.rotation.y,
      bodyZ: this.pivot.rotation.z,
    });
    this.refreshTargets();
  }

  pointerMove(event) {
    const drag = this.drags.get(event.pointerId);
    if (!drag) return;
    if (event.cancelable) event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const dx = (event.clientX - drag.startX) / Math.max(rect.width, 1);
    const dy = (event.clientY - drag.startY) / Math.max(rect.height, 1);
    const strength = Math.PI * 1.35;

    if (drag.kind === 'head' && drag.bone) {
      drag.bone.rotation.copy(drag.boneRotation);
      drag.bone.rotation.y += clamp(dx * strength, -0.75, 0.75);
      drag.bone.rotation.x += clamp(dy * strength, -0.48, 0.48);
      return;
    }
    if ((drag.kind === 'leftArm' || drag.kind === 'rightArm') && drag.bone) {
      drag.bone.rotation.copy(drag.boneRotation);
      const side = drag.kind === 'leftArm' ? 1 : -1;
      drag.bone.rotation.z += side * clamp(-dy * strength, -1.2, 1.2);
      drag.bone.rotation.x += clamp(dx * strength * 0.76, -0.9, 0.9);
      drag.bone.rotation.y += side * clamp(dx * strength * 0.28, -0.38, 0.38);
      if (drag.secondaryBone && drag.secondaryRotation) {
        drag.secondaryBone.rotation.copy(drag.secondaryRotation);
        drag.secondaryBone.rotation.x += clamp(-dy * strength * 0.42, -0.7, 0.7);
        drag.secondaryBone.rotation.z += side * clamp(dx * strength * 0.34, -0.48, 0.48);
      }
      return;
    }
    if (drag.kind === 'torso' && drag.bone) {
      drag.bone.rotation.copy(drag.boneRotation);
      drag.bone.rotation.y += clamp(dx * strength * 0.72, -0.65, 0.65);
      drag.bone.rotation.z += clamp(-dy * strength * 0.38, -0.38, 0.38);
      return;
    }
    this.pivot.rotation.y = drag.bodyY + clamp(dx * Math.PI, -0.8, 0.8);
    this.pivot.rotation.z = drag.bodyZ + clamp(-dy * 0.55, -0.25, 0.25);
  }

  pointerUp(event) {
    if (!this.drags.has(event.pointerId)) return;
    this.drags.delete(event.pointerId);
    this.refreshTargets();
  }

  resetPose() {
    this.drags.clear();
    for (const [bone, rotation] of this.restRotations.entries()) bone.rotation.copy(rotation);
    this.pivot.rotation.set(0, MODEL_FACING_Y, 0);
    this.pivot.position.set(0, 0, 0);
    this.positionCardMesh();
    this.refreshTargets();
  }

  tick = () => {
    if (this.disposed || document.hidden) return;
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  resume() {
    if (this.disposed || this.frame || document.hidden) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    this.cardLoadSerial += 1;
    if (this.frame) cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
    window.removeEventListener('pointercancel', this.onPointerUp, true);
    this.mixer?.stopAllAction();
    disposeObject(this.cardAnchor);
    disposeObject(this.model);
    this.renderer.dispose();
    this.canvas.remove();
  }
}

function enablePuppet() {
  if (puppet) return;
  setOriginalVisible(false);
  puppet = new TranscriptionPuppet();
}

function disablePuppet() {
  puppet?.dispose();
  puppet = null;
  setOriginalVisible(true);
}

window.transcriptionPuppetSetEnabled = function transcriptionPuppetSetEnabled(enabled) {
  requestedEnabled = Boolean(enabled);
  if (requestedEnabled) enablePuppet();
  else disablePuppet();
};

window.transcriptionPuppetSetCard = function transcriptionPuppetSetCard(cardId, imagePath) {
  pendingCard = { cardId: String(cardId || ''), imagePath: String(imagePath || '') };
  puppet?.setSelectedCard(pendingCard.cardId, pendingCard.imagePath);
};

window.transcriptionPuppetReset = function transcriptionPuppetReset() {
  puppet?.resetPose();
};

window.addEventListener('pagehide', () => {
  if (puppet) disablePuppet();
});
