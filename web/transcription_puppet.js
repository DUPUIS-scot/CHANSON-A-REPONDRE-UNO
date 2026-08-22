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

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const stageWidth = mobile
    ? Math.min(viewportWidth * 0.90, 660)
    : Math.min(viewportWidth * 0.66, 860);
  const stageHeight = mobile
    ? Math.min(viewportHeight * 0.52, 560)
    : Math.min(viewportHeight * 0.66, 700);
  return {
    left: (viewportWidth - stageWidth) * 0.5,
    top: mobile
      ? Math.max(34, viewportHeight * 0.07)
      : Math.max(20, viewportHeight * 0.035),
    width: stageWidth,
    height: stageHeight,
  };
}

function originalCanvases() {
  return [...document.querySelectorAll(
    '[data-transcription-jester-canvas="true"]',
  )].filter((element) => element.id !== PUPPET_CANVAS_ID);
}

function setOriginalVisible(visible) {
  for (const canvas of originalCanvases()) {
    canvas.style.visibility = visible ? 'visible' : 'hidden';
  }
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
    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(object.material);
    }
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

  const containsAll = (...parts) =>
    (name) => parts.every((part) => name.includes(part));
  const endsWith = (...parts) =>
    (name) => parts.some((part) => name.endsWith(part));

  const head = chooseBone(bones, [
    endsWith('head'),
    containsAll('head'),
  ]);
  const chest = chooseBone(bones, [
    containsAll('upperchest'),
    containsAll('spine2'),
    containsAll('chest'),
    containsAll('spine1'),
    containsAll('spine'),
  ]);
  const leftUpperArm = chooseBone(bones, [
    containsAll('left', 'upperarm'),
    containsAll('left', 'arm'),
    endsWith('upperarml', 'arml'),
  ]);
  const rightUpperArm = chooseBone(bones, [
    containsAll('right', 'upperarm'),
    containsAll('right', 'arm'),
    endsWith('upperarmr', 'armr'),
  ]);
  const leftForeArm = chooseBone(bones, [
    containsAll('left', 'forearm'),
    containsAll('left', 'lowerarm'),
    endsWith('forearml', 'lowerarml'),
  ]);
  const rightForeArm = chooseBone(bones, [
    containsAll('right', 'forearm'),
    containsAll('right', 'lowerarm'),
    endsWith('forearmr', 'lowerarmr'),
  ]);

  return {
    all: bones,
    head,
    chest,
    leftUpperArm,
    rightUpperArm,
    leftForeArm,
    rightForeArm,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isInteractiveUiTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(
    'button, a, input, textarea, select, [role="button"], [role="link"]',
  ));
}

