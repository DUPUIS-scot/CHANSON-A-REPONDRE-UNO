(()=>{
'use strict';
const VERSION='v8';
function installHints(doc,win){
  if(!doc||!win)return;
  const selector='button,[role=button],input[type=range],select';
  let hint=doc.getElementById('enochContextHint');
  if(!hint){hint=doc.createElement('div');hint.id='enochContextHint';hint.className='enoch-context-hint';doc.body.appendChild(hint)}
  if(doc.documentElement.dataset.contextHintsV8==='1')return;
  doc.documentElement.dataset.contextHintsV8='1';
  let timer=0;
  const target=e=>e.target.closest?.(selector);
  const hide=(delay=0)=>{clearTimeout(timer);timer=win.setTimeout(()=>hint.classList.remove('show'),delay)};
  const show=(el,e)=>{const text=el?.title||el?.getAttribute?.('aria-label');if(!text)return;clearTimeout(timer);hint.textContent=text;hint.classList.add('show');const r=el.getBoundingClientRect(),x=Math.min(win.innerWidth-235,(e?.clientX??r.left)+12),y=Math.min(win.innerHeight-38,(e?.clientY??r.bottom)+10);hint.style.left=Math.max(4,x)+'px';hint.style.top=Math.max(4,y)+'px'};
  doc.addEventListener('pointerover',e=>{const el=target(e);if(el)show(el,e)});
  doc.addEventListener('pointerout',e=>{if(target(e))hide()});
  doc.addEventListener('focusin',e=>{const el=target(e);if(el)show(el)});
  doc.addEventListener('focusout',()=>hide());
  doc.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){const el=target(e);if(el){show(el,e);hide(1800)}}},{passive:true});
}
function repairPlaybackFlow(d){
  const side=d.querySelector('.enoch-shell-playback')||d.querySelector('.grid>.side');
  const panel=side?.querySelector('.ref-playback');if(!side||!panel)return;
  panel.style.position='relative';panel.style.zIndex='1';
  [...side.children].forEach(node=>{if(node===panel)return;const text=(node.textContent||'').trim().replace(/\s+/g,' ').toUpperCase();if(node.classList.contains('fx-title')||/^(DECK ENGINE|STEMS MIX|FULL SCREEN|PLAYBACK)$/.test(text))node.style.display='none'});
}
function repairSignalRoot(d,w){
  const stage=d.querySelector('.enoch-shell-signal')||d.querySelector('.stage'),wave=stage?.querySelector('.wave'),canvas=wave?.querySelector('canvas.analyser-3d');if(!stage||!wave)return;
  stage.style.setProperty('grid-template-rows','minmax(0,1fr)','important');
  stage.style.setProperty('min-height','0','important');stage.style.setProperty('height','100%','important');
  wave.style.setProperty('position','relative','important');wave.style.setProperty('height','100%','important');wave.style.setProperty('min-height','0','important');
  if(canvas){canvas.style.setProperty('position','absolute','important');canvas.style.setProperty('inset','0','important');canvas.style.setProperty('left','0','important');canvas.style.setProperty('right','0','important');canvas.style.setProperty('top','0','important');canvas.style.setProperty('bottom','0','important');canvas.style.setProperty('width','100%','important');canvas.style.setProperty('height','100%','important')}
  const resize=()=>{try{w.__enochAnalyser3D?.invalidate?.();w.dispatchEvent(new Event('resize'))}catch(_){}};
  if(!wave.dataset.signalRootObserver&&w.ResizeObserver){wave.dataset.signalRootObserver='1';new w.ResizeObserver(resize).observe(wave)}
}
function repairFloatResolution(outer){
  const panel=outer.getElementById('outerAnalyserPanel'),canvas=outer.getElementById('outerAnalyserCanvas');if(!panel||!canvas||canvas.dataset.hiresFloat==='1')return;
  canvas.dataset.hiresFloat='1';const win=outer.defaultView||window;
  const sync=()=>{if(!panel.classList.contains('open'))return;const r=canvas.getBoundingClientRect(),ratio=Math.min(3,Math.max(2,win.devicePixelRatio||1)),cw=Math.max(1,Math.round(r.width*ratio)),ch=Math.max(1,Math.round(r.height*ratio));if(canvas.width<cw)canvas.width=cw;if(canvas.height<ch)canvas.height=ch};
  if(win.ResizeObserver)new win.ResizeObserver(()=>win.requestAnimationFrame(sync)).observe(panel);win.addEventListener('resize',()=>win.requestAnimationFrame(sync));panel.addEventListener('transitionend',sync);win.requestAnimationFrame(sync)
}
function install(host){
  try{
    const outer=host?.ownerDocument||document,outerWin=outer.defaultView||window;
    const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
    if(!d||!w)return false;
    let s=d.getElementById('enochian-ui-repairs-v8-style');if(!s){s=d.createElement('style');s.id='enochian-ui-repairs-v8-style';s.textContent='.enoch-context-hint{position:fixed;z-index:2147483646;max-width:230px;padding:5px 7px;border:1px solid #0e6fa0;background:#020a0ff2;color:#a8b5b5;font:700 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;pointer-events:none;box-shadow:0 3px 12px #000b;display:none}.enoch-context-hint.show{display:block}html.enoch-shell-desktop .enoch-shell-signal,html.terminal-fullscreen.enoch-shell-desktop .enoch-shell-signal{grid-template-rows:minmax(0,1fr)!important;height:100%!important;min-height:0!important}html.enoch-shell-desktop .enoch-shell-analyser,html.terminal-fullscreen.enoch-shell-desktop .enoch-shell-analyser{height:100%!important;min-height:0!important}html.enoch-shell-desktop .enoch-shell-analyser canvas.analyser-3d,html.terminal-fullscreen.enoch-shell-desktop .enoch-shell-analyser canvas.analyser-3d{position:absolute!important;inset:0!important;left:0!important;right:0!important;top:0!important;bottom:0!important;width:100%!important;height:100%!important}html.enoch-shell-desktop .enoch-shell-playback>.fx-title{display:none!important}html.enoch-shell-desktop .ref-playback{position:relative!important;z-index:1!important;margin-top:0!important}';d.head.appendChild(s)}
    if(!outer.getElementById('enochian-ui-repairs-v8-outer-style')){const os=outer.createElement('style');os.id='enochian-ui-repairs-v8-outer-style';os.textContent='.enoch-context-hint{position:fixed;z-index:2147483646;max-width:230px;padding:5px 7px;border:1px solid #0e6fa0;background:#020a0ff2;color:#a8b5b5;font:700 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:none;display:none}.enoch-context-hint.show{display:block}#outerAnalyserCanvas{width:100%!important;height:100%!important}';outer.head.appendChild(os)}
    const innerHints=[['#twoMixToggle','3MIX · three signal mice'],['#signalModToggle','SIGNAL MOD · sculpt the live 3D mesh'],['[data-stem-toggle],[data-stem-range]','STEMS · enable or mix this stem'],['#low','LOW EQ'],['#mid','MID EQ'],['#high','HIGH EQ'],['#modWheel,#modWheelV,[data-mod]','MOD · modulation control'],['[data-fx],#filter,#drive,#delay,#fb,#wet','FX · effect control'],['#play','PLAY / PAUSE'],['#loopToggle,#loop','LOOP'],['#loopIn','LOOP IN'],['#loopOut','LOOP OUT'],['#loopReset,#resetLoop','RESET LOOP'],['#vol','MASTER VOLUME'],['#pitch','PITCH']];
    innerHints.forEach(([sel,text])=>d.querySelectorAll(sel).forEach(el=>{el.title=text;if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',text)}));
    const outerHints=[['#doubleDeckerSpecialLaunch,#twoJToggle,#doubleDeckerLauncher,[data-double-jecker-launcher],[data-2j-launcher]','2J · open or spin 2JESTER SPECIAL'],['#doubleDeckerSpecial button,#doubleDeckerSpecial input,#doubleDeckerSpecial select','2JESTER SPECIAL · live stem turntable control']];
    outerHints.forEach(([sel,text])=>outer.querySelectorAll(sel).forEach(el=>{if(!el.title)el.title=text;if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',text)}));
    d.querySelectorAll('button,[role=button],input[type=range],select').forEach(el=>{if(!el.title){const text=el.getAttribute('aria-label')||el.textContent?.trim();if(text)el.title=text.slice(0,120)}});
    repairPlaybackFlow(d);repairSignalRoot(d,w);repairFloatResolution(outer);installHints(d,w);installHints(outer,outerWin);
    d.documentElement.dataset.enochUiRepairs=VERSION;outer.documentElement.dataset.enochUiRepairs=VERSION;return true;
  }catch(_){return false}
}
window.installEnochianUiRepairsV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
