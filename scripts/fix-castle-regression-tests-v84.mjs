import fs from 'node:fs';
const perf='test/castle_loading_performance_test.dart';
const integ='test/castle_jester_gatekeeper_integration_test.dart';
let a=fs.readFileSync(perf,'utf8');
let b=fs.readFileSync(integ,'utf8');
function rep(s,from,to,label){if(!s.includes(from)) throw new Error('missing '+label);return s.replace(from,to)}
a=rep(a,"expect(jesterOverlay, contains('worldPosition=mesh.getWorldPosition'));","expect(jesterOverlay, contains('const p=mesh.getWorldPosition'));",'world position assertion');
a=rep(a,"contains('parent.worldToLocal(worldPosition)')","contains('parent.worldToLocal(p)')",'worldToLocal assertion');
a=rep(a,"contains('parentWorldQuaternion.invert().multiply(worldQuaternion)')","contains('parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q)')",'quaternion assertion');
b=rep(b,"contains(\"castleEntranceTrigger='castle-anywhere-single-click'\")","contains(\"castleEntranceTrigger='jester-exact-hit-pointerup-v84'\")",'entrance trigger assertion');
b=rep(b,"expect(overlay, contains(\"castleJesterGesture='single-click-anywhere-v73'\"));","expect(overlay, contains(\"castleJesterGesture='exact-jester-pointerup-v84'\"));",'gesture assertion');
b=rep(b,"expect(overlay, contains('if(!down||down.pointerId!==event.pointerId||down.moved)return'));","expect(overlay, contains('if(!down||down.pointerId!==event.pointerId||down.moved||!down.jester||!exactHit(event))return'));",'pointerup guard assertion');
b=rep(b,"expect(overlay, isNot(contains('||!down.jester||down.moved')));","expect(overlay, contains('pointerDown={pointerId:event.pointerId,x:event.clientX,y:event.clientY,jester:hit,moved:false}'));",'pointerdown hit assertion');
fs.writeFileSync(perf,a);fs.writeFileSync(integ,b);
console.log('Aligned Castle regression tests with exact-jester v84 runtime.');
