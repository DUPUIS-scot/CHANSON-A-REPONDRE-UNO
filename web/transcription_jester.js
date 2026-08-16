import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const scenes = new Map();
const MODEL_URL = new URL(
  'assets/assets/models/jester_player_reupload.glb',
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
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 0.05, 8.7);
    this.camera.lookAt(0, 0.45, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.domElement.style.cssText =
      'display:block;width:100%;height:100%;pointer-events:none';
    host.appendChild(this.renderer.domElement);

    this.pivot = new THREE.Group();
    this.pivot.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.pivot);

    this.scene.add(new THREE.HemisphereLight(0xffd6a1, 0x12070a, 2.35));
    const key = new THREE.DirectionalLight(0xffa03e, 4.8);
    key.position.set(-3.6, 5.2, 5.8);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3214, 3.1);
    rim.position.set(4, 4, -3);
    this.scene.add(rim);
    const face = new THREE.PointLight(0xffc262, 2.0, 9);
    face.position.set(0.2, 1.7, 4);
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
        this.model.scale.setScalar(6.55 / Math.max(size.y, 0.001));
        this.pivot.add(this.model);

        if (gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(this.model);
          this.clips = gltf.animations;
          const laugh = gltf.animations.find((clip) =>
            /laugh|giggle|chuckle|taunt|mock/i.test(clip.name),
          );
          const idle = gltf.animations.find((clip) => /idle/i.test(clip.name));
          this.idleAction = this.mixer.clipAction(idle || gltf.animations[0]);
          this.idleAction.play();
          if (laugh) this.laughAction = this.mixer.clipAction(laugh);
        }

        this.host.dataset.transcriptionJester = 'ready';
        this.host.dataset.modelAsset = MODEL_URL;
        this.host.dataset.behavior = 'laughing-arrogantly-at-viewer';
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
    this.camera.fov = width < 500 ? 34 : 30;
    this.camera.position.z = width < 500 ? 8.15 : 8.7;
    this.camera.updateProjectionMatrix();
  }

  update(time, delta) {
    this.mixer?.update(delta);
    if (!this.model) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 0.22 : 1;
    const cycle = (time % 5.35) / 5.35;
    const active = cycle > 0.08 && cycle < 0.82;
    const local = active ? (cycle - 0.08) / 0.74 : 0;
    const envelope = active ? Math.sin(Math.PI * local) : 0;
    const pulses = active
      ? Math.pow(Math.max(0, Math.sin(local * Math.PI * 8.0)), 1.45)
      : 0;

    this.pivot.rotation.x =
      -envelope * 0.095 * amount - pulses * 0.052 * amount;
    this.pivot.rotation.y =
      MODEL_FACING_Y + Math.sin(time * 0.62) * 0.035 * amount;
    this.pivot.rotation.z =
      Math.sin(time * 1.4) * 0.015 * amount + pulses * 0.024 * amount;
    this.pivot.position.y =
      Math.sin(time * 1.05) * 0.05 * amount + pulses * 0.075 * amount;
    this.pivot.position.z =
      envelope * 0.34 * amount + pulses * 0.08 * amount;
    const squash = 1 + pulses * 0.022 * amount;
    this.pivot.scale.set(1 - pulses * 0.012 * amount, squash, 1);

    if (active && this.laughAction && !this.laughing) {
      this.laughing = true;
      this.idleAction?.fadeOut(0.12);
      this.laughAction
        .reset()
        .setLoop(THREE.LoopRepeat, 3)
        .fadeIn(0.12)
        .play();
    } else if (!active && this.laughing) {
      this.laughing = false;
      this.laughAction?.fadeOut(0.18);
      this.idleAction?.reset().fadeIn(0.18).play();
    }

    this.host.dataset.laughPhase = active
      ? pulses > 0.32
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
