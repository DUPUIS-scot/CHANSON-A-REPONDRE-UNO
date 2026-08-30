import fs from 'node:fs';

const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
let changed=false;

function once(from,to,label){
  if(src.includes(to)) return;
  if(!src.includes(from)) throw new Error(`Missing ${label} anchor`);
  src=src.replace(from,to); changed=true;
}

once(
`  // Canonical walk pose: shaft physically rests on the right shoulder,
  // engine extending to the rider's left and brush to the right.
  broomShoulderSocket.position.set(0.16, 0.24, -0.02);
  broomShoulderSocket.rotation.set(-0.03, 0.02, -0.07);`,
`  // LUBIAK_HAND_HELD_BROOM_WALK_V2
  // Carry the broom diagonally across the body: the right hand grips the shaft
  // low at the rider's side while the opposite end lies over the left shoulder.
  broomShoulderSocket.position.set(-0.02, 0.18, -0.01);
  broomShoulderSocket.rotation.set(-0.08, -0.16, 0.34);`,
'broom carry socket'
);

once(
`  broomRoot.scale.setScalar(2.65 / longest);
  broomRoot.rotation.set(0.03, Math.PI * 0.5, -0.02);
  broomRoot.position.set(-1.08, 0.01, -0.03);`,
`  broomRoot.scale.setScalar(2.65 / longest);
  broomRoot.rotation.set(0.06, Math.PI * 0.5, 0.05);
  broomRoot.position.set(-0.72, -0.18, -0.02);`,
'broom shaft alignment'
);

once(
`function applyWalkCarryPose(blend = 1) {
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
}`,
`function applyWalkCarryPose(blend = 1, swing = 0) {
  const b = playerBoneCache;
  if (!b) return;
  if (b.chest) {
    b.chest.rotation.x = 0.025 * blend;
    b.chest.rotation.z = 0.045 * blend;
  }

  // Right arm is the carrying arm: elbow down, forearm across the hip and
  // hand closed around the broom shaft. Keep it comparatively stable while walking.
  if (b.rightArm) {
    b.rightArm.rotation.x = (-0.18 + swing * 0.025) * blend;
    b.rightArm.rotation.y = -0.12 * blend;
    b.rightArm.rotation.z = -0.46 * blend;
  }
  if (b.rightForeArm) {
    b.rightForeArm.rotation.x = -0.78 * blend;
    b.rightForeArm.rotation.y = 0.22 * blend;
    b.rightForeArm.rotation.z = -0.34 * blend;
  }
  if (b.rightHand) {
    b.rightHand.rotation.x = 0.10 * blend;
    b.rightHand.rotation.y = -0.08 * blend;
    b.rightHand.rotation.z = -0.22 * blend;
  }
}`,
'hand-held carry pose'
);

once(
`  if (playerBoneCache.hips) playerBoneCache.hips.rotation.y = swing * 0.045 * walkBlend;
  if (playerBoneCache.leftLeg) playerBoneCache.leftLeg.rotation.x = swing * 0.32 * walkBlend;
  if (playerBoneCache.rightLeg) playerBoneCache.rightLeg.rotation.x = -swing * 0.32 * walkBlend;
  if (playerBoneCache.leftArm) playerBoneCache.leftArm.rotation.x = -swing * 0.16 * walkBlend;
  applyWalkCarryPose(1);`,
`  if (playerBoneCache.hips) {
    playerBoneCache.hips.rotation.y = swing * 0.065 * walkBlend;
    playerBoneCache.hips.rotation.z = Math.sin(walkPhase * 2) * 0.018 * walkBlend;
  }
  if (playerBoneCache.leftLeg) playerBoneCache.leftLeg.rotation.x = swing * 0.46 * walkBlend;
  if (playerBoneCache.rightLeg) playerBoneCache.rightLeg.rotation.x = -swing * 0.46 * walkBlend;
  if (playerBoneCache.leftLowerLeg) playerBoneCache.leftLowerLeg.rotation.x = Math.max(0, -swing) * 0.34 * walkBlend;
  if (playerBoneCache.rightLowerLeg) playerBoneCache.rightLowerLeg.rotation.x = Math.max(0, swing) * 0.34 * walkBlend;

  // Free left arm counter-swings; carrying right arm remains on the broom.
  if (playerBoneCache.leftArm) {
    playerBoneCache.leftArm.rotation.x = -swing * 0.34 * walkBlend;
    playerBoneCache.leftArm.rotation.z = 0.08 * walkBlend;
  }
  if (playerBoneCache.leftForeArm) playerBoneCache.leftForeArm.rotation.x = 0.10 * walkBlend;
  applyWalkCarryPose(1, swing * walkBlend);`,
'animated walking gait'
);

if(!changed){ console.log('Djinn hand-held broom walk already installed.'); process.exit(0); }
fs.writeFileSync(path,src);
console.log('Applied animated djinn walk with one-hand side grip and opposite-end shoulder carry.');
