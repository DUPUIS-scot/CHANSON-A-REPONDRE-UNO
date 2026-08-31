import fs from 'node:fs';

const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
if(src.includes('LUBIAK_RIDE_DRAGON_MEGAPOLE_V1')){
  console.log('LUBIAK RIDE dragon Megapole collision already present.');
  process.exit(0);
}

const updateAnchor=`function updatePlayer(dt) {`;
if(!src.includes(updateAnchor)) throw new Error('updatePlayer anchor missing');

const helper=`// LUBIAK_RIDE_DRAGON_MEGAPOLE_V1
// A physical broom-flight impact with the dragon becomes a cinematic Megapole gateway.
let rideDragonGatewayActive=false;
const rideDragonRaycaster=new THREE.Raycaster();
function rideFlightWouldHitDragon(from,to){
  if(rideDragonGatewayActive || playerMode!=='flight' || worldMode!=='exterior' || !dragonRoot?.visible) return false;
  dragonRoot.updateMatrixWorld(true);
  const delta=to.clone().sub(from);
  const distance=delta.length();
  if(distance>1e-5){
    rideDragonRaycaster.set(from.clone().add(new THREE.Vector3(0,0.95,0)),delta.clone().normalize());
    rideDragonRaycaster.near=0;
    rideDragonRaycaster.far=distance+0.9;
    if(rideDragonRaycaster.intersectObject(dragonRoot,true).length) return true;
  }
  const dragonBox=new THREE.Box3().setFromObject(dragonRoot);
  if(dragonBox.isEmpty()) return false;
  dragonBox.expandByScalar(0.62);
  const riderProbe=to.clone().add(new THREE.Vector3(0,0.9,0));
  return dragonBox.containsPoint(riderProbe) || dragonBox.distanceToPoint(riderProbe)<0.72;
}
function enterMegapoleFromRideDragon(){
  if(rideDragonGatewayActive) return;
  rideDragonGatewayActive=true;
  playerVelocity.set(0,0,0);
  showStatus('DRAGON IMPACT · ENTERING SILMARI’LLION MEGAPOLE',0);
  const overlay=document.createElement('div');
  overlay.id='lubiak-ride-dragon-cinematic';
  overlay.style.cssText='position:fixed;inset:0;z-index:10050;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden';
  const video=document.createElement('video');
  video.src='../assets/assets/videos/grok-video-ab342e1f-6aba-436f-85eb-30aa604d252f.mp4';
  video.preload='auto';
  video.playsInline=true;
  video.setAttribute('playsinline','');
  video.style.cssText='width:100%;height:100%;object-fit:cover;background:#000';
  const skip=document.createElement('button');
  skip.type='button';
  skip.textContent='SKIP · MEGAPOLE';
  skip.style.cssText='position:absolute;right:18px;bottom:18px;z-index:3;border:1px solid #f0d7ad88;background:#080504dd;color:#f0d7ad;padding:10px 13px;font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;cursor:pointer';
  overlay.append(video,skip);
  document.body.appendChild(overlay);
  let gone=false;
  const go=()=>{
    if(gone) return;
    gone=true;
    location.assign('../megapole/');
  };
  video.addEventListener('ended',go,{once:true});
  video.addEventListener('error',go,{once:true});
  skip.addEventListener('click',go,{once:true});
  const attempt=video.play();
  if(attempt?.catch) attempt.catch(()=>{
    video.muted=true;
    video.play().catch(go);
  });
  setTimeout(go,7000);
}

${updateAnchor}`;
src=src.replace(updateAnchor,helper);

const moveAnchor=`    movePlayerWithCollision(playerVelocity.clone().multiplyScalar(dt), true);`;
if(!src.includes(moveAnchor)) throw new Error('flight move anchor missing');
const moveReplacement=`    const rideDelta=playerVelocity.clone().multiplyScalar(dt);\n    const rideFrom=playerRoot.position.clone();\n    const rideTo=rideFrom.clone().add(rideDelta);\n    if(rideFlightWouldHitDragon(rideFrom,rideTo)){\n      enterMegapoleFromRideDragon();\n      return;\n    }\n    movePlayerWithCollision(rideDelta, true);`;
src=src.replace(moveAnchor,moveReplacement);

fs.writeFileSync(path,src);
console.log('Added RIDE dragon collision cinematic Megapole gateway.');
