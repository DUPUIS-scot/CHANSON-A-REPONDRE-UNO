import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let s=fs.readFileSync(path,'utf8');
if(s.includes('LUBIAK_DJINN_BROOM_RESTORE_V2')) process.exit(0);

const start=s.indexOf('async function installPlayer(decoder) {');
const end=s.indexOf('\n\nasync function installEnvironment()',start);
if(start<0||end<0) throw new Error('installPlayer block not found');

const playerBlock=`// LUBIAK_DJINN_BROOM_RESTORE_V2
// Prioritise the playable actor before the dragon and retry transient mobile asset failures.
const DJINN_URL='/assets/assets/models/lubiak_djinn_player_ultralight.glb?v=20260903-djinn-broom-restore-v2';
const BROOM_URL='/assets/assets/models/lubiak_da_noble_y2k_broom_ultralight.glb?v=20260903-djinn-broom-restore-v2';

function actorDelay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function loadActorWithRetry(url,decoder,label,attempts=2){
  let lastError=null;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{
      const sep=url.includes('?')?'&':'?';
      return await loadGlb(url+sep+'attempt='+attempt,decoder,label,false,30000);
    }catch(error){
      lastError=error;
      console.warn(label+' attempt '+attempt+' failed.',error);
      if(attempt<attempts) await actorDelay(550);
    }
  }
  throw lastError || new Error(label+' unavailable');
}

async function restoreBroom(decoder){
  if(broomRoot) return true;
  try{
    const broomGltf=await loadActorWithRetry(BROOM_URL,decoder,'PREPARING DA NOBLE Y2K',3);
    broomRoot=broomGltf.scene;
    broomRoot.visible=true;
    attachBroomToShoulder();
    restoreStandingWalkPose();
    if(typeof refreshLubiakModeButtons==='function') refreshLubiakModeButtons();
    return true;
  }catch(error){
    console.warn('DA NOBLE Y2K broom unavailable after retries.',error);
    return false;
  }
}

async function installPlayer(decoder) {
  if(playerReady && playerRoot){
    playerRoot.visible=true;
    if(!broomRoot) await restoreBroom(decoder);
    return true;
  }
  try {
    const gltf=await loadActorWithRetry(DJINN_URL,decoder,'CALLING DJINN',3);
    preparePlayer(gltf.scene);
    if(playerRoot) playerRoot.visible=true;
    const broomReady=await restoreBroom(decoder);
    showStatus(broomReady?'DJINN + DA NOBLE Y2K READY':'DJINN PLAYER READY',950);
    return true;
  } catch (error) {
    playerReady=false;
    console.warn('Djinn player unavailable after retries; free-camera navigation remains active.',error);
    return false;
  }
}`;

s=s.slice(0,start)+playerBlock+s.slice(end);

const oldBoot=`    finishLoad('ENTER LUBIAK');\n    setTimeout(()=>{ void Promise.allSettled([installDragon(decoder),installPlayer(decoder)]); },350);`;
const newBoot=`    // Restore player authority before optional guardian loading, especially on iPhone.\n    const actorReady=await installPlayer(decoder);\n    finishLoad(actorReady?'DJINN PLAYER READY':'ENTER LUBIAK');\n    setTimeout(()=>{ void installDragon(decoder); },700);`;
if(!s.includes(oldBoot)) throw new Error('environment actor boot anchor not found');
s=s.replace(oldBoot,newBoot);

fs.writeFileSync(path,s);
console.log('Restored LUBIAK Djinn + broom with actor-first loading and retries.');
