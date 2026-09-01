import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { DRACOLoader } from '../vendor/draco/DRACOLoader.js';

const host = document.querySelector('#stage');
const bar = document.querySelector('#bar');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
const circusYoutube = document.querySelector('#circus-youtube');
const bandcamp = document.querySelector('#bandcamp');
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('../vendor/draco/');
dracoLoader.setDecoderConfig({ type: isIOS ? 'js' : 'wasm' });
dracoLoader.setWorkerLimit(isIOS ? 1 : 2);
dracoLoader.preload();

const scene = new THREE.Scene();
const exteriorBackground = new THREE.Color(0x000000);
const exteriorFogColor = new THREE.Color(0x050303);
let exteriorBackgroundTexture = null;
scene.background = exteriorBackgroundTexture || exteriorBackground.clone();
scene.fog = new THREE.FogExp2(exteriorFogColor, 0.0024);

// LUBIAK_KATHMANDU_360_BACKGROUND_V2
// The supplied equirectangular Kathmandu night panorama is the exterior world background.
new THREE.TextureLoader().load(
  'assets/lubiak-kathmandu-360.jpg?v=20260831-integrity-v1',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    exteriorBackgroundTexture = texture;
    if (worldMode === 'exterior') scene.background = texture;
  },
  undefined,
  (error) => console.warn('LUBIAK Kathmandu 360 background failed; black fallback retained.', error),
);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.03, 1200);
let yaw = 0;
let pitch = -0.04;
let movementBounds = null;
let environmentSize = null;
let dragonRoot = null;
let dragonMixer = null;
// LUBIAK_AERIAL_DRAGON_PATROL_V1
let dragonGuardianPosition = new THREE.Vector3();
let dragonGuardianQuaternion = new THREE.Quaternion();
let dragonPatrolPhase = 0;
let dragonPatrolBlend = 0;
let exteriorRoot = null;
// LUBIAK_NO_FALLBACK_ROOT_V1 — procedural fallbackRoot is forbidden in live.
const fallbackRoot = null;
let circusInterior = null;
let circusSetRoot = null;
let circusSetPromise = null;
let worldMode = 'exterior';
let transitionLockUntil = 0;
let circusTransitioning = false;
const circusGate = new THREE.Vector3(12, 2, -9);
const exteriorReturn = { position: new THREE.Vector3(), yaw: 0, pitch: 0 };

let playerRoot = null;
let playerVisual = null;
let playerVisualGroundOffsetY = 0;
let broomRoot = null;
let playerReady = false;
let playerMode = 'walk';
let playerVelocity = new THREE.Vector3();
let playerHeading = Math.PI;
let playerBaseY = 0;
let followYaw = 0;
let followPitch = -0.10;
let followDistance = 4.35;
// LUBIAK_AERIAL_CAMERA_V1
let cameraMode = 'follow';
let aerialYaw = 0;
let aerialPitch = -0.28;
let aerialSpeed = 18;
let aerialReturnBlend = 0;
const aerialSaved = { followYaw: 0, followPitch: -0.10, followDistance: 4.35 };
let walkPhase = 0;
let walkBlend = 0;
let mountTransition = 0;
let playerBoneCache = null;
const playerGateClicks = [];
const PLAYER_GATE_MAX_GAP = 650;
const PLAYER_GATE_MAX_TRAVEL = 72;

let renderer;
let webglContextLost = false;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  host.appendChild(renderer.domElement);
} catch (error) {
  console.error('LUBIAK WebGL bootstrap failed.', error);
  status.textContent = '3D UNAVAILABLE';
  throw error;
}

renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  webglContextLost = true;
  setStatus('3D PAUSED · RESTORING GRAPHICS', 100);
}, false);
renderer.domElement.addEventListener('webglcontextrestored', () => {
  webglContextLost = false;
  renderer.resetState();
  scene.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.needsUpdate = true;
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
        if (material[key]) material[key].needsUpdate = true;
      }
    }
  });
  renderer.render(scene, camera);
  showStatus('3D GRAPHICS RESTORED', 1200);
}, false);

// Neutral presentation lighting preserves the authored PBR textures and material values.
const ambient = new THREE.AmbientLight(0xffffff, 0.82);
const hemi = new THREE.HemisphereLight(0xdde8ff, 0x4b4b52, 1.15);
const moon = new THREE.DirectionalLight(0xf2f6ff, 1.55);
moon.position.set(-24, 48, 30);
const moonFill = new THREE.DirectionalLight(0xbac8df, 0.55);
moonFill.position.set(30, 22, -34);
const circus = new THREE.PointLight(0xffc79a, 18, 210, 1.6);
circus.position.set(0, 14, 0);
const streetFillA = new THREE.PointLight(0xffd1ad, 10, 135, 1.7);
streetFillA.position.set(-18, 9, 30);
const streetFillB = new THREE.PointLight(0xdce7ff, 9, 125, 1.7);
streetFillB.position.set(18, 8, -28);
const dragonLight = new THREE.PointLight(0xffb28a, 12, 95, 1.7);
scene.add(ambient, hemi, moon, moonFill, circus, streetFillA, streetFillB, dragonLight);

// LUBIAK_WORLD_CONTRACT_V2
function enforceLubiakWorldContract(){
  // WALK means feet on the authored terrain and a vertical body. Flight is only entered by the existing player triple-click mount transition.
  if(playerRoot && playerMode==='walk'){
    playerRoot.rotation.x=0;
    playerRoot.rotation.z=0;
    if(typeof groundSurfaceBelow==='function'){
      const ground=groundSurfaceBelow(playerRoot.position,12);
      if(ground?.hit?.point){
        const y=ground.hit.point.y+0.055;
        playerRoot.position.y=y;
        playerBaseY=y;
      }
    }
  }
}

let worldContractScanned=false;
function repairLubiakStaticWorld(){
  // Preserve the selected master's authored geometry and every embedded PBR material.
  // Runtime scene traversal must never replace materials or rescale model branches.
  if (worldContractScanned || !exteriorRoot) return;
  exteriorRoot.updateMatrixWorld(true);
  worldContractScanned = true;
}

// In aerial mode the dragon remains a triple-click Megapole gateway. Walk mode keeps the existing authored handler.
const aerialDragonClicks=[];
renderer.domElement.addEventListener('pointerup',(event)=>{
  if(playerMode==='walk' || !dragonRoot || worldMode!=='exterior') return;
  const rect=renderer.domElement.getBoundingClientRect();
  const ndc=new THREE.Vector2(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
  const ray=new THREE.Raycaster(); ray.setFromCamera(ndc,camera);
  if(!ray.intersectObject(dragonRoot,true).length) return;
  const now=performance.now(); aerialDragonClicks.push(now); while(aerialDragonClicks.length && now-aerialDragonClicks[0]>900) aerialDragonClicks.shift();
  if(aerialDragonClicks.length>=3){ aerialDragonClicks.length=0; window.location.assign('/megapole/'); }
},true);

function setStatus(label, pct) {
  status.textContent = label;
  if (Number.isFinite(pct)) bar.style.width = `${THREE.MathUtils.clamp(pct, 0, 100)}%`;
}

function showStatus(label, hideAfter = 1200) {
  status.style.opacity = '1';
  progress.style.opacity = '1';
  setStatus(label, 100);
  if (hideAfter > 0) setTimeout(() => {
    if (status.textContent === label) {
      status.style.opacity = '0';
      progress.style.opacity = '0';
    }
  }, hideAfter);
}

function finishLoad(label = 'ENTER LUBIAK') {
  showStatus(label, 900);
}

function setExteriorVisibility(visible) {
  if (exteriorRoot) exteriorRoot.visible = visible;
  // Fallback is mutually exclusive with the authored master. Never reveal it
  // merely because the exterior world becomes visible again.
  if (fallbackRoot) fallbackRoot.visible = visible && !exteriorRoot;
  if (dragonRoot) dragonRoot.visible = visible;
  if (playerRoot) playerRoot.visible = visible;
  moon.visible = visible;
  moonFill.visible = visible;
  circus.visible = visible;
  streetFillA.visible = visible;
  streetFillB.visible = visible;
  dragonLight.visible = visible;
}

function setCircusMediaVisible(visible) {
  if (circusYoutube) circusYoutube.classList.toggle('is-visible', visible);
  if (bandcamp) {
    bandcamp.style.opacity = visible ? '0' : '1';
    bandcamp.style.pointerEvents = visible ? 'none' : 'auto';
  }
}

function makeCircusInterior() {
  if (circusInterior) return circusInterior;

  const group = new THREE.Group();
  group.name = 'LUBIAK_CIRCUS_INTERIOR';
  group.visible = false;

  const cream = new THREE.MeshStandardMaterial({ color: 0xf2d5ad, roughness: 0.78, side: THREE.DoubleSide });
  const orange = new THREE.MeshStandardMaterial({ color: 0xd55b24, roughness: 0.74, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x351712, roughness: 0.92, side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffb25f, emissive: 0x8c2e09, emissiveIntensity: 0.6, roughness: 0.55 });

  const floor = new THREE.Mesh(new THREE.CircleGeometry(23, 64), dark);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  group.add(floor);

  const ring = new THREE.Mesh(new THREE.RingGeometry(6.5, 9.4, 64), orange);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.025;
  group.add(ring);

  const innerRing = new THREE.Mesh(new THREE.CircleGeometry(6.5, 64), cream);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.03;
  group.add(innerRing);

  const wallRadius = 22;
  const panels = 32;
  for (let i = 0; i < panels; i += 1) {
    const a = (i / panels) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.45, 9.5, 0.24), i % 2 ? orange : cream);
    panel.position.set(Math.sin(a) * wallRadius, 4.75, Math.cos(a) * wallRadius);
    panel.rotation.y = a;
    group.add(panel);
  }

  const roof = new THREE.Mesh(new THREE.ConeGeometry(22.3, 17, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0xc85324, roughness: 0.78, side: THREE.BackSide }));
  roof.position.y = 17.7;
  group.add(roof);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 20, 18), gold);
  mast.position.y = 10;
  group.add(mast);

  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const lamp = new THREE.PointLight(i % 2 ? 0xff783d : 0xffd09c, 42, 28, 1.6);
    lamp.position.set(Math.sin(a) * 13.5, 6.5 + (i % 3), Math.cos(a) * 13.5);
    group.add(lamp);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), gold);
    bulb.position.copy(lamp.position);
    group.add(bulb);
  }

  const centreGlow = new THREE.PointLight(0xffa25d, 105, 50, 1.4);
  centreGlow.position.set(0, 12, 0);
  group.add(centreGlow);

  const entryGlow = new THREE.PointLight(0xffd2a0, 68, 24, 1.4);
  entryGlow.position.set(0, 4, 19);
  group.add(entryGlow);

  const exitLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5, 0.45), gold);
  exitLeft.position.set(-2.2, 2.5, 21.4);
  const exitRight = exitLeft.clone();
  exitRight.position.x = 2.2;
  const exitTop = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.45), gold);
  exitTop.position.set(0, 5, 21.4);
  group.add(exitLeft, exitRight, exitTop);

  scene.add(group);
  circusInterior = group;
  return group;
}

