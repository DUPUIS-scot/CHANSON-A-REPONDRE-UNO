import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
let changed=false;
function rep(from,to,label){if(src.includes(to))return;if(!src.includes(from))throw new Error(`missing ${label}`);src=src.replace(from,to);changed=true;}
rep('broomRoot.scale.setScalar(2.65 / longest);','// LUBIAK_BROOM_REFERENCE_PROPORTION_V2\n  // Reference: DA NOBLE Y2K spans about 1.9x the 1.72-unit djinn height.\n  broomRoot.scale.setScalar(3.34 / longest);','broom scale');
rep("broomShoulderSocket.position.set(0.08, -0.03, 0.02);\n  broomShoulderSocket.rotation.set(0.10, -0.22, 0.30);","// Primary shoulder carry: engine behind/left of head, shaft across upper back, right-hand grip.\n  broomShoulderSocket.position.set(0.055, 0.015, 0.035);\n  broomShoulderSocket.rotation.set(0.075, -0.18, 0.24);",'carry socket');
rep("broomRoot.position.set(-0.42, -0.03, -0.01);","broomRoot.position.set(-0.54, -0.015, -0.015);",'carry offset');
rep("function applyWalkCarryPose(blend = 1, swing = 0) {\n  const b = playerBoneCache;\n  if (!b) return;","function applyWalkCarryPose(blend = 1, swing = 0) {\n  const b = playerBoneCache;\n  if (!b) return;\n\n  // LUBIAK_BROOM_WALK_VARIANTS_V2\n  // Keep the hand grip authoritative while the heavy engine subtly settles with the stride.\n  if (broomShoulderSocket) {\n    const gait = Math.abs(swing);\n    const weight = Math.sin(walkPhase * 0.5);\n    broomShoulderSocket.position.y = 0.015 - gait * 0.012 * blend;\n    broomShoulderSocket.rotation.x = 0.075 + swing * 0.035 * blend;\n    broomShoulderSocket.rotation.y = -0.18 + weight * 0.025 * blend;\n    broomShoulderSocket.rotation.z = 0.24 - gait * 0.04 * blend;\n  }",'walk carry dynamics');
rep("b.chest.rotation.z = 0.045 * blend;","// Counterbalance the oversized engine without disturbing locomotion.\n    b.chest.rotation.z = (0.045 - Math.abs(swing) * 0.018) * blend;",'body counterbalance');
if(!changed){console.log('Broom proportion/walk reference already installed.');process.exit(0);}
fs.writeFileSync(path,src);console.log('Applied DA NOBLE Y2K reference proportion and walking carry variants.');
