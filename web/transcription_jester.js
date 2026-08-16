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

function stageRect() {
  const mobile = window.matchMedia('(max-width: 759px)').matches;
  return mobile
    ? { left: 8, top: 170, width: Math.min(300, window.innerWidth * 0.42), height: Math.min(610, window.innerHeight * 0.72) }
    : { left: 18, top: 118, width: Math.min(430, window.innerWidth * 0.34), height: Math.max(520, window.innerHeight - 150) };
}

class TranscriptionJester {
  constructor(host) {
    this.host = host;
    this.host.dataset.transcriptionJester = 'loading';
    this.disposed = false;
    this.frame = 0;
    this.clock = new THREE.Clock();

    // The Flutter HtmlElementView lives inside a platform-view stacking context.
    // On iOS Safari that context can stay underneath the Flutter canvas even
    // with a huge z-index. Render the WebGL canvas directly on document.body
    // instead so the puppet is guaranteed to remain visible while still being
    // completely non-interactive.
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
    this.renderer.toneMappingExposure = 1.26;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    Object.assign(this.renderer.domElement.style, {
      display: 'block',
      position: 'fixed',
      pointerEvents: 'none',
      background: 'transparent',
      zIndex: '2147482500',
      opacity: '0.96',
      filter: 'drop-shadow(0 18px 18px rgba(0,0,0,.65))',
      transform: 'translateZ(0)',
    });
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.renderer.domElement);

    this.pivot = new THREE.Group();
    this.pivot.rotation.y = MODEL_FACING_Y;
    this.scene.add(this.pivot);

    this.scene.add(new THREE.HemisphereLight(0xffd6a1, 0x12070a, 2.7));
    const key = new THREE.DirectionalLight(0xffa03e, 5.8);
    key.position.set(-3.6, 5.2, 5.8);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3214, 3.8);
    rim.position.set(4, 4, -3);
    this.scene.add(rim);
    const face = new THREE.PointLight(0xffc262, 2.8, 9);
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
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        const bounds = new THREE.Box3().setFromObject(this.model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        this.model.scale.setScalar(7.05 / Math.max(size.y, 0.001));
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
    disposeObject(this.model);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.host.dataset.transcriptionJester = 'disposed';
  }
}

window.transcriptionJesterCreate = (id) => {
  if (scenes.has(id)) return;
  const host = document.getElementById(id);
  if (!host) return;
  scenes.set(id, new TranscriptionJester(host));
};

window.transcriptionJesterDestroy = (id) => {
  scenes.get(id)?.dispose();
  scenes.delete(id);
};