class TranscriptionPuppet {
  constructor() {
    this.disposed = false;
    this.frame = 0;
    this.drag = null;
    this.bones = null;
    this.restRotations = new Map();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(31, 1, 0.01, 200);
    this.camera.position.set(0, 1, 8);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));

    const canvas = this.renderer.domElement;
    canvas.id = PUPPET_CANVAS_ID;
    canvas.dataset.transcriptionJesterCanvas = 'true';
    canvas.dataset.transcriptionPuppet = 'true';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      display: 'block',
      position: 'fixed',
      pointerEvents: 'none',
      background: 'transparent',
      zIndex: '2',
      opacity: '1',
      filter: 'drop-shadow(0 18px 24px rgba(0,0,0,.78))',
      transform: 'translateZ(0)',
    });
    document.body.appendChild(canvas);

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
    new GLTFLoader().load(
      JESTER_MODEL,
      (gltf) => {
        if (this.disposed) {
          disposeObject(gltf.scene);
          return;
        }
        this.model = gltf.scene;
        this.model.traverse((object) => {
          object.visible = true;
          if (!object.isMesh) return;
          if (!object.geometry.getAttribute('normal')) {
            object.geometry.computeVertexNormals();
          }
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.filter(Boolean).forEach((material) => {
            material.side = THREE.DoubleSide;
            material.transparent = false;
            material.opacity = 1;
            material.depthWrite = true;
            material.needsUpdate = true;
          });
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
          const idle = gltf.animations.find(
            (clip) => /idle|breath|stand/i.test(clip.name),
          ) || gltf.animations[0];
          const action = this.mixer.clipAction(idle);
          action.reset().play();
          this.mixer.setTime(Math.min(idle.duration * 0.16, 0.35));
          action.paused = true;
        }

        this.bones = discoverBones(this.model);
        for (const bone of this.bones.all) {
          this.restRotations.set(bone, bone.rotation.clone());
        }

        this.fitCamera();
        this.renderer.domElement.dataset.puppetBones = String(this.bones.all.length);
        this.renderer.domElement.dataset.puppetHead = this.bones.head?.name || '';
        this.renderer.domElement.dataset.puppetChest = this.bones.chest?.name || '';
        this.renderer.domElement.dataset.puppetLeftArm = this.bones.leftUpperArm?.name || '';
        this.renderer.domElement.dataset.puppetRightArm = this.bones.rightUpperArm?.name || '';
        this.renderer.domElement.dataset.puppetReady = 'true';
        this.resume();
      },
      undefined,
      (error) => {
        this.renderer.domElement.dataset.puppetReady = 'failed';
        this.renderer.domElement.dataset.puppetError = String(error?.message || error);
        setOriginalVisible(true);
        console.error('Unable to load transcription puppet jester.', error);
      },
    );
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
    const horizontalFov = 2 * Math.atan(
      Math.tan(verticalFov / 2) * Math.max(this.camera.aspect, 0.2),
    );
    const verticalDistance =
      (visibleHeight * 0.5) / Math.tan(verticalFov * 0.5);
    const horizontalDistance =
      (visibleWidth * 0.5) / Math.tan(Math.max(horizontalFov, 0.2) * 0.5);
    const distance = Math.max(verticalDistance, horizontalDistance, 4.4) * 1.16;
    this.camera.position.set(target.x, target.y, target.z + distance);
    this.camera.near = Math.max(0.01, distance / 100);
    this.camera.far = Math.max(100, distance * 20);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
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
    this.camera.aspect = rect.width / Math.max(rect.height, 1);
    this.camera.fov = rect.width < 560 ? 35 : 31;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
  }

  containsPointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
  }

  targetForPointer(event) {
    if (!this.bones) return { kind: 'body', bone: null };
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);

    if (y < 0.31 && x > 0.30 && x < 0.70 && this.bones.head) {
      return { kind: 'head', bone: this.bones.head };
    }
    if (x < 0.42 && y < 0.72 && this.bones.leftUpperArm) {
      return { kind: 'leftArm', bone: this.bones.leftUpperArm };
    }
    if (x > 0.58 && y < 0.72 && this.bones.rightUpperArm) {
      return { kind: 'rightArm', bone: this.bones.rightUpperArm };
    }
    if (this.bones.chest) {
      return { kind: 'torso', bone: this.bones.chest };
    }
    return { kind: 'body', bone: null };
  }

  pointerDown(event) {
    if (!this.model || event.button > 0 || !this.containsPointer(event)) return;
    if (isInteractiveUiTarget(event.target)) return;
    // Keep the top navigation/puppet controls clickable even when Flutter's
    // renderer reports the glass pane rather than a semantic button target.
    if (event.clientY < 108) return;

    const target = this.targetForPointer(event);
    const bone = target.bone;
    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      kind: target.kind,
      bone,
      boneRotation: bone?.rotation.clone() || null,
      bodyY: this.pivot.rotation.y,
      bodyZ: this.pivot.rotation.z,
    };
    this.renderer.domElement.dataset.puppetTarget = target.kind;
  }

  pointerMove(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    if (event.cancelable) event.preventDefault();
    const rect = this.renderer.domElement.getBoundingClientRect();
    const dx = (event.clientX - this.drag.startX) / Math.max(rect.width, 1);
    const dy = (event.clientY - this.drag.startY) / Math.max(rect.height, 1);
    const strength = Math.PI * 1.35;

    if (this.drag.kind === 'head' && this.drag.bone) {
      this.drag.bone.rotation.copy(this.drag.boneRotation);
      this.drag.bone.rotation.y += clamp(dx * strength, -0.75, 0.75);
      this.drag.bone.rotation.x += clamp(dy * strength, -0.48, 0.48);
    } else if (
      (this.drag.kind === 'leftArm' || this.drag.kind === 'rightArm') &&
      this.drag.bone
    ) {
      this.drag.bone.rotation.copy(this.drag.boneRotation);
      const side = this.drag.kind === 'leftArm' ? 1 : -1;
      this.drag.bone.rotation.z += side * clamp(-dy * strength, -1.15, 1.15);
      this.drag.bone.rotation.x += clamp(dx * strength * 0.72, -0.85, 0.85);
      this.drag.bone.rotation.y += side * clamp(dx * strength * 0.25, -0.35, 0.35);
    } else if (this.drag.kind === 'torso' && this.drag.bone) {
      this.drag.bone.rotation.copy(this.drag.boneRotation);
      this.drag.bone.rotation.y += clamp(dx * strength * 0.72, -0.65, 0.65);
      this.drag.bone.rotation.z += clamp(-dy * strength * 0.38, -0.38, 0.38);
    } else {
      this.pivot.rotation.y = this.drag.bodyY + clamp(dx * Math.PI, -0.8, 0.8);
      this.pivot.rotation.z = this.drag.bodyZ + clamp(-dy * 0.55, -0.25, 0.25);
    }
  }

  pointerUp(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.drag = null;
    this.renderer.domElement.dataset.puppetTarget = '';
  }

  resetPose() {
    for (const [bone, rotation] of this.restRotations.entries()) {
      bone.rotation.copy(rotation);
    }
    this.pivot.rotation.set(0, MODEL_FACING_Y, 0);
    this.pivot.position.set(0, 0, 0);
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
    if (this.frame) cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
    window.removeEventListener('pointercancel', this.onPointerUp, true);
    this.mixer?.stopAllAction();
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
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

window.transcriptionPuppetReset = function transcriptionPuppetReset() {
  puppet?.resetPose();
};

window.addEventListener('pagehide', () => {
  if (puppet) disablePuppet();
});
