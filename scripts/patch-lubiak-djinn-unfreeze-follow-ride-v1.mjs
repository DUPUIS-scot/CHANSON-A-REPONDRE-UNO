import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

if (src.includes('LUBIAK_DJINN_UNFREEZE_FOLLOW_RIDE_V1')) {
  console.log('LUBIAK djinn FOLLOW/RIDE unfreeze patch already present.');
  process.exit(0);
}

function replaceOrFail(before, after, label) {
  if (!src.includes(before)) throw new Error(`Patch anchor missing: ${label}`);
  src = src.replace(before, after);
}

replaceOrFail(
`const PLAYER_COLLISION_RADIUS = 0.34;
const BROOM_COLLISION_RADIUS = 0.28;`,
`// LUBIAK_DJINN_UNFREEZE_FOLLOW_RIDE_V1
// Navigation uses a compact rider capsule. The visually oversized broom is never
// allowed to turn the complete rendered GLB bounds into a hard movement blocker.
const PLAYER_COLLISION_RADIUS = 0.34;
const BROOM_COLLISION_RADIUS = 0.28;
const RIDE_COLLISION_RADIUS = 0.56;`,
'collision constants',
);

replaceOrFail(
`  const safeEntrance = findSafeEntranceSpawn(entranceAnchor, true);`,
`  // Spawn is validated against the djinn body. The shoulder-carried broom may
  // visually overhang the apron without pinning the player in place.
  const safeEntrance = findSafeEntranceSpawn(entranceAnchor, false);`,
'safe entrance broom clearance',
);

replaceOrFail(
`function movePlayerWithCollision(delta, includeBroom=false) {
  if(!playerRoot || delta.lengthSq()<1e-10) return;`,
`function movePlayerWithCollision(delta, includeBroom=false) {
  if(!playerRoot || delta.lengthSq()<1e-10) return;`,
'move player function anchor',
);

const moveFunctionEnd = `  } else playerRoot.position.copy(solved);
}

// LUBIAK_GROUND_GRAVITY_V2`;
const moveFunctionNew = `  } else playerRoot.position.copy(solved);
}

function moveRideWithCollision(delta) {
  if (!playerRoot || delta.lengthSq() < 1e-10) return;
  const start = playerRoot.position.clone();
  const desired = start.clone().add(delta);
  const dist = delta.length();
  const dir = delta.clone().normalize();

  // Compact vehicle envelope around the rider/pelvis. Do not raycast from the
  // far brush/engine tips: those are presentation geometry, not the flight capsule.
  const rideOrigins = [
    new THREE.Vector3(0, 0.42, 0),
    new THREE.Vector3(0, 0.95, 0),
    new THREE.Vector3(0, 1.42, 0),
  ];
  let blocked = false;
  for (const local of rideOrigins) {
    if (rayBlocked(start.clone().add(local), dir, dist + RIDE_COLLISION_RADIUS)) {
      blocked = true;
      break;
    }
  }

  if (!blocked) {
    playerRoot.position.copy(desired);
    return;
  }

  // Preserve responsive flight by attempting horizontal/vertical sliding rather
  // than zeroing the entire frame whenever one direction is obstructed.
  const parts = [
    new THREE.Vector3(delta.x, 0, delta.z),
    new THREE.Vector3(0, delta.y, 0),
  ];
  for (const part of parts) {
    if (part.lengthSq() < 1e-10) continue;
    const partDir = part.clone().normalize();
    const partDist = part.length();
    let partBlocked = false;
    for (const local of rideOrigins) {
      if (rayBlocked(playerRoot.position.clone().add(local), partDir, partDist + RIDE_COLLISION_RADIUS)) {
        partBlocked = true;
        break;
      }
    }
    if (!partBlocked) playerRoot.position.add(part);
  }

  if (playerRoot.position.distanceTo(start) < 1e-5) playerVelocity.multiplyScalar(0.35);
}

// LUBIAK_GROUND_GRAVITY_V2`;
replaceOrFail(moveFunctionEnd, moveFunctionNew, 'ride collision helper insertion');

replaceOrFail(
`      movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);
      applyGroundGravity(dt);`,
`      // FOLLOW collision authority is the djinn body only. The shoulder broom
      // stays visually full-size but cannot freeze the character against scenery.
      movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), false);
      applyGroundGravity(dt);`,
'follow hard broom collision',
);

replaceOrFail(
`    const mountSolved = resolvePlayerCollision(playerRoot.position, mountTarget, true);`,
`    // Mount vertically with the rider capsule; broom tips may sweep past nearby
    // scenery without aborting the transition at its first frame.
    const mountSolved = resolvePlayerCollision(playerRoot.position, mountTarget, false);`,
'mount hard broom collision',
);

replaceOrFail(
`    movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);`,
`    moveRideWithCollision(playerVelocity.clone().multiplyScalar(dt));`,
'flight hard broom collision',
);

fs.writeFileSync(path, src);
console.log('Unfroze LUBIAK FOLLOW and RIDE by decoupling visual broom bounds from hard navigation collision.');
