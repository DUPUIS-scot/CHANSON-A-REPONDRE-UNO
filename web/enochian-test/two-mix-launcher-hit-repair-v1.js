(()=>{
'use strict';
const VERSION='v1';
function install(frame){
  try{
    const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument;
    if(!d)return false;
    if(d.documentElement.dataset.twoMixLauncherHitRepair===VERSION)return true;
    const toggle=d.getElementById('twoMixToggle');
    if(!toggle)return false;
    d.getElementById('two-mix-launcher-hit-repair-style')?.remove();
    const style=d.createElement('style');
    style.id='two-mix-launcher-hit-repair-style';
    style.textContent=`
#twoMixToggle.two-mix-master-anchor{z-index:2147483005!important;pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;isolation:isolate!important}
#twoMixHelpToggle{right:64px!important;top:10px!important;z-index:2147483004!important;pointer-events:auto!important;touch-action:manipulation!important}
#twoMixCursorHelp,#twoMixCursorTrail,#twoMixC,#twoMixCTether{pointer-events:none!important}
`;
    d.head.appendChild(style);
    toggle.style.pointerEvents='auto';
    toggle.style.touchAction='manipulation';
    toggle.setAttribute('aria-label',toggle.getAttribute('aria-pressed')==='true'?'Disable 2MIX':'Enable 2MIX');
    d.documentElement.dataset.twoMixLauncherHitRepair=VERSION;
    return true;
  }catch(_){return false}
}
window.installEnochianTwoMixLauncherHitRepairV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)};
})();
