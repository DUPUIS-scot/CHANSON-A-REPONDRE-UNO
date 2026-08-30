import fs from 'node:fs';

const path='web/lubiak/lubiak.js';
let s=fs.readFileSync(path,'utf8');

const marker=`function prepareBroomForRide() {`;
if(!s.includes(marker)) throw new Error('prepareBroomForRide marker missing');

const standing=`function restoreStandingWalkPose() {
  // LUBIAK_STANDING_GROUND_ZERO_V1
  // Walk/idle owns an upright human stance. Riding geometry may never leak back here.
  if (!playerVisual || !playerBoneCache) return;
  const b = playerBoneCache;

  // Feet remain calibrated to the authored GLB foot plane; playerRoot supplies terrain Y.
  playerVisual.position.y = playerVisualGroundOffsetY;
  playerRoot.rotation.x = 0;
  playerRoot.rotation.z = 0;

  if (b.hips) {
    b.hips.rotation.x = 0;
    b.hips.rotation.y = 0;
    b.hips.rotation.z = 0;
  }
  if (b.chest) {
    b.chest.rotation.x = 0;
    b.chest.rotation.y = 0;
    b.chest.rotation.z = 0;
  }
  if (b.leftLeg) {
    b.leftLeg.rotation.x = 0;
    b.leftLeg.rotation.y = 0;
    b.leftLeg.rotation.z = 0;
  }
  if (b.rightLeg) {
    b.rightLeg.rotation.x = 0;
    b.rightLeg.rotation.y = 0;
    b.rightLeg.rotation.z = 0;
  }
  if (b.leftLowerLeg) {
    b.leftLowerLeg.rotation.x = 0;
    b.leftLowerLeg.rotation.y = 0;
    b.leftLowerLeg.rotation.z = 0;
  }
  if (b.rightLowerLeg) {
    b.rightLowerLeg.rotation.x = 0;
    b.rightLowerLeg.rotation.y = 0;
    b.rightLowerLeg.rotation.z = 0;
  }

  // If a prior ride state ever owned the broom, return it to the authoritative hand socket.
  if (broomRoot && broomShoulderSocket && broomRoot.parent !== broomShoulderSocket) {
    broomShoulderSocket.attach(broomRoot);
    broomRoot.rotation.set(0.06, Math.PI * 0.5, 0.05);
    // Canonical walk carry transform: identical to attachBroomToShoulder().
    broomRoot.position.set(-0.42, -0.03, -0.01);
    broomRideStart = null;
  }

  // Re-establish the shoulder carry only after the body is upright.
  applyWalkCarryPose(1, 0);
}

`;
s=s.replace(marker,standing+marker);

const installNeedle=`      broomRoot = broomGltf.scene;\n      attachBroomToShoulder();`;
if(!s.includes(installNeedle)) throw new Error('broom install needle missing');
s=s.replace(installNeedle,`${installNeedle}\n      restoreStandingWalkPose();`);

const walkNeedle=`  if (playerMode === 'walk') {\n    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);`;
if(!s.includes(walkNeedle)) throw new Error('walk branch needle missing');
s=s.replace(walkNeedle,`  if (playerMode === 'walk') {\n    // Standing is the walk/idle baseline. Clear all ride transforms before locomotion.\n    restoreStandingWalkPose();\n    const mag = THREE.MathUtils.clamp(input.length(), 0, 1);`);

const procNeedle=`function proceduralWalk(dt, speed01) {\n  if (!playerVisual || !playerBoneCache) return;`;
if(!s.includes(procNeedle)) throw new Error('proceduralWalk needle missing');
s=s.replace(procNeedle,`function proceduralWalk(dt, speed01) {\n  if (!playerVisual || !playerBoneCache) return;\n  // Idle is a strict straight-leg stance at ground zero; gait begins only with real movement.\n  if (speed01 < 0.035) {\n    walkBlend += (0 - walkBlend) * Math.min(1, dt * 12);\n    restoreStandingWalkPose();\n    return;\n  }`);

fs.writeFileSync(path,s);
console.log('Patched LUBIAK standing ground-zero walk authority with canonical broom return');
