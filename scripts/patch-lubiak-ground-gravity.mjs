import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

if (src.includes('function sampleLubiakGroundHeight(')) {
  console.log('LUBIAK ground gravity already installed.');
  process.exit(0);
}

const anchor = "function combinedMoveInput() {";
if (!src.includes(anchor)) throw new Error('combinedMoveInput anchor missing');

const helper = `const groundRaycaster = new THREE.Raycaster();\nconst groundOrigin = new THREE.Vector3();\nconst groundDown = new THREE.Vector3(0, -1, 0);\nlet lastGroundY = 0;\n\nfunction activeGroundRoot() {\n  if (worldMode === 'circus' && circusInterior) return circusInterior;\n  return exteriorRoot || fallbackRoot;\n}\n\nfunction sampleLubiakGroundHeight(position, mode = playerMode) {\n  const root = activeGroundRoot();\n  if (!root) return Number.isFinite(lastGroundY) ? lastGroundY : 0;\n\n  // Probe only a short distance above the player so roofs / bridges well above\n  // the current locomotion level do not teleport the djinn upward.\n  const probeLift = mode === 'flight' ? 5.0 : 1.25;\n  groundOrigin.set(position.x, position.y + probeLift, position.z);\n  groundRaycaster.set(groundOrigin, groundDown);\n  groundRaycaster.far = mode === 'flight' ? 40 : 6.5;\n\n  const hits = groundRaycaster.intersectObject(root, true);\n  for (const hit of hits) {\n    if (!hit.face) continue;\n    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);\n    if (normal.y < 0.42) continue;\n    const y = hit.point.y;\n    if (mode !== 'flight' && y > position.y + 0.72) continue;\n    lastGroundY = y;\n    return y;\n  }\n  return Number.isFinite(lastGroundY) ? lastGroundY : 0;\n}\n\nfunction applyGroundGravity(dt, lift = 0) {\n  if (!playerRoot) return;\n  const groundY = sampleLubiakGroundHeight(playerRoot.position, playerMode);\n  const targetY = groundY + lift;\n  const delta = targetY - playerRoot.position.y;\n\n  // Strong ground adhesion: quick enough for steps/slopes, still visually smooth.\n  const rate = delta > 0 ? 18 : 13;\n  playerRoot.position.y += delta * Math.min(1, dt * rate);\n  if (Math.abs(delta) < 0.012) playerRoot.position.y = targetY;\n  playerBaseY = groundY;\n}\n\n`;
src = src.replace(anchor, helper + anchor);

const walkNeedle = `    playerRoot.position.addScaledVector(playerVelocity, dt);\n    proceduralWalk(dt, THREE.MathUtils.clamp(playerVelocity.length() / 5, 0, 1));`;
if (!src.includes(walkNeedle)) throw new Error('walk movement anchor missing');
src = src.replace(walkNeedle, `    playerRoot.position.addScaledVector(playerVelocity, dt);\n    applyGroundGravity(dt, 0.02);\n    proceduralWalk(dt, THREE.MathUtils.clamp(playerVelocity.length() / 5, 0, 1));`);

const mountNeedle = `    applyRidePose(t);\n    playerRoot.position.y = playerBaseY + t * 2.6;\n    playerRoot.rotation.x = -0.08 * t;`;
if (!src.includes(mountNeedle)) throw new Error('mounting anchor missing');
src = src.replace(mountNeedle, `    applyRidePose(t);\n    const mountGroundY = sampleLubiakGroundHeight(playerRoot.position, 'walk');\n    playerBaseY = mountGroundY;\n    const mountTargetY = mountGroundY + t * 2.6;\n    playerRoot.position.y += (mountTargetY - playerRoot.position.y) * Math.min(1, dt * 16);\n    playerRoot.rotation.x = -0.08 * t;`);

const flightNeedle = `    playerRoot.position.addScaledVector(playerVelocity, dt);\n    playerRoot.position.y += (Math.max(playerBaseY + 2.6, 2.6) - playerRoot.position.y) * dt * 0.8;`;
if (!src.includes(flightNeedle)) throw new Error('flight altitude anchor missing');
src = src.replace(flightNeedle, `    playerRoot.position.addScaledVector(playerVelocity, dt);\n    // Flight altitude is always terrain-relative, never an absolute world-Y plane.\n    applyGroundGravity(dt, 2.6);`);

const enterNeedle = `    playerRoot.position.set(0, 0, 14.5);\n    playerBaseY = 0;`;
if (src.includes(enterNeedle)) {
  src = src.replace(enterNeedle, `    playerRoot.position.set(0, 0, 14.5);\n    playerBaseY = sampleLubiakGroundHeight(playerRoot.position, 'walk');\n    playerRoot.position.y = playerBaseY + 0.02;`);
}

fs.writeFileSync(path, src);
console.log('Applied GLB-surface gravity / terrain-relative djinn+broom grounding.');
