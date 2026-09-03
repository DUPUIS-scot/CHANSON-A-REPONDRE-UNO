import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
let changed=false;
function rep(from,to,label){
  if(src.includes(to)) return;
  if(!src.includes(from)) throw new Error(`missing ${label}`);
  src=src.replace(from,to); changed=true;
}
rep(
  "let followDistance = 4.35;\n// LUBIAK_AERIAL_CAMERA_V1",
  "let followDistance = 4.35;\n// LUBIAK_FOLLOW_RIGHT_SHOULDER_V1\nconst followShoulderOffset = 0.72;\n// LUBIAK_AERIAL_CAMERA_V1",
  'follow shoulder constant'
);
rep(
  "playerVelocity.lerp(desired.multiplyScalar(5.0 * mag), Math.min(1, dt * 9));",
  "// FOLLOW walk speed is always exactly half the current aerial navigation speed.\n        playerVelocity.lerp(desired.multiplyScalar((aerialSpeed * 0.5) * mag), Math.min(1, dt * 9));",
  'walk speed authority'
);
rep(
  "const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.40 : 1.18, 0));\n  const cp = Math.cos(followPitch);",
  "const target = playerRoot.position.clone().add(new THREE.Vector3(0, playerMode === 'flight' ? 1.40 : 1.18, 0));\n  // In FOLLOW/walk, bias the framing over the djinn's right shoulder.\n  if (playerMode === 'walk') {\n    const rightShoulder = new THREE.Vector3(Math.cos(playerHeading), 0, -Math.sin(playerHeading));\n    target.addScaledVector(rightShoulder, followShoulderOffset);\n  }\n  const cp = Math.cos(followPitch);",
  'follow camera target'
);
if(!changed){console.log('LUBIAK follow right-shoulder/speed patch already installed.');process.exit(0);}
fs.writeFileSync(path,src);
console.log('Installed LUBIAK right-shoulder follow camera and half-aerial walk speed.');
