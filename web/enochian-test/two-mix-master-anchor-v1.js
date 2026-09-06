(()=>{'use strict';
const VERSION='v12-three-mix';
function install(frame){
 try{
  const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;if(!d||!w)return false;
  if(d.documentElement.dataset.twoMixMasterLayout==='v12'&&d.documentElement.dataset.twoMixActivationAuthority===VERSION)return true;
  const toggle=d.getElementById('twoMixToggle');if(!toggle)return false;
  const findMaster=()=>d.querySelector('[data-master-deck],.master-deck')||[...d.querySelectorAll('section,.box,.panel,.module,div')].find(el=>{const t=(el.textContent||'').toUpperCase(),r=el.getBoundingClientRect();return r.width>220&&r.height>70&&t.includes('MASTER DECK')});
  const master=findMaster();if(master)master.dataset.masterDeck='1';if(toggle.parentElement!==d.body)d.body.appendChild(toggle)
  let style=d.getElementById('two-mix-master-anchor-style');if(!style){style=d.createElement('style');style.id='two-mix-master-anchor-style';d.head.appendChild(style)}
  style.textContent='#twoMixToggle.two-mix-master-anchor{position:fixed!important;right:12px!important;bottom:12px!important;top:auto!important;left:auto!important;z-index:2147483005!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;isolation:isolate!important}';
  toggle.classList.add('two-mix-master-anchor');toggle.style.pointerEvents='auto';toggle.style.touchAction='manipulation';toggle.title='3MIX · three signal mice';toggle.textContent='3MIX';
  const state=()=>toggle.getAttribute('aria-pressed')==='true'||toggle.classList.contains('active');
  const sync=()=>{const on=state();toggle.setAttribute('aria-label',on?'Disable 3MIX':'Enable 3MIX');d.documentElement.dataset.twoMixActivation=on?'on':'off';d.documentElement.classList.toggle('two-mix-help-open',on)};
  if(toggle.dataset.activationAuthority!==VERSION){
   toggle.dataset.activationAuthority=VERSION;
   let before=false,armed=false,repairing=false;
   toggle.addEventListener('pointerdown',()=>{before=state();armed=true},{capture:true,passive:true});
   toggle.addEventListener('pointerup',()=>{if(!armed)return;armed=false;setTimeout(()=>{if(state()!==before){sync();return}repairing=true;const next=!before;toggle.classList.toggle('active',next);toggle.setAttribute('aria-pressed',String(next));toggle.dispatchEvent(new CustomEvent('enochian:two-mix-toggle',{bubbles:true,detail:{active:next,source:'master-anchor-v12'}}));repairing=false;sync()},0)},{capture:true,passive:true});
   toggle.addEventListener('click',()=>{if(!repairing)setTimeout(sync,0)});
   toggle.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();const next=!state();toggle.classList.toggle('active',next);toggle.setAttribute('aria-pressed',String(next));toggle.dispatchEvent(new CustomEvent('enochian:two-mix-toggle',{bubbles:true,detail:{active:next,source:'keyboard'}}));sync()}});
  }
  sync();
  d.documentElement.dataset.twoMixMasterAnchor='v1';d.documentElement.dataset.twoMixMasterLayout='v12';d.documentElement.dataset.twoMixActivationAuthority=VERSION;
  w.__enochTwoMixMasterAnchor={version:VERSION,toggle,master,sync};return true;
 }catch(_){return false}
}
window.installEnochianTwoMixMasterAnchorV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)};
})();