import fs from 'node:fs';

const jsPath = 'web/lubiak/lubiak.js';
const htmlPath = 'web/lubiak/index.html';
const terrainPath = 'web/lubiak/lubiak-terrain-addon.js';

let js = fs.readFileSync(jsPath, 'utf8');
let html = fs.readFileSync(htmlPath, 'utf8');
let terrain = fs.existsSync(terrainPath) ? fs.readFileSync(terrainPath, 'utf8') : '';
let changed = false;

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`Missing ${label} anchor`);
  changed = true;
  return source.replace(from, to);
}

// One stable mobile capability flag shared by rendering, terrain and touch behavior.
js = replaceOnce(
  js,
  "const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.03, 1200);",
  "const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.03, 1200);\nconst IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);",
  'iOS capability flag',
);

// iPhone Safari: cap DPR before allocating the framebuffer. Desktop keeps existing quality.
js = replaceOnce(
  js,
  "  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));",
  "  renderer.setPixelRatio(Math.min(devicePixelRatio, IS_IOS ? 1.18 : 1.6));",
  'renderer DPR',
);

// Put the panorama in WebGL instead of continuously compositing a translucent canvas over CSS.
js = replaceOnce(
  js,
  "const exteriorFogColor = new THREE.Color(0x101018);\nscene.background = exteriorBackground.clone();",
  "const exteriorFogColor = new THREE.Color(0x101018);\nlet exteriorPanorama = null;\nscene.background = exteriorBackground.clone();\nnew THREE.TextureLoader().load('./lubiak-kathmandu-night.svg?v=20260830-ios-v1', (texture) => {\n  texture.colorSpace = THREE.SRGBColorSpace;\n  texture.mapping = THREE.EquirectangularReflectionMapping;\n  exteriorPanorama = texture;\n  if (worldMode === 'exterior') scene.background = texture;\n}, undefined, (error) => console.warn('LUBIAK panorama texture fallback active.', error));",
  'WebGL panorama',
);

js = js.replaceAll("scene.background = exteriorBackground.clone();", "scene.background = exteriorPanorama || exteriorBackground.clone();");

// Avoid preloading the hidden YouTube player on iPhone. Instantiate only when entering circus.
js = replaceOnce(
  js,
  "function setCircusMediaVisible(visible) {\n  if (circusYoutube) circusYoutube.classList.toggle('is-visible', visible);",
  "function setCircusMediaVisible(visible) {\n  if (circusYoutube) {\n    circusYoutube.classList.toggle('is-visible', visible);\n    const iframe = circusYoutube.querySelector('iframe');\n    if (visible && iframe && !iframe.src && iframe.dataset.src) iframe.src = iframe.dataset.src;\n  }",
  'lazy circus media',
);

// Reduce mobile-only dynamic light work without changing desktop lighting.
const lightAnchor = "scene.add(ambient, hemi, moon, moonFill, circus, streetFillA, streetFillB, dragonLight);";
js = replaceOnce(
  js,
  lightAnchor,
  `${lightAnchor}\nif (IS_IOS) {\n  renderer.toneMappingExposure = 1.48;\n  moonFill.intensity *= 0.70;\n  streetFillA.intensity *= 0.62;\n  streetFillB.intensity *= 0.48;\n  dragonLight.intensity *= 0.72;\n}`,
  'iOS light profile',
);

// Restore normal frustum culling for static environment and circus meshes on iPhone.
// Animated player/dragon traversal remains untouched.
const envCullAnchor = "function frameLoadedEnvironment(root) {";
const envCullStart = js.indexOf(envCullAnchor);
if (envCullStart < 0) throw new Error('frameLoadedEnvironment missing');
const envCullEnd = js.indexOf('\n}', envCullStart);
if (envCullEnd < 0) throw new Error('frameLoadedEnvironment end missing');
let envBlock = js.slice(envCullStart, envCullEnd + 2);
if (!envBlock.includes('object.frustumCulled = IS_IOS;')) {
  envBlock = envBlock.replace('object.frustumCulled = false;', 'object.frustumCulled = IS_IOS;');
  js = js.slice(0, envCullStart) + envBlock + js.slice(envCullEnd + 2);
  changed = true;
}

// Ground raycasting can dominate the main thread on Safari. Reuse a very recent sample while
// the player has barely moved; still resample immediately on meaningful movement.
if (js.includes('function sampleLubiakGroundHeight(') && !js.includes('lastGroundSampleAt')) {
  js = replaceOnce(
    js,
    "let lastGroundY = 0;",
    "let lastGroundY = 0;\nlet lastGroundSampleAt = 0;\nconst lastGroundSamplePos = new THREE.Vector3(1e9, 1e9, 1e9);",
    'ground sample cache state',
  );
  js = replaceOnce(
    js,
    "function sampleLubiakGroundHeight(position, mode = playerMode) {\n  const root = activeGroundRoot();",
    "function sampleLubiakGroundHeight(position, mode = playerMode) {\n  if (IS_IOS) {\n    const now = performance.now();\n    if ((now - lastGroundSampleAt) < 42 && lastGroundSamplePos.distanceToSquared(position) < 0.09) return lastGroundY;\n    lastGroundSampleAt = now;\n    lastGroundSamplePos.copy(position);\n  }\n  const root = activeGroundRoot();",
    'ground sample cache',
  );
}

