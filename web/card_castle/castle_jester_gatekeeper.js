import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export class CastleJesterGatekeeper {
  constructor({ scene, camera, renderer, modelUrl, onEnterRequested }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.modelUrl = modelUrl;
    this.onEnterRequested = onEnterRequested;

    this.root = new THREE.Group();
    this.root.position.set(0, 0, 10.8);
    this.root.rotation.y = Math.PI;
    this.root.visible = false;
    this.scene.add(this.root);

    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.elapsed = 0;
    this.hover = false;
    this.clicked = false;
    this.ready = false;
    this.enterDispatched = false;
    this.bones = new Map();
    this.base = new Map();

    this.load();
  }

  load() {
    new GLTFLoader().load(this.modelUrl, (gltf) => {
      this.model = gltf.scene;
      this.model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          object.userData.castleGatekeeper = true;
        }
        if (object.isBone) {
          const key = (object.name || '').toLowerCase();
          this.bones.set(key, object);
          this.base.set(object.uuid, {
            position: object.position.clone(),
            quaternion: object.quaternion.clone(),
          });
        }
      });

      const bounds = new THREE.Box3().setFromObject(this.model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      this.model.position.sub(center);
      this.model.position.y += size.y * 0.5;
      this.model.scale.setScalar(5.6 / Math.max(size.y, 0.001));
      this.root.add(this.model);
      this.root.visible = true;
      this.ready = true;
      document.body.dataset.castleJester = 'ready';
      document.body.dataset.castleJesterAnimations = String(gltf.animations.length);
    }, undefined, (error) => {
      document.body.dataset.castleJester = 'failed';
      document.body.dataset.castleJesterError = String(error?.message || error);
    });
  }

  findBone(...parts) {
    for (const [key, bone] of this.bones.entries()) {
      if (parts.every((part) => key.includes(part))) return bone;
    }
    return null;
  }

  resetPose() {
    for (const bone of this.bones.values()) {
      const base = this.base.get(bone.uuid);
      if (!base) continue;
      bone.position.copy(base.position);
      bone.quaternion.copy(base.quaternion);
    }
  }

  updateLoopPose() {
    this.resetPose();
    const t = this.elapsed % 10.0;
    const segment = (start, end) => smooth((t - start) / (end - start));
    const pulse = (start, peak, end) => segment(start, peak) * (1 - segment(peak, end));

    const head = this.findBone('head') || this.findBone('neck');
    const spine = this.findBone('spine');
    const hip = this.findBone('hip') || this.findBone('pelvis');
    const rightArm = this.findBone('right', 'arm') || this.findBone('r', 'arm');
    const rightForearm = this.findBone('right', 'fore') || this.findBone('right', 'lower');
    const leftArm = this.findBone('left', 'arm') || this.findBone('l', 'arm');
    const leftForearm = this.findBone('left', 'fore') || this.findBone('left', 'lower');

    if (head) {
      head.rotation.y += this.hover ? 0.26 : 0.10 * Math.sin(this.elapsed * 0.9);
      head.rotation.x += 0.05 * Math.sin(this.elapsed * 1.3);
    }
    if (spine) spine.rotation.z += 0.025 * Math.sin(this.elapsed * 1.7);

    const point = pulse(1.4, 2.0, 3.1);
    if (rightArm) {
      rightArm.rotation.x -= 1.05 * point;
      rightArm.rotation.z -= 0.28 * point;
    }
    if (rightForearm) rightForearm.rotation.x -= 0.34 * point;

    const beckon = pulse(3.0, 3.5, 4.7);
    if (rightArm) {
      rightArm.rotation.x -= 0.72 * beckon;
      rightArm.rotation.z -= 0.5 * beckon;
    }
    if (rightForearm) {
      rightForearm.rotation.x -= 0.75 * beckon * (0.65 + 0.35 * Math.sin(this.elapsed * 9));
    }

    const bow = pulse(4.6, 5.2, 6.1);
    if (spine) spine.rotation.x += 0.65 * bow;
    if (hip) hip.rotation.x += 0.22 * bow;

    const present = segment(6.0, 7.0) * (1 - segment(8.0, 9.4));
    this.root.rotation.y = Math.PI - 0.72 * present;
    if (leftArm) {
      leftArm.rotation.x -= 0.72 * present;
      leftArm.rotation.z += 0.9 * present;
    }
    if (leftForearm) leftForearm.rotation.x -= 0.22 * present;
  }

  update(deltaSeconds) {
    if (!this.ready) return;
    this.elapsed += Math.min(0.05, Math.max(0, deltaSeconds || 0));

    if (this.clicked) {
      const progress = clamp01((this.elapsed - this.clickStarted) / 1.35);
      const eased = smooth(progress);
      this.root.position.x = THREE.MathUtils.lerp(this.clickOriginX, 5.4, eased);
      this.root.rotation.y = THREE.MathUtils.lerp(this.clickOriginRotation, Math.PI * 0.68, eased);
      if (progress >= 1 && !this.enterDispatched) {
        this.enterDispatched = true;
        this.onEnterRequested?.();
      }
      return;
    }

    this.updateLoopPose();
  }

  hitTest(event) {
    if (!this.ready || this.clicked || !this.root.visible) return false;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObject(this.root, true)
      .some((hit) => hit.object.userData.castleGatekeeper === true);
  }

  setHover(event) {
    const active = this.hitTest(event);
    this.hover = active;
    document.body.dataset.castleJesterHover = active ? 'true' : 'false';
    return active;
  }

  click(event) {
    if (!this.hitTest(event)) return false;
    this.clicked = true;
    this.clickStarted = this.elapsed;
    this.clickOriginX = this.root.position.x;
    this.clickOriginRotation = this.root.rotation.y;
    document.body.dataset.castleJesterState = 'entering';
    return true;
  }

  setVisible(active) {
    this.root.visible = Boolean(active && this.ready);
  }

  dispose() {
    this.scene?.remove(this.root);
  }
}
