(()=>{
function install(frame){
 try{
  const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
  if(!d||!d.body)return false;
  const isolator=d.querySelector('.stem-isolator'),master=d.getElementById('audio'),play=d.getElementById('play');
  if(!isolator||!master)return false;
  let stem=d.getElementById('stemMasterToggle');if(!stem){stem=d.createElement('button');stem.id='stemMasterToggle';stem.className='btn stem-master-toggle';stem.type='button';stem.dataset.syntheticStemMaster='1';stem.setAttribute('aria-pressed','false');stem.textContent='STEMS OFF'}
  const title=isolator.querySelector('.stem-title');if(stem.parentElement!==isolator){if(title)title.insertAdjacentElement('afterend',stem);else isolator.prepend(stem)}
  const old=d.getElementById('stemSeparatorControlStyle');if(old)old.remove();const style=d.createElement('style');style.id='stemSeparatorControlStyle';style.textContent=`#stemMasterToggle{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;inset:auto!important;width:100%!important;min-height:28px!important;margin:2px 0 4px!important;padding:5px 7px!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;z-index:30!important;border:1px solid #315b56!important;background:#06110f!important;color:#a9eee7!important}#stemMasterToggle.active,#stemMasterToggle[aria-pressed="true"]{background:#083128!important;color:#63f5cf!important;border-color:#68d8bd!important;box-shadow:0 0 10px #40e6b455!important}#stemMasterToggle.partial{background:#171308!important;color:#f0c97e!important;border-color:#7b6339!important;box-shadow:0 0 10px #d5aa6333!important}.stem-value{color:#f0c97e!important}html.enoch-ios-landscape #stemMasterToggle{min-height:22px!important;margin:1px 0 2px!important;padding:3px 4px!important;font-size:5.5px!important}.stem-isolator{overflow:visible!important}`;d.head.appendChild(style);
  const rows=()=>[...isolator.querySelectorAll('.stem-toggle')],active=b=>!!b&&(b.classList.contains('active')||b.getAttribute('aria-pressed')==='true');
  const state=()=>{const r=rows(),n=r.filter(active).length;return !r.length||n===0?'off':n===r.length?'on':'mix'};
  const media=[...d.querySelectorAll('audio')].filter(m=>m!==master);
  const mediaKey=m=>{const s=(m.dataset?.src||m.src||'').toLowerCase();return s.includes('vocals')?'vocals':s.includes('drums')?'drums':s.includes('bass')?'bass':s.includes('other')?'other':''};
  const mediaMap=()=>{const map={};media.forEach(m=>{const k=mediaKey(m);if(k)map[k]=m});return map};
  const rangeValue=key=>Math.max(0,Math.min(1,(parseFloat(isolator.querySelector(`[data-stem-range="${key}"]`)?.value)||0)/100));
  const buttonOn=key=>active(isolator.querySelector(`[data-stem-toggle="${key}"]`));
  const wanted=key=>key==='bass'||key==='other'?buttonOn('instruments'):buttonOn(key);
  const applyMedia=()=>{const map=mediaMap();Object.entries(map).forEach(([key,m])=>{try{m.volume=wanted(key)?(key==='bass'||key==='other'?rangeValue('instruments'):rangeValue(key)):0;m.muted=!wanted(key)}catch(_){}})};
  const align=()=>{const map=mediaMap();Object.values(map).forEach(m=>{try{m.playbackRate=master.playbackRate||1;if(Math.abs((m.currentTime||0)-(master.currentTime||0))>.06)m.currentTime=Math.max(0,master.currentTime||0)}catch(_){}})};
  const startMedia=()=>{const map=mediaMap();applyMedia();align();Object.entries(map).forEach(([key,m])=>{if(!wanted(key))return;try{if(!m.src&&m.dataset.src){m.src=m.dataset.src;m.load()}const p=m.play();if(p&&p.catch)p.catch(()=>{})}catch(_){}})};
  const stopMedia=()=>Object.values(mediaMap()).forEach(m=>{try{m.pause()}catch(_){}});
  const setVisual=()=>{const s=state(),on=s==='on',mix=s==='mix';stem.classList.toggle('active',on);stem.classList.toggle('partial',mix);stem.setAttribute('aria-pressed',String(on));stem.dataset.stemState=s;stem.textContent=on?'STEMS ON':mix?'STEMS MIX':'STEMS OFF';isolator.classList.toggle('separator-off',s==='off');applyMedia()};
  const setRows=on=>rows().forEach(b=>{if(active(b)!==on)b.click()});
  if(d.documentElement.dataset.stemsDefaultOnV7!=='1'){d.documentElement.dataset.stemsDefaultOnV7='1';setRows(true)}
  if(!stem.dataset.masterBoundV7){stem.dataset.masterBoundV7='1';stem.addEventListener('click',()=>{const turnOn=state()!=='on';setRows(turnOn);setTimeout(()=>{setVisual();if(turnOn&&!master.paused)startMedia();else if(!turnOn)stopMedia()},0)})}
  rows().forEach(b=>{if(!b.dataset.masterSyncBoundV7){b.dataset.masterSyncBoundV7='1';b.addEventListener('click',()=>setTimeout(()=>{setVisual();if(!master.paused&&state()!=='off')startMedia()},0))}});
  isolator.querySelectorAll('.stem-range').forEach(r=>{if(r.dataset.operatorRangeV7)return;r.dataset.operatorRangeV7='1';r.addEventListener('input',()=>{const out=isolator.querySelector(`[data-stem-value="${r.dataset.stemRange}"]`);if(out)out.textContent=Math.round(parseFloat(r.value)||0)+'%';applyMedia()})});
  if(play&&!play.dataset.stemPrimeV7){play.dataset.stemPrimeV7='1';play.addEventListener('pointerdown',()=>{if(state()==='off')return;media.forEach(m=>{try{if(!m.src&&m.dataset.src){m.src=m.dataset.src;m.preload='auto';m.load()}}catch(_){}})},true)}
  if(!master.dataset.stemOperatorV7){master.dataset.stemOperatorV7='1';master.addEventListener('play',()=>{if(state()!=='off')startMedia()});master.addEventListener('pause',stopMedia);master.addEventListener('seeking',align);master.addEventListener('seeked',()=>{align();if(!master.paused&&state()!=='off')startMedia()});master.addEventListener('ratechange',align)}
  setVisual();d.documentElement.dataset.stemSeparatorControl='v7';return true;
 }catch(_){return false}
}
window.installEnochianStemSeparatorControl=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();