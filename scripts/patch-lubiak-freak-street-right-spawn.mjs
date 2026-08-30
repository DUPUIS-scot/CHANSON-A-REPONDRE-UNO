import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

if (src.includes('LUBIAK_FREAK_STREET_RIGHT_SPAWN_V1')) {
  console.log('Freak Street right-side spawn already present.');
  process.exit(0);
}

const oldAnchor = `  const entranceAnchor = new THREE.Vector3(0, 0.08, env.z * 0.60);`;
const newAnchor = `  // LUBIAK_FREAK_STREET_RIGHT_SPAWN_V1\n  // Begin beside the right-hand side of the Freak Street entrance/banner, not centred\n  // in front of the doorway. Positive X is screen-right from the +Z entrance camera.\n  const entranceAnchor = new THREE.Vector3(env.x * 0.16, 0.08, env.z * 0.60);`;
if (!src.includes(oldAnchor)) throw new Error('Entrance anchor marker not found');
src = src.replace(oldAnchor, newAnchor);

const oldSearch = `    for (const xRatio of [0, 0.035, -0.035, 0.07, -0.07, 0.11, -0.11, 0.15, -0.15]) {\n      candidates.push(new THREE.Vector3(env.x * xRatio, anchor.y, z));\n    }`;
const newSearch = `    // Prefer the banner/right apron first; only drift toward centre if that zone is blocked.\n    for (const xRatio of [0.16, 0.20, 0.12, 0.24, 0.08, 0.28, 0.04, 0, -0.04]) {\n      candidates.push(new THREE.Vector3(env.x * xRatio, anchor.y, z));\n    }`;
if (!src.includes(oldSearch)) throw new Error('Entrance candidate search marker not found');
src = src.replace(oldSearch, newSearch);

const oldFallback = `  return new THREE.Vector3(0, 0.08, env.z * 0.62);`;
const newFallback = `  return new THREE.Vector3(env.x * 0.18, 0.08, env.z * 0.62);`;
if (!src.includes(oldFallback)) throw new Error('Entrance fallback marker not found');
src = src.replace(oldFallback, newFallback);

fs.writeFileSync(path, src);
console.log('Patched djinn spawn to right side of Freak Street entrance/banner.');
