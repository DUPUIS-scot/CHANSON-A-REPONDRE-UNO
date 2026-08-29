import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

function replaceOrFail(before, after, label) {
  if (!src.includes(before)) throw new Error(`Patch anchor missing: ${label}`);
  src = src.replace(before, after);
}

replaceOrFail(`function cachePlayerBones() {
  if (!playerVisual) return null;
  playerBoneCache = {
    hips: findBone(playerVisual, ['hips', 'pelvis']),
    chest: findBone(playerVisual, ['upperchest', 'chest', 'spine2', 'spine02', 'spine1']),
    leftLeg: findBone(playerVisual, ['leftupleg', 'leftthigh', 'thighl', 'upperlegl']),
    rightLeg: findBone(playerVisual, ['rightupleg', 'rightthigh', 'thighr', 'upperlegr']),
    leftArm: findBone(playerVisual, ['leftarm', 'leftupperarm', 'upperarml']),
    rightArm: findBone(playerVisual, ['rightarm', 'rightupperarm', 'upperarmr']),
  };
  return playerBoneCache;
}`,
`function cachePlayerBones() {
  if (!playerVisual) return null;
  playerBoneCache = {
    hips: findBone(playerVisual, ['hips', 'pelvis']),
    chest: findBone(playerVisual, ['upperchest', 'chest', 'spine2', 'spine02', 'spine1']),
    leftLeg: findBone(playerVisual, ['leftupleg', 'leftthigh', 'thighl', 'upperlegl']),
    rightLeg: findBone(playerVisual, ['rightupleg', 'rightthigh', 'thighr', 'upperlegr']),
    leftLowerLeg: findBone(playerVisual, ['leftleg', 'leftcalf', 'calfl', 'lowerlegl']),
    rightLowerLeg: findBone(playerVisual, ['rightleg', 'rightcalf', 'calfr', 'lowerlegr']),
    leftArm: findBone(playerVisual, ['leftarm', 'leftupperarm', 'upperarml']),
    rightArm: findBone(playerVisual, ['rightarm', 'rightupperarm', 'upperarmr']),
    leftForeArm: findBone(playerVisual, ['leftforearm', 'leftlowerarm', 'forearml']),
    rightForeArm: findBone(playerVisual, ['rightforearm', 'rightlowerarm', 'forearmr']),
    leftHand: findBone(playerVisual, ['lefthand', 'handl']),
    rightHand: findBone(playerVisual, ['righthand', 'handr']),
  };
  return playerBoneCache;
}`,
'cachePlayerBones');

