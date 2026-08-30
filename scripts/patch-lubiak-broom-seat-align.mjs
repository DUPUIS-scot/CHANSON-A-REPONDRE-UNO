import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
const from=`let broomShoulderSocket = null;\nlet broomRideStart = null;`;
const to=`let broomShoulderSocket = null;\nlet broomRideStart = null;\nlet broomRideCenterOffset = new THREE.Vector3();`;
if(!src.includes(to)){if(!src.includes(from)) throw new Error('missing broom state anchor'); src=src.replace(from,to);}
const fromPrep=`  playerRoot.attach(broomRoot);\n  broomRideStart = {\n    position: broomRoot.position.clone(),\n    quaternion: broomRoot.quaternion.clone(),\n  };`;
const toPrep=`  playerRoot.attach(broomRoot);\n  // Measure the rendered broom centre in player-local space after reparenting.\n  // GLB origins are not guaranteed to sit on the shaft, so riding must align\n  // visible geometry rather than the asset pivot.\n  broomRoot.updateMatrixWorld(true);\n  const rideBox = new THREE.Box3().setFromObject(broomRoot);\n  const rideCenterWorld = rideBox.getCenter(new THREE.Vector3());\n  const rideCenterLocal = playerRoot.worldToLocal(rideCenterWorld.clone());\n  broomRideCenterOffset.copy(rideCenterLocal).sub(broomRoot.position);\n  broomRideStart = {\n    position: broomRoot.position.clone(),\n    quaternion: broomRoot.quaternion.clone(),\n  };`;
if(!src.includes(toPrep)){if(!src.includes(fromPrep)) throw new Error('missing ride prepare anchor'); src=src.replace(fromPrep,toPrep);}
const fromTarget=`    const targetPos = new THREE.Vector3(0, 0.58, 0.02);`;
const toTarget=`    // Seat the visible broom shaft directly beneath the djinn pelvis.\n    // Compensate for the GLB's off-centre pivot so the rider cannot float above it.\n    const targetPos = new THREE.Vector3(0, 0.72, 0.02).sub(broomRideCenterOffset);`;
if(!src.includes(toTarget)){if(!src.includes(fromTarget)) throw new Error('missing ride target anchor'); src=src.replace(fromTarget,toTarget);}
fs.writeFileSync(path,src); console.log('Aligned visible broom geometry beneath djinn pelvis.');