// Mobile help should describe gestures, not desktop keys.
js = replaceOnce(
  js,
  "const bandcamp = document.querySelector('#bandcamp');",
  "const bandcamp = document.querySelector('#bandcamp');\nconst help = document.querySelector('#help');\nif ((/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && help) help.textContent = 'DRAG · LOOK   TOUCH CONTROL · MOVE';",
  'touch help',
);

// HTML: full opaque canvas, no fixed background compositing, safe areas, lazy media.
html = replaceOnce(
  html,
  "#stage{background:#050303 url('lubiak-kathmandu-night.svg') center center/cover no-repeat fixed}",
  "#stage{position:relative;background:#050303 url('lubiak-kathmandu-night.svg') center center/cover no-repeat}",
  'stage background',
);
html = replaceOnce(
  html,
  "canvas{position:relative;z-index:1;display:block;width:100%;height:100%;touch-action:none;opacity:.90}",
  "canvas{position:relative;z-index:1;display:block;width:100%;height:100%;touch-action:none;opacity:1}",
  'opaque canvas',
);
html = html.replace(
  '#home{pointer-events:auto;position:absolute;right:18px;top:18px;',
  '#home{pointer-events:auto;position:absolute;right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));',
);
html = html.replace(
  '.top{position:absolute;left:18px;top:18px;',
  '.top{position:absolute;left:max(18px,env(safe-area-inset-left));top:max(18px,env(safe-area-inset-top));',
);
html = html.replace(
  '#bandcamp{pointer-events:auto;position:absolute;left:18px;bottom:18px;',
  '#bandcamp{pointer-events:auto;position:absolute;left:max(18px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));',
);
html = html.replace(
  '#help{position:absolute;right:18px;bottom:18px;',
  '#help{position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));',
);
if (!html.includes('@media (orientation:landscape) and (max-height:500px)')) {
  html = html.replace(
    '    @media (max-width:720px)',
    '    @media (orientation:landscape) and (max-height:500px){.top{padding:7px 9px}.sub{font-size:9px}#bandcamp{height:36px}#bandcamp iframe{height:36px}#help{font-size:9px}}\n    @media (max-width:720px)',
  );
  changed = true;
}
html = html.replace(
  '<iframe src="https://www.youtube-nocookie.com/embed/24rx276VBk0?rel=0&playsinline=1" title="LUBIAK circus screen"',
  '<iframe data-src="https://www.youtube-nocookie.com/embed/24rx276VBk0?rel=0&playsinline=1" title="LUBIAK circus screen"',
);
html = html.replace(
  '<iframe src="https://bandcamp.com/EmbeddedPlayer/',
  '<iframe loading="lazy" src="https://bandcamp.com/EmbeddedPlayer/',
);
html = html.replace('lubiak-terrain-addon.js?v=20260830-terrain-v2', 'lubiak-terrain-addon.js?v=20260830-ios-v1');
html = html.replace('lubiak.js?v=20260830-terrain-v2', 'lubiak.js?v=20260830-ios-v1');

// Terrain addon: retain geometry but cut mobile fragment/light cost.
if (terrain) {
  if (!terrain.includes('const IS_IOS_TERRAIN')) {
    terrain = terrain.replace(
      "const TERRAIN_URL = '/assets/assets/models/lubiak_ember_ground.glb?v=20260830-ember-terrain-v2';",
      "const TERRAIN_URL = '/assets/assets/models/lubiak_ember_ground.glb?v=20260830-ember-terrain-v2';\nconst IS_IOS_TERRAIN = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);",
    );
    changed = true;
  }
  terrain = terrain.replace('object.frustumCulled = false;', 'object.frustumCulled = IS_IOS_TERRAIN;');
  terrain = terrain.replace('const glowA = new THREE.PointLight(0xff3a08, 34,', 'const glowA = new THREE.PointLight(0xff3a08, IS_IOS_TERRAIN ? 14 : 34,');
  terrain = terrain.replace('const glowB = new THREE.PointLight(0xff6a12, 26,', 'const glowB = new THREE.PointLight(0xff6a12, IS_IOS_TERRAIN ? 10 : 26,');
}

if (!changed) {
  console.log('LUBIAK iOS performance profile already installed.');
  process.exit(0);
}

fs.writeFileSync(jsPath, js);
fs.writeFileSync(htmlPath, html);
if (terrain) fs.writeFileSync(terrainPath, terrain);
console.log('Applied LUBIAK iPhone/iOS performance + touch profile.');