replaceOrFail(`function attachBroomToShoulder() {
  if (!playerVisual || !broomRoot) return;
  const bones = playerBoneCache || cachePlayerBones();
  const shoulderSocket = new THREE.Group();
  shoulderSocket.name = 'DA_NOBLE_Y2K_SHOULDER_SOCKET';
  (bones?.chest || playerVisual).add(shoulderSocket);
  shoulderSocket.position.set(0.18, 0.12, -0.08);
  shoulderSocket.rotation.set(-0.16, -0.18, -0.42);
  shoulderSocket.add(broomRoot);

  broomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(broomRoot);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.001);
  broomRoot.scale.setScalar(2.15 / longest);
  broomRoot.rotation.set(0, Math.PI * 0.5, 0.08);
  broomRoot.position.set(-0.82, 0.06, -0.08);
}`,
`let broomShoulderSocket = null;
let broomRideStart = null;

function attachBroomToShoulder() {
  if (!playerVisual || !broomRoot) return;
  const bones = playerBoneCache || cachePlayerBones();
  broomShoulderSocket = new THREE.Group();
  broomShoulderSocket.name = 'DA_NOBLE_Y2K_SHOULDER_SOCKET';
  (bones?.chest || playerVisual).add(broomShoulderSocket);

  // Canonical walk pose: shaft physically rests on the right shoulder,
  // engine extending to the rider's left and brush to the right.
  broomShoulderSocket.position.set(0.16, 0.24, -0.02);
  broomShoulderSocket.rotation.set(-0.03, 0.02, -0.07);
  broomShoulderSocket.add(broomRoot);

  broomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(broomRoot);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.001);
  broomRoot.scale.setScalar(2.65 / longest);
  broomRoot.rotation.set(0.03, Math.PI * 0.5, -0.02);
  broomRoot.position.set(-1.08, 0.01, -0.03);
}

function applyWalkCarryPose(blend = 1) {
  const b = playerBoneCache;
  if (!b) return;
  if (b.chest) b.chest.rotation.z = -0.03 * blend;
  if (b.rightArm) {
    b.rightArm.rotation.x = -0.12 * blend;
    b.rightArm.rotation.z = -1.02 * blend;
  }
  if (b.rightForeArm) {
    b.rightForeArm.rotation.x = -0.28 * blend;
    b.rightForeArm.rotation.y = 0.18 * blend;
    b.rightForeArm.rotation.z = -0.74 * blend;
  }
  if (b.rightHand) b.rightHand.rotation.z = -0.18 * blend;
}

function prepareBroomForRide() {
  if (!broomRoot || !playerRoot) return;
  playerRoot.attach(broomRoot);
  broomRideStart = {
    position: broomRoot.position.clone(),
    quaternion: broomRoot.quaternion.clone(),
  };
}

function applyRidePose(t) {
  const b = playerBoneCache;
  if (!b) return;
  const s = THREE.MathUtils.smoothstep(t, 0, 1);
  if (b.chest) {
    b.chest.rotation.x = THREE.MathUtils.lerp(0, -0.22, s);
    b.chest.rotation.z = THREE.MathUtils.lerp(-0.03, 0, s);
  }
  if (b.leftLeg) {
    b.leftLeg.rotation.x = THREE.MathUtils.lerp(0, -0.92, s);
    b.leftLeg.rotation.z = THREE.MathUtils.lerp(0, -0.34, s);
  }
  if (b.rightLeg) {
    b.rightLeg.rotation.x = THREE.MathUtils.lerp(0, -0.92, s);
    b.rightLeg.rotation.z = THREE.MathUtils.lerp(0, 0.34, s);
  }
  if (b.leftLowerLeg) b.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.18, s);
  if (b.rightLowerLeg) b.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.18, s);
  if (b.leftArm) {
    b.leftArm.rotation.x = THREE.MathUtils.lerp(0, -0.72, s);
    b.leftArm.rotation.z = THREE.MathUtils.lerp(0, -0.34, s);
  }
  if (b.rightArm) {
    b.rightArm.rotation.x = THREE.MathUtils.lerp(-0.12, -0.78, s);
    b.rightArm.rotation.z = THREE.MathUtils.lerp(-1.02, 0.30, s);
  }
  if (b.leftForeArm) b.leftForeArm.rotation.x = THREE.MathUtils.lerp(0, -0.78, s);
  if (b.rightForeArm) b.rightForeArm.rotation.x = THREE.MathUtils.lerp(-0.28, -0.84, s);

  if (broomRoot && broomRideStart) {
    const targetPos = new THREE.Vector3(0, 0.88, 0.12);
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.02, 0, 0.03));
    broomRoot.position.lerpVectors(broomRideStart.position, targetPos, s);
    broomRoot.quaternion.slerpQuaternions(broomRideStart.quaternion, targetQuat, s);
  }
}`,
'attachBroomToShoulder');

replaceOrFail(`function beginMountTransition() {
  if (!playerReady || playerMode !== 'walk') return;
  playerMode = 'mounting';
  mountTransition = 0;
  playerVelocity.set(0, 0, 0);
  showStatus('DA NOBLE Y2K · LIFT OFF', 1100);
}`,
`function beginMountTransition() {
  if (!playerReady || playerMode !== 'walk') return;
  playerMode = 'mounting';
  mountTransition = 0;
  playerVelocity.set(0, 0, 0);
  prepareBroomForRide();
  showStatus('DA NOBLE Y2K · MOUNTING', 1100);
}`,
'beginMountTransition');

