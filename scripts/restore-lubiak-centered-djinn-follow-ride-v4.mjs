import fs from 'node:fs';

const path='web/lubiak/lubiak.js';
let s=fs.readFileSync(path,'utf8');
if(s.includes('LUBIAK_CENTERED_DJINN_FOLLOW_RIDE_V4')){
  console.log('Centered Djinn follow/ride v4 already installed.');
  process.exit(0);
}

// Strengthen the existing centre-lock: FOLLOW/RIDE stays centred on the Djinn,
// while AERIAL/free look stays centred on the authored LUBIAK environment.
const captureStart=s.indexOf('function captureCenterLockFocus(){');
const applyStart=s.indexOf('\nfunction applyCenterLockedOrbit(){',captureStart);
const directLook=s.indexOf('\n// LUBIAK_DIRECT_LOOK_V1',applyStart);
if(captureStart<0||applyStart<0||directLook<0) throw new Error('centre-lock anchors missing');
const centreBlock=`function centerLockWorldFocus(out){
  // LUBIAK_CENTERED_DJINN_FOLLOW_RIDE_V4
  // Drag is orientation only. It never pans/translates the authored LUBIAK scene.
  if(cameraMode==='follow'&&playerReady&&playerRoot){
    return out.copy(playerRoot.position).add(new THREE.Vector3(0,playerMode==='flight'||playerMode==='mounting'?1.40:1.18,0));
  }
  const candidates=[worldMode==='circus'?circusSetRoot:null,worldMode==='circus'?circusInterior:null,exteriorRoot];
  for(const root of candidates){
    if(!root) continue;
    try{
      const box=new THREE.Box3().setFromObject(root);
      if(!box.isEmpty()) return box.getCenter(out);
    }catch(_){ }
  }
  if(movementBounds&&!movementBounds.isEmpty()) return movementBounds.getCenter(out);
  const dir=new THREE.Vector3();camera.getWorldDirection(dir);
  return out.copy(camera.position).addScaledVector(dir,18);
}
function captureCenterLockFocus(){
  centerLockWorldFocus(centerLockFocus);
  centerLockRadius=THREE.MathUtils.clamp(camera.position.distanceTo(centerLockFocus),2.5,160);
  centerLockActive=true;
}
function applyCenterLockedOrbit(){
  if(!centerLockActive)return;
  // Re-pin the live subject while dragging so movement/animation cannot pull it off-centre.
  centerLockWorldFocus(centerLockFocus);
  const a=currentCenterLockAngles();
  const cp=Math.cos(a.pitch);
  camera.position.set(
    centerLockFocus.x+Math.sin(a.yaw)*cp*centerLockRadius,
    centerLockFocus.y+Math.sin(a.pitch)*centerLockRadius,
    centerLockFocus.z+Math.cos(a.yaw)*cp*centerLockRadius
  );
  camera.lookAt(centerLockFocus);
}
`;
s=s.slice(0,captureStart)+centreBlock+s.slice(directLook+1);

// Enforce the orbit lock immediately before every rendered frame. This prevents
// follow/aerial camera updates from turning a drag into an apparent pan.
const renderAnchor="  repairLubiakStaticWorld();\n  if(typeof refreshRideSignalTray==='function') refreshRideSignalTray();\n  renderer.render(scene, camera);";
if(!s.includes(renderAnchor)) throw new Error('render authority anchor missing');
s=s.replace(renderAnchor,"  repairLubiakStaticWorld();\n  if(centerLockActive) applyCenterLockedOrbit();\n  if(typeof refreshRideSignalTray==='function') refreshRideSignalTray();\n  renderer.render(scene, camera);");

// Restore all FOLLOW behaviour: return from ride cleanly, reattach the broom to
// the carrying pose, reveal the complete actor and immediately re-centre camera.
const followOld="const followToggle=modeButton('FOLLOW',()=>{if(playerMode!=='walk'){playerMode='walk';restoreStandingWalkPose();}setCameraMode('follow');refreshLubiakModeButtons()});";
const followNew="const followToggle=modeButton('FOLLOW',()=>{if(!playerReady||!playerRoot)return;if(playerMode!=='walk'){playerMode='walk';restoreStandingWalkPose();}else if(broomRoot&&typeof recoverBroomCarryIfNeeded==='function')recoverBroomCarryIfNeeded();if(typeof revealDjinnAndBroom==='function')revealDjinnAndBroom();setCameraMode('follow');followDistance=Math.max(followDistance,5.15);updateFollowCamera(1);refreshLubiakModeButtons()});";
if(!s.includes(followOld)&&!s.includes(followNew)) throw new Error('FOLLOW control anchor missing');
if(s.includes(followOld)) s=s.replace(followOld,followNew);

// Restore RIDE behaviour: ensure Djinn+broom are present before mounting, reset
// walk blend, hand authority and mount transition, and keep follow camera centred.
const rideOld="const rideToggle=modeButton('RIDE',()=>{if(!playerReady||!broomRoot)return;if(playerMode==='walk'){prepareBroomForRide();mountTransition=0;playerMode='mounting';}setCameraMode('follow');refreshLubiakModeButtons()});";
const rideNew="const rideToggle=modeButton('RIDE',()=>{if(!playerReady||!playerRoot||!broomRoot)return;if(typeof forceActorTreeVisible==='function'){forceActorTreeVisible(playerRoot);forceActorTreeVisible(broomRoot);}if(playerMode==='walk'){if(typeof recoverBroomCarryIfNeeded==='function')recoverBroomCarryIfNeeded();walkBlend=0;prepareBroomForRide();mountTransition=0;playerMode='mounting';}setCameraMode('follow');followDistance=Math.max(followDistance,5.15);updateFollowCamera(1);refreshLubiakModeButtons()});";
if(!s.includes(rideOld)&&!s.includes(rideNew)) throw new Error('RIDE control anchor missing');
if(s.includes(rideOld)) s=s.replace(rideOld,rideNew);

fs.writeFileSync(path,s);
console.log('Restored centred LUBIAK drag plus complete Djinn FOLLOW/RIDE authority.');
