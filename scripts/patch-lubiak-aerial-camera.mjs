import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');
if (src.includes('LUBIAK_AERIAL_CAMERA_V1')) {
  console.log('Aerial camera patch already present.');
  process.exit(0);
}

function replaceOnce(needle, replacement, label) {
  if (!src.includes(needle)) throw new Error(`Missing patch anchor: ${label}`);
  src = src.replace(needle, replacement);
}

replaceOnce(
`let followDistance = 6.6;\nlet walkPhase = 0;`,
`let followDistance = 6.6;\n// LUBIAK_AERIAL_CAMERA_V1\nlet cameraMode = 'follow';\nlet aerialYaw = 0;\nlet aerialPitch = -0.28;\nlet aerialSpeed = 18;\nlet aerialReturnBlend = 0;\nconst aerialSaved = { followYaw: 0, followPitch: -0.12, followDistance: 6.6 };\nlet walkPhase = 0;`,
'camera globals');

replaceOnce(
`const keys = new Set();\naddEventListener('keydown', (event) => keys.add(event.key.toLowerCase()));\naddEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));`,
`const keys = new Set();\nfunction setCameraMode(nextMode) {\n  if (!playerReady || !playerRoot || nextMode === cameraMode) return;\n  if (nextMode === 'aerial') {\n    aerialSaved.followYaw = followYaw;\n    aerialSaved.followPitch = followPitch;\n    aerialSaved.followDistance = followDistance;\n    const dir = new THREE.Vector3();\n    camera.getWorldDirection(dir);\n    aerialYaw = Math.atan2(-dir.x, -dir.z);\n    aerialPitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));\n    cameraMode = 'aerial';\n    aerialReturnBlend = 0;\n    showStatus('AERIAL OBSERVATION · V TO RETURN', 1200);\n  } else {\n    cameraMode = 'follow';\n    followYaw = aerialSaved.followYaw;\n    followPitch = aerialSaved.followPitch;\n    followDistance = aerialSaved.followDistance;\n    aerialReturnBlend = 1;\n    showStatus('RETURNING TO DJINN', 800);\n  }\n  if (aerialToggle) aerialToggle.textContent = cameraMode === 'aerial' ? 'RETURN' : 'AERIAL';\n}\n\naddEventListener('keydown', (event) => {\n  const key = event.key.toLowerCase();\n  if (key === 'v' && !event.repeat) {\n    setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow');\n    event.preventDefault();\n    return;\n  }\n  keys.add(key);\n});\naddEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));`,
'keyboard camera toggle');

replaceOnce(
`let drag = null;\nrenderer.domElement.addEventListener('pointerdown', (event) => {\n  if (handlePlayerGatePointer(event) || handleDragonGatePointer(event)) {`,
`let drag = null;\nrenderer.domElement.addEventListener('pointerdown', (event) => {\n  if (cameraMode === 'follow' && (handlePlayerGatePointer(event) || handleDragonGatePointer(event))) {`,
'gate isolation');

replaceOnce(
`  if (playerReady) {\n    followYaw -= (event.clientX - drag.x) * 0.0042;\n    followPitch -= (event.clientY - drag.y) * 0.0032;\n    followPitch = THREE.MathUtils.clamp(followPitch, -0.58, 0.38);\n  } else {`,
`  if (playerReady && cameraMode === 'aerial') {\n    aerialYaw -= (event.clientX - drag.x) * 0.0042;\n    aerialPitch -= (event.clientY - drag.y) * 0.0032;\n    aerialPitch = THREE.MathUtils.clamp(aerialPitch, -1.32, 1.20);\n  } else if (playerReady) {\n    followYaw -= (event.clientX - drag.x) * 0.0042;\n    followPitch -= (event.clientY - drag.y) * 0.0032;\n    followPitch = THREE.MathUtils.clamp(followPitch, -0.58, 0.38);\n  } else {`,
'pointer aerial orbit');