replaceOrFail(`function proceduralWalk(dt, speed01) {
  if (!playerVisual || !playerBoneCache) return;
  walkBlend += (speed01 - walkBlend) * Math.min(1, dt * 9);
  walkPhase += dt * (3.4 + speed01 * 4.8);
  const swing = Math.sin(walkPhase);
  const bob = Math.sin(walkPhase * 2) * 0.018 * walkBlend;
  playerVisual.position.y = bob;
  if (playerBoneCache.hips) playerBoneCache.hips.rotation.y = swing * 0.045 * walkBlend;
  if (playerBoneCache.leftLeg) playerBoneCache.leftLeg.rotation.x = swing * 0.32 * walkBlend;
  if (playerBoneCache.rightLeg) playerBoneCache.rightLeg.rotation.x = -swing * 0.32 * walkBlend;
  if (playerBoneCache.leftArm) playerBoneCache.leftArm.rotation.x = -swing * 0.16 * walkBlend;
  if (playerBoneCache.rightArm) playerBoneCache.rightArm.rotation.x = swing * 0.07 * walkBlend;
}`,
`function proceduralWalk(dt, speed01) {
  if (!playerVisual || !playerBoneCache) return;
  walkBlend += (speed01 - walkBlend) * Math.min(1, dt * 9);
  walkPhase += dt * (3.4 + speed01 * 4.8);
  const swing = Math.sin(walkPhase);
  const bob = Math.sin(walkPhase * 2) * 0.018 * walkBlend;
  playerVisual.position.y = bob;
  if (playerBoneCache.hips) playerBoneCache.hips.rotation.y = swing * 0.045 * walkBlend;
  if (playerBoneCache.leftLeg) playerBoneCache.leftLeg.rotation.x = swing * 0.32 * walkBlend;
  if (playerBoneCache.rightLeg) playerBoneCache.rightLeg.rotation.x = -swing * 0.32 * walkBlend;
  if (playerBoneCache.leftArm) playerBoneCache.leftArm.rotation.x = -swing * 0.16 * walkBlend;
  applyWalkCarryPose(1);
}`,
'proceduralWalk');

replaceOrFail(`  } else if (playerMode === 'mounting') {
    mountTransition += dt;
    playerVelocity.multiplyScalar(Math.max(0, 1 - dt * 9));
    const t = THREE.MathUtils.smoothstep(mountTransition, 0.25, 1.55);
    playerRoot.position.y = playerBaseY + t * 2.6;
    playerRoot.rotation.x = -0.13 * t;
    if (broomRoot) broomRoot.rotation.z = 0.08 - t * 0.38;
    if (mountTransition > 1.75) {
      playerMode = 'flight';
      showStatus('FLIGHT MODE', 800);
    }
  } else if (playerMode === 'flight') {`,
`  } else if (playerMode === 'mounting') {
    mountTransition += dt;
    playerVelocity.multiplyScalar(Math.max(0, 1 - dt * 9));
    const t = THREE.MathUtils.smoothstep(mountTransition, 0.15, 1.45);
    applyRidePose(t);
    playerRoot.position.y = playerBaseY + t * 2.6;
    playerRoot.rotation.x = -0.08 * t;
    if (mountTransition > 1.65) {
      playerMode = 'flight';
      applyRidePose(1);
      showStatus('FLIGHT MODE · RIDING DA NOBLE Y2K', 900);
    }
  } else if (playerMode === 'flight') {`,
'mounting update');

replaceOrFail(`  } else if (playerMode === 'flight') {
    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);`,
`  } else if (playerMode === 'flight') {
    applyRidePose(1);
    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);`,
'flight pose lock');

fs.writeFileSync(path, src);
console.log('Applied canonical LUBIAK walk-carry and broom-riding poses.');