async function getMeshoptDecoder() {
  try {
    const module = await import('../vendor/meshopt_decoder.module.js');
    const decoder = module.MeshoptDecoder;
    if (!decoder) throw new Error('MeshoptDecoder export missing');
    await decoder.ready;
    return decoder;
  } catch (error) {
    console.warn('LUBIAK Meshopt decoder unavailable; uncompressed fallback remains enabled.', error);
    return null;
  }
}

function loadGlb(url, decoder, label, reportProgress = true, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };
    const timeout = setTimeout(() => {
      finish(reject, new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    // The promoted LUBIAK master requires KHR_draco_mesh_compression. The
    // decoder is pinned locally to the same Three.js r160 runtime.
    loader.setDRACOLoader(dracoLoader);
    if (decoder) loader.setMeshoptDecoder(decoder);
    loader.load(url, (gltf) => finish(resolve, gltf), (xhr) => {
      if (reportProgress && xhr.total && !settled) {
        const local = Math.min(99, (xhr.loaded / xhr.total) * 100);
        setStatus(label, local);
      }
    }, (error) => finish(reject, error));
  });
}

function renderConfirmedFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (!webglContextLost) renderer.render(scene, camera);
      requestAnimationFrame(resolve);
    });
  });
}

// LUBIAK_VALLEY_BLACK_SURFACE_V1
// The Kathmandu valley artwork is a physical render texture only. It is never
// composited behind the whole viewport. Choose one large, thin, near-black,
// untextured authored surface and leave every other black surface untouched.
function applyValleyToBlackBackdrop(root) {
  root.updateMatrixWorld(true);
  let best = null;
  let bestScore = -Infinity;
  root.traverse((object) => {
    if (!object.isMesh || object.userData?.lubiakEmberGround) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const darkSlots = materials.map((material, index) => {
      if (!material || material.map || !material.color) return -1;
      const c = material.color;
      const maxC = Math.max(c.r, c.g, c.b);
      const minC = Math.min(c.r, c.g, c.b);
      return maxC <= 0.16 && (maxC - minC) <= 0.08 ? index : -1;
    }).filter((index) => index >= 0);
    if (!darkSlots.length) return;

    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const s = box.getSize(new THREE.Vector3());
    const horizontalSpan = Math.max(s.x, s.z);
    const thinAxis = Math.min(s.x, s.z);
    const isBackdropShape = s.y >= 2.5 && horizontalSpan >= 5 && thinAxis <= Math.max(1.2, horizontalSpan * 0.12);
    if (!isBackdropShape) return;

    const semantic = [object.name, ...materials.map((m) => m?.name || '')].join(' ');
    const nameBoost = /backdrop|background|panorama|valley|screen|black|sky/i.test(semantic) ? 4 : 1;
    const score = (s.y * horizontalSpan / Math.max(0.18, thinAxis)) * nameBoost;
    if (score > bestScore) { bestScore = score; best = { object, darkSlots }; }
  });

  if (!best) {
    console.warn('LUBIAK valley backdrop: no qualifying black surface found; viewport remains black.');
    return;
  }

  const texture = new THREE.TextureLoader().load(
    'lubiak-kathmandu-night.svg?v=20260830-valley-surface-v1',
    () => console.info('LUBIAK valley texture loaded on black backdrop', { mesh: best.object.name || '(unnamed)' }),
    undefined,
    (error) => console.warn('LUBIAK valley texture failed to load; black backdrop retained.', error),
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  const valleyMaterial = new THREE.MeshBasicMaterial({
    name: 'LUBIAK_Kathmandu_Valley_Backdrop',
    map: texture,
    color: 0xffffff,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });

  if (Array.isArray(best.object.material)) {
    best.object.material = best.object.material.map((material, index) => best.darkSlots.includes(index) ? valleyMaterial : material);
  } else {
    best.object.material = valleyMaterial;
  }
  best.object.userData.lubiakValleyBackdrop = true;
}

async function installCircusSet() {
  if (circusSetRoot) return circusSetRoot;
  if (circusSetPromise) return circusSetPromise;

  circusSetPromise = (async () => {
    try {
      showStatus('LOADING CIRCUS STAGE', 0);
      const decoder = await getMeshoptDecoder();
      const gltf = await loadGlb(
        '/assets/assets/models/lubiak_scene11_web_ultralight.glb?v=20260830-blackout-recovery-v1',
        decoder,
        'LOADING CIRCUS STAGE',
        true,
      );
      const root = gltf.scene;
      root.name = 'LUBIAK_CIRCUS_SCENE11';
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      if (box.isEmpty()) throw new Error('Scene 11 GLB has empty bounds');
      const center = box.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -box.min.y + 0.04, -center.z);
      root.rotation.y = 0;
      root.traverse((object) => {
        if (!object.isMesh) return;
        object.frustumCulled = false;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          material.side = THREE.DoubleSide;
          material.needsUpdate = true;
        }
      });
      makeCircusInterior().add(root);
      circusSetRoot = root;
      if (worldMode === 'circus') showStatus('CIRCUS STAGE READY', 850);
      return root;
    } catch (error) {
      console.warn('LUBIAK optimized circus stage unavailable; procedural circus remains active.', error);
      if (worldMode === 'circus') showStatus('CIRCUS INTERIOR READY', 850);
      return null;
    } finally {
      circusSetPromise = null;
    }
  })();

  return circusSetPromise;
}

function enterCircus() {
  if (worldMode !== 'exterior' || circusTransitioning || performance.now() < transitionLockUntil) return;
  circusTransitioning = true;
  transitionLockUntil = performance.now() + 1250;
  makeCircusInterior();
  exteriorReturn.position.copy(playerReady ? playerRoot.position : camera.position);
  exteriorReturn.yaw = playerReady ? followYaw : yaw;
  exteriorReturn.pitch = playerReady ? followPitch : pitch;

  // LUBIAK_CIRCUS_ENTRY_FADE_V1 — briefly veil the hard scene swap so walking
  // through the tent reads as one continuous transition rather than a teleport.
  renderer.domElement.style.transition = 'opacity .22s ease';
  renderer.domElement.style.opacity = '0.08';
  showStatus('ENTERING LUBIAK CIRCUS', 700);

  setTimeout(() => {
    worldMode = 'circus';
    setExteriorVisibility(false);
    circusInterior.visible = true;
    if (playerRoot) playerRoot.visible = true;
    scene.background = new THREE.Color(0x160b08);
    scene.fog = new THREE.FogExp2(0x1e0d09, 0.012);
    renderer.toneMappingExposure = 1.45;
    if (playerReady) {
      playerRoot.position.set(0, 0, 14.5);
      playerBaseY = 0;
    } else {
      camera.position.set(0, 2.1, 14.5);
      yaw = 0;
      pitch = -0.02;
    }
    movementBounds = new THREE.Box3(new THREE.Vector3(-19, 0, -19), new THREE.Vector3(19, 8, 22.5));
    setCircusMediaVisible(true);
    installCircusSet();
    requestAnimationFrame(() => {
      renderer.domElement.style.opacity = '0.90';
      setTimeout(() => {
        circusTransitioning = false;
        renderer.domElement.style.transition = '';
        renderer.domElement.style.opacity = '';
      }, 260);
    });
    showStatus('INSIDE LUBIAK CIRCUS', 1100);
  }, 220);
}

function exitCircus() {
  if (worldMode !== 'circus' || performance.now() < transitionLockUntil) return;
  worldMode = 'exterior';
  transitionLockUntil = performance.now() + 1400;
  if (circusInterior) circusInterior.visible = false;
  setCircusMediaVisible(false);
  setExteriorVisibility(true);
  scene.background = exteriorBackgroundTexture || exteriorBackground.clone();
  scene.fog = new THREE.FogExp2(exteriorFogColor, 0.0024);
  renderer.toneMappingExposure = 1.0;
  if (playerReady) {
    playerRoot.position.copy(exteriorReturn.position);
    playerBaseY = playerRoot.position.y;
    followYaw = exteriorReturn.yaw;
    followPitch = exteriorReturn.pitch;
  } else {
    camera.position.copy(exteriorReturn.position);
    yaw = exteriorReturn.yaw;
    pitch = exteriorReturn.pitch;
  }
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  movementBounds = new THREE.Box3(
    new THREE.Vector3(-env.x * 0.7, 0, -env.z * 0.7),
    new THREE.Vector3(env.x * 0.7, Math.max(18, env.y * 1.15), env.z * 0.9),
  );
  showStatus('BACK TO FREAK STREET', 900);
}

function updateCircusTransition() {
  if (circusTransitioning || performance.now() < transitionLockUntil) return;
  const p = playerReady ? playerRoot.position : camera.position;
  if (worldMode === 'exterior') {
    const dx = p.x - circusGate.x;
    const dz = p.z - circusGate.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 11 && p.y < 9) enterCircus();
  } else if (p.z > 21.2) {
    exitCircus();
  }
}

function makeFallbackDistrict() {
  // Intentionally void. Never construct or expose procedural replacement geometry live.
  console.error('LUBIAK authored master unavailable; fallbackRoot is disabled.');
  finishLoad('LUBIAK MASTER UNAVAILABLE');
}

