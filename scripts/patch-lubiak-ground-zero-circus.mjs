import fs from 'node:fs';

const path='web/lubiak/lubiak.js';
let js=fs.readFileSync(path,'utf8');
let changed=false;

function once(from,to,label){
  if(js.includes(to)) return;
  if(!js.includes(from)) throw new Error(`Missing ${label} anchor`);
  js=js.replace(from,to); changed=true;
}

// Environment must use the model floor as world Y=0. The previous centering put
// half of the model below zero and made every later ground calculation ambiguous.
once(
  '  root.position.sub(center);\n  root.updateMatrixWorld(true);',
  '  root.position.set(-center.x, -box.min.y, -center.z);\n  root.updateMatrixWorld(true);',
  'environment floor alignment'
);

// Raise only top-level circus/tent subtrees. Nested circus-labelled children are
// left untouched so the whole tent moves as one rigid object rather than exploding.
const frameAnchor='  environmentSize = size.clone();\n  const eyeHeight = Math.max(1.7, Math.min(size.y * 0.12, 5));';
const framePatch=`  environmentSize = size.clone();

  // LUBIAK_CIRCUS_GROUND_ZERO_V1
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
  }

  const eyeHeight = Math.max(1.7, Math.min(size.y * 0.12, 5));`;
once(frameAnchor,framePatch,'circus ground-zero insertion');

// The djinn visual is already normalized so its lowest bound is at the player
// root origin. Walking therefore means root Y=0 exactly. Do not raycast roofs,
// walls or decorative meshes as ground. Flight/mounting remain unconstrained.
once(
`function applyGroundGravity(dt, clearance=0.055){
  if(!playerRoot || playerMode!=='walk') return;
  const ground=groundSurfaceBelow(playerRoot.position,10);
  if(!ground) return;
  const targetY=ground.hit.point.y+clearance;
  playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*20));
  playerBaseY=targetY;`,
`function applyGroundGravity(dt, clearance=0.0){
  if(!playerRoot || playerMode!=='walk') return;
  const targetY=0;
  playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*28));
  if (Math.abs(playerRoot.position.y-targetY) < 0.001) playerRoot.position.y=targetY;
  playerBaseY=targetY;`,
  'djinn ground gravity'
);

// Spawn and circus return are explicitly on world ground zero.
once(
  '  playerRoot.position.set(0, 0, Math.min(env.z * 0.34, 42));\n  playerBaseY = playerRoot.position.y;',
  '  playerRoot.position.set(0, 0, Math.min(env.z * 0.34, 42));\n  playerBaseY = 0;',
  'player spawn ground zero'
);

if(!changed){ console.log('LUBIAK circus/djinn ground-zero repair already installed.'); process.exit(0); }
fs.writeFileSync(path,js);
console.log('Applied LUBIAK circus plaza + djinn ground-zero repair.');
