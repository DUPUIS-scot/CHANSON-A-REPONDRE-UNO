import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let s=fs.readFileSync(path,'utf8');
if(s.includes('function resolvePlayerCollision')){console.log('Collision patch already present');process.exit(0)}
const anchor=`function combinedMoveInput() {`;
const collision=`const collisionRaycaster = new THREE.Raycaster();
const collisionOrigins = [
  new THREE.Vector3(0,0.28,0), new THREE.Vector3(0,0.92,0), new THREE.Vector3(0,1.48,0),
];
const PLAYER_COLLISION_RADIUS = 0.34;
const BROOM_COLLISION_RADIUS = 0.28;

function activeCollisionRoots() {
  const roots=[];
  if(worldMode==='exterior') {
    if(exteriorRoot?.visible) roots.push(exteriorRoot);
    if(fallbackRoot?.visible) roots.push(fallbackRoot);
    if(dragonRoot?.visible) roots.push(dragonRoot);
  } else if(worldMode==='circus' && circusInterior?.visible) {
    roots.push(circusInterior);
  }
  return roots;
}

function rayBlocked(origin, direction, distance) {
  if(direction.lengthSq()<1e-8) return false;
  collisionRaycaster.set(origin, direction.clone().normalize());
  collisionRaycaster.near=0;
  collisionRaycaster.far=distance;
  for(const root of activeCollisionRoots()) {
    const hits=collisionRaycaster.intersectObject(root,true);
    if(hits.some(h=>h.distance<=distance)) return true;
  }
  return false;
}

function resolvePlayerCollision(from, to, includeBroom=false) {
  const delta=to.clone().sub(from);
  const dist=delta.length();
  if(dist<1e-6) return to;
  const dir=delta.clone().normalize();
  const probe=dist + PLAYER_COLLISION_RADIUS + (includeBroom?BROOM_COLLISION_RADIUS:0);
  for(const local of collisionOrigins) {
    const origin=from.clone().add(local);
    if(rayBlocked(origin,dir,probe)) return from.clone();
  }
  if(includeBroom && broomRoot) {
    broomRoot.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(broomRoot);
    if(!box.isEmpty()) {
      const c=box.getCenter(new THREE.Vector3());
      if(rayBlocked(c,dir,dist+BROOM_COLLISION_RADIUS)) return from.clone();
    }
  }
  return to;
}

function movePlayerWithCollision(delta, includeBroom=false) {
  if(!playerRoot || delta.lengthSq()<1e-10) return;
  const start=playerRoot.position.clone();
  const desired=start.clone().add(delta);
  const solved=resolvePlayerCollision(start,desired,includeBroom);
  if(solved.equals(start)) {
    // Try axis-separated sliding so walls feel physical instead of sticky.
    const xTry=resolvePlayerCollision(start,start.clone().add(new THREE.Vector3(delta.x,0,0)),includeBroom);
    playerRoot.position.copy(xTry);
    const zStart=playerRoot.position.clone();
    const zTry=resolvePlayerCollision(zStart,zStart.clone().add(new THREE.Vector3(0,delta.y,delta.z)),includeBroom);
    playerRoot.position.copy(zTry);
    if(playerRoot.position.distanceTo(start)<1e-5) playerVelocity.multiplyScalar(0.15);
  } else playerRoot.position.copy(solved);
}

`;
if(!s.includes(anchor)) throw new Error('combinedMoveInput anchor missing');
s=s.replace(anchor,collision+anchor);
s=s.replace(`    playerRoot.position.addScaledVector(playerVelocity, dt);\n    proceduralWalk`, `    movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);\n    proceduralWalk`);
s=s.replace(`    playerRoot.position.addScaledVector(playerVelocity, dt);\n    playerRoot.position.y +=`, `    movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);\n    playerRoot.position.y +=`);
// Prevent mounting lift from passing upward through ceilings/mesh.
s=s.replace(`    playerRoot.position.y = playerBaseY + t * 2.6;`, `    const mountTarget = playerRoot.position.clone();\n    mountTarget.y = playerBaseY + t * 2.6;\n    const mountSolved = resolvePlayerCollision(playerRoot.position, mountTarget, true);\n    playerRoot.position.y = mountSolved.y;`);
fs.writeFileSync(path,s);
console.log('Applied LUBIAK boy+broom collision patch');