function frameLoadedEnvironment(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return false;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return false;

  // LUBIAK_PLAZA_DATUM_V2
  // Centre X/Z first, then infer the authored plaza height from mesh bases instead
  // of trusting the scene's absolute minimum (which may be foundations/stray geo).
  root.position.set(-center.x, 0, -center.z);
  root.updateMatrixWorld(true);
  const meshBaseSamples = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    const meshBox = new THREE.Box3().setFromObject(object);
    if (meshBox.isEmpty()) return;
    const h = meshBox.max.y - meshBox.min.y;
    if (!Number.isFinite(meshBox.min.y) || !Number.isFinite(h)) return;
    meshBaseSamples.push(meshBox.min.y);
  });
  meshBaseSamples.sort((a,b) => a-b);
  const q = (arr,p) => arr.length ? arr[Math.max(0, Math.min(arr.length-1, Math.floor((arr.length-1)*p)))] : 0;
  const authoredPlazaY = meshBaseSamples.length >= 6 ? q(meshBaseSamples, 0.35) : box.min.y;
  const PLAZA_Y = 0;
  root.position.y = PLAZA_Y - authoredPlazaY;
  root.updateMatrixWorld(true);

  // LUBIAK_AUTHORED_PBR_MATERIALS_V1
  // The promoted PBR WEB OPTIMIZED master is display-authoritative.
  // Keep all embedded baseColor, normal, roughness, metalness and emissive textures unchanged.

  root.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      material.depthTest = true;
      material.depthWrite = true;
      material.needsUpdate = true;
    }
  });

  environmentSize = size.clone();

  // LUBIAK_CIRCUS_GROUND_ZERO_V2
  // Resolve a stable circus branch from labelled descendants, then lift that
  // compact branch as one rigid object to the same plaza datum used everywhere.
  const circusTerms = /circus|big[ _-]?top|bigtop|tent|marquee|foetus|fetus/i;
  const circusRoots = [];
  const maxFootprintX = size.x * 0.48;
  const maxFootprintZ = size.z * 0.48;
  root.traverse((object) => {
    if (object === root || !circusTerms.test(object.name || '')) return;
    let candidate = object;
    let parent = object.parent;
    while (parent && parent !== root) {
      const parentBox = new THREE.Box3().setFromObject(parent);
      const parentSize = parentBox.getSize(new THREE.Vector3());
      if (parentSize.x > maxFootprintX || parentSize.z > maxFootprintZ) break;
      candidate = parent;
      parent = parent.parent;
    }
    if (!circusRoots.includes(candidate)) circusRoots.push(candidate);
  });
  if (circusRoots.length) {
    const uniqueRoots = circusRoots.filter((candidate, index, arr) =>
      !arr.some((other, otherIndex) => otherIndex !== index && candidate.parent && other === candidate.parent)
    );
    const circusBox = new THREE.Box3();
    for (const object of uniqueRoots) circusBox.expandByObject(object);
    if (!circusBox.isEmpty()) {
      // The circus is a rigid authored hierarchy, but its base belongs on the
      // shared ground datum. Allow correction in either direction so a raised
      // terrain/plaza pass cannot leave the tent floating above Freak Street.
      const groundOffset = PLAZA_Y - circusBox.min.y + 0.04;
      if (Math.abs(groundOffset) > 0.03) {
        for (const object of uniqueRoots) object.position.y += groundOffset;
        root.updateMatrixWorld(true);
        console.info('LUBIAK circus aligned to ground datum', { groundOffset, roots: uniqueRoots.map(o => o.name) });
      }
    }
  }

  const eyeHeight = Math.max(1.7, Math.min(size.y * 0.12, 5));
  const distance = Math.max(maxDim * 0.72, size.z * 0.72, 18);
  camera.position.set(0, eyeHeight, distance);
  camera.near = Math.max(0.02, maxDim / 50000);
  camera.far = Math.max(500, maxDim * 8);
  camera.updateProjectionMatrix();
  yaw = 0;
  pitch = -0.035;

  movementBounds = new THREE.Box3(
    new THREE.Vector3(-size.x * 0.7, 0, -size.z * 0.7),
    new THREE.Vector3(size.x * 0.7, Math.max(18, size.y * 1.15), size.z * 0.9),
  );
  circus.position.set(size.x * 0.08, Math.max(7, size.y * 0.25), -size.z * 0.08);
  circusGate.set(circus.position.x, 2, circus.position.z + Math.max(9, size.z * 0.075));
  streetFillA.position.set(-size.x * 0.22, Math.max(5, size.y * 0.13), size.z * 0.28);
  streetFillB.position.set(size.x * 0.22, Math.max(5, size.y * 0.13), -size.z * 0.3);
  makeCircusInterior();
  console.info('LUBIAK environment ready', { size: size.toArray(), camera: camera.position.toArray(), circusGate: circusGate.toArray() });
  return true;
}

function prepareDragon(root) {
  root.name = 'LUBIAK_DRAGON_GUARDIAN';
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) throw new Error('Dragon GLB has empty bounds');
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  const targetHeight = Math.max(8, Math.min(env.y * 0.46, env.z * 0.13));
  const scale = targetHeight / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -box.min.y * scale, -env.z * 0.31);
  root.rotation.y = Math.PI;
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    object.userData.isLubiakDragonGuardian = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.opacity = 1;
      material.needsUpdate = true;
    }
  });
  dragonLight.position.set(0, targetHeight * 0.55, root.position.z + targetHeight * 0.35);
  dragonGuardianPosition.copy(root.position);
  dragonGuardianQuaternion.copy(root.quaternion);
  dragonPatrolPhase = 0;
  dragonPatrolBlend = 0;
}

async function installDragon(decoder) {
  try {
    const gltf = await loadGlb('/assets/assets/models/lubiak_dragon_guardian_web.glb?v=20260831-draco-webp-v1', decoder, 'SUMMONING DRAGON GUARDIAN', false);
    dragonRoot = gltf.scene;
    prepareDragon(dragonRoot);
    scene.add(dragonRoot);

    dragonMixer = null;
    if (Array.isArray(gltf.animations) && gltf.animations.length > 0) {
      dragonMixer = new THREE.AnimationMixer(dragonRoot);
      for (const clip of gltf.animations) {
        const action = dragonMixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.enabled = true;
        action.play();
      }
    }
  } catch (error) {
    dragonRoot = null;
    dragonMixer = null;
    console.warn('LUBIAK dragon guardian unavailable; circus remains accessible.', error);
  }
}

function findBone(root, patterns) {
  let hit = null;
  root.traverse((object) => {
    if (hit || !object.isBone) return;
    const name = (object.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (patterns.some((pattern) => name.includes(pattern))) hit = object;
  });
  return hit;
}

function cachePlayerBones() {
  if (!playerVisual) return null;
  playerBoneCache = {
    hips: findBone(playerVisual, ['hips', 'pelvis']),
    chest: findBone(playerVisual, ['upperchest', 'chest', 'spine2', 'spine02', 'spine1']),
    leftLeg: findBone(playerVisual, ['leftupleg', 'leftthigh', 'thighl', 'upperlegl']),
    rightLeg: findBone(playerVisual, ['rightupleg', 'rightthigh', 'thighr', 'upperlegr']),
    leftLowerLeg: findBone(playerVisual, ['leftleg', 'leftcalf', 'calfl', 'lowerlegl']),
    rightLowerLeg: findBone(playerVisual, ['rightleg', 'rightcalf', 'calfr', 'lowerlegr']),
    leftArm: findBone(playerVisual, ['leftarm', 'leftupperarm', 'upperarml']),
    rightArm: findBone(playerVisual, ['rightarm', 'rightupperarm', 'upperarmr']),
    leftForeArm: findBone(playerVisual, ['leftforearm', 'leftlowerarm', 'forearml']),
    rightForeArm: findBone(playerVisual, ['rightforearm', 'rightlowerarm', 'forearmr']),
    leftHand: findBone(playerVisual, ['lefthand', 'handl']),
    rightHand: findBone(playerVisual, ['righthand', 'handr']),
  };
  return playerBoneCache;
}

let broomShoulderSocket = null;
let broomRideStart = null;
let broomRideCenterOffset = new THREE.Vector3();

function attachBroomToShoulder() {
  if (!playerVisual || !broomRoot) return;
  const bones = playerBoneCache || cachePlayerBones();
  broomShoulderSocket = new THREE.Group();
  broomShoulderSocket.name = 'DA_NOBLE_Y2K_HAND_GRIP_SOCKET';

  // LUBIAK_DJINN_BROOM_AUTHORITY_V1
  // Walk mode has one authority: the broom follows the carrying hand, not the chest.
  // The shoulder is only a visual contact point created by the broom's local angle.
  const gripParent = bones?.rightHand || bones?.rightForeArm || bones?.chest || playerVisual;
  gripParent.add(broomShoulderSocket);
  // Primary shoulder carry: engine behind/left of head, shaft across upper back, right-hand grip.
  broomShoulderSocket.position.set(0.055, 0.015, 0.035);
  broomShoulderSocket.rotation.set(0.075, -0.18, 0.24);
  broomShoulderSocket.add(broomRoot);

  broomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(broomRoot);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.001);
  // LUBIAK_BROOM_REFERENCE_PROPORTION_V2
  // Reference: DA NOBLE Y2K spans about 1.9x the 1.72-unit djinn height.
  broomRoot.scale.setScalar(3.34 / longest);
  broomRoot.rotation.set(0.06, Math.PI * 0.5, 0.05);
  broomRoot.position.set(-0.54, -0.015, -0.015);
}

function applyWalkCarryPose(blend = 1, swing = 0) {
  const b = playerBoneCache;
  if (!b) return;

  // LUBIAK_BROOM_WALK_VARIANTS_V2
  // Keep the hand grip authoritative while the heavy engine subtly settles with the stride.
  if (broomShoulderSocket) {
    const gait = Math.abs(swing);
    const weight = Math.sin(walkPhase * 0.5);
    broomShoulderSocket.position.y = 0.015 - gait * 0.012 * blend;
    broomShoulderSocket.rotation.x = 0.075 + swing * 0.035 * blend;
    broomShoulderSocket.rotation.y = -0.18 + weight * 0.025 * blend;
    broomShoulderSocket.rotation.z = 0.24 - gait * 0.04 * blend;
  }
  if (b.chest) {
    b.chest.rotation.x = 0.025 * blend;
    // Counterbalance the oversized engine without disturbing locomotion.
    b.chest.rotation.z = (0.045 - Math.abs(swing) * 0.018) * blend;
  }

  // Right arm is the carrying arm: elbow down, forearm across the hip and
  // hand closed around the broom shaft. Keep it comparatively stable while walking.
  if (b.rightArm) {
    b.rightArm.rotation.x = (-0.18 + swing * 0.025) * blend;
    b.rightArm.rotation.y = -0.12 * blend;
    b.rightArm.rotation.z = -0.46 * blend;
  }
  if (b.rightForeArm) {
    b.rightForeArm.rotation.x = -0.78 * blend;
    b.rightForeArm.rotation.y = 0.22 * blend;
    b.rightForeArm.rotation.z = -0.34 * blend;
  }
  if (b.rightHand) {
    b.rightHand.rotation.x = 0.10 * blend;
    b.rightHand.rotation.y = -0.08 * blend;
    b.rightHand.rotation.z = -0.22 * blend;
  }
}

