(()=>{
'use strict';
const VERSION='v1';
const inner=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
  const d=inner(frame);if(!d)return false;
  const button=d.getElementById('twoMixToggle');if(!button)return false;
  if(button.dataset.activationGuard===VERSION)return true;
  button.dataset.activationGuard=VERSION;
  let downState=null,armed=false;
  const state=()=>button.getAttribute('aria-pressed')==='true'||button.classList.contains('active');
  button.addEventListener('pointerdown',()=>{downState=state();armed=true},{capture:true,passive:true});
  button.addEventListener('pointerup',()=>{
    if(!armed)return;armed=false;
    const before=downState;
    setTimeout(()=>{
      if(state()!==before)return;
      try{button.click()}catch(_){}
    },0);
  },{capture:true,passive:true});
  button.addEventListener('click',()=>{
    setTimeout(()=>{
      const on=state();
      button.setAttribute('aria-label',on?'Disable 2MIX':'Enable 2MIX');
      d.documentElement.dataset.twoMixActivation=on?'on':'off';
    },0);
  },{capture:false});
  d.documentElement.dataset.twoMixActivationGuard=VERSION;
  return true;
}
window.installEnochianTwoMixActivationGuardV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)};
})();
