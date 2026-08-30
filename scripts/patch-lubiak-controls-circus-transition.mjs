import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');
let changed = false;

function replaceOnce(from, to, label) {
  if (src.includes(to)) return;
  if (!src.includes(from)) throw new Error(`Missing ${label} anchor`);
  src = src.replace(from, to);
  changed = true;
}

replaceOnce(
`let worldMode = 'exterior';\nlet transitionLockUntil = 0;`,
`let worldMode = 'exterior';\nlet transitionLockUntil = 0;\nlet circusTransitioning = false;`,
'circus transition state'
);

replaceOnce(
`function enterCircus() {\n  if (worldMode !== 'exterior' || performance.now() < transitionLockUntil) return;\n  makeCircusInterior();\n  exteriorReturn.position.copy(playerReady ? playerRoot.position : camera.position);\n  exteriorReturn.yaw = playerReady ? followYaw : yaw;\n  exteriorReturn.pitch = playerReady ? followPitch : pitch;\n\n  worldMode = 'circus';\n  transitionLockUntil = performance.now() + 1400;\n  setExteriorVisibility(false);\n  circusInterior.visible = true;\n  if (playerRoot) playerRoot.visible = true;\n  scene.background = new THREE.Color(0x160b08);\n  scene.fog = new THREE.FogExp2(0x1e0d09, 0.012);\n  renderer.toneMappingExposure = 1.45;\n  if (playerReady) {\n    playerRoot.position.set(0, 0, 14.5);\n    playerBaseY = 0;\n  } else {\n    camera.position.set(0, 2.1, 14.5);\n    yaw = 0;\n    pitch = -0.02;\n  }\n  movementBounds = new THREE.Box3(new THREE.Vector3(-19, 0, -19), new THREE.Vector3(19, 8, 22.5));\n  setCircusMediaVisible(true);\n  installCircusSet();\n  showStatus('INSIDE LUBIAK CIRCUS', 1100);\n}`,
`function enterCircus() {\n  if (worldMode !== 'exterior' || circusTransitioning || performance.now() < transitionLockUntil) return;\n  circusTransitioning = true;\n  transitionLockUntil = performance.now() + 1250;\n  makeCircusInterior();\n  exteriorReturn.position.copy(playerReady ? playerRoot.position : camera.position);\n  exteriorReturn.yaw = playerReady ? followYaw : yaw;\n  exteriorReturn.pitch = playerReady ? followPitch : pitch;\n\n  // LUBIAK_CIRCUS_ENTRY_FADE_V1 — briefly veil the hard scene swap so walking\n  // through the tent reads as one continuous transition rather than a teleport.\n  renderer.domElement.style.transition = 'opacity .22s ease';\n  renderer.domElement.style.opacity = '0.08';\n  showStatus('ENTERING LUBIAK CIRCUS', 700);\n\n  setTimeout(() => {\n    worldMode = 'circus';\n    setExteriorVisibility(false);\n    circusInterior.visible = true;\n    if (playerRoot) playerRoot.visible = true;\n    scene.background = new THREE.Color(0x160b08);\n    scene.fog = new THREE.FogExp2(0x1e0d09, 0.012);\n    renderer.toneMappingExposure = 1.45;\n    if (playerReady) {\n      playerRoot.position.set(0, 0, 14.5);\n      playerBaseY = 0;\n    } else {\n      camera.position.set(0, 2.1, 14.5);\n      yaw = 0;\n      pitch = -0.02;\n    }\n    movementBounds = new THREE.Box3(new THREE.Vector3(-19, 0, -19), new THREE.Vector3(19, 8, 22.5));\n    setCircusMediaVisible(true);\n    installCircusSet();\n    requestAnimationFrame(() => {\n      renderer.domElement.style.opacity = '0.90';\n      setTimeout(() => {\n        circusTransitioning = false;\n        renderer.domElement.style.transition = '';\n        renderer.domElement.style.opacity = '';\n      }, 260);\n    });\n    showStatus('INSIDE LUBIAK CIRCUS', 1100);\n  }, 220);\n}`,
'circus entry transition'
);

replaceOnce(
`function updateCircusTransition() {\n  if (performance.now() < transitionLockUntil) return;`,
`function updateCircusTransition() {\n  if (circusTransitioning || performance.now() < transitionLockUntil) return;`,
'circus transition guard'
);

replaceOnce(
`#lubiak-sphere-control{position:fixed;left:22px;bottom:20px;width:118px;height:136px;z-index:60;display:grid;place-items:center;touch-action:none;user-select:none;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.18em;text-shadow:0 1px 4px #0008;opacity:.94}`,
`#lubiak-sphere-control{position:fixed;right:max(20px,env(safe-area-inset-right));left:auto;bottom:max(18px,env(safe-area-inset-bottom));width:118px;height:136px;z-index:60;display:grid;place-items:center;touch-action:none;user-select:none;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.18em;text-shadow:0 1px 4px #0008;opacity:.94}`,
'sphere desktop position'
);

replaceOnce(
`@media (max-width:600px){#lubiak-sphere-control{left:12px;bottom:10px;transform:scale(.88);transform-origin:left bottom}}`,
`@media (max-width:600px){#lubiak-sphere-control{right:max(10px,env(safe-area-inset-right));left:auto;bottom:max(8px,env(safe-area-inset-bottom));transform:scale(.88);transform-origin:right bottom}}`,
'sphere mobile position'
);

replaceOnce(
`aerialToggle.style.cssText = 'position:fixed;right:18px;bottom:22px;z-index:70;border:1px solid #f6c28b88;border-radius:999px;padding:10px 14px;background:#160b08dd;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.14em;box-shadow:0 6px 20px #0009;cursor:pointer';`,
`aerialToggle.style.cssText = 'position:fixed;right:max(26px,env(safe-area-inset-right));bottom:158px;z-index:70;border:1px solid #f6c28b88;border-radius:999px;padding:10px 14px;background:#160b08dd;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.14em;box-shadow:0 6px 20px #0009;cursor:pointer';`,
'aerial stack position'
);

if (!changed) {
  console.log('LUBIAK controls/circus transition patch already installed.');
  process.exit(0);
}

fs.writeFileSync(path, src);
console.log('Moved sphere control right, stacked AERIAL, and softened circus entry transition.');
