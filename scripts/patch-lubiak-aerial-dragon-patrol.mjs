import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let s = fs.readFileSync(path, 'utf8');

const globalsOld = `let dragonRoot = null;\nlet dragonMixer = null;\nlet exteriorRoot = null;`;
const globalsNew = `let dragonRoot = null;\nlet dragonMixer = null;\n// LUBIAK_AERIAL_DRAGON_PATROL_V1\nlet dragonGuardianPosition = new THREE.Vector3();\nlet dragonGuardianQuaternion = new THREE.Quaternion();\nlet dragonPatrolPhase = 0;\nlet dragonPatrolBlend = 0;\nlet exteriorRoot = null;`;
if (!s.includes(globalsOld) && !s.includes('LUBIAK_AERIAL_DRAGON_PATROL_V1')) throw new Error('dragon globals anchor missing');
if (!s.includes('LUBIAK_AERIAL_DRAGON_PATROL_V1')) s = s.replace(globalsOld, globalsNew);

const prepareOld = `  dragonLight.position.set(0, targetHeight * 0.55, root.position.z + targetHeight * 0.35);\n}`;
const prepareNew = `  dragonLight.position.set(0, targetHeight * 0.55, root.position.z + targetHeight * 0.35);\n  dragonGuardianPosition.copy(root.position);\n  dragonGuardianQuaternion.copy(root.quaternion);\n  dragonPatrolPhase = 0;\n  dragonPatrolBlend = 0;\n}`;
if (!s.includes(prepareOld) && !s.includes('dragonGuardianPosition.copy(root.position)')) throw new Error('prepareDragon anchor missing');
if (!s.includes('dragonGuardianPosition.copy(root.position)')) s = s.replace(prepareOld, prepareNew);

const aerialFnAnchor = `function updateAerialCamera(dt) {`;
const patrolFn = `function updateDragonPatrol(dt) {\n  if (!dragonRoot || worldMode !== 'exterior') return;\n  const env = environmentSize || new THREE.Vector3(76, 30, 130);\n  const targetBlend = cameraMode === 'aerial' ? 1 : 0;\n  dragonPatrolBlend += (targetBlend - dragonPatrolBlend) * (1 - Math.exp(-dt * (targetBlend ? 1.8 : 1.25)));\n\n  if (dragonPatrolBlend < 0.001 && targetBlend === 0) {\n    dragonRoot.position.copy(dragonGuardianPosition);\n    dragonRoot.quaternion.copy(dragonGuardianQuaternion);\n    dragonLight.position.set(\n      dragonRoot.position.x,\n      dragonRoot.position.y + Math.max(4, env.y * 0.18),\n      dragonRoot.position.z + Math.max(3, env.z * 0.035),\n    );\n    return;\n  }\n\n  if (cameraMode === 'aerial') dragonPatrolPhase += dt * 0.19;\n  const a = dragonPatrolPhase * Math.PI * 2;\n  const rx = Math.max(22, env.x * 0.42);\n  const rz = Math.max(34, env.z * 0.34);\n  const baseY = Math.max(10, env.y * 0.42);\n  const patrolPos = new THREE.Vector3(\n    Math.sin(a) * rx,\n    baseY + Math.sin(a * 2.0 + 0.7) * Math.max(2.5, env.y * 0.07),\n    Math.cos(a) * rz,\n  );\n  const tangent = new THREE.Vector3(\n    Math.cos(a) * rx,\n    Math.cos(a * 2.0 + 0.7) * Math.max(5, env.y * 0.14),\n    -Math.sin(a) * rz,\n  ).normalize();\n  const patrolQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(\n    THREE.MathUtils.clamp(-tangent.y * 0.22, -0.18, 0.18),\n    Math.atan2(tangent.x, tangent.z),\n    THREE.MathUtils.clamp(-Math.sin(a) * 0.13, -0.13, 0.13),\n    'YXZ',\n  ));\n\n  dragonRoot.position.lerpVectors(dragonGuardianPosition, patrolPos, dragonPatrolBlend);\n  dragonRoot.quaternion.copy(dragonGuardianQuaternion).slerp(patrolQuat, dragonPatrolBlend);\n  dragonLight.position.set(\n    dragonRoot.position.x,\n    dragonRoot.position.y + Math.max(4, env.y * 0.18),\n    dragonRoot.position.z + Math.max(3, env.z * 0.035),\n  );\n}\n\nfunction updateAerialCamera(dt) {`;
if (!s.includes('function updateDragonPatrol(dt)')) {
  if (!s.includes(aerialFnAnchor)) throw new Error('aerial camera anchor missing');
  s = s.replace(aerialFnAnchor, patrolFn);
}

const animateOld = `  if (dragonMixer && worldMode === 'exterior') dragonMixer.update(dt);\n  if (playerReady) {`;
const animateNew = `  if (dragonMixer && worldMode === 'exterior') dragonMixer.update(dt);\n  updateDragonPatrol(dt);\n  if (playerReady) {`;
if (!s.includes(animateOld) && !s.includes('updateDragonPatrol(dt);\n  if (playerReady)')) throw new Error('animate anchor missing');
if (!s.includes('updateDragonPatrol(dt);\n  if (playerReady)')) s = s.replace(animateOld, animateNew);

fs.writeFileSync(path, s);
console.log('Patched LUBIAK aerial dragon patrol.');
