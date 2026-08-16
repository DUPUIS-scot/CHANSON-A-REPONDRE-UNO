import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const scenes = new Map();
const MODEL_URL = new URL(
  'assets/assets/models/jester_player.glb',
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

class TranscriptionJester {
  constructor(host) {
    this.host = host;
    this.host.dataset.transcriptionJester = 'loading';
    this.visible = true;
    this.disposed = false;
    this.frame = 0;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    this.camera.position.set(0, 0.15, 9.2);
    this.camera.lookAt(0, 0.55, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.domElement.style.cssText =
      'display:block;width:100%;height:100%;pointer-events:none';
    host.appendChild(this.renderer.domElement);

    this.pivot = new THREE.Group();
    this.pivot.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.pivot);

    this.scene.add(new THREE.HemisphereLight(0xffd8aa, 0x12080b, 2.3));
    const key = new THREE.DirectionalLight(0xffa244, 4.5);
    key.position.set(-3.5, 5.0, 5.5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3a1a, 2.8);
    rim.position.set(4, 4, -3);
    this.scene.add(rim);
    const face = new THREE.PointLight(0xffcb72, 1.8, 8.0);
    face.position.set(0.4, 1.8, 4.0);
    this.scene.add(face);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.resume();
      else this.pause();
    });
    this.intersectionObserver.observe(host);
    this.onVisibility = () => {
      if (document.hidden) this.pause();
      else if (this.visible) this.resume();
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
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        const scale = 6.35 / Math.max(size.y, 0.001);
        this.model.scale.setScalar(scale);
        this.pivot.add(this.model);

        if (gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(this.model);
          this.clips = gltf.animations;
          const laughClip = gltf.animations.find((clip) => /laugh|giggle|chuckle|taunt/i.test(clip.name));
          const idleClip = gltf.animations.find((clip) => /idle/i.test(clip.name));
          this.idleAction = this.mixer.clipAction(idleClip || gltf.animations[0]);
          this.idleAction.play();
          if (laughClip) this.laughAction = this.mixer.clipAction(laughClip);
        }

        this.host.dataset.transcriptionJester = 'ready';
        this.host.dataset.modelAsset = MODEL_URL;
        this.host.dataset.modelAnimations = String(gltf.animations.length);
        this.host.dataset.behavior = 'arrogant-laugh-at-viewer';
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

  resize() {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = width < 500 ? 37 : 31;
    this.camera.updateProjectionMatrix();
  }

  update(time, delta) {
    this.mixer?.update(delta);
    if (!this.model) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.22 : 1;
    const cycle = (time % 5.8) / 5.8;
    const active = cycle > 0.13 && cycle < 0.80;
    const local = active ? (cycle - 0.13) / 0.67 : 0;
    const envelope = active ? Math.sin(Math.PI * local) : 0;
    const pulses = active
      ? Math.pow(Math.max(0, Math.sin(local * Math.PI * 7.0)), 1.7)
      : 0;

    // Keep the puppet's eye-line on the viewer, then lean in with three smug
    // laugh pulses. It reads as the character laughing at the person behind
    // the screen without intercepting any UI pointer events.
    this.pivot.rotation.x = -envelope * 0.075 * amount - pulses * 0.045 * amount;
    this.pivot.rotation.y = MODEL_FACING_Y + Math.sin(time * 0.72) * 0.025 * amount;
    this.pivot.rotation.z = Math.sin(time * 1.45) * 0.012 * amount + pulses * 0.016 * amount;
    this.pivot.position.y = Math.sin(time * 1.15) * 0.045 * amount + pulses * 0.065 * amount;
    this.pivot.position.z = envelope * 0.28 * amount;
    const squash = 1 + pulses * 0.016 * amount;
    this.pivot.scale.set(1 - pulses * 0.008 * amount, squash, 1);

    if (active && this.laughAction && !this.laughing) {
      this.laughing = true;
      this.idleAction?.fadeOut(0.15);
      this.laughAction.reset().setLoop(THREE.LoopRepeat, 2).fadeIn(0.15).play();
    } else if (!active && this.laughing) {
      this.laughing = false;
      this.laughAction?.fadeOut(0.2);
      this.idleAction?.reset().fadeIn(0.2).play();
    }
    this.host.dataset.laughPhase = active
      ? pulses > 0.35
        ? 'laughing-at-viewer'
        : 'smirking'
      : 'idle';
  }

  tick = () => {
    if (this.disposed || !this.visible || document.hidden) return;
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
    if (this.disposed || this.frame || !this.visible || document.hidden) return;
    this.clock.getDelta();
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    this.pause();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.mixer?.stopAllAction();
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.host.dataset.transcriptionJester = 'disposed';
  }
}

window.transcriptionJesterCreate = (id) => {
  const host = document.getElementById(id);
  if (!host || scenes.has(id)) return;
  scenes.set(id, new TranscriptionJester(host));
};

window.transcriptionJesterDestroy = (id) => {
  scenes.get(id)?.dispose();
  scenes.delete(id);
};
