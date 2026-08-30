import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let s = fs.readFileSync(path, 'utf8');

function replaceOnce(from, to, label) {
  if (!s.includes(from)) throw new Error(`Missing anchor: ${label}`);
  s = s.replace(from, to);
}

replaceOnce(
`let dragonRoot = null;\nlet dragonMixer = null;`,
`let dragonRoot = null;\nlet dragonMixer = null;\nlet dragonActions = {};\nlet dragonState = 'rest';\nlet dragonStateTime = 0;\nlet dragonObservedTime = 0;\nlet dragonHome = new THREE.Vector3();\nlet dragonPatrolOrigin = new THREE.Vector3();\nlet dragonFlightPhase = 0;\nlet dragonCurrentAction = null;`,
'dragon state vars',
);

replaceOnce(
`function prepareDragon(root) {`,
`function dragonClipScore(name, role) {\n  const n = (name || '').toLowerCase();\n  const keys = {\n    fly: ['fly', 'flight', 'wing', 'glide'],\n    pose: ['pose', 'roar', 'threat', 'attack', 'display'],\n    vigilant: ['vigil', 'guard', 'alert', 'watch', 'idle'],\n    rest: ['rest', 'sleep', 'idle', 'sit', 'stand'],\n  }[role] || [];\n  return keys.reduce((score, key, i) => score + (n.includes(key) ? (keys.length - i) : 0), 0);\n}\n\nfunction chooseDragonAction(role) {\n  const actions = Object.values(dragonActions);\n  if (!actions.length) return null;\n  let best = null;\n  let bestScore = -1;\n  for (const entry of actions) {\n    const score = dragonClipScore(entry.clip.name, role);\n    if (score > bestScore) { best = entry.action; bestScore = score; }\n  }\n  return best || actions[0].action;\n}\n\nfunction playDragonRole(role, fade = 0.45) {\n  const next = chooseDragonAction(role);\n  if (!next || next === dragonCurrentAction) return;\n  next.enabled = true;\n  next.setEffectiveWeight(1);\n  next.setEffectiveTimeScale(role === 'rest' ? 0.7 : role === 'vigilant' ? 0.9 : 1);\n  next.reset().fadeIn(fade).play();\n  if (dragonCurrentAction) dragonCurrentAction.fadeOut(fade);\n  dragonCurrentAction = next;\n}\n\nfunction setDragonState(next) {\n  if (!dragonRoot || dragonState === next) return;\n  dragonState = next;\n  dragonStateTime = 0;\n  if (next === 'flyover' || next === 'flyby') {\n    dragonFlightPhase = 0;\n    dragonPatrolOrigin.copy(dragonRoot.position);\n    playDragonRole('fly');\n  } else if (next === 'pose') {\n    playDragonRole('pose');\n  } else if (next === 'vigilant') {\n    playDragonRole('vigilant');\n  } else {\n    playDragonRole('rest');\n  }\n}\n\nfunction isDragonObserved() {\n  if (!dragonRoot || worldMode !== 'exterior') return false;\n  const dragonPos = dragonRoot.getWorldPosition(new THREE.Vector3());\n  const toDragon = dragonPos.sub(camera.position);\n  const distance = toDragon.length();\n  if (distance < 0.01 || distance > Math.max(120, (environmentSize?.z || 130) * 1.2)) return false;\n  toDragon.normalize();\n  const cameraDir = camera.getWorldDirection(new THREE.Vector3());\n  return cameraDir.dot(toDragon) > 0.90;\n}\n\nfunction updateDragonBehaviour(dt) {\n  if (!dragonRoot || worldMode !== 'exterior') return;\n  dragonStateTime += dt;\n  const observed = isDragonObserved();\n  dragonObservedTime = observed ? Math.min(4, dragonObservedTime + dt) : Math.max(0, dragonObservedTime - dt * 1.8);\n\n  const env = environmentSize || new THREE.Vector3(76, 30, 130);\n  const playerDistance = playerReady ? dragonRoot.position.distanceTo(playerRoot.position) : Infinity;\n\n  if (dragonState === 'rest') {\n    dragonRoot.position.lerp(dragonHome, 1 - Math.exp(-dt * 1.8));\n    if (dragonObservedTime > 0.8 || playerDistance < 26) setDragonState('vigilant');\n    else if (dragonStateTime > 12) setDragonState('flyover');\n  } else if (dragonState === 'vigilant') {\n    const watchTarget = playerReady ? playerRoot.position : camera.position;\n    const dx = watchTarget.x - dragonRoot.position.x;\n    const dz = watchTarget.z - dragonRoot.position.z;\n    const targetYaw = Math.atan2(dx, dz);\n    const yawDiff = THREE.MathUtils.euclideanModulo(targetYaw - dragonRoot.rotation.y + Math.PI, Math.PI * 2) - Math.PI;\n    dragonRoot.rotation.y += yawDiff * Math.min(1, dt * 2.6);\n    if (dragonObservedTime > 1.8 && dragonStateTime > 1.2) setDragonState('pose');\n    else if (dragonObservedTime <= 0.05 && playerDistance > 34 && dragonStateTime > 6) setDragonState('rest');\n  } else if (dragonState === 'pose') {\n    if (dragonStateTime > 2.6) setDragonState(observed ? 'flyby' : 'vigilant');\n  } else if (dragonState === 'flyover' || dragonState === 'flyby') {\n    dragonFlightPhase += dt * (dragonState === 'flyby' ? 0.14 : 0.095);\n    const phase = dragonFlightPhase;\n    const radiusX = Math.max(22, env.x * (dragonState === 'flyby' ? 0.30 : 0.46));\n    const radiusZ = Math.max(28, env.z * (dragonState === 'flyby' ? 0.22 : 0.38));\n    const centre = dragonState === 'flyby' && playerReady ? playerRoot.position : new THREE.Vector3(0, 0, -env.z * 0.12);\n    const target = new THREE.Vector3(\n      centre.x + Math.sin(phase * Math.PI * 2) * radiusX,\n      Math.max(9, env.y * 0.36) + Math.sin(phase * Math.PI * 4) * 2.2,\n      centre.z + Math.cos(phase * Math.PI * 2) * radiusZ,\n    );\n    const prev = dragonRoot.position.clone();\n    dragonRoot.position.lerp(target, 1 - Math.exp(-dt * 2.4));\n    const velocity = dragonRoot.position.clone().sub(prev);\n    if (velocity.lengthSq() > 0.00001) {\n      const yaw = Math.atan2(velocity.x, velocity.z);\n      const yawDiff = THREE.MathUtils.euclideanModulo(yaw - dragonRoot.rotation.y + Math.PI, Math.PI * 2) - Math.PI;\n      dragonRoot.rotation.y += yawDiff * Math.min(1, dt * 5.5);\n      dragonRoot.rotation.z = THREE.MathUtils.lerp(dragonRoot.rotation.z, -yawDiff * 0.22, Math.min(1, dt * 3));\n    }\n    if (dragonStateTime > (dragonState === 'flyby' ? 9 : 14)) setDragonState('vigilant');\n  }\n\n  if (dragonState !== 'flyover' && dragonState !== 'flyby') {\n    dragonRoot.rotation.z *= Math.max(0, 1 - dt * 4);\n  }\n  dragonLight.position.set(dragonRoot.position.x, dragonRoot.position.y + 2.5, dragonRoot.position.z + 2);\n}\n\nfunction prepareDragon(root) {`,
'dragon behavior functions',
);

