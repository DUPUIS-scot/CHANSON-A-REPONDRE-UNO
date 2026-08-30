import fs from 'node:fs';

const path='web/lubiak/lubiak.js';
let js=fs.readFileSync(path,'utf8');
let changed=false;

function replaceOnce(from,to,label){
  if(js.includes(to)) return;
  if(!js.includes(from)) throw new Error(`Missing ${label} anchor`);
  js=js.replace(from,to); changed=true;
}

const plazaConstants=`// LUBIAK_PLAZA_TERRACE_V1\nconst FREAK_STREET_GROUND_Y = 0;\nconst CIRCUS_GROUND_Y = 0;\nconst KUMARI_PLAZA_Y = 4.0; // deliberately >= 2x the lower district reference rise\n`;
if(!js.includes('LUBIAK_PLAZA_TERRACE_V1')){
  const anchor="const exteriorReturn = { position: new THREE.Vector3(), yaw: 0, pitch: 0 };\n";
  if(!js.includes(anchor)) throw new Error('Missing plaza constants anchor');
  js=js.replace(anchor,anchor+'\n'+plazaConstants); changed=true;
}

// Keep the environment centred horizontally, but do not let arbitrary deep geometry
// define vertical placement. Lower district remains the stable world datum.
replaceOnce(
  '  root.position.set(-center.x, -box.min.y, -center.z);\n  root.updateMatrixWorld(true);',
  '  root.position.set(-center.x, FREAK_STREET_GROUND_Y, -center.z);\n  root.updateMatrixWorld(true);',
  'environment vertical authority'
);

// Replace the older circus-only lift with explicit lower-district/circus alignment and
// a separate elevated Kumari Ghar plaza terrace. Prefer semantic names when present,
// but fall back to compact upper-central geometry so the authored plaza moves together.
const oldStart='  // LUBIAK_CIRCUS_GROUND_ZERO_V1';
const oldEnd="  const eyeHeight = Math.max(1.7, Math.min(size.y * 0.12, 5));";
if(js.includes(oldStart)){
  const a=js.indexOf(oldStart);
  const b=js.indexOf(oldEnd,a);
  if(b<0) throw new Error('Missing old circus repair terminator');
  const replacement=`  // LUBIAK_DISTRICT_LEVELS_V2\n  // Freak Street and circus share the lower datum. Kumari Ghar plaza is an\n  // intentionally elevated terrace, clearly above both lower zones.\n  const lowerTerms = /circus|big[ _-]?top|bigtop|tent|marquee|freak[ _-]?street/i;\n  const plazaTerms = /kumari|ghar|plaza|place|square|courtyard|chowk/i;\n  const lowerRoots = [];\n  const plazaRoots = [];\n  root.traverse((object) => {\n    if (object === root) return;\n    const name = object.name || '';\n    if (plazaTerms.test(name)) plazaRoots.push(object);\n    else if (lowerTerms.test(name)) lowerRoots.push(object);\n  });\n\n  function outermost(nodes){\n    return nodes.filter((node) => !nodes.some((other) => other !== node && node.parent && (other === node.parent || other.getObjectById?.(node.parent.id))));\n  }\n\n  const lowerSet = outermost(lowerRoots);\n  if (lowerSet.length) {\n    const lowerBox = new THREE.Box3();\n    lowerSet.forEach((object) => lowerBox.expandByObject(object));\n    if (!lowerBox.isEmpty()) {\n      const lift = CIRCUS_GROUND_Y - lowerBox.min.y;\n      lowerSet.forEach((object) => object.position.y += lift);\n    }\n  }\n\n  let plazaSet = outermost(plazaRoots);\n  if (!plazaSet.length) {\n    const candidates=[];\n    root.children.forEach((child) => {\n      const cb=new THREE.Box3().setFromObject(child);\n      if(cb.isEmpty()) return;\n      const cs=cb.getSize(new THREE.Vector3());\n      const cc=cb.getCenter(new THREE.Vector3());\n      if (cs.x < size.x*0.72 && cs.z < size.z*0.72 && Math.abs(cc.x) < size.x*0.32 && Math.abs(cc.z) < size.z*0.32) candidates.push(child);\n    });\n    plazaSet=candidates;\n  }\n  if (plazaSet.length) {\n    const plazaBox = new THREE.Box3();\n    plazaSet.forEach((object) => plazaBox.expandByObject(object));\n    if (!plazaBox.isEmpty()) {\n      const lift = KUMARI_PLAZA_Y - plazaBox.min.y;\n      plazaSet.forEach((object) => object.position.y += lift);\n      root.updateMatrixWorld(true);\n      console.info('LUBIAK district levels aligned', { freakStreetY:FREAK_STREET_GROUND_Y, circusY:CIRCUS_GROUND_Y, kumariPlazaY:KUMARI_PLAZA_Y, plazaRoots:plazaSet.map(o=>o.name) });\n    }\n  }\n\n`;
  js=js.slice(0,a)+replacement+js.slice(b); changed=true;
}

// Restore true walkable-surface grounding. This lets the djinn climb from Freak Street
// to the elevated plaza and remain attached to the authored terrace instead of Y=0.
const hardcoded=`function applyGroundGravity(dt, clearance=0.0){\n  if(!playerRoot || playerMode!=='walk') return;\n  const targetY=0;\n  playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*28));\n  if (Math.abs(playerRoot.position.y-targetY) < 0.001) playerRoot.position.y=targetY;\n  playerBaseY=targetY;`;
const raycast=`function applyGroundGravity(dt, clearance=0.055){\n  if(!playerRoot || playerMode!=='walk') return;\n  const ground=groundSurfaceBelow(playerRoot.position,12);\n  if(!ground) return;\n  const targetY=ground.hit.point.y+clearance;\n  playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*22));\n  if (Math.abs(playerRoot.position.y-targetY) < 0.001) playerRoot.position.y=targetY;\n  playerBaseY=targetY;`;
replaceOnce(hardcoded,raycast,'walkable surface grounding');

// Spawn remains on the lower district; raycast takes authority immediately afterward.
replaceOnce(
  '  playerRoot.position.set(0, 0, Math.min(env.z * 0.34, 42));\n  playerBaseY = 0;',
  '  playerRoot.position.set(0, FREAK_STREET_GROUND_Y + 0.055, Math.min(env.z * 0.34, 42));\n  playerBaseY = FREAK_STREET_GROUND_Y + 0.055;',
  'player spawn lower datum'
);

if(!changed){ console.log('LUBIAK elevated plaza repair already installed.'); process.exit(0); }
fs.writeFileSync(path,js);
console.log('Applied elevated Kumari Ghar plaza + lower Freak Street/circus hierarchy.');