function restoreStandingWalkPose() {
  // LUBIAK_STANDING_GROUND_ZERO_V1
  // Walk/idle owns an upright human stance. Riding geometry may never leak back here.
  if (!playerVisual || !playerBoneCache) return;
  const b = playerBoneCache;

  // Feet remain calibrated to the authored GLB foot plane; playerRoot supplies terrain Y.
  playerVisual.position.y = playerVisualGroundOffsetY;
  playerRoot.rotation.x = 0;
  playerRoot.rotation.z = 0;

  if (b.hips) {
    b.hips.rotation.x = 0;
    b.hips.rotation.y = 0;
    b.hips.rotation.z = 0;
  }
  if (b.chest) {
    b.chest.rotation.x = 0;
    b.chest.rotation.y = 0;
    b.chest.rotation.z = 0;
  }
  if (b.leftLeg) {
    b.leftLeg.rotation.x = 0;
    b.leftLeg.rotation.y = 0;
    b.leftLeg.rotation.z = 0;
  }
  if (b.rightLeg) {
    b.rightLeg.rotation.x = 0;
    b.rightLeg.rotation.y = 0;
    b.rightLeg.rotation.z = 0;
  }
  if (b.leftLowerLeg) {
    b.leftLowerLeg.rotation.x = 0;
    b.leftLowerLeg.rotation.y = 0;
    b.leftLowerLeg.rotation.z = 0;
  }
  if (b.rightLowerLeg) {
    b.rightLowerLeg.rotation.x = 0;
    b.rightLowerLeg.rotation.y = 0;
    b.rightLowerLeg.rotation.z = 0;
  }

  // If a prior ride state ever owned the broom, return it to the authoritative hand socket.
  if (broomRoot && broomShoulderSocket && broomRoot.parent !== broomShoulderSocket) {
    broomShoulderSocket.attach(broomRoot);
    broomRoot.scale.setScalar(broomRoot.scale.x);
    broomRoot.rotation.set(0.06, Math.PI * 0.5, 0.05);
    broomRoot.position.set(-0.54, -0.015, -0.015);
    broomRideStart = null;
  }

  // Re-establish the shoulder carry only after the body is upright.
  applyWalkCarryPose(1, 0);
}

function prepareBroomForRide() {
  if (!broomRoot || !playerRoot) return;
  // Reparent exactly once while preserving world transform. From this point onward
  // the ride state owns the broom; the walk hand socket no longer influences it.
  broomRoot.updateMatrixWorld(true);
  playerRoot.attach(broomRoot);
  // Measure the rendered broom centre in player-local space after reparenting.
  // GLB origins are not guaranteed to sit on the shaft, so riding must align
  // visible geometry rather than the asset pivot.
  broomRoot.updateMatrixWorld(true);
  const rideBox = new THREE.Box3().setFromObject(broomRoot);
  const rideCenterWorld = rideBox.getCenter(new THREE.Vector3());
  const rideCenterLocal = playerRoot.worldToLocal(rideCenterWorld.clone());
  broomRideCenterOffset.copy(rideCenterLocal).sub(broomRoot.position);
  broomRideStart = {
    position: broomRoot.position.clone(),
    quaternion: broomRoot.quaternion.clone(),
  };
}

function applyRidePose(t) {
  const b = playerBoneCache;
  if (!b) return;
  const s = THREE.MathUtils.smoothstep(t, 0, 1);
  const swingOver = Math.sin(Math.PI * s); // one-leg bicycle-style swing during mount

  // Ride mode fully owns the procedural rig so no residual walking rotations leak in.
  if (b.hips) {
    b.hips.rotation.y = 0;
    b.hips.rotation.z = 0;
  }
  if (b.rightHand) {
    b.rightHand.rotation.x = THREE.MathUtils.lerp(0.10, 0, s);
    b.rightHand.rotation.y = THREE.MathUtils.lerp(-0.08, 0, s);
    b.rightHand.rotation.z = THREE.MathUtils.lerp(-0.22, 0, s);
  }
  if (b.chest) {
    b.chest.rotation.x = THREE.MathUtils.lerp(0, -0.22, s);
    b.chest.rotation.z = THREE.MathUtils.lerp(-0.03, 0, s);
  }
  if (b.leftLeg) {
    b.leftLeg.rotation.x = THREE.MathUtils.lerp(0, -0.78, s);
    b.leftLeg.rotation.z = THREE.MathUtils.lerp(0, -0.26, s);
  }
  if (b.rightLeg) {
    // Swing the right leg up and over the broom, then settle astride it.
    b.rightLeg.rotation.x = THREE.MathUtils.lerp(0, -0.78, s) - swingOver * 0.42;
    b.rightLeg.rotation.z = THREE.MathUtils.lerp(0, 0.26, s) + swingOver * 0.62;
  }
  if (b.leftLowerLeg) b.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.02, s);
  if (b.rightLowerLeg) b.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.02, s) + swingOver * 0.22;
  if (b.leftArm) {
    b.leftArm.rotation.x = THREE.MathUtils.lerp(0, -0.72, s);
    b.leftArm.rotation.z = THREE.MathUtils.lerp(0, -0.34, s);
  }
  if (b.rightArm) {
    b.rightArm.rotation.x = THREE.MathUtils.lerp(-0.12, -0.78, s);
    b.rightArm.rotation.z = THREE.MathUtils.lerp(-1.02, 0.30, s);
  }
  if (b.leftForeArm) b.leftForeArm.rotation.x = THREE.MathUtils.lerp(0, -0.78, s);
  if (b.rightForeArm) b.rightForeArm.rotation.x = THREE.MathUtils.lerp(-0.28, -0.84, s);

  if (broomRoot && broomRideStart) {
    // Final riding geometry: shaft centered under the pelvis, running between both legs.
    // Seat the visible broom shaft directly beneath the djinn pelvis.
    // Compensate for the GLB's off-centre pivot so the rider cannot float above it.
    const targetPos = new THREE.Vector3(0, 0.72, 0.02).sub(broomRideCenterOffset);
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.0, 0, 0.0));
    broomRoot.position.lerpVectors(broomRideStart.position, targetPos, s);
    broomRoot.quaternion.slerpQuaternions(broomRideStart.quaternion, targetQuat, s);
  }
}

function preparePlayer(root) {
  playerRoot = new THREE.Group();
  playerRoot.name = 'LUBIAK_DJINN_PLAYER_ROOT';
  playerVisual = root;
  root.name = 'LUBIAK_DJINN_PLAYER';
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) throw new Error('Djinn GLB has empty bounds');
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 1.72 / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  playerVisualGroundOffsetY = root.position.y;
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    object.userData.isLubiakPlayer = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    }
  });
  playerRoot.add(root);
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  // LUBIAK_SAFE_ENTRANCE_CAMERA_V2
  // The authored GLB is centred around the origin. Its public/street entrance is on
  // the +Z side (the same side from which frameLoadedEnvironment initially views it).
  // Start OUTSIDE that edge and scan inward; never guess from an interior percentage.
  // LUBIAK_FREAK_STREET_RIGHT_SPAWN_V1
  // Begin beside the right-hand side of the Freak Street entrance/banner, not centred
  // in front of the doorway. Positive X is screen-right from the +Z entrance camera.
  const entranceAnchor = new THREE.Vector3(env.x * 0.16, 0.08, env.z * 0.60);
  playerRoot.position.copy(entranceAnchor);
  playerBaseY = playerRoot.position.y;
  playerHeading = Math.PI;
  playerRoot.rotation.set(0, playerHeading, 0, 'YXZ');
  scene.add(playerRoot);
  // Spawn is validated against the djinn body. The shoulder-carried broom may
  // visually overhang the apron without pinning the player in place.
  const safeEntrance = findSafeEntranceSpawn(entranceAnchor, false);
  playerRoot.position.copy(safeEntrance);
  playerBaseY = playerRoot.position.y;
  followYaw = 0;
  followPitch = -0.08;
  followDistance = 4.35;
  cachePlayerBones();
  playerReady = true;
  // Place the camera immediately on the safe exterior side before the first player frame.
  updateFollowCamera(1);
}

async function installPlayer(decoder) {
  try {
    const gltf = await loadGlb('/assets/assets/models/lubiak_djinn_player_ultralight.glb?v=20260830-blackout-recovery-v1', decoder, 'CALLING DJINN', false);
    preparePlayer(gltf.scene);
    try {
      const broomGltf = await loadGlb('/assets/assets/models/lubiak_da_noble_y2k_broom_ultralight.glb?v=20260830-blackout-recovery-v1', decoder, 'PREPARING DA NOBLE Y2K', false);
      broomRoot = broomGltf.scene;
      attachBroomToShoulder();
      restoreStandingWalkPose();
    } catch (broomError) {
      console.warn('DA NOBLE Y2K broom unavailable; player remains active without broom.', broomError);
    }
    showStatus('DJINN PLAYER READY', 850);
  } catch (error) {
    playerReady = false;
    console.warn('Djinn player unavailable; original free-camera navigation remains active.', error);
  }
}

async function installEnvironment() {
  setStatus('STARTING 3D ENGINE', 4);
  const decoder = await getMeshoptDecoder();
  const candidates = [
    // Stable mobile-safe master. Palace geometry must be corrected in the GLB export itself.
    { url: '/assets/assets/models/LUBIAK_palace_pbr_repaired_final.glb?v=safe-33492995942-1', label: 'LOADING LUBIAK MASTER', finish: 'ENTER LUBIAK', timeoutMs: 26000 },
  ];

  for (const candidate of candidates) {
    try {
      setStatus(candidate.label, 8);
      const gltf = await loadGlb(candidate.url, decoder, candidate.label, true, candidate.timeoutMs);
      const root = gltf.scene;
      root.name = 'LUBIAK_ENVIRONMENT';
      scene.add(root);
      if (!frameLoadedEnvironment(root)) {
        scene.remove(root);
        throw new Error('GLB scene has invalid or empty bounds');
      }
      exteriorRoot = root;
      // Confirm two animation frames before optional network/decode work begins.
      await renderConfirmedFrame();
      finishLoad(candidate.finish);
      setTimeout(() => {
        void Promise.allSettled([installDragon(decoder), installPlayer(decoder)]);
      }, 350);
      return;
    } catch (error) {
      console.error(`${candidate.label} failed.`, error);
    }
  }

  console.error('LUBIAK master failed; live fallbackRoot is void.');
  finishLoad('LUBIAK MASTER UNAVAILABLE');
  await renderConfirmedFrame();
  setTimeout(() => {
    void Promise.allSettled([installDragon(decoder), installPlayer(decoder)]);
  }, 350);
}

