import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');
let changed = false;

function replaceAny(candidates, after, label) {
  if (src.includes(after)) return;
  for (const before of candidates) {
    if (src.includes(before)) {
      src = src.replace(before, after);
      changed = true;
      return;
    }
  }
  throw new Error(`Patch anchor missing: ${label}`);
}

replaceAny([
`function applyRidePose(t) {
  const b = playerBoneCache;
  if (!b) return;
  const s = THREE.MathUtils.smoothstep(t, 0, 1);`,
],
`function applyRidePose(t) {
  const b = playerBoneCache;
  if (!b) return;
  const s = THREE.MathUtils.smoothstep(t, 0, 1);
  const swingOver = Math.sin(Math.PI * s); // one-leg bicycle-style swing during mount`,
'bicycle mount phase');

replaceAny([
`  if (b.leftLeg) {
    b.leftLeg.rotation.x = THREE.MathUtils.lerp(0, -0.92, s);
    b.leftLeg.rotation.z = THREE.MathUtils.lerp(0, -0.34, s);
  }
  if (b.rightLeg) {
    b.rightLeg.rotation.x = THREE.MathUtils.lerp(0, -0.92, s);
    b.rightLeg.rotation.z = THREE.MathUtils.lerp(0, 0.34, s);
  }
  if (b.leftLowerLeg) b.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.18, s);
  if (b.rightLowerLeg) b.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.18, s);`,
],
`  if (b.leftLeg) {
    b.leftLeg.rotation.x = THREE.MathUtils.lerp(0, -0.78, s);
    b.leftLeg.rotation.z = THREE.MathUtils.lerp(0, -0.26, s);
  }
  if (b.rightLeg) {
    // Swing the right leg up and over the broom, then settle astride it.
    b.rightLeg.rotation.x = THREE.MathUtils.lerp(0, -0.78, s) - swingOver * 0.42;
    b.rightLeg.rotation.z = THREE.MathUtils.lerp(0, 0.26, s) + swingOver * 0.62;
  }
  if (b.leftLowerLeg) b.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.02, s);
  if (b.rightLowerLeg) b.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(0, 1.02, s) + swingOver * 0.22;`,
'astride legs');

replaceAny([
`    const targetPos = new THREE.Vector3(0, 0.88, 0.12);
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.02, 0, 0.03));`,
],
`    // Final riding geometry: shaft centered under the pelvis, running between both legs.
    const targetPos = new THREE.Vector3(0, 0.58, 0.02);
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.0, 0, 0.0));`,
'broom between legs');

replaceAny([
`    const t = THREE.MathUtils.smoothstep(mountTransition, 0.15, 1.45);
    applyRidePose(t);`,
],
`    const t = THREE.MathUtils.smoothstep(mountTransition, 0.10, 1.55);
    applyRidePose(t);`,
'mount timing');

replaceAny([
`    if (mountTransition > 1.65) {`,
],
`    if (mountTransition > 1.78) {`,
'mount completion timing');

if (!changed) {
  console.log('Bicycle-style broom mount already installed.');
  process.exit(0);
}
fs.writeFileSync(path, src);
console.log('Applied bicycle-style broom mount: leg-over transition and broom centered between legs.');
