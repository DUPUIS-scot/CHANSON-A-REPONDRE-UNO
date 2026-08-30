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
`const PLAYER_COLLISION_RADIUS = 0.34;\nconst BROOM_COLLISION_RADIUS = 0.28;`,
`const PLAYER_COLLISION_RADIUS = 0.34;\nconst BROOM_COLLISION_RADIUS = 0.28;\n// LUBIAK_ENTRANCE_CLEARANCE_V1\n// Keep the complete djinn + DA NOBLE Y2K silhouette away from nearby mesh borders.\nconst PLAYER_BORDER_CLEARANCE = 0.62;\nconst BROOM_BORDER_CLEARANCE = 0.78;\nconst clearanceDirections = Array.from({ length: 12 }, (_, i) => {\n  const a = (i / 12) * Math.PI * 2;\n  return new THREE.Vector3(Math.cos(a), 0, Math.sin(a));\n});`,
'clearance constants'
);

replaceOnce(
`function rayBlocked(origin, direction, distance) {\n  if(direction.lengthSq()<1e-8) return false;\n  collisionRaycaster.set(origin, direction.clone().normalize());\n  collisionRaycaster.near=0;\n  collisionRaycaster.far=distance;\n  for(const root of activeCollisionRoots()) {\n    const hits=collisionRaycaster.intersectObject(root,true);\n    if(hits.some(h=>h.distance<=distance)) return true;\n  }\n  return false;\n}`,
`function rayBlocked(origin, direction, distance) {\n  if(direction.lengthSq()<1e-8) return false;\n  collisionRaycaster.set(origin, direction.clone().normalize());\n  collisionRaycaster.near=0;\n  collisionRaycaster.far=distance;\n  for(const root of activeCollisionRoots()) {\n    const hits=collisionRaycaster.intersectObject(root,true);\n    if(hits.some(h=>h.distance<=distance)) return true;\n  }\n  return false;\n}\n\nfunction hasMeshClearance(point, includeBroom=false) {\n  const radius = PLAYER_BORDER_CLEARANCE + (includeBroom ? BROOM_BORDER_CLEARANCE : 0);\n  for (const h of [0.24, 0.82, 1.36]) {\n    const origin = point.clone().add(new THREE.Vector3(0, h, 0));\n    for (const dir of clearanceDirections) {\n      if (rayBlocked(origin, dir, radius)) return false;\n    }\n  }\n  return true;\n}\n\nfunction findSafeEntranceSpawn(anchor, includeBroom=true) {\n  const candidates = [anchor.clone()];\n  // Entrance apron search: first spread sideways, then slightly outward/inward.\n  for (const zOffset of [0, 1.2, -1.2, 2.4, -2.4, 3.6]) {\n    for (const xOffset of [0, 1.2, -1.2, 2.4, -2.4, 3.6, -3.6]) {\n      if (xOffset === 0 && zOffset === 0) continue;\n      candidates.push(anchor.clone().add(new THREE.Vector3(xOffset, 0, zOffset)));\n    }\n  }\n  for (const candidate of candidates) {\n    const ground = groundSurfaceBelow(candidate, 12);\n    if (!ground) continue;\n    candidate.y = ground.hit.point.y + 0.045;\n    if (hasMeshClearance(candidate, includeBroom)) return candidate;\n  }\n  return anchor.clone();\n}`,
'clearance helpers'
);

replaceOnce(
`  const env = environmentSize || new THREE.Vector3(76, 30, 130);\n  playerRoot.position.set(0, 0.08, Math.min(env.z * 0.34, 42));\n  playerBaseY = playerRoot.position.y;\n  playerHeading = Math.PI;\n  playerRoot.rotation.set(0, playerHeading, 0, 'YXZ');\n  scene.add(playerRoot);\n  // Spawn on the real walkable architecture after all environment transforms.\n  const spawnGround = groundSurfaceBelow(playerRoot.position, 12);\n  if (spawnGround) {\n    playerRoot.position.y = spawnGround.hit.point.y + 0.045;\n    playerBaseY = playerRoot.position.y;\n  }`,
`  const env = environmentSize || new THREE.Vector3(76, 30, 130);\n  // Spawn on the open entrance apron of the authored LUBIAK GLB, facing inward.\n  // The camera also frames the district from +Z, so this keeps entrance semantics stable\n  // across optimized/fallback GLBs while avoiding close mesh borders.\n  const entranceAnchor = new THREE.Vector3(0, 0.08, Math.min(env.z * 0.40, 48));\n  playerRoot.position.copy(entranceAnchor);\n  playerBaseY = playerRoot.position.y;\n  playerHeading = Math.PI;\n  playerRoot.rotation.set(0, playerHeading, 0, 'YXZ');\n  scene.add(playerRoot);\n  const safeEntrance = findSafeEntranceSpawn(entranceAnchor, true);\n  playerRoot.position.copy(safeEntrance);\n  playerBaseY = playerRoot.position.y;`,
'entrance spawn'
);

replaceOnce(
`  const solved=resolvePlayerCollision(start,desired,includeBroom);\n  if(solved.equals(start)) {`,
`  let solved=resolvePlayerCollision(start,desired,includeBroom);\n  if(!solved.equals(start) && !hasMeshClearance(solved, includeBroom)) solved=start.clone();\n  if(solved.equals(start)) {`,
'move clearance primary'
);

replaceOnce(
`    const xTry=resolvePlayerCollision(start,start.clone().add(new THREE.Vector3(delta.x,0,0)),includeBroom);\n    playerRoot.position.copy(xTry);\n    const zStart=playerRoot.position.clone();\n    const zTry=resolvePlayerCollision(zStart,zStart.clone().add(new THREE.Vector3(0,delta.y,delta.z)),includeBroom);\n    playerRoot.position.copy(zTry);`,
`    let xTry=resolvePlayerCollision(start,start.clone().add(new THREE.Vector3(delta.x,0,0)),includeBroom);\n    if(!xTry.equals(start) && !hasMeshClearance(xTry, includeBroom)) xTry=start.clone();\n    playerRoot.position.copy(xTry);\n    const zStart=playerRoot.position.clone();\n    let zTry=resolvePlayerCollision(zStart,zStart.clone().add(new THREE.Vector3(0,delta.y,delta.z)),includeBroom);\n    if(!zTry.equals(zStart) && !hasMeshClearance(zTry, includeBroom)) zTry=zStart.clone();\n    playerRoot.position.copy(zTry);`,
'move clearance slide'
);

if (!changed) {
  console.log('LUBIAK entrance clearance already installed.');
  process.exit(0);
}

fs.writeFileSync(path, src);
console.log('Installed entrance-apron spawn and djinn+broom mesh-border clearance.');