// LUBIAK_RIDE_2MIX_TRAY_V1
// Match the Enochian Terminal 2MIX live-context visual language while the djinn rides DA NOBLE Y2K.
const rideSignalTray=document.createElement('div');
rideSignalTray.id='lubiak-ride-signal-tray';
rideSignalTray.setAttribute('role','status');
rideSignalTray.setAttribute('aria-live','polite');
rideSignalTray.innerHTML='<b>RIDE</b> <span class="ctx">DA NOBLE Y2K</span><span class="hint">MOVE STEER · ▲ UP CLIMB · ▼ DOWN DESCEND</span><span class="live">LUBIAK FLIGHT SIGNAL</span>';
document.body.appendChild(rideSignalTray);
const rideSignalStyle=document.createElement('style');
rideSignalStyle.textContent=`
#lubiak-ride-signal-tray{position:fixed;z-index:73;left:18px;bottom:max(70px,calc(env(safe-area-inset-bottom) + 70px));display:none;max-width:300px;padding:6px 8px;border:1px solid #63f5cf;border-radius:5px 5px 5px 1px;background:#03110ff2;color:#c9fff0;font:800 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.05em;white-space:normal;pointer-events:none;box-shadow:0 4px 16px #000c,0 0 12px #19c98f55}
#lubiak-ride-signal-tray.visible{display:block}#lubiak-ride-signal-tray b{color:#f0c97e;letter-spacing:.13em}#lubiak-ride-signal-tray .ctx{color:#dffcff}#lubiak-ride-signal-tray .live{display:block;margin-top:2px;color:#63f5cf;letter-spacing:.08em}#lubiak-ride-signal-tray .hint{display:block;margin-top:2px;color:#9de8dc}
@media(max-width:720px){#lubiak-ride-signal-tray{left:10px;bottom:max(62px,calc(env(safe-area-inset-bottom) + 62px));max-width:220px;padding:5px 6px;font-size:6px}}
`;
document.head.appendChild(rideSignalStyle);
function refreshRideSignalTray(){
  const riding=playerMode==='mounting'||playerMode==='flight';
  rideSignalTray.classList.toggle('visible',riding&&cameraMode!=='aerial');
  if(riding){
    const phase=playerMode==='mounting'?'MOUNTING':'FLIGHT';
    const altitude=playerRoot?Math.max(0,playerRoot.position.y).toFixed(1):'0.0';
    const speed=playerVelocity?playerVelocity.length().toFixed(1):'0.0';
    rideSignalTray.querySelector('.ctx').textContent='DA NOBLE Y2K · '+phase;
    rideSignalTray.querySelector('.live').textContent='LUBIAK FLIGHT SIGNAL · ALT '+altitude+' · SPD '+speed;
  }
}

const joystick = document.createElement('div');
joystick.id = 'lubiak-sphere-control';
joystick.innerHTML = '<div class="sphere-shell" aria-hidden="true"><div class="sphere-knob"></div></div><span>MOVE</span>';
joystick.setAttribute('role', 'application');
joystick.setAttribute('aria-label', 'LUBIAK spherical movement control');
document.body.appendChild(joystick);
const joystickStyle = document.createElement('style');
joystickStyle.textContent = `
#lubiak-sphere-control{position:fixed;right:max(20px,env(safe-area-inset-right));left:auto;bottom:max(18px,env(safe-area-inset-bottom));width:118px;height:136px;z-index:60;display:grid;place-items:center;touch-action:none;user-select:none;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.18em;text-shadow:0 1px 4px #0008;opacity:.94}
#lubiak-sphere-control .sphere-shell{position:relative;width:104px;height:104px;border-radius:50%;border:1px solid #f6c28b88;background:radial-gradient(circle at 32% 27%,#fff7 0 4%,#efad6d55 5% 17%,#6d3018bb 48%,#190a06ee 100%);box-shadow:inset -15px -18px 28px #000a,inset 9px 10px 22px #ffb76b2a,0 8px 28px #000a}
#lubiak-sphere-control .sphere-shell:after{content:'';position:absolute;inset:10px;border-radius:50%;border:1px solid #ffd5a72b;box-shadow:inset 0 0 18px #ffb0671f}
#lubiak-sphere-control .sphere-knob{position:absolute;left:50%;top:50%;width:38px;height:38px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 28%,#fff8,#f2ae68 24%,#7c3415 66%,#210b04);box-shadow:0 4px 12px #000b,inset -5px -6px 8px #0008;border:1px solid #ffd7a1aa;will-change:transform}
#lubiak-sphere-control span{position:absolute;bottom:2px;opacity:.78}
@media (max-width:600px){#lubiak-sphere-control{right:max(10px,env(safe-area-inset-right));left:auto;bottom:max(8px,env(safe-area-inset-bottom));transform:scale(.88);transform-origin:right bottom}}
`;
document.head.appendChild(joystickStyle);

// LUBIAK_FOLLOW_CLIMB_RIDE_CONTROLS_V1
// LUBIAK_THREE_MODE_SELECTOR_V1
// Explicit control choices: grounded/follow camera, detached aerial camera, or broom ride.
const modeDock = document.createElement('div');
modeDock.id = 'lubiak-mode-dock';
modeDock.style.cssText = 'position:fixed;right:max(18px,env(safe-area-inset-right));bottom:158px;z-index:70;display:flex;gap:6px;align-items:center;padding:5px;border:1px solid #f6c28b55;border-radius:999px;background:#100806dd;box-shadow:0 6px 20px #0009;backdrop-filter:blur(8px)';

function makeModeButton(label, aria) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', aria);
  button.style.cssText = 'border:1px solid #f6c28b66;border-radius:999px;padding:9px 12px;background:#160b08cc;color:#ffe2bd;font:700 9px/1 system-ui;letter-spacing:.12em;cursor:pointer;opacity:.72';
  modeDock.appendChild(button);
  return button;
}

const followToggle = makeModeButton('FOLLOW', 'Follow the djinn in third person');
const aerialToggle = makeModeButton('AERIAL', 'Use detached aerial observation camera');
const rideToggle = makeModeButton('RIDE', 'Mount DA NOBLE Y2K and fly');

document.body.appendChild(modeDock);

function refreshLubiakModeButtons() {
  if (typeof refreshVerticalControls === 'function') refreshVerticalControls();
  const riding = playerMode === 'mounting' || playerMode === 'flight';
  const active = cameraMode === 'aerial' ? aerialToggle : riding ? rideToggle : followToggle;
  for (const button of [followToggle, aerialToggle, rideToggle]) {
    const isActive = button === active;
    button.style.opacity = isActive ? '1' : '.62';
    button.style.background = isActive ? '#6d3018ee' : '#160b08cc';
    button.style.borderColor = isActive ? '#ffd7a1cc' : '#f6c28b66';
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
}

followToggle.addEventListener('click', () => {
  if (cameraMode === 'aerial') setCameraMode('follow');
  else {
    cameraMode = 'follow';
    showStatus(playerMode === 'flight' ? 'FOLLOWING RIDER' : 'FOLLOWING DJINN', 700);
    refreshLubiakModeButtons();
  }
});

aerialToggle.addEventListener('click', () => {
  setCameraMode(cameraMode === 'aerial' ? 'follow' : 'aerial');
  refreshLubiakModeButtons();
});

rideToggle.addEventListener('click', () => {
  if (!playerReady || !playerRoot || !broomRoot) {
    showStatus('DA NOBLE Y2K NOT READY', 900);
    return;
  }
  if (cameraMode === 'aerial') setCameraMode('follow');
  if (playerMode === 'walk') beginMountTransition();
  else if (playerMode === 'mounting') showStatus('DA NOBLE Y2K · MOUNTING', 700);
  else if (playerMode === 'flight') showStatus('RIDE MODE · DA NOBLE Y2K', 700);
  refreshLubiakModeButtons();
});

queueMicrotask(() => refreshLubiakModeButtons());

let verticalTrigger = 0;
let climbAttached = false;
const verticalDock = document.createElement('div');
verticalDock.id = 'lubiak-vertical-dock';
verticalDock.style.cssText = 'position:fixed;right:max(146px,calc(env(safe-area-inset-right) + 146px));bottom:max(22px,env(safe-area-inset-bottom));z-index:72;display:flex;flex-direction:column;gap:7px;pointer-events:auto';
function makeVerticalButton(label, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = 'min-width:64px;border:1px solid #f6c28b88;border-radius:12px;padding:10px;background:#160b08e8;color:#ffe2bd;font:800 9px/1 system-ui;letter-spacing:.12em;box-shadow:0 5px 16px #0009;touch-action:none;cursor:pointer';
  const engage = (event) => { verticalTrigger = value; button.setPointerCapture?.(event.pointerId); event.preventDefault(); };
  const release = () => { if (verticalTrigger === value) verticalTrigger = 0; };
  button.addEventListener('pointerdown', engage);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  verticalDock.appendChild(button);
  return button;
}
const verticalUpButton = makeVerticalButton('▲ UP', 1);
const verticalDownButton = makeVerticalButton('▼ DOWN', -1);
document.body.appendChild(verticalDock);
function refreshVerticalControls() {
  const enabled = playerReady && cameraMode === 'follow' && (playerMode === 'walk' || playerMode === 'mounting' || playerMode === 'flight');
  verticalDock.style.opacity = enabled ? '.94' : '.30';
  verticalDock.style.pointerEvents = enabled ? 'auto' : 'none';
  if (!enabled) verticalTrigger = 0;
}

const joystickVector = new THREE.Vector2();
let joystickPointer = null;
function updateJoystick(event) {
  const shell = joystick.querySelector('.sphere-shell');
  const knob = joystick.querySelector('.sphere-knob');
  const rect = shell.getBoundingClientRect();
  const radius = rect.width * 0.34;
  let x = event.clientX - (rect.left + rect.width / 2);
  let y = event.clientY - (rect.top + rect.height / 2);
  const length = Math.hypot(x, y);
  if (length > radius) {
    x *= radius / length;
    y *= radius / length;
  }
  joystickVector.set(x / radius, -y / radius);
  knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
}

joystick.addEventListener('pointerdown', (event) => {
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
  event.preventDefault();
});
joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystickPointer) updateJoystick(event);
});
function releaseJoystick(event) {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null;
  joystickVector.set(0, 0);
  joystick.querySelector('.sphere-knob').style.transform = 'translate(-50%,-50%)';
}
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const dragonGateClicks = [];
const DRAGON_GATE_MAX_GAP = 650;
const DRAGON_GATE_MAX_TRAVEL = 72;

function pointerHitsDragon(event) {
  if (!dragonRoot || worldMode !== 'exterior') return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  return raycaster.intersectObject(dragonRoot, true).length > 0;
}

function pointerHitsPlayer(event) {
  if (!playerReady || !playerRoot) return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  return raycaster.intersectObject(playerRoot, true).length > 0;
}

function beginMountTransition() {
  if (!playerReady || playerMode !== 'walk') return;
  playerMode = 'mounting';
  mountTransition = 0;
  walkBlend = 0;
  playerVelocity.set(0, 0, 0);
  if (playerVisual) playerVisual.position.y = playerVisualGroundOffsetY;
  prepareBroomForRide();
  showStatus('DA NOBLE Y2K · MOUNTING', 1100);
}

function handlePlayerGatePointer(event) {
  if (!event.shiftKey || event.button !== 0 || !pointerHitsPlayer(event)) {
    playerGateClicks.length = 0;
    return false;
  }
  const now = performance.now();
  while (playerGateClicks.length && now - playerGateClicks[0].t > PLAYER_GATE_MAX_GAP * 2) playerGateClicks.shift();
  const first = playerGateClicks[0];
  if (first && Math.hypot(event.clientX - first.x, event.clientY - first.y) > PLAYER_GATE_MAX_TRAVEL) playerGateClicks.length = 0;
  playerGateClicks.push({ t: now, x: event.clientX, y: event.clientY });
  if (playerGateClicks.length < 3) return true;
  const a = playerGateClicks[playerGateClicks.length - 3];
  const b = playerGateClicks[playerGateClicks.length - 2];
  const c = playerGateClicks[playerGateClicks.length - 1];
  if (b.t - a.t <= PLAYER_GATE_MAX_GAP && c.t - b.t <= PLAYER_GATE_MAX_GAP) {
    playerGateClicks.length = 0;
    beginMountTransition();
  }
  return true;
}

