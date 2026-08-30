import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

if (src.includes('LUBIAK_FOLLOW_CLIMB_RIDE_CONTROLS_V1')) {
  console.log('Follow/climb/ride controls already present.');
  process.exit(0);
}

const modeMarker = `// LUBIAK_THREE_MODE_SELECTOR_V1`;
if (!src.includes(modeMarker)) throw new Error('Three-mode selector must be applied first');
src = src.replace(modeMarker, `// LUBIAK_FOLLOW_CLIMB_RIDE_CONTROLS_V1\n${modeMarker}`);

// Close third-person videogame framing.
src = src.replace(`let followPitch = -0.12;\nlet followDistance = 6.6;`, `let followPitch = -0.10;\nlet followDistance = 4.35;`);
src = src.replace(`const aerialSaved = { followYaw: 0, followPitch: -0.12, followDistance: 6.6 };`, `const aerialSaved = { followYaw: 0, followPitch: -0.10, followDistance: 4.35 };`);
src = src.replace(`  followPitch = -0.10;\n  followDistance = 5.6;`, `  followPitch = -0.08;\n  followDistance = 4.35;`);
src = src.replace(`const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.45 : 1.25, 0));`, `const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.40 : 1.18, 0));`);
src = src.replace(`Math.sin(-followPitch) * followDistance + 1.05,`, `Math.sin(-followPitch) * followDistance + 0.72,`);
src = src.replace(`followDistance = THREE.MathUtils.clamp(followDistance + Math.sign(event.deltaY) * 0.55, 3.4, 11);`, `followDistance = THREE.MathUtils.clamp(followDistance + Math.sign(event.deltaY) * 0.45, 2.8, 7.2);`);

// Add shared UP/DOWN buttons near the movement sphere.
const joystickAnchor = `const joystickVector = new THREE.Vector2();`;
const controls = `let verticalTrigger = 0;\nlet climbAttached = false;\nconst verticalDock = document.createElement('div');\nverticalDock.id = 'lubiak-vertical-dock';\nverticalDock.style.cssText = 'position:fixed;right:max(146px,calc(env(safe-area-inset-right) + 146px));bottom:max(22px,env(safe-area-inset-bottom));z-index:72;display:flex;flex-direction:column;gap:7px;pointer-events:auto';\nfunction makeVerticalButton(label, value) {\n  const button = document.createElement('button');\n  button.type = 'button';\n  button.textContent = label;\n  button.style.cssText = 'min-width:64px;border:1px solid #f6c28b88;border-radius:12px;padding:10px;background:#160b08e8;color:#ffe2bd;font:800 9px/1 system-ui;letter-spacing:.12em;box-shadow:0 5px 16px #0009;touch-action:none;cursor:pointer';\n  const engage = (event) => { verticalTrigger = value; button.setPointerCapture?.(event.pointerId); event.preventDefault(); };\n  const release = () => { if (verticalTrigger === value) verticalTrigger = 0; };\n  button.addEventListener('pointerdown', engage);\n  button.addEventListener('pointerup', release);\n  button.addEventListener('pointercancel', release);\n  button.addEventListener('lostpointercapture', release);\n  verticalDock.appendChild(button);\n  return button;\n}\nconst verticalUpButton = makeVerticalButton('▲ UP', 1);\nconst verticalDownButton = makeVerticalButton('▼ DOWN', -1);\ndocument.body.appendChild(verticalDock);\nfunction refreshVerticalControls() {\n  const enabled = playerReady && cameraMode === 'follow' && (playerMode === 'walk' || playerMode === 'mounting' || playerMode === 'flight');\n  verticalDock.style.opacity = enabled ? '.94' : '.30';\n  verticalDock.style.pointerEvents = enabled ? 'auto' : 'none';\n  if (!enabled) verticalTrigger = 0;\n}\n\n${joystickAnchor}`;
if (!src.includes(joystickAnchor)) throw new Error('Joystick anchor missing');
src = src.replace(joystickAnchor, controls);

