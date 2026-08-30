import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
if(src.includes('LUBIAK_RIDE_2MIX_TRAY_V1')) process.exit(0);
const anchor=`const joystick = document.createElement('div');`;
if(!src.includes(anchor)) throw new Error('joystick anchor missing');
const ui=`// LUBIAK_RIDE_2MIX_TRAY_V1
// Match the Enochian Terminal 2MIX live-context visual language while the djinn rides DA NOBLE Y2K.
const rideSignalTray=document.createElement('div');
rideSignalTray.id='lubiak-ride-signal-tray';
rideSignalTray.setAttribute('role','status');
rideSignalTray.setAttribute('aria-live','polite');
rideSignalTray.innerHTML='<b>RIDE</b> <span class="ctx">DA NOBLE Y2K</span><span class="hint">MOVE STEER · ▲ UP CLIMB · ▼ DOWN DESCEND</span><span class="live">LUBIAK FLIGHT SIGNAL</span>';
document.body.appendChild(rideSignalTray);
const rideSignalStyle=document.createElement('style');
rideSignalStyle.textContent=\`
#lubiak-ride-signal-tray{position:fixed;z-index:73;left:18px;bottom:max(70px,calc(env(safe-area-inset-bottom) + 70px));display:none;max-width:300px;padding:6px 8px;border:1px solid #63f5cf;border-radius:5px 5px 5px 1px;background:#03110ff2;color:#c9fff0;font:800 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.05em;white-space:normal;pointer-events:none;box-shadow:0 4px 16px #000c,0 0 12px #19c98f55}
#lubiak-ride-signal-tray.visible{display:block}#lubiak-ride-signal-tray b{color:#f0c97e;letter-spacing:.13em}#lubiak-ride-signal-tray .ctx{color:#dffcff}#lubiak-ride-signal-tray .live{display:block;margin-top:2px;color:#63f5cf;letter-spacing:.08em}#lubiak-ride-signal-tray .hint{display:block;margin-top:2px;color:#9de8dc}
@media(max-width:720px){#lubiak-ride-signal-tray{left:10px;bottom:max(62px,calc(env(safe-area-inset-bottom) + 62px));max-width:220px;padding:5px 6px;font-size:6px}}
\`;
document.head.appendChild(rideSignalStyle);
function refreshRideSignalTray(){
  const riding=playerMode==='mounting'||playerMode==='flight';
  rideSignalTray.classList.toggle('visible',riding&&cameraMode!=='aerial');
  if(riding){
    const phase=playerMode==='mounting'?'MOUNTING':'FLIGHT';
    const altitude=playerRoot?Math.max(0,playerRoot.position.y).toFixed(1):'0.0';
    const speed=playerVelocity?playerVelocity.length().toFixed(1):'0.0';
    rideSignalTray.querySelector('.ctx').textContent='DA NOBLE Y2K · '+phase;
    rideSignalTray.querySelector('.live').textContent='LUBIAK FLIGHT SIGNAL · ALT '+altitude+' · SPD '+speed;
  }
}

${anchor}`;
src=src.replace(anchor,ui);
const renderAnchor=`  renderer.render(scene, camera);`;
if(!src.includes(renderAnchor)) throw new Error('render anchor missing');
src=src.replace(renderAnchor,`  if(typeof refreshRideSignalTray==='function') refreshRideSignalTray();\n${renderAnchor}`);
fs.writeFileSync(path,src);
console.log('Added 2MIX-style RIDE signal tray.');
