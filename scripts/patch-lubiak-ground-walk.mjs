import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

const start = src.indexOf('// LUBIAK_SURFACE_GRAVITY_V1');
const end = src.indexOf('function combinedMoveInput()', start);
if (start < 0 || end < 0) throw new Error('Surface gravity block not found');

const replacement = `// LUBIAK_GROUND_GRAVITY_V2\n// Walk mode stays upright and attached only to walkable ground surfaces.\n// Walls and ceilings remain collision surfaces, never walking surfaces.\nconst surfaceRaycaster = new THREE.Raycaster();\nconst WORLD_UP = new THREE.Vector3(0,1,0);\nconst WALKABLE_NORMAL_Y = 0.42;\n\nfunction activeSurfaceRoots(){\n  const roots=[];\n  if(worldMode==='exterior'){\n    if(exteriorRoot?.visible) roots.push(exteriorRoot);\n    if(fallbackRoot?.visible) roots.push(fallbackRoot);\n  } else if(worldMode==='circus' && circusInterior?.visible) roots.push(circusInterior);\n  return roots;\n}\n\nfunction worldHitNormal(hit){\n  if(!hit?.face || !hit?.object) return null;\n  const normalMatrix=new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);\n  return hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();\n}\n\nfunction groundSurfaceBelow(point, maxDistance=8){\n  const roots=activeSurfaceRoots();\n  if(!roots.length) return null;\n  const origin=point.clone().add(new THREE.Vector3(0,2.2,0));\n  surfaceRaycaster.set(origin,new THREE.Vector3(0,-1,0));\n  surfaceRaycaster.near=0;\n  surfaceRaycaster.far=maxDistance+2.2;\n  let best=null;\n  for(const root of roots){\n    const hits=surfaceRaycaster.intersectObject(root,true);\n    for(const hit of hits){\n      const normal=worldHitNormal(hit);\n      if(!normal || normal.dot(WORLD_UP)<WALKABLE_NORMAL_Y) continue;\n      if(hit.point.y>origin.y+0.05) continue;\n      if(!best || hit.point.y>best.hit.point.y) best={hit,normal};\n    }\n  }\n  return best;\n}\n\nfunction groundMoveVector(input){\n  const forward=new THREE.Vector3(Math.sin(followYaw),0,-Math.cos(followYaw));\n  const right=new THREE.Vector3(Math.cos(followYaw),0,Math.sin(followYaw));\n  const desired=forward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));\n  if(desired.lengthSq()>1e-6) desired.normalize();\n  return desired;\n}\n\nfunction applyGroundGravity(dt, clearance=0.055){\n  if(!playerRoot || playerMode!=='walk') return;\n  const ground=groundSurfaceBelow(playerRoot.position,10);\n  if(!ground) return;\n  const targetY=ground.hit.point.y+clearance;\n  playerRoot.position.y += (targetY-playerRoot.position.y)*(1-Math.exp(-dt*20));\n  playerBaseY=targetY;\n\n  // Keep the djinn upright in world gravity. Only yaw follows travel direction.\n  const targetQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,playerHeading,0,'YXZ'));\n  playerRoot.quaternion.slerp(targetQ,1-Math.exp(-dt*14));\n}\n\n`;

src = src.slice(0,start) + replacement + src.slice(end);
src = src.replace('const desired = surfaceMoveVector(input);','const desired = groundMoveVector(input);');
src = src.replace('applySurfaceGravity(dt);','applyGroundGravity(dt);');

fs.writeFileSync(path, src);
console.log('Patched LUBIAK walk mode to world-upright ground gravity.');
