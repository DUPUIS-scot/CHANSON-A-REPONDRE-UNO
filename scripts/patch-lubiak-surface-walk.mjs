import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
const source = fs.readFileSync(path, 'utf8');

// LUBIAK_SURFACE_PATCH_RETIRE_V1
// The old surface-gravity injector predates the current ground/collision runtime.
// Do not re-inject it into modern LUBIAK builds: doing so would create competing
// locomotion authorities and can make walking/collision behavior non-deterministic.
if (
  source.includes('function combinedMoveInput() {') &&
  source.includes('function sampleLubiakGroundHeight(') &&
  source.includes('function movePlayerWithCollision(')
) {
  console.log('Current LUBIAK ground/collision runtime is authoritative; legacy surface patch skipped.');
  process.exit(0);
}

if (source.includes('LUBIAK_SURFACE_GRAVITY_V1')) {
  console.log('Legacy surface-gravity runtime already present; no mutation applied.');
  process.exit(0);
}

throw new Error('Unsupported LUBIAK locomotion runtime; retired surface patch will not mutate this file.');
