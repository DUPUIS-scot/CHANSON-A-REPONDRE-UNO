import fs from 'node:fs';

const runtimePath='web/lubiak/lubiak.js';
const terrainPath='web/lubiak/lubiak-terrain-addon.js';
let js=fs.readFileSync(runtimePath,'utf8');
let terrain=fs.readFileSync(terrainPath,'utf8');
let changed=false;

function replaceRuntime(from,to,label){
  if(js.includes(to)) return;
  if(!js.includes(from)) throw new Error(`Missing runtime ${label} anchor`);
  js=js.replace(from,to); changed=true;
}
function replaceTerrain(from,to,label){
  if(terrain.includes(to)) return;
  if(!terrain.includes(from)) throw new Error(`Missing terrain ${label} anchor`);
  terrain=terrain.replace(from,to); changed=true;
}

replaceRuntime(
`  root.position.set(-center.x, -box.min.y, -center.z);
  root.updateMatrixWorld(true);`,
`  // LUBIAK_PLAZA_DATUM_V2
  // Centre X/Z first, then infer the authored plaza height from mesh bases instead
  // of trusting the scene's absolute minimum (which may be foundations/stray geo).
  root.position.set(-center.x, 0, -center.z);
  root.updateMatrixWorld(true);
  const meshBaseSamples = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    const meshBox = new THREE.Box3().setFromObject(object);
    if (meshBox.isEmpty()) return;
    const h = meshBox.max.y - meshBox.min.y;
    if (!Number.isFinite(meshBox.min.y) || !Number.isFinite(h)) return;
    meshBaseSamples.push(meshBox.min.y);
  });
  meshBaseSamples.sort((a,b) => a-b);
  const q = (arr,p) => arr.length ? arr[Math.max(0, Math.min(arr.length-1, Math.floor((arr.length-1)*p)))] : 0;
  const authoredPlazaY = meshBaseSamples.length >= 6 ? q(meshBaseSamples, 0.35) : box.min.y;
  const PLAZA_Y = 0;
  root.position.y = PLAZA_Y - authoredPlazaY;
  root.updateMatrixWorld(true);`,
  'plaza datum'
);

const oldCircus=`  // LUBIAK_CIRCUS_GROUND_ZERO_V1
  // The authored big-top sits below the plaza in the master GLB. Move only the
  // outermost circus-labelled subtree upward; never move the terrain or whole city.
  const circusTerms = /circus|big[ _-]?top|bigtop|tent|marquee|foetus|fetus/i;
  const circusRoots = [];
  root.traverse((object) => {
    if (object === root || !circusTerms.test(object.name || '')) return;
    let parent = object.parent;
    while (parent && parent !== root) {
      if (circusTerms.test(parent.name || '')) return;
      parent = parent.parent;
    }
    circusRoots.push(object);
  });
  if (circusRoots.length) {
    const circusBox = new THREE.Box3();
    for (const object of circusRoots) circusBox.expandByObject(object);
    const plazaY = 0;
    if (!circusBox.isEmpty() && circusBox.min.y < plazaY - 0.05) {
      const lift = plazaY - circusBox.min.y + 0.04;
      for (const object of circusRoots) object.position.y += lift;
      root.updateMatrixWorld(true);
      console.info('LUBIAK circus lifted to plaza ground zero', { lift, roots: circusRoots.map(o => o.name) });
    }
  }`;

const newCircus=`  // LUBIAK_CIRCUS_GROUND_ZERO_V2
  // Resolve a stable circus branch from labelled descendants, then lift that
  // compact branch as one rigid object to the same plaza datum used everywhere.
  const circusTerms = /circus|big[ _-]?top|bigtop|tent|marquee|foetus|fetus/i;
  const circusRoots = [];
  const maxFootprintX = size.x * 0.48;
  const maxFootprintZ = size.z * 0.48;
  root.traverse((object) => {
    if (object === root || !circusTerms.test(object.name || '')) return;
    let candidate = object;
    let parent = object.parent;
    while (parent && parent !== root) {
      const parentBox = new THREE.Box3().setFromObject(parent);
      const parentSize = parentBox.getSize(new THREE.Vector3());
      if (parentSize.x > maxFootprintX || parentSize.z > maxFootprintZ) break;
      candidate = parent;
      parent = parent.parent;
    }
    if (!circusRoots.includes(candidate)) circusRoots.push(candidate);
  });
  if (circusRoots.length) {
    const uniqueRoots = circusRoots.filter((candidate, index, arr) =>
      !arr.some((other, otherIndex) => otherIndex !== index && candidate.parent && other === candidate.parent)
    );
    const circusBox = new THREE.Box3();
    for (const object of uniqueRoots) circusBox.expandByObject(object);
    if (!circusBox.isEmpty() && circusBox.min.y < PLAZA_Y - 0.03) {
      const lift = PLAZA_Y - circusBox.min.y + 0.04;
      for (const object of uniqueRoots) object.position.y += lift;
      root.updateMatrixWorld(true);
      console.info('LUBIAK circus aligned to plaza datum', { lift, roots: uniqueRoots.map(o => o.name) });
    }
  }`;
replaceRuntime(oldCircus,newCircus,'circus branch alignment');

replaceRuntime(
`function applyGroundGravity(dt, clearance=0.0){
  if(!playerRoot || playerMode!=='walk') return;
  const targetY=0;
  playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*28));
  if (Math.abs(playerRoot.position.y-targetY) < 0.001) playerRoot.position.y=targetY;
  playerBaseY=targetY;`,
`function applyGroundGravity(dt, clearance=0.045){
  if(!playerRoot || playerMode!=='walk') return;
  const ground=groundSurfaceBelow(playerRoot.position,6.5);
  if(ground){
    const targetY=ground.hit.point.y+clearance;
    playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*24));
    if (Math.abs(playerRoot.position.y-targetY) < 0.0015) playerRoot.position.y=targetY;
    playerBaseY=targetY;
  }`,
  'surface-following djinn gravity'
);

replaceRuntime(
`  playerRoot.position.set(0, 0, Math.min(env.z * 0.34, 42));
  playerBaseY = 0;`,
`  playerRoot.position.set(0, 0.08, Math.min(env.z * 0.34, 42));
  playerBaseY = playerRoot.position.y;`,
  'player spawn clearance'
);

replaceTerrain(
`    const worldTarget = new THREE.Vector3(envCenter.x, envBox.min.y + Math.max(0.025, envSize.y * 0.002), envCenter.z);`,
`    // Shared LUBIAK plaza datum: environment runtime normalizes the walkable plaza
    // to world Y=0, so decorative ember terrain must never follow envBox.min.y.
    const worldTarget = new THREE.Vector3(envCenter.x, 0.025, envCenter.z);`,
  'terrain shared datum'
);

if(!changed){ console.log('LUBIAK shared plaza-ground repair already installed.'); process.exit(0); }
fs.writeFileSync(runtimePath,js);
fs.writeFileSync(terrainPath,terrain);
console.log('Applied LUBIAK shared plaza datum, circus alignment, terrain datum, and djinn surface grounding.');
