(()=>{
'use strict';
const VERSION='v3';
function install(host){
 try{
  const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
  const api=w?.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial'),main=d?.getElementById('audio'),mainPlay=d?.getElementById('play');
  if(!d||!w||!api||!panel||!main||!mainPlay)return false;
  if(w.__enochDoubleJesterIndependentTransport?.version===VERSION)return true;
  const stems=['vocals','drums','bass','other'];
  const slots=()=>['A','B'].flatMap(deckName=>stems.map(stem=>api.state?.slots?.[deckName]?.[stem]).filter(Boolean));
  const activeSlots=()=>slots().filter(slot=>slot.on!==false&&slot.media);
  const allMedia=()=>slots().map(slot=>slot.media).filter(Boolean);
  const state={playing:false,time:0,rate:1,anchor:null,mainHeld:false};
  const clampTime=(media,t)=>Math.max(0,Math.min(Number.isFinite(media.duration)?Math.max(0,media.duration-.01):t,t));
  const leader=()=>activeSlots()[0]?.media||allMedia()[0]||null;
  const captureClock=()=>{const lead=leader();if(lead)state.time=Number(lead.currentTime)||state.time;return state.time};
  const syncToJesterClock=(force=false)=>{const lead=leader();if(!lead)return;const t=Number(lead.currentTime)||state.time;state.time=t;activeSlots().forEach(slot=>{const m=slot.media;if(!m)return;try{m.playbackRate=state.rate;m.preservesPitch=false;m.webkitPreservesPitch=false;if(force||Math.abs((Number(m.currentTime)||0)-t)>.045)m.currentTime=clampTime(m,t)}catch(_){}})};
  const pauseStems=()=>{captureClock();allMedia().forEach(m=>{try{m.pause()}catch(_){}});state.playing=false;paint()};
  const ensureEngine=async()=>{if(api.state?.enabled)return true;panel.querySelector('[data-dds-enable]')?.click();await new Promise(resolve=>w.setTimeout(resolve,80));return !!api.state?.enabled};
  const playStems=async()=>{if(!await ensureEngine())return false;try{main.pause()}catch(_){}state.mainHeld=true;const list=activeSlots();const t=state.time||Number(list[0]?.media?.currentTime)||0;list.forEach(slot=>{try{slot.media.currentTime=clampTime(slot.media,t);slot.media.playbackRate=state.rate}catch(_){}});await Promise.all(list.map(async slot=>{try{await slot.media.play()}catch(_){}}));state.playing=list.some(slot=>!slot.media.paused);syncToJesterClock(true);paint();return state.playing};
  const toggle=async()=>state.playing?(pauseStems(),false):playStems();
  const stopForMain=()=>{if(state.playing)pauseStems();state.mainHeld=false;paint()};
  const originalEnforce=api.enforceActivePlayback;
  api.enforceActivePlayback=async force=>{if(!api.state?.enabled||!state.playing){allMedia().forEach(m=>{try{m.pause()}catch(_){}});return []}syncToJesterClock(!!force);return Promise.all(activeSlots().map(async slot=>{try{if(slot.media.paused)await slot.media.play();return true}catch(_){return false}}))};
  let transport=panel.querySelector('[data-jester-independent-transport]');
  if(!transport){transport=document.createElement('div');transport.dataset.jesterIndependentTransport='';transport.className='jester-independent-transport';transport.setAttribute('role','group');transport.setAttribute('aria-label','2JESTER transport');transport.innerHTML='<button type="button" data-jester-play>▶ PLAY</button><button type="button" data-jester-pause>❚❚ PAUSE</button>';const center=panel.querySelector('.dds-center')||panel;center.insertBefore(transport,center.firstChild)}
  let style=document.getElementById('jester-independent-transport-style');if(!style){style=document.createElement('style');style.id='jester-independent-transport-style';style.textContent='.jester-independent-transport{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:3px}.jester-independent-transport button{min-height:23px;border:1px solid #315b56;border-radius:999px;background:#06110f;color:#86aaa5;font:1000 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;cursor:pointer}.jester-independent-transport button.active{border-color:#63f5cf;background:#163c31;color:#e8fff8;box-shadow:0 0 12px #19c98f88}#play.jester-main-hold{border-color:#e6a64b!important;background:#2a1805!important;color:#ffd28a!important;box-shadow:0 0 16px #e6923266!important;text-shadow:0 0 8px #e69232!important}';document.head.appendChild(style)}
  const playButton=transport.querySelector('[data-jester-play]'),pauseButton=transport.querySelector('[data-jester-pause]');
  const paint=()=>{playButton?.classList.toggle('active',state.playing);pauseButton?.classList.toggle('active',!state.playing);playButton?.setAttribute('aria-pressed',String(state.playing));pauseButton?.setAttribute('aria-pressed',String(!state.playing));mainPlay.classList.toggle('jester-main-hold',state.playing||state.mainHeld);if(state.playing||state.mainHeld){mainPlay.title='MAIN ON HOLD · 2JESTER TRANSPORT';mainPlay.setAttribute('aria-label','MAIN ON HOLD · press to return to main transport')}else{mainPlay.removeAttribute('title');mainPlay.removeAttribute('aria-label')}panel.dataset.jesterTransport=state.playing?'playing':'paused'};
  playButton?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();void playStems()});
  pauseButton?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();pauseStems()});
  // Main PLAY always belongs to the master deck. Let its native click handler
  // resume/create the AudioContext and start the master media element; 2JESTER
  // only yields its independent stem transport after that command is issued.
  w.addEventListener('click',e=>{if(e.target!==mainPlay&&!mainPlay.contains(e.target))return;if(!api.state?.enabled)return;if(state.playing)pauseStems();state.mainHeld=false;paint()});
  main.addEventListener('play',()=>{if(api.state?.enabled&&!state.playing){state.mainHeld=false;paint()}});
  main.addEventListener('pause',()=>{if(state.playing){state.mainHeld=true;paint()}});
  const watchdog=w.setInterval(()=>{if(!api.state?.enabled){if(state.playing)pauseStems();state.mainHeld=false;paint();return}if(state.playing){syncToJesterClock(false);if(!main.paused)try{main.pause()}catch(_){}}},180);
  w.addEventListener('pagehide',()=>w.clearInterval(watchdog),{once:true});
  const controller={version:VERSION,state,play:playStems,pause:pauseStems,toggle,sync:syncToJesterClock,stopForMain,ensureEngine,originalEnforce};
  w.__enochDoubleJesterIndependentTransport=controller;w.__enochDoubleJeckerIndependentTransport=controller;paint();return true;
 }catch(_){return false}
}
window.installEnochianDoubleJesterIndependentTransportV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