function handleDragonGatePointer(event) {
  if (event.button !== 0 || !pointerHitsDragon(event)) {
    dragonGateClicks.length = 0;
    return false;
  }
  const now = performance.now();
  while (dragonGateClicks.length && now - dragonGateClicks[0].t > DRAGON_GATE_MAX_GAP * 2) dragonGateClicks.shift();
  const first = dragonGateClicks[0];
  if (first && Math.hypot(event.clientX - first.x, event.clientY - first.y) > DRAGON_GATE_MAX_TRAVEL) dragonGateClicks.length = 0;
  dragonGateClicks.push({ t: now, x: event.clientX, y: event.clientY });
  if (dragonGateClicks.length < 3) return true;
  const a = dragonGateClicks[dragonGateClicks.length - 3];
  const b = dragonGateClicks[dragonGateClicks.length - 2];
  const c = dragonGateClicks[dragonGateClicks.length - 1];
  if (b.t - a.t <= DRAGON_GATE_MAX_GAP && c.t - b.t <= DRAGON_GATE_MAX_GAP) {
    dragonGateClicks.length = 0;
    showStatus('ENTERING SILMARI’LLION MEGAPOLE', 0);
    setTimeout(() => location.assign('../megapole/'), 140);
  }
  return true;
}

const keys = new Set();
function setCameraMode(nextMode) {
  if (typeof refreshVerticalControls === 'function') refreshVerticalControls();
  if (!playerReady || !playerRoot || nextMode === cameraMode) return;
  if (nextMode === 'aerial') {
    aerialSaved.followYaw = followYaw;
    aerialSaved.followPitch = followPitch;
    aerialSaved.followDistance = followDistance;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    aerialYaw = Math.atan2(-dir.x, -dir.z);
    aerialPitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    cameraMode = 'aerial';
    aerialReturnBlend = 0;
    showStatus('AERIAL OBSERVATION · V TO RETURN', 1200);
  } else {
    cameraMode = 'follow';
    followYaw = aerialSaved.followYaw;
    followPitch = aerialSaved.followPitch;
    followDistance = aerialSaved.followDistance;
    aerialReturnBlend = 1;
    showStatus('RETURNING TO DJINN', 800);
  }
  if (typeof refreshLubiakModeButtons === 'function') refreshLubiakModeButtons();
}

addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'v' && !event.repeat) {
    setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow');
    event.preventDefault();
    return;
  }
  if (key === 'r' && !event.repeat) {
    if (cameraMode === 'aerial') setCameraMode('follow');
    if (playerReady && broomRoot && playerMode === 'walk') beginMountTransition();
    if (typeof refreshLubiakModeButtons === 'function') refreshLubiakModeButtons();
    event.preventDefault();
    return;
  }
  keys.add(key);
});
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
let drag = null;
renderer.domElement.addEventListener('pointerdown', (event) => {
  if ((cameraMode === 'follow' && handlePlayerGatePointer(event)) || handleDragonGatePointer(event)) {
    event.preventDefault();
    return;
  }
  drag = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!drag) return;
  if (playerReady && cameraMode === 'aerial') {
    aerialYaw -= (event.clientX - drag.x) * 0.0042;
    aerialPitch -= (event.clientY - drag.y) * 0.0032;
    aerialPitch = THREE.MathUtils.clamp(aerialPitch, -1.32, 1.20);
  } else if (playerReady) {
    followYaw -= (event.clientX - drag.x) * 0.0042;
    followPitch -= (event.clientY - drag.y) * 0.0032;
    followPitch = THREE.MathUtils.clamp(followPitch, -0.58, 0.38);
  } else {
    yaw -= (event.clientX - drag.x) * 0.0042;
    pitch -= (event.clientY - drag.y) * 0.0032;
    pitch = THREE.MathUtils.clamp(pitch, -0.78, 0.62);
  }
  drag = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('pointerup', () => { drag = null; });
renderer.domElement.addEventListener('pointercancel', () => { drag = null; });
renderer.domElement.addEventListener('wheel', (event) => {
  if (playerReady && cameraMode === 'aerial') {
    aerialSpeed = THREE.MathUtils.clamp(aerialSpeed + Math.sign(event.deltaY) * 2.2, 5, 48);
  } else if (playerReady) {
    followDistance = THREE.MathUtils.clamp(followDistance + Math.sign(event.deltaY) * 0.45, 2.8, 7.2);
  } else {
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    camera.position.addScaledVector(forward, -Math.sign(event.deltaY) * 1.7);
  }
}, { passive: true });

const collisionRaycaster = new THREE.Raycaster();
const collisionOrigins = [
  new THREE.Vector3(0,0.28,0), new THREE.Vector3(0,0.92,0), new THREE.Vector3(0,1.48,0),
];
// LUBIAK_DJINN_UNFREEZE_FOLLOW_RIDE_V1
// Navigation uses a compact rider capsule. The visually oversized broom is never
// allowed to turn the complete rendered GLB bounds into a hard movement blocker.
const PLAYER_COLLISION_RADIUS = 0.34;
const BROOM_COLLISION_RADIUS = 0.28;
const RIDE_COLLISION_RADIUS = 0.56;
// LUBIAK_ENTRANCE_CLEARANCE_V1
// Keep the complete djinn + DA NOBLE Y2K silhouette away from nearby mesh borders.
const PLAYER_BORDER_CLEARANCE = 0.62;
const BROOM_BORDER_CLEARANCE = 0.78;
const clearanceDirections = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
});

function activeCollisionRoots() {
  const roots=[];
  if(worldMode==='exterior') {
    if(exteriorRoot?.visible) roots.push(exteriorRoot);
    if(fallbackRoot?.visible) roots.push(fallbackRoot);
    if(dragonRoot?.visible) roots.push(dragonRoot);
  } else if(worldMode==='circus' && circusInterior?.visible) {
    roots.push(circusInterior);
  }
  return roots;
}

function findClimbableSurface() {
  if (!playerRoot || worldMode !== 'exterior') return null;
  const origin = playerRoot.position.clone().add(new THREE.Vector3(0, 0.95, 0));
  let best = null;
  for (const dir of clearanceDirections) {
    collisionRaycaster.set(origin, dir);
    collisionRaycaster.near = 0.06;
    collisionRaycaster.far = 1.15;
    for (const root of activeCollisionRoots()) {
      const hits = collisionRaycaster.intersectObject(root, true);
      for (const hit of hits) {
        const normal = worldHitNormal(hit);
        if (!normal || Math.abs(normal.y) > 0.58) continue;
        if (!best || hit.distance < best.hit.distance) best = { hit, normal };
        break;
      }
    }
  }
  return best;
}

function applyFollowClimb(dt) {
  if (!verticalTrigger || cameraMode !== 'follow' || playerMode !== 'walk') { climbAttached = false; return false; }
  const wall = findClimbableSurface();
  if (!wall) { climbAttached = false; return false; }
  climbAttached = true;
  playerVelocity.set(0, 0, 0);
  restoreStandingWalkPose();
  const nextY = playerRoot.position.y + verticalTrigger * 3.1 * dt;
  playerRoot.position.y = THREE.MathUtils.clamp(nextY, 0, movementBounds?.max.y ?? 24);
  playerBaseY = playerRoot.position.y;
  const n = wall.normal.clone(); n.y = 0;
  if (n.lengthSq() > 1e-6) {
    n.normalize();
    const hold = wall.hit.point.clone().addScaledVector(n, 0.46);
    playerRoot.position.x += (hold.x - playerRoot.position.x) * Math.min(1, dt * 14);
    playerRoot.position.z += (hold.z - playerRoot.position.z) * Math.min(1, dt * 14);
    const face = Math.atan2(-n.x, -n.z);
    playerHeading += (face - playerHeading) * Math.min(1, dt * 10);
    playerRoot.rotation.y = playerHeading;
  }
  return true;
}

function rayBlocked(origin, direction, distance) {
  if(direction.lengthSq()<1e-8) return false;
  collisionRaycaster.set(origin, direction.clone().normalize());
  collisionRaycaster.near=0;
  collisionRaycaster.far=distance;
  for(const root of activeCollisionRoots()) {
    const hits=collisionRaycaster.intersectObject(root,true);
    if(hits.some(h=>h.distance<=distance)) return true;
  }
  return false;
}

function hasMeshClearance(point, includeBroom=false) {
  const radius = PLAYER_BORDER_CLEARANCE + (includeBroom ? BROOM_BORDER_CLEARANCE : 0);
  for (const h of [0.24, 0.82, 1.36]) {
    const origin = point.clone().add(new THREE.Vector3(0, h, 0));
    for (const dir of clearanceDirections) {
      if (rayBlocked(origin, dir, radius)) return false;
    }
  }
  return true;
}

function findSafeEntranceSpawn(anchor, includeBroom=true) {
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  const candidates = [];
  // Search from clearly outside the +Z shell inward toward Freak Street. This finds
  // the first authored walkable apron with enough room for the complete broom span.
  for (const zRatio of [0.60, 0.56, 0.52, 0.49, 0.46, 0.43, 0.40, 0.36, 0.32, 0.28, 0.24]) {
    const z = env.z * zRatio;
    // Prefer the banner/right apron first; only drift toward centre if that zone is blocked.
    for (const xRatio of [0.16, 0.20, 0.12, 0.24, 0.08, 0.28, 0.04, 0, -0.04]) {
      candidates.push(new THREE.Vector3(env.x * xRatio, anchor.y, z));
    }
  }
  for (const candidate of candidates) {
    const ground = groundSurfaceBelow(candidate, 18);
    if (!ground) continue;
    candidate.y = ground.hit.point.y + 0.045;
    if (hasMeshClearance(candidate, includeBroom)) return candidate;
  }
  // Never fall back into the mesh. If the authored apron cannot be resolved, stay
  // visibly outside the +Z shell until a valid walkable point is available.
  return new THREE.Vector3(env.x * 0.18, 0.08, env.z * 0.62);
}

function resolvePlayerCollision(from, to, includeBroom=false) {
  const delta=to.clone().sub(from);
  const dist=delta.length();
  if(dist<1e-6) return to;
  const dir=delta.clone().normalize();
  const probe=dist + PLAYER_COLLISION_RADIUS + (includeBroom?BROOM_COLLISION_RADIUS:0);
  for(const local of collisionOrigins) {
    const origin=from.clone().add(local);
    if(rayBlocked(origin,dir,probe)) return from.clone();
  }
  if(includeBroom && broomRoot) {
    broomRoot.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(broomRoot);
    if(!box.isEmpty()) {
      const c=box.getCenter(new THREE.Vector3());
      if(rayBlocked(c,dir,dist+BROOM_COLLISION_RADIUS)) return from.clone();
    }
  }
  return to;
}