replaceOnce(
`  if (playerReady) {\n    followDistance = THREE.MathUtils.clamp(followDistance + Math.sign(event.deltaY) * 0.55, 3.4, 11);\n  } else {`,
`  if (playerReady && cameraMode === 'aerial') {\n    aerialSpeed = THREE.MathUtils.clamp(aerialSpeed + Math.sign(event.deltaY) * 2.2, 5, 48);\n  } else if (playerReady) {\n    followDistance = THREE.MathUtils.clamp(followDistance + Math.sign(event.deltaY) * 0.55, 3.4, 11);\n  } else {`,
'wheel aerial speed');

replaceOnce(
`document.head.appendChild(joystickStyle);\n\nconst joystickVector = new THREE.Vector2();`,
`document.head.appendChild(joystickStyle);\n\nconst aerialToggle = document.createElement('button');\naerialToggle.id = 'lubiak-aerial-toggle';\naerialToggle.type = 'button';\naerialToggle.textContent = 'AERIAL';\naerialToggle.setAttribute('aria-label', 'Toggle aerial observation camera');\naerialToggle.style.cssText = 'position:fixed;right:18px;bottom:22px;z-index:70;border:1px solid #f6c28b88;border-radius:999px;padding:10px 14px;background:#160b08dd;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.14em;box-shadow:0 6px 20px #0009;cursor:pointer';\naerialToggle.addEventListener('click', () => setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow'));\ndocument.body.appendChild(aerialToggle);\n\nconst joystickVector = new THREE.Vector2();`,
'aerial toggle button');

replaceOnce(
`function updateFallbackCamera(dt) {`,
`function updateAerialCamera(dt) {\n  if (!playerReady || cameraMode !== 'aerial') return;\n  const input = combinedMoveInput();\n  const cp = Math.cos(aerialPitch);\n  const forward = new THREE.Vector3(-Math.sin(aerialYaw) * cp, Math.sin(aerialPitch), -Math.cos(aerialYaw) * cp).normalize();\n  const right = new THREE.Vector3(Math.cos(aerialYaw), 0, -Math.sin(aerialYaw)).normalize();\n  const vertical = (keys.has(' ') || keys.has('space') || keys.has('pageup') || keys.has('e') ? 1 : 0)\n    - (keys.has('control') || keys.has('ctrl') || keys.has('pagedown') || keys.has('q') ? 1 : 0);\n  const delta = new THREE.Vector3();\n  delta.addScaledVector(forward, input.y * aerialSpeed * dt);\n  delta.addScaledVector(right, input.x * aerialSpeed * dt);\n  delta.y += vertical * aerialSpeed * dt;\n  camera.position.add(delta);\n  if (movementBounds) {\n    const pad = Math.max(10, (environmentSize?.y || 30) * 1.5);\n    camera.position.x = THREE.MathUtils.clamp(camera.position.x, movementBounds.min.x - pad, movementBounds.max.x + pad);\n    camera.position.z = THREE.MathUtils.clamp(camera.position.z, movementBounds.min.z - pad, movementBounds.max.z + pad);\n    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.8, movementBounds.max.y + pad * 2);\n  }\n  camera.rotation.order = 'YXZ';\n  camera.rotation.y = aerialYaw;\n  camera.rotation.x = aerialPitch;\n}\n\nfunction updateFallbackCamera(dt) {`,
'aerial camera function');

replaceOnce(
`  if (playerReady) {\n    updatePlayer(dt);\n    updateFollowCamera(dt);\n  } else {`,
`  if (playerReady) {\n    if (cameraMode === 'aerial') {\n      // Freeze the djinn and broom exactly where they are while the detached camera explores LUBIAK.\n      updateAerialCamera(dt);\n    } else {\n      updatePlayer(dt);\n      updateFollowCamera(dt);\n      if (aerialReturnBlend > 0) aerialReturnBlend = Math.max(0, aerialReturnBlend - dt * 1.4);\n    }\n  } else {`,
'animation mode split');

fs.writeFileSync(path, src);
console.log('Applied LUBIAK aerial camera mode.');