replaceOnce(
`  dragonLight.position.set(0, targetHeight * 0.55, root.position.z + targetHeight * 0.35);\n}`,
`  dragonLight.position.set(0, targetHeight * 0.55, root.position.z + targetHeight * 0.35);\n  dragonHome.copy(root.position);\n  dragonPatrolOrigin.copy(root.position);\n  dragonState = 'rest';\n  dragonStateTime = 0;\n  dragonObservedTime = 0;\n}`,
'prepare dragon home',
);

replaceOnce(
`    dragonMixer = null;\n    if (Array.isArray(gltf.animations) && gltf.animations.length > 0) {\n      dragonMixer = new THREE.AnimationMixer(dragonRoot);\n      for (const clip of gltf.animations) {\n        const action = dragonMixer.clipAction(clip);\n        action.setLoop(THREE.LoopRepeat, Infinity);\n        action.clampWhenFinished = false;\n        action.enabled = true;\n        action.play();\n      }\n    }`,
`    dragonMixer = null;\n    dragonActions = {};\n    dragonCurrentAction = null;\n    if (Array.isArray(gltf.animations) && gltf.animations.length > 0) {\n      dragonMixer = new THREE.AnimationMixer(dragonRoot);\n      gltf.animations.forEach((clip, index) => {\n        const action = dragonMixer.clipAction(clip);\n        action.setLoop(THREE.LoopRepeat, Infinity);\n        action.clampWhenFinished = false;\n        action.enabled = true;\n        action.setEffectiveWeight(0);\n        action.play();\n        dragonActions[clip.name || `clip_${index}`] = { clip, action };\n      });\n      playDragonRole('rest', 0);\n    }`,
'dragon animation selection',
);

replaceOnce(
`  if (dragonMixer && worldMode === 'exterior') dragonMixer.update(dt);`,
`  if (dragonMixer && worldMode === 'exterior') dragonMixer.update(dt);\n  updateDragonBehaviour(dt);`,
'animate hook',
);

fs.writeFileSync(path, s);
console.log('Applied LUBIAK dragon flyover / pose / vigilant / rest / observation fly-by behaviour.');
