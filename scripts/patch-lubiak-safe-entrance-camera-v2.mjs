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
`  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  // Spawn on the open entrance apron of the authored LUBIAK GLB, facing inward.
  // The camera also frames the district from +Z, so this keeps entrance semantics stable
  // across optimized/fallback GLBs while avoiding close mesh borders.
  const entranceAnchor = new THREE.Vector3(0, 0.08, Math.min(env.z * 0.40, 48));
  playerRoot.position.copy(entranceAnchor);
  playerBaseY = playerRoot.position.y;
  playerHeading = Math.PI;
  playerRoot.rotation.set(0, playerHeading, 0, 'YXZ');
  scene.add(playerRoot);
  const safeEntrance = findSafeEntranceSpawn(entranceAnchor, true);
  playerRoot.position.copy(safeEntrance);
  playerBaseY = playerRoot.position.y;
  cachePlayerBones();
  playerReady = true;`,
`  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  // LUBIAK_SAFE_ENTRANCE_CAMERA_V2
  // The authored GLB is centred around the origin. Its public/street entrance is on
  // the +Z side (the same side from which frameLoadedEnvironment initially views it).
  // Start OUTSIDE that edge and scan inward; never guess from an interior percentage.
  const entranceAnchor = new THREE.Vector3(0, 0.08, env.z * 0.60);
  playerRoot.position.copy(entranceAnchor);
  playerBaseY = playerRoot.position.y;
  playerHeading = Math.PI;
  playerRoot.rotation.set(0, playerHeading, 0, 'YXZ');
  scene.add(playerRoot);
  const safeEntrance = findSafeEntranceSpawn(entranceAnchor, true);
  playerRoot.position.copy(safeEntrance);
  playerBaseY = playerRoot.position.y;
  followYaw = 0;
  followPitch = -0.10;
  followDistance = 5.6;
  cachePlayerBones();
  playerReady = true;
  // Place the camera immediately on the safe exterior side before the first player frame.
  updateFollowCamera(1);`,
'player entrance spawn'
);

replaceOnce(
`function findSafeEntranceSpawn(anchor, includeBroom=true) {
  const candidates = [anchor.clone()];
  // Entrance apron search: first spread sideways, then slightly outward/inward.
  for (const zOffset of [0, 1.2, -1.2, 2.4, -2.4, 3.6]) {
    for (const xOffset of [0, 1.2, -1.2, 2.4, -2.4, 3.6, -3.6]) {
      if (xOffset === 0 && zOffset === 0) continue;
      candidates.push(anchor.clone().add(new THREE.Vector3(xOffset, 0, zOffset)));
    }
  }
  for (const candidate of candidates) {
    const ground = groundSurfaceBelow(candidate, 12);
    if (!ground) continue;
    candidate.y = ground.hit.point.y + 0.045;
    if (hasMeshClearance(candidate, includeBroom)) return candidate;
  }
  return anchor.clone();
}`,
`function findSafeEntranceSpawn(anchor, includeBroom=true) {
  const env = environmentSize || new THREE.Vector3(76, 30, 130);
  const candidates = [];
  // Search from clearly outside the +Z shell inward toward Freak Street. This finds
  // the first authored walkable apron with enough room for the complete broom span.
  for (const zRatio of [0.60, 0.56, 0.52, 0.49, 0.46, 0.43, 0.40, 0.36, 0.32, 0.28, 0.24]) {
    const z = env.z * zRatio;
    for (const xRatio of [0, 0.035, -0.035, 0.07, -0.07, 0.11, -0.11, 0.15, -0.15]) {
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
  return new THREE.Vector3(0, 0.08, env.z * 0.62);
}`,
'entrance safety search'
);

replaceOnce(
`function updateFollowCamera(dt) {
  if (!playerReady || !playerRoot) return;
  const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.45 : 1.25, 0));
  const cp = Math.cos(followPitch);
  const desired = target.clone().add(new THREE.Vector3(
    -Math.sin(followYaw) * cp * followDistance,
    Math.sin(-followPitch) * followDistance + 1.05,
    Math.cos(followYaw) * cp * followDistance,
  ));
  camera.position.lerp(desired, 1 - Math.exp(-dt * 7.5));
  camera.lookAt(target);
}`,
`function updateFollowCamera(dt) {
  if (!playerReady || !playerRoot) return;
  const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.45 : 1.25, 0));
  const cp = Math.cos(followPitch);
  const desired = target.clone().add(new THREE.Vector3(
    -Math.sin(followYaw) * cp * followDistance,
    Math.sin(-followPitch) * followDistance + 1.05,
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
}`,
'follow camera collision guard'
);

if (!changed) {
  console.log('LUBIAK safe entrance/camera v2 already installed.');
  process.exit(0);
}

fs.writeFileSync(path, src);
console.log('Applied LUBIAK outside-in entrance spawn and collision-safe follow camera.');
