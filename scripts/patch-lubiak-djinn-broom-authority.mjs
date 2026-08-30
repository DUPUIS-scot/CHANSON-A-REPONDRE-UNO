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
`function attachBroomToShoulder() {
  if (!playerVisual || !broomRoot) return;
  const bones = playerBoneCache || cachePlayerBones();
  broomShoulderSocket = new THREE.Group();
  broomShoulderSocket.name = 'DA_NOBLE_Y2K_SHOULDER_SOCKET';
  (bones?.chest || playerVisual).add(broomShoulderSocket);

  // LUBIAK_HAND_HELD_BROOM_WALK_V2
  // Carry the broom diagonally across the body: the right hand grips the shaft
  // low at the rider's side while the opposite end lies over the left shoulder.
  broomShoulderSocket.position.set(-0.02, 0.18, -0.01);
  broomShoulderSocket.rotation.set(-0.08, -0.16, 0.34);
  broomShoulderSocket.add(broomRoot);

  broomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(broomRoot);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.001);
  broomRoot.scale.setScalar(2.65 / longest);
  broomRoot.rotation.set(0.06, Math.PI * 0.5, 0.05);
  broomRoot.position.set(-0.72, -0.18, -0.02);
}`,
`function attachBroomToShoulder() {
  if (!playerVisual || !broomRoot) return;
  const bones = playerBoneCache || cachePlayerBones();
  broomShoulderSocket = new THREE.Group();
  broomShoulderSocket.name = 'DA_NOBLE_Y2K_HAND_GRIP_SOCKET';

  // LUBIAK_DJINN_BROOM_AUTHORITY_V1
  // Walk mode has one authority: the broom follows the carrying hand, not the chest.
  // The shoulder is only a visual contact point created by the broom's local angle.
  const gripParent = bones?.rightHand || bones?.rightForeArm || bones?.chest || playerVisual;
  gripParent.add(broomShoulderSocket);
  broomShoulderSocket.position.set(0.08, -0.03, 0.02);
  broomShoulderSocket.rotation.set(0.10, -0.22, 0.30);
  broomShoulderSocket.add(broomRoot);

  broomRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(broomRoot);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 0.001);
  broomRoot.scale.setScalar(2.65 / longest);
  broomRoot.rotation.set(0.06, Math.PI * 0.5, 0.05);
  broomRoot.position.set(-0.42, -0.03, -0.01);
}`,
'broom walk attachment'
);

replaceOnce(
`function prepareBroomForRide() {
  if (!broomRoot || !playerRoot) return;
  playerRoot.attach(broomRoot);
  broomRideStart = {
    position: broomRoot.position.clone(),
    quaternion: broomRoot.quaternion.clone(),
  };
}`,
`function prepareBroomForRide() {
  if (!broomRoot || !playerRoot) return;
  // Reparent exactly once while preserving world transform. From this point onward
  // the ride state owns the broom; the walk hand socket no longer influences it.
  broomRoot.updateMatrixWorld(true);
  playerRoot.attach(broomRoot);
  broomRideStart = {
    position: broomRoot.position.clone(),
    quaternion: broomRoot.quaternion.clone(),
  };
}`,
'ride reparent'
);

replaceOnce(
`function applyRidePose(t) {
  const b = playerBoneCache;
  if (!b) return;
  const s = THREE.MathUtils.smoothstep(t, 0, 1);
  const swingOver = Math.sin(Math.PI * s); // one-leg bicycle-style swing during mount`,
`function applyRidePose(t) {
  const b = playerBoneCache;
  if (!b) return;
  const s = THREE.MathUtils.smoothstep(t, 0, 1);
  const swingOver = Math.sin(Math.PI * s); // one-leg bicycle-style swing during mount

  // Ride mode fully owns the procedural rig so no residual walking rotations leak in.
  if (b.hips) {
    b.hips.rotation.y = 0;
    b.hips.rotation.z = 0;
  }
  if (b.rightHand) {
    b.rightHand.rotation.x = THREE.MathUtils.lerp(0.10, 0, s);
    b.rightHand.rotation.y = THREE.MathUtils.lerp(-0.08, 0, s);
    b.rightHand.rotation.z = THREE.MathUtils.lerp(-0.22, 0, s);
  }`,
'ride pose authority'
);

replaceOnce(
`function beginMountTransition() {
  if (!playerReady || playerMode !== 'walk') return;
  playerMode = 'mounting';
  mountTransition = 0;
  playerVelocity.set(0, 0, 0);
  prepareBroomForRide();
  showStatus('DA NOBLE Y2K · MOUNTING', 1100);
}`,
`function beginMountTransition() {
  if (!playerReady || playerMode !== 'walk') return;
  playerMode = 'mounting';
  mountTransition = 0;
  walkBlend = 0;
  playerVelocity.set(0, 0, 0);
  if (playerVisual) playerVisual.position.y = playerVisualGroundOffsetY;
  prepareBroomForRide();
  showStatus('DA NOBLE Y2K · MOUNTING', 1100);
}`,
'mount transition reset'
);

if (!changed) {
  console.log('LUBIAK djinn/broom authority repair already installed.');
  process.exit(0);
}

fs.writeFileSync(path, src);
console.log('Applied hand-authoritative broom walk and isolated mount/flight pose ownership.');