// Climbable wall probe: near-vertical authored mesh in front/around the djinn.
const rayAnchor = `function rayBlocked(origin, direction, distance) {`;
const climbFns = `function findClimbableSurface() {\n  if (!playerRoot || worldMode !== 'exterior') return null;\n  const origin = playerRoot.position.clone().add(new THREE.Vector3(0, 0.95, 0));\n  let best = null;\n  for (const dir of clearanceDirections) {\n    collisionRaycaster.set(origin, dir);\n    collisionRaycaster.near = 0.06;\n    collisionRaycaster.far = 1.15;\n    for (const root of activeCollisionRoots()) {\n      const hits = collisionRaycaster.intersectObject(root, true);\n      for (const hit of hits) {\n        const normal = worldHitNormal(hit);\n        if (!normal || Math.abs(normal.y) > 0.58) continue;\n        if (!best || hit.distance < best.hit.distance) best = { hit, normal };\n        break;\n      }\n    }\n  }\n  return best;\n}\n\nfunction applyFollowClimb(dt) {\n  if (!verticalTrigger || cameraMode !== 'follow' || playerMode !== 'walk') { climbAttached = false; return false; }\n  const wall = findClimbableSurface();\n  if (!wall) { climbAttached = false; return false; }\n  climbAttached = true;\n  playerVelocity.set(0, 0, 0);\n  restoreStandingWalkPose();\n  const nextY = playerRoot.position.y + verticalTrigger * 3.1 * dt;\n  playerRoot.position.y = THREE.MathUtils.clamp(nextY, 0, movementBounds?.max.y ?? 24);\n  playerBaseY = playerRoot.position.y;\n  const n = wall.normal.clone(); n.y = 0;\n  if (n.lengthSq() > 1e-6) {\n    n.normalize();\n    const hold = wall.hit.point.clone().addScaledVector(n, 0.46);\n    playerRoot.position.x += (hold.x - playerRoot.position.x) * Math.min(1, dt * 14);\n    playerRoot.position.z += (hold.z - playerRoot.position.z) * Math.min(1, dt * 14);\n    const face = Math.atan2(-n.x, -n.z);\n    playerHeading += (face - playerHeading) * Math.min(1, dt * 10);\n    playerRoot.rotation.y = playerHeading;\n  }\n  return true;\n}\n\n${rayAnchor}`;
if (!src.includes(rayAnchor)) throw new Error('Ray blocker anchor missing');
src = src.replace(rayAnchor, climbFns);

// FOLLOW walk uses UP/DOWN to climb a contacted wall instead of ground gravity.
const walkStart = `  if (playerMode === 'walk') {\n    // Standing is the walk/idle baseline. Clear all ride transforms before locomotion.\n    restoreStandingWalkPose();`;
const walkStartNew = `  if (playerMode === 'walk') {\n    // Standing is the walk/idle baseline. Clear all ride transforms before locomotion.\n    restoreStandingWalkPose();\n    const climbingNow = applyFollowClimb(dt);`;
if (!src.includes(walkStart)) throw new Error('Walk branch anchor missing');
src = src.replace(walkStart, walkStartNew);
src = src.replace(`    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);\n    if (mag > 0.05) {`, `    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);\n    if (!climbingNow && mag > 0.05) {`);
src = src.replace(`    movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);\n    applyGroundGravity(dt);\n    proceduralWalk(dt, THREE.MathUtils.clamp(playerVelocity.length() / 5, 0, 1));`, `    if (!climbingNow) {\n      movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);\n      applyGroundGravity(dt);\n      proceduralWalk(dt, THREE.MathUtils.clamp(playerVelocity.length() / 5, 0, 1));\n    } else {\n      proceduralWalk(dt, 0);\n    }`);

// RIDE: same UP/DOWN buttons become vertical broom thrust.
const verticalKeyOld = `    const verticalKey = (keys.has(' ') || keys.has('space') || keys.has('pageup') || keys.has('e') ? 1 : 0)\n      - (keys.has('control') || keys.has('ctrl') || keys.has('pagedown') || keys.has('q') ? 1 : 0);`;
const verticalKeyNew = `    const keyboardVertical = (keys.has(' ') || keys.has('space') || keys.has('pageup') || keys.has('e') ? 1 : 0)\n      - (keys.has('control') || keys.has('ctrl') || keys.has('pagedown') || keys.has('q') ? 1 : 0);\n    const verticalKey = THREE.MathUtils.clamp(keyboardVertical + verticalTrigger, -1, 1);`;
if (!src.includes(verticalKeyOld)) throw new Error('Flight vertical key anchor missing');
src = src.replace(verticalKeyOld, verticalKeyNew);

// Keep UI state synced with mode transitions.
src = src.replace(`function refreshLubiakModeButtons() {`, `function refreshLubiakModeButtons() {\n  if (typeof refreshVerticalControls === 'function') refreshVerticalControls();`);
src = src.replace(`function setCameraMode(nextMode) {`, `function setCameraMode(nextMode) {\n  if (typeof refreshVerticalControls === 'function') refreshVerticalControls();`);
src = src.replace(`      showStatus('RIDE MODE · DA NOBLE Y2K', 900);`, `      if (typeof refreshVerticalControls === 'function') refreshVerticalControls();\n      showStatus('RIDE MODE · DA NOBLE Y2K', 900);`);

fs.writeFileSync(path, src);
console.log('Added close third-person FOLLOW, wall climb UP/DOWN, and RIDE altitude UP/DOWN.');
