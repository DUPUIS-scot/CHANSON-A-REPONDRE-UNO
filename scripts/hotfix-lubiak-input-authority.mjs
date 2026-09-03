import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

if (!src.includes("const keys = new Set();")) {
  const anchor = "const aerialSaved = { followYaw: 0, followPitch: -0.10, followDistance: 4.35 };";
  if (!src.includes(anchor)) throw new Error('LUBIAK aerial state anchor missing');
  const repair = `${anchor}\n\n// LUBIAK_INPUT_AUTHORITY_REPAIR_V1\nconst keys = new Set();\nfunction setCameraMode(nextMode) {\n  if (!playerReady || !playerRoot || nextMode === cameraMode) return;\n  if (nextMode === 'aerial') {\n    aerialSaved.followYaw = followYaw;\n    aerialSaved.followPitch = followPitch;\n    aerialSaved.followDistance = followDistance;\n    const dir = new THREE.Vector3();\n    camera.getWorldDirection(dir);\n    aerialYaw = Math.atan2(-dir.x, -dir.z);\n    aerialPitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));\n    cameraMode = 'aerial';\n    aerialReturnBlend = 0;\n    showStatus('AERIAL OBSERVATION · V TO RETURN', 1200);\n  } else {\n    cameraMode = 'follow';\n    followYaw = aerialSaved.followYaw;\n    followPitch = aerialSaved.followPitch;\n    followDistance = aerialSaved.followDistance;\n    aerialReturnBlend = 1;\n    showStatus('RETURNING TO DJINN', 800);\n  }\n  const toggle = document.querySelector('#lubiak-aerial-toggle');\n  if (toggle) toggle.textContent = cameraMode === 'aerial' ? 'RETURN' : 'AERIAL';\n}\naddEventListener('keydown', (event) => {\n  const key = event.key.toLowerCase();\n  if (key === 'v' && !event.repeat) {\n    setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow');\n    event.preventDefault();\n    return;\n  }\n  keys.add(key);\n});\naddEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));`;
  src = src.replace(anchor, repair);
}

if (!src.includes('LUBIAK_INPUT_AUTHORITY_REPAIR_V1')) throw new Error('input authority repair missing');
if (!src.includes('const keys = new Set();')) throw new Error('keys authority missing');
if (!src.includes('function setCameraMode(nextMode)')) throw new Error('camera mode authority missing');
fs.writeFileSync(path, src);
console.log('LUBIAK input authority repaired: keys + camera mode restored');
