import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let s=fs.readFileSync(path,'utf8');
if(s.includes('LUBIAK_SHARE_MOMENT_LINK_V4')) process.exit(0);
const start=s.indexOf('// LUBIAK_SHARE_PREVIEW_LINK_V3');
const end=s.indexOf('// LUBIAK_DIRECT_LOOK_V1',start);
if(start<0||end<0) throw new Error('share preview v3 block missing');
const block=`// LUBIAK_SHARE_MOMENT_LINK_V4
// Capture is preview-only. What leaves the device is a URL that restores this exact LUBIAK view.
let sharePreviewObjectUrl=null;
function closeLubiakSharePreview(){
  document.querySelector('#lubiak-share-preview')?.remove();
  if(sharePreviewObjectUrl){URL.revokeObjectURL(sharePreviewObjectUrl);sharePreviewObjectUrl=null;}
}
function momentRound(n){return Number.isFinite(n)?Math.round(n*1000)/1000:0;}
function currentLubiakMomentState(){
  const state={
    v:1,w:worldMode,cm:cameraMode,f:momentRound(camera.fov),
    c:camera.position.toArray().map(momentRound),y:momentRound(yaw),p:momentRound(pitch),
    fy:momentRound(followYaw),fp:momentRound(followPitch),fd:momentRound(followDistance),
    ay:momentRound(aerialYaw),ap:momentRound(aerialPitch)
  };
  if(playerReady&&playerRoot){
    state.pp=playerRoot.position.toArray().map(momentRound);
    state.ph=momentRound(playerHeading);
    state.pm=playerMode;
  }
  return state;
}
function encodeLubiakMoment(state){
  return btoa(JSON.stringify(state)).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
}
function decodeLubiakMoment(value){
  if(!value) return null;
  try{
    const b64=value.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((value.length+3)%4);
    const state=JSON.parse(atob(b64));
    return state&&state.v===1?state:null;
  }catch{return null;}
}
function buildLubiakMomentUrl(state=currentLubiakMomentState()){
  const url=new URL(location.href);
  url.hash='';
  url.searchParams.set('moment',encodeLubiakMoment(state));
  return url.toString();
}
function applySharedLubiakMoment(){
  const state=decodeLubiakMoment(new URLSearchParams(location.search).get('moment'));
  if(!state) return false;
  if(state.w==='circus'){
    makeCircusInterior();
    worldMode='circus';
    setExteriorVisibility(false);
    if(circusInterior)circusInterior.visible=true;
    scene.background=new THREE.Color(0x160b08);
    scene.fog=new THREE.FogExp2(0x1e0d09,0.012);
    renderer.toneMappingExposure=1.45;
    setCircusMediaVisible(true);
    installCircusSet();
    if(typeof syncCircusExitButton==='function')syncCircusExitButton();
  }else{
    worldMode='exterior';
    setExteriorVisibility(true);
    if(circusInterior)circusInterior.visible=false;
    scene.background=null;
    scene.fog=new THREE.FogExp2(exteriorFogColor,0.0024);
    renderer.toneMappingExposure=1.0;
    setCircusMediaVisible(false);
    if(typeof syncCircusExitButton==='function')syncCircusExitButton();
  }
  if(Array.isArray(state.pp)&&state.pp.length===3&&playerReady&&playerRoot){
    playerRoot.position.fromArray(state.pp);
    playerBaseY=playerRoot.position.y;
    playerHeading=Number.isFinite(state.ph)?state.ph:playerHeading;
    playerRoot.rotation.set(0,playerHeading,0,'YXZ');
    if(state.pm==='flight'&&broomRoot){prepareBroomForRide();playerMode='flight';applyRidePose(1);}
    else {playerMode='walk';restoreStandingWalkPose();}
    playerRoot.visible=true;
  }
  if(Number.isFinite(state.f)){camera.fov=THREE.MathUtils.clamp(state.f,30,78);camera.updateProjectionMatrix();}
  if(Number.isFinite(state.fy))followYaw=state.fy;
  if(Number.isFinite(state.fp))followPitch=state.fp;
  if(Number.isFinite(state.fd))followDistance=state.fd;
  if(Number.isFinite(state.ay))aerialYaw=state.ay;
  if(Number.isFinite(state.ap))aerialPitch=state.ap;
  if(Number.isFinite(state.y))yaw=state.y;
  if(Number.isFinite(state.p))pitch=state.p;
  cameraMode=state.cm==='aerial'?'aerial':'follow';
  if(cameraMode==='aerial'){
    if(Array.isArray(state.c)&&state.c.length===3)camera.position.fromArray(state.c);
    camera.rotation.order='YXZ';camera.rotation.y=aerialYaw;camera.rotation.x=aerialPitch;
  }else if(playerReady&&playerRoot){
    updateFollowCamera(1);
  }else{
    if(Array.isArray(state.c)&&state.c.length===3)camera.position.fromArray(state.c);
    camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
  }
  if(typeof refreshLubiakModeButtons==='function')refreshLubiakModeButtons();
  transitionLockUntil=performance.now()+650;
  showStatus('SHARED LUBIAK MOMENT',1000);
  return true;
}
async function shareMomentLink(momentUrl){
  const data={title:'LUBIAK — Chanson à Répondre UNO',text:'Open this LUBIAK moment',url:momentUrl};
  if(navigator.share){
    try{await navigator.share(data);return true;}catch(error){if(error?.name==='AbortError')return false;}
  }
  try{await navigator.clipboard?.writeText(momentUrl);showStatus('MOMENT LINK COPIED',900);return true;}catch{return false;}
}
function openLubiakSharePreview(blob,momentUrl){
  closeLubiakSharePreview();
  sharePreviewObjectUrl=URL.createObjectURL(blob);
  const overlay=document.createElement('div');overlay.id='lubiak-share-preview';
  overlay.style.cssText='position:fixed;inset:0;z-index:260;background:#050303e8;display:grid;place-items:center;padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));backdrop-filter:blur(8px)';
  const card=document.createElement('div');card.style.cssText='width:min(92vw,720px);max-height:92vh;display:flex;flex-direction:column;gap:10px;padding:10px;background:#0b0706;border:1px solid #c47b3d88;box-shadow:0 18px 70px #000c';
  const img=document.createElement('img');img.src=sharePreviewObjectUrl;img.alt='Preview of the LUBIAK moment link';img.style.cssText='display:block;width:100%;max-height:68vh;object-fit:contain;background:#000';
  const link=document.createElement('div');link.textContent=momentUrl;link.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d6b98f;font:500 9px/1.3 ui-monospace;padding:3px 2px';
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap';
  const mk=(label)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='border:1px solid #c47b3d88;background:#130b08;color:#f0d7ad;padding:10px 14px;font:700 10px/1 ui-monospace;letter-spacing:.1em;touch-action:manipulation';return b;};
  const cancel=mk('CLOSE'),copy=mk('COPY LINK'),share=mk('SHARE LINK');
  cancel.addEventListener('click',closeLubiakSharePreview);
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(momentUrl);showStatus('MOMENT LINK COPIED',900);}catch{}});
  share.addEventListener('click',async()=>{share.disabled=true;const old=share.textContent;share.textContent='SHARING…';const done=await shareMomentLink(momentUrl);share.disabled=false;share.textContent=old;if(done){showStatus('LUBIAK MOMENT SHARED',900);closeLubiakSharePreview();}});
  actions.append(cancel,copy,share);card.append(img,link,actions);overlay.appendChild(card);
  overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)closeLubiakSharePreview();});document.body.appendChild(overlay);
}
async function shareLubiakCapture(){
  if(shareCaptureButton.disabled)return;
  const old=shareCaptureButton.textContent;shareCaptureButton.disabled=true;shareCaptureButton.textContent='CAPTURE…';
  try{
    showStatus('CAPTURING MOMENT',500);
    const state=currentLubiakMomentState();
    const momentUrl=buildLubiakMomentUrl(state);
    const blob=await captureLubiakScreen();
    openLubiakSharePreview(blob,momentUrl);
    showStatus('MOMENT LINK READY',800);
  }catch(error){console.warn('LUBIAK moment link failed',error);showStatus('SHARE UNAVAILABLE',1100);}
  finally{shareCaptureButton.disabled=false;shareCaptureButton.textContent=old;}
}
shareCaptureButton.addEventListener('click',shareLubiakCapture);
window.__LUBIAK_SHARE_CAPTURE__=shareLubiakCapture;
window.__LUBIAK_MOMENT_URL__=buildLubiakMomentUrl;

`;
s=s.slice(0,start)+block+s.slice(end);
const installNeedle="    const actorReady=await installPlayer(decoder);\n    finishLoad(actorReady?'DJINN PLAYER READY':'ENTER LUBIAK');";
if(!s.includes(installNeedle)) throw new Error('install environment moment restore anchor missing');
s=s.replace(installNeedle,"    const actorReady=await installPlayer(decoder);\n    const sharedMoment=applySharedLubiakMoment();\n    finishLoad(sharedMoment?'SHARED LUBIAK MOMENT':(actorReady?'DJINN PLAYER READY':'ENTER LUBIAK'));\n");
fs.writeFileSync(path,s);
console.log('Installed link-only exact LUBIAK moment sharing v4.');