function movePlayerWithCollision(delta, includeBroom=false) {
  if(!playerRoot || delta.lengthSq()<1e-10) return;
  const start=playerRoot.position.clone();
  const desired=start.clone().add(delta);
  let solved=resolvePlayerCollision(start,desired,includeBroom);
  if(!solved.equals(start) && !hasMeshClearance(solved, includeBroom)) solved=start.clone();
  if(solved.equals(start)) {
    // Try axis-separated sliding so walls feel physical instead of sticky.
    let xTry=resolvePlayerCollision(start,start.clone().add(new THREE.Vector3(delta.x,0,0)),includeBroom);
    if(!xTry.equals(start) && !hasMeshClearance(xTry, includeBroom)) xTry=start.clone();
    playerRoot.position.copy(xTry);
    const zStart=playerRoot.position.clone();
    let zTry=resolvePlayerCollision(zStart,zStart.clone().add(new THREE.Vector3(0,delta.y,delta.z)),includeBroom);
    if(!zTry.equals(zStart) && !hasMeshClearance(zTry, includeBroom)) zTry=zStart.clone();
    playerRoot.position.copy(zTry);
    if(playerRoot.position.distanceTo(start)<1e-5) playerVelocity.multiplyScalar(0.15);
  } else playerRoot.position.copy(solved);
}

function moveRideWithCollision(delta) {
  if (!playerRoot || delta.lengthSq() < 1e-10) return;
  const start = playerRoot.position.clone();
  const desired = start.clone().add(delta);
  const dist = delta.length();
  const dir = delta.clone().normalize();

  // Compact vehicle envelope around the rider/pelvis. Do not raycast from the
  // far brush/engine tips: those are presentation geometry, not the flight capsule.
  const rideOrigins = [
    new THREE.Vector3(0, 0.42, 0),
    new THREE.Vector3(0, 0.95, 0),
    new THREE.Vector3(0, 1.42, 0),
  ];
  let blocked = false;
  for (const local of rideOrigins) {
    if (rayBlocked(start.clone().add(local), dir, dist + RIDE_COLLISION_RADIUS)) {
      blocked = true;
      break;
    }
  }

  if (!blocked) {
    playerRoot.position.copy(desired);
    return;
  }

  // Preserve responsive flight by attempting horizontal/vertical sliding rather
  // than zeroing the entire frame whenever one direction is obstructed.
  const parts = [
    new THREE.Vector3(delta.x, 0, delta.z),
    new THREE.Vector3(0, delta.y, 0),
  ];
  for (const part of parts) {
    if (part.lengthSq() < 1e-10) continue;
    const partDir = part.clone().normalize();
    const partDist = part.length();
    let partBlocked = false;
    for (const local of rideOrigins) {
      if (rayBlocked(playerRoot.position.clone().add(local), partDir, partDist + RIDE_COLLISION_RADIUS)) {
        partBlocked = true;
        break;
      }
    }
    if (!partBlocked) playerRoot.position.add(part);
  }

  if (playerRoot.position.distanceTo(start) < 1e-5) playerVelocity.multiplyScalar(0.35);
}

// LUBIAK_GROUND_GRAVITY_V2
// Walk mode stays upright and attached only to walkable ground surfaces.
// Walls and ceilings remain collision surfaces, never walking surfaces.
const surfaceRaycaster = new THREE.Raycaster();
const WORLD_UP = new THREE.Vector3(0,1,0);
const WALKABLE_NORMAL_Y = 0.42;

function activeSurfaceRoots(){
  const roots=[];
  if(worldMode==='exterior'){
    if(exteriorRoot?.visible) roots.push(exteriorRoot);
    if(fallbackRoot?.visible) roots.push(fallbackRoot);
  } else if(worldMode==='circus' && circusInterior?.visible) roots.push(circusInterior);
  return roots;
}

function worldHitNormal(hit){
  if(!hit?.face || !hit?.object) return null;
  const normalMatrix=new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  return hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
}

function groundSurfaceBelow(point, maxDistance=8){
  const roots=activeSurfaceRoots();
  if(!roots.length) return null;
  const origin=point.clone().add(new THREE.Vector3(0,2.2,0));
  surfaceRaycaster.set(origin,new THREE.Vector3(0,-1,0));
  surfaceRaycaster.near=0;
  surfaceRaycaster.far=maxDistance+2.2;
  let best=null;
  for(const root of roots){
    const hits=surfaceRaycaster.intersectObject(root,true);
    for(const hit of hits){
      const normal=worldHitNormal(hit);
      if(!normal || normal.dot(WORLD_UP)<WALKABLE_NORMAL_Y) continue;
      // A walk probe may step onto curbs, but must not snap to the circus roof,
      // raised decoration, or another surface above the djinn's feet.
      if(hit.point.y > point.y + 0.55) continue;
      if(!best || hit.point.y>best.hit.point.y) best={hit,normal};
    }
  }
  return best;
}

function groundMoveVector(input){
  const forward=new THREE.Vector3(Math.sin(followYaw),0,-Math.cos(followYaw));
  const right=new THREE.Vector3(Math.cos(followYaw),0,Math.sin(followYaw));
  const desired=forward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
  if(desired.lengthSq()>1e-6) desired.normalize();
  return desired;
}

function applyGroundGravity(dt, clearance=0.045){
  if(!playerRoot || playerMode!=='walk') return;
  const ground=groundSurfaceBelow(playerRoot.position,6.5);
  if(ground){
    const targetY=ground.hit.point.y+clearance;
    playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*24));
    if (Math.abs(playerRoot.position.y-targetY) < 0.0015) playerRoot.position.y=targetY;
    playerBaseY=targetY;
  }

  // Keep the djinn upright in world gravity. Only yaw follows travel direction.
  const targetQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,playerHeading,0,'YXZ'));
  playerRoot.quaternion.slerp(targetQ,1-Math.exp(-dt*14));
}

function combinedMoveInput() {
  const input = joystickVector.clone();
  if (keys.has('w') || keys.has('arrowup')) input.y += 1;
  if (keys.has('s') || keys.has('arrowdown')) input.y -= 1;
  if (keys.has('a') || keys.has('arrowleft')) input.x -= 1;
  if (keys.has('d') || keys.has('arrowright')) input.x += 1;
  if (input.length() > 1) input.normalize();
  return input;
}

function proceduralWalk(dt, speed01) {
  if (!playerVisual || !playerBoneCache) return;
  // Idle is a strict straight-leg stance at ground zero; gait begins only with real movement.
  if (speed01 < 0.035) {
    walkBlend += (0 - walkBlend) * Math.min(1, dt * 12);
    restoreStandingWalkPose();
    return;
  }
  walkBlend += (speed01 - walkBlend) * Math.min(1, dt * 9);
  walkPhase += dt * (3.4 + speed01 * 4.8);
  const swing = Math.sin(walkPhase);
  const bob = Math.sin(walkPhase * 2) * 0.018 * walkBlend;
  // Bob around the calibrated feet-on-ground offset; never replace it.
  playerVisual.position.y = playerVisualGroundOffsetY + bob;
  if (playerBoneCache.hips) {
    playerBoneCache.hips.rotation.y = swing * 0.065 * walkBlend;
    playerBoneCache.hips.rotation.z = Math.sin(walkPhase * 2) * 0.018 * walkBlend;
  }
  if (playerBoneCache.leftLeg) playerBoneCache.leftLeg.rotation.x = swing * 0.46 * walkBlend;
  if (playerBoneCache.rightLeg) playerBoneCache.rightLeg.rotation.x = -swing * 0.46 * walkBlend;
  if (playerBoneCache.leftLowerLeg) playerBoneCache.leftLowerLeg.rotation.x = Math.max(0, -swing) * 0.34 * walkBlend;
  if (playerBoneCache.rightLowerLeg) playerBoneCache.rightLowerLeg.rotation.x = Math.max(0, swing) * 0.34 * walkBlend;

  // Free left arm counter-swings; carrying right arm remains on the broom.
  if (playerBoneCache.leftArm) {
    playerBoneCache.leftArm.rotation.x = -swing * 0.34 * walkBlend;
    playerBoneCache.leftArm.rotation.z = 0.08 * walkBlend;
  }
  if (playerBoneCache.leftForeArm) playerBoneCache.leftForeArm.rotation.x = 0.10 * walkBlend;
  applyWalkCarryPose(1, swing * walkBlend);
}

