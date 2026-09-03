import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
if(src.includes('LUBIAK_INTERACTIVE_LAYER_RESTORE_V1')) process.exit(0);

// Restore actor asset authority to canonical deployed model paths.
src=src.replaceAll('/assets/assets/models/textured-glb-comparison/lubiak_dragon_guardian_web.glb','/assets/assets/models/lubiak_dragon_guardian_web.glb');
src=src.replaceAll('/assets/assets/models/textured-glb-comparison/lubiak_djinn_player_ultralight.glb','/assets/assets/models/lubiak_djinn_player_ultralight.glb');
src=src.replaceAll('/assets/assets/models/textured-glb-comparison/lubiak_da_noble_y2k_broom_ultralight.glb','/assets/assets/models/lubiak_da_noble_y2k_broom_ultralight.glb');

const anchor='let walkPhase = 0;';
if(!src.includes(anchor)) throw new Error('interactive input anchor missing');
const ui=`// LUBIAK_INTERACTIVE_LAYER_RESTORE_V1
// Restore the movement sphere, vertical flight controls and FOLLOW/AERIAL/RIDE navigation UI.
const joystickVector = new THREE.Vector2();
let verticalTrigger = 0;

const joystick = document.createElement('div');
joystick.id='lubiak-sphere-control';
joystick.innerHTML='<div class="sphere-shell"><div class="sphere-knob"></div></div><span>MOVE</span>';
joystick.style.cssText='position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));width:112px;height:132px;z-index:80;display:grid;place-items:center;touch-action:none;user-select:none;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.16em';
document.body.appendChild(joystick);
const js=document.createElement('style');
js.textContent='#lubiak-sphere-control .sphere-shell{position:relative;width:98px;height:98px;border-radius:50%;border:1px solid #f6c28b99;background:radial-gradient(circle at 32% 27%,#fff7 0 4%,#efad6d55 5% 17%,#6d3018bb 48%,#190a06ee 100%);box-shadow:inset -14px -17px 26px #000a,0 8px 28px #000a}#lubiak-sphere-control .sphere-knob{position:absolute;left:50%;top:50%;width:36px;height:36px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 28%,#fff8,#f2ae68 24%,#7c3415 66%,#210b04);border:1px solid #ffd7a1aa}#lubiak-sphere-control span{position:absolute;bottom:1px}';
document.head.appendChild(js);
const knob=joystick.querySelector('.sphere-knob');
let joyPointer=null;
function setJoy(e){const r=joystick.querySelector('.sphere-shell').getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))/(r.width*.5);const y=(e.clientY-(r.top+r.height/2))/(r.height*.5);joystickVector.set(THREE.MathUtils.clamp(x,-1,1),THREE.MathUtils.clamp(-y,-1,1));if(joystickVector.length()>1) joystickVector.normalize();knob.style.transform='translate(calc(-50% + '+(joystickVector.x*29)+'px),calc(-50% + '+(-joystickVector.y*29)+'px))';}
joystick.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joystick.setPointerCapture?.(e.pointerId);setJoy(e);e.preventDefault()});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)setJoy(e)});
function releaseJoy(e){if(joyPointer!==null && (!e||e.pointerId===joyPointer)){joyPointer=null;joystickVector.set(0,0);knob.style.transform='translate(-50%,-50%)';}}
joystick.addEventListener('pointerup',releaseJoy);joystick.addEventListener('pointercancel',releaseJoy);

const verticalDock=document.createElement('div');verticalDock.id='lubiak-vertical-dock';verticalDock.style.cssText='position:fixed;right:max(132px,calc(env(safe-area-inset-right) + 132px));bottom:max(28px,calc(env(safe-area-inset-bottom) + 28px));z-index:81;display:flex;flex-direction:column;gap:7px';
function verticalButton(label,value){const b=document.createElement('button');b.textContent=label;b.style.cssText='border:1px solid #f6c28b88;background:#100806dd;color:#ffe2bd;padding:9px 12px;border-radius:18px;font:700 10px system-ui;touch-action:none';const on=e=>{verticalTrigger=value;b.setPointerCapture?.(e.pointerId);e.preventDefault()};const off=()=>{if(verticalTrigger===value)verticalTrigger=0};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);verticalDock.appendChild(b);}
verticalButton('▲ UP',1);verticalButton('▼ DOWN',-1);document.body.appendChild(verticalDock);

const modeDock=document.createElement('div');modeDock.id='lubiak-mode-dock';modeDock.style.cssText='position:fixed;right:max(18px,env(safe-area-inset-right));bottom:158px;z-index:82;display:flex;gap:5px;padding:5px;border:1px solid #f6c28b55;border-radius:999px;background:#100806dd';
function modeButton(label,fn){const b=document.createElement('button');b.textContent=label;b.style.cssText='border:1px solid #f6c28b66;border-radius:999px;padding:8px 10px;background:#160b08cc;color:#ffe2bd;font:700 9px system-ui;letter-spacing:.08em';b.addEventListener('click',fn);modeDock.appendChild(b);return b;}
const followToggle=modeButton('FOLLOW',()=>{if(playerMode!=='walk'){playerMode='walk';restoreStandingWalkPose();}setCameraMode('follow');refreshLubiakModeButtons()});
const aerialToggle=modeButton('AERIAL',()=>{setCameraMode('aerial');refreshLubiakModeButtons()});
const rideToggle=modeButton('RIDE',()=>{if(!playerReady||!broomRoot)return;if(playerMode==='walk'){prepareBroomForRide();mountTransition=0;playerMode='mounting';}setCameraMode('follow');refreshLubiakModeButtons()});
document.body.appendChild(modeDock);
function refreshLubiakModeButtons(){const riding=playerMode==='mounting'||playerMode==='flight';const active=cameraMode==='aerial'?aerialToggle:riding?rideToggle:followToggle;for(const b of [followToggle,aerialToggle,rideToggle])b.style.opacity=b===active?'1':'.65';verticalDock.style.display=(riding||cameraMode==='aerial')?'flex':'none';}
function refreshVerticalControls(){refreshLubiakModeButtons();}
refreshLubiakModeButtons();

${anchor}`;
src=src.replace(anchor,ui);
fs.writeFileSync(path,src);
console.log('Restored LUBIAK interactive actors and navigation UI.');