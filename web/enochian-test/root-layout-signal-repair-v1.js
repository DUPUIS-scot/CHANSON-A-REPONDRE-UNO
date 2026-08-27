(()=>{
'use strict';
const VERSION='v1';
function install(frame){
 try{
  const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
  if(!d||!w)return false;
  let s=d.getElementById('root-layout-signal-repair-v1-style');
  if(!s){s=d.createElement('style');s.id='root-layout-signal-repair-v1-style';s.textContent=`
@media (min-width:1001px){
 html,html body{height:100%!important;min-height:0!important;overflow:hidden!important}
 .app{height:100dvh!important;min-height:0!important;grid-template-rows:auto minmax(0,1fr) auto!important;overflow:hidden!important}
 .grid{height:100%!important;min-height:0!important;overflow:hidden!important;grid-template-columns:minmax(180px,18vw) minmax(0,1fr) minmax(205px,20vw)!important;gap:4px!important}
 .stage{height:100%!important;min-height:0!important;overflow:hidden!important;display:grid!important;grid-template-rows:minmax(0,1fr) auto auto auto auto!important;gap:4px!important;padding:5px!important}
 .stage>.wave{grid-row:1!important;position:relative!important;min-height:180px!important;height:100%!important;overflow:hidden!important}
 .stage>.wave>.analyser-3d{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important}
 .stage>.wave>#wave{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important}
 .stage>.wave>.signals{position:absolute!important;left:8px!important;right:8px!important;bottom:6px!important;z-index:8!important}
 .stage>.wave>.outer-float-launch{z-index:90!important}
 .side>.ref-playback{position:relative!important;z-index:1!important;margin:0!important;width:100%!important;min-width:0!important}
 .side>.ref-playback~.fx-title{position:relative!important}
}
html.terminal-fullscreen .stage{grid-template-rows:minmax(0,1fr) auto auto auto auto!important;height:100%!important;min-height:0!important;overflow:hidden!important}
html.terminal-fullscreen .stage>.wave{grid-row:1!important;min-height:180px!important;height:100%!important;position:relative!important;overflow:hidden!important}
html.terminal-fullscreen .stage>.wave>.analyser-3d,html.terminal-fullscreen .stage>.wave>#wave{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important}
`;d.head.appendChild(s)}
  const playback=d.querySelector('.ref-playback');
  if(playback){
   const side=playback.closest('.side');
   if(side){
    [...side.children].forEach(el=>{
     if(el===playback)return;
     const text=(el.textContent||'').trim().toUpperCase();
     if((el.classList.contains('fx-title')||el.classList.contains('label'))&&/^(STEMS MIX|FULL SCREEN|PLAYBACK)$/.test(text))el.remove();
    });
   }
  }
  const wave=d.querySelector('.stage>.wave'),canvas=wave?.querySelector('.analyser-3d');
  const sync=()=>{if(!wave||!canvas)return;const r=wave.getBoundingClientRect();if(r.width>2&&r.height>2){canvas.style.width='100%';canvas.style.height='100%';w.__enochAnalyser3D?.invalidate?.()}};
  if(wave&&w.ResizeObserver&&!wave.__rootSignalResize){wave.__rootSignalResize=new w.ResizeObserver(sync);wave.__rootSignalResize.observe(wave)}
  w.addEventListener('resize',()=>w.requestAnimationFrame(sync));
  d.documentElement.dataset.rootLayoutSignalRepair=VERSION;sync();return true;
 }catch(_){return false}
}
window.installEnochianRootLayoutSignalRepairV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)};
})();