function updatePlayer(dt) {
  if (!playerReady || !playerRoot) return;
  const input = combinedMoveInput();

  if (playerMode === 'walk') {
    // Standing is the walk/idle baseline. Clear all ride transforms before locomotion.
    restoreStandingWalkPose();
    const climbingNow = applyFollowClimb(dt);
    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);
    if (!climbingNow && mag > 0.05) {
      const desired = groundMoveVector(input);
      if (desired.lengthSq() > 0.001) {
        desired.normalize();
        const targetHeading = Math.atan2(desired.x, desired.z) + Math.PI;
        const diff = THREE.MathUtils.euclideanModulo(targetHeading - playerHeading + Math.PI, Math.PI * 2) - Math.PI;
        playerHeading += diff * Math.min(1, dt * 8.5);
        playerRoot.rotation.y = playerHeading;
        playerVelocity.lerp(desired.multiplyScalar(5.0 * mag), Math.min(1, dt * 9));
      }
    } else {
      playerVelocity.multiplyScalar(Math.max(0, 1 - dt * 8));
    }
    if (!climbingNow) {
      // FOLLOW collision authority is the djinn body only. The shoulder broom
      // stays visually full-size but cannot freeze the character against scenery.
      movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), false);
      applyGroundGravity(dt);
      proceduralWalk(dt, THREE.MathUtils.clamp(playerVelocity.length() / 5, 0, 1));
    } else {
      proceduralWalk(dt, 0);
    }
  } else if (playerMode === 'mounting') {
    mountTransition += dt;
    playerVelocity.multiplyScalar(Math.max(0, 1 - dt * 9));
    const t = THREE.MathUtils.smoothstep(mountTransition, 0.10, 1.55);
    applyRidePose(t);
    const mountTarget = playerRoot.position.clone();
    mountTarget.y = playerBaseY + t * 2.6;
    // Mount vertically with the rider capsule; broom tips may sweep past nearby
    // scenery without aborting the transition at its first frame.
    const mountSolved = resolvePlayerCollision(playerRoot.position, mountTarget, false);
    playerRoot.position.y = mountSolved.y;
    playerRoot.rotation.x = -0.08 * t;
    if (mountTransition > 1.78) {
      playerMode = 'flight';
      applyRidePose(1);
      if (typeof refreshLubiakModeButtons === 'function') refreshLubiakModeButtons();
      if (typeof refreshVerticalControls === 'function') refreshVerticalControls();
      showStatus('RIDE MODE · DA NOBLE Y2K', 900);
    }
  } else if (playerMode === 'flight') {
    // LUBIAK_BROOM_FLIGHT_3D_V1
    // Ride the broom as a true 3D vehicle: forward follows the camera look direction,
    // so looking up/down and pushing forward climbs/dives. Space/PageUp climb; Ctrl/PageDown descend.
    applyRidePose(1);
    const keyboardVertical = (keys.has(' ') || keys.has('space') || keys.has('pageup') || keys.has('e') ? 1 : 0)
      - (keys.has('control') || keys.has('ctrl') || keys.has('pagedown') || keys.has('q') ? 1 : 0);
    const verticalKey = THREE.MathUtils.clamp(keyboardVertical + verticalTrigger, -1, 1);
    const mag2d = THREE.MathUtils.clamp(input.length(), 0, 1);
    const lookForward = new THREE.Vector3();
    camera.getWorldDirection(lookForward);
    if (lookForward.lengthSq() < 1e-6) lookForward.set(Math.sin(followYaw), 0, -Math.cos(followYaw));
    lookForward.normalize();
    const right = new THREE.Vector3().crossVectors(lookForward, WORLD_UP);
    if (right.lengthSq() < 1e-6) right.set(Math.cos(followYaw), 0, Math.sin(followYaw));
    right.normalize();
    const desired = lookForward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
    desired.y += verticalKey * 0.95;
    const mag3d = THREE.MathUtils.clamp(Math.hypot(mag2d, verticalKey), 0, 1);
    if (desired.lengthSq() > 0.001) desired.normalize();
    playerVelocity.lerp(desired.multiplyScalar(9.5 * mag3d), Math.min(1, dt * 5));
    moveRideWithCollision(playerVelocity.clone().multiplyScalar(dt));

    // Terrain is a floor, not an altitude lock: maintain only a minimum clearance from the GLB below.
    const below = nearestSurface(playerRoot.position.clone().add(new THREE.Vector3(0,0.25,0)), WORLD_UP, 18);
    if (below && below.normal.dot(WORLD_UP) > 0.25) {
      const minY = below.hit.point.y + 1.05;
      if (playerRoot.position.y < minY) playerRoot.position.y += (minY - playerRoot.position.y) * Math.min(1, dt * 12);
    }

    if (mag3d > 0.05 && desired.lengthSq() > 0.001) {
      const flat = desired.clone(); flat.y = 0;
      if (flat.lengthSq() > 0.001) {
        const targetHeading = Math.atan2(flat.x, flat.z) + Math.PI;
        const diff = THREE.MathUtils.euclideanModulo(targetHeading - playerHeading + Math.PI, Math.PI * 2) - Math.PI;
        playerHeading += diff * Math.min(1, dt * 4.5);
        playerRoot.rotation.y = playerHeading;
      }
      const pitchTarget = THREE.MathUtils.clamp(-desired.y * 0.34, -0.32, 0.32);
      playerRoot.rotation.x += (pitchTarget - playerRoot.rotation.x) * Math.min(1, dt * 5);
      const bankTarget = THREE.MathUtils.clamp(-input.x * 0.28, -0.28, 0.28);
      playerRoot.rotation.z += (bankTarget - playerRoot.rotation.z) * Math.min(1, dt * 5);
    } else {
      playerRoot.rotation.x += (0 - playerRoot.rotation.x) * Math.min(1, dt * 3);
      playerRoot.rotation.z += (0 - playerRoot.rotation.z) * Math.min(1, dt * 3);
    }
  }

  if (movementBounds) playerRoot.position.clamp(movementBounds.min, movementBounds.max);
}

function updateFollowCamera(dt) {
  if (!playerReady || !playerRoot) return;
  const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.40 : 1.18, 0));
  const cp = Math.cos(followPitch);
  const desired = target.clone().add(new THREE.Vector3(
    -Math.sin(followYaw) * cp * followDistance,
    Math.sin(-followPitch) * followDistance + 0.72,
    Math.cos(followYaw) * cp * followDistance,
  ));

  // LUBIAK_CAMERA_VOLUME_GUARD_V2
  // The camera boom is physical: never allow the lens to cross an exterior/circus
  // mesh between the djinn and the requested third-person position.
  const boom = desired.clone().sub(target);
  const boomLength = boom.length();
  let safeDesired = desired;
  if (boomLength > 0.001) {
    const dir = boom.clone().normalize();
    collisionRaycaster.set(target, dir);
    collisionRaycaster.near = 0.12;
    collisionRaycaster.far = boomLength;
    let nearest = null;
    for (const root of activeCollisionRoots()) {
      const hits = collisionRaycaster.intersectObject(root, true);
      const hit = hits.find((h) => h.distance > 0.12 && h.distance <= boomLength);
      if (hit && (!nearest || hit.distance < nearest.distance)) nearest = hit;
    }
    if (nearest) {
      const safeDistance = Math.max(1.65, nearest.distance - 0.48);
      safeDesired = target.clone().addScaledVector(dir, safeDistance);
    }
  }

  const blend = dt >= 0.5 ? 1 : 1 - Math.exp(-dt * 7.5);
  camera.position.lerp(safeDesired, blend);
  camera.near = 0.05;
  camera.updateProjectionMatrix();
  camera.lookAt(target);
}

function updateDragonPatrol(dt) {
  if (!dragonRoot || worldMode !== 'exterior') return;
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  const targetBlend = cameraMode === 'aerial' ? 1 : 0;
  dragonPatrolBlend += (targetBlend - dragonPatrolBlend) * (1 - Math.exp(-dt * (targetBlend ? 1.8 : 1.25)));

  if (dragonPatrolBlend < 0.001 && targetBlend === 0) {
    dragonRoot.position.copy(dragonGuardianPosition);
    dragonRoot.quaternion.copy(dragonGuardianQuaternion);
    dragonLight.position.set(
      dragonRoot.position.x,
      dragonRoot.position.y + Math.max(4, env.y * 0.18),
      dragonRoot.position.z + Math.max(3, env.z * 0.035),
    );
    return;
  }

  if (cameraMode === 'aerial') dragonPatrolPhase += dt * 0.19;
  const a = dragonPatrolPhase * Math.PI * 2;
  const rx = Math.max(22, env.x * 0.42);
  const rz = Math.max(34, env.z * 0.34);
  const baseY = Math.max(10, env.y * 0.42);
  const patrolPos = new THREE.Vector3(
    Math.sin(a) * rx,
    baseY + Math.sin(a * 2.0 + 0.7) * Math.max(2.5, env.y * 0.07),
    Math.cos(a) * rz,
  );
  const tangent = new THREE.Vector3(
    Math.cos(a) * rx,
    Math.cos(a * 2.0 + 0.7) * Math.max(5, env.y * 0.14),
    -Math.sin(a) * rz,
  ).normalize();
  const patrolQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
    THREE.MathUtils.clamp(-tangent.y * 0.22, -0.18, 0.18),
    Math.atan2(tangent.x, tangent.z),
    THREE.MathUtils.clamp(-Math.sin(a) * 0.13, -0.13, 0.13),
    'YXZ',
  ));

  dragonRoot.position.lerpVectors(dragonGuardianPosition, patrolPos, dragonPatrolBlend);
  dragonRoot.quaternion.copy(dragonGuardianQuaternion).slerp(patrolQuat, dragonPatrolBlend);
  dragonLight.position.set(
    dragonRoot.position.x,
    dragonRoot.position.y + Math.max(4, env.y * 0.18),
    dragonRoot.position.z + Math.max(3, env.z * 0.035),
  );
}

function updateAerialCamera(dt) {
  if (!playerReady || cameraMode !== 'aerial') return;
  const input = combinedMoveInput();
  const cp = Math.cos(aerialPitch);
  const forward = new THREE.Vector3(-Math.sin(aerialYaw) * cp, Math.sin(aerialPitch), -Math.cos(aerialYaw) * cp).normalize();
  const right = new THREE.Vector3(Math.cos(aerialYaw), 0, -Math.sin(aerialYaw)).normalize();
  const vertical = (keys.has(' ') || keys.has('space') || keys.has('pageup') || keys.has('e') ? 1 : 0)
    - (keys.has('control') || keys.has('ctrl') || keys.has('pagedown') || keys.has('q') ? 1 : 0);
  const delta = new THREE.Vector3();
  delta.addScaledVector(forward, input.y * aerialSpeed * dt);
  delta.addScaledVector(right, input.x * aerialSpeed * dt);
  delta.y += vertical * aerialSpeed * dt;
  camera.position.add(delta);
  if (movementBounds) {
    const pad = Math.max(10, (environmentSize?.y || 30) * 1.5);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, movementBounds.min.x - pad, movementBounds.max.x + pad);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, movementBounds.min.z - pad, movementBounds.max.z + pad);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.8, movementBounds.max.y + pad * 2);
  }
  camera.rotation.order = 'YXZ';
  camera.rotation.y = aerialYaw;
  camera.rotation.x = aerialPitch;
}

function updateFallbackCamera(dt) {
  const speed = 9.5 * dt;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
  if (keys.has('w') || keys.has('arrowup')) camera.position.addScaledVector(forward, speed);
  if (keys.has('s') || keys.has('arrowdown')) camera.position.addScaledVector(forward, -speed);
  if (keys.has('a') || keys.has('arrowleft')) camera.position.addScaledVector(right, -speed);
  if (keys.has('d') || keys.has('arrowright')) camera.position.addScaledVector(right, speed);
  if (movementBounds) camera.position.clamp(movementBounds.min, movementBounds.max);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  if (webglContextLost) return;
  const dt = Math.min(clock.getDelta(), 0.04);
  if (dragonMixer && worldMode === 'exterior') dragonMixer.update(dt);
  updateDragonPatrol(dt);
  if (playerReady) {
    if (cameraMode === 'aerial') {
      // Freeze the djinn and broom exactly where they are while the detached camera explores LUBIAK.
      updateAerialCamera(dt);
    } else {
      updatePlayer(dt);
      updateFollowCamera(dt);
      if (aerialReturnBlend > 0) aerialReturnBlend = Math.max(0, aerialReturnBlend - dt * 1.4);
    }
  } else {
    updateFallbackCamera(dt);
  }
  updateCircusTransition();
  enforceLubiakWorldContract();
  repairLubiakStaticWorld();
  if(typeof refreshRideSignalTray==='function') refreshRideSignalTray();
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

installEnvironment().catch((error) => {
  console.error('LUBIAK bootstrap failed unexpectedly.', error);
  console.error('LUBIAK bootstrap failed; live fallbackRoot is void.');
  finishLoad('LUBIAK MASTER UNAVAILABLE');
});
