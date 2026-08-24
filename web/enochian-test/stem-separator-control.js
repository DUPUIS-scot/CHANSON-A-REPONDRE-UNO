(()=>{
function install(frame){
 try{
  const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument;
  if(!d||!d.body)return false;
  const isolator=d.querySelector('.stem-isolator'),kill=d.getElementById('killfx');
  if(!isolator||!kill)return false;
  let stem=d.getElementById('stemMasterToggle');
  if(!stem){
   stem=d.createElement('button');stem.id='stemMasterToggle';stem.className='btn stem-master-toggle';stem.type='button';stem.dataset.syntheticStemMaster='1';stem.setAttribute('aria-pressed','false');stem.textContent='STEMS OFF';
  }
  const title=isolator.querySelector('.stem-title');
  if(stem.parentElement!==isolator){if(title)title.insertAdjacentElement('afterend',stem);else isolator.prepend(stem)}
  const old=d.getElementById('stemSeparatorControlStyle');if(old)old.remove();
  const style=d.createElement('style');style.id='stemSeparatorControlStyle';style.textContent=`#stemMasterToggle{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;inset:auto!important;width:100%!important;max-width:none!important;min-width:0!important;min-height:28px!important;margin:2px 0 4px!important;padding:5px 7px!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;z-index:30!important;border:1px solid #315b56!important;background:#06110f!important;color:#a9eee7!important}#stemMasterToggle.active,#stemMasterToggle[aria-pressed="true"]{background:#083128!important;color:#63f5cf!important;border-color:#68d8bd!important;box-shadow:0 0 10px #40e6b455!important}html.enoch-ios-landscape #stemMasterToggle{display:flex!important;visibility:visible!important;opacity:1!important;width:100%!important;min-height:22px!important;margin:1px 0 2px!important;padding:3px 4px!important;font-size:5.5px!important;line-height:1!important}.stem-isolator{overflow:visible!important}`;d.head.appendChild(style);
  const isOn=()=>stem.classList.contains('active')||stem.getAttribute('aria-pressed')==='true';
  const setVisual=on=>{stem.classList.toggle('active',on);stem.setAttribute('aria-pressed',String(on));stem.textContent=on?'STEMS ON':'STEMS OFF';stem.title=on?'Stem separator on':'Stem separator off';isolator.classList.toggle('separator-off',!on)};
  const setRows=on=>{[...isolator.querySelectorAll('.stem-toggle')].forEach(b=>{const active=b.classList.contains('active')||b.getAttribute('aria-pressed')==='true';if(active!==on)b.click()})};
  if(stem.dataset.syntheticStemMaster==='1'&&!stem.dataset.masterBound){stem.dataset.masterBound='1';stem.addEventListener('click',()=>{const on=!isOn();setVisual(on);setRows(on)})}
  else if(!stem.dataset.separatorSyncBound){stem.dataset.separatorSyncBound='1';stem.addEventListener('click',()=>setTimeout(()=>setVisual(isOn()),0))}
  if(!kill.dataset.stemKillBoundV4){kill.dataset.stemKillBoundV4='1';kill.addEventListener('click',()=>setTimeout(()=>{setRows(false);setVisual(false)},0))}
  if(!stem.dataset.defaultOnApplied){stem.dataset.defaultOnApplied='1';setVisual(true);setTimeout(()=>setRows(true),0)}else setVisual(isOn());
  d.documentElement.dataset.stemSeparatorControl='v4';return true;
 }catch(_){return false}
}
window.installEnochianStemSeparatorControl=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();