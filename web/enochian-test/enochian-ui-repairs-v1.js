(()=>{
'use strict';
function install(host){
 try{
  const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
  if(!d||!w)return false;
  let style=d.getElementById('enochian-ui-repairs-v2-style');
  if(!style){style=d.createElement('style');style.id='enochian-ui-repairs-v2-style';style.textContent=`
.wave{min-height:118px!important;overflow:hidden!important;position:relative!important}
.wave #wave{min-height:100%!important}.wave .analyser-3d,.wave .enoch-reference-mesh{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.wave .analyser-control-widget{position:absolute!important;right:7px!important;top:31px!important;left:auto!important;bottom:auto!important;z-index:66!important;pointer-events:auto!important}
.wave .analyser-glide-readout{position:absolute!important;right:8px!important;top:5px!important;z-index:64!important}.wave .signal-mod-toggle{position:absolute!important;left:8px!important;top:5px!important;z-index:65!important}
.analyser-help{display:block!important;white-space:normal!important;line-height:1.15!important;max-width:150px!important}
#twoMixToggle{z-index:2147483000!important}#twoJToggle,#doubleDeckerLauncher,[data-double-jecker-launcher],[data-2j-launcher]{z-index:2147482990!important}
#doubleDeckerSpecial.jecker-radial{overflow:hidden!important;isolation:isolate!important;background:radial-gradient(circle at 50% 50%,#071b25 0 18%,#02070b 18.5% 37%,#50422e 37.5% 38.2%,#020609 38.8% 67%,#74674b 67.4% 69%,#020609 69.5% 100%)!important;border-color:#74674b!important}
#doubleDeckerSpecial.jecker-radial .dds-grid,#doubleDeckerSpecial.jecker-radial .dds-deck{inset:0!important;max-width:none!important;max-height:none!important}
#doubleDeckerSpecial.jecker-radial .dds-center{left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;overflow:visible!important;contain:layout!important;box-sizing:border-box!important;border-color:#74674b!important;background:radial-gradient(circle,#08161f,#020a0f 68%,#020609)!important}
#doubleDeckerSpecial.jecker-radial .dds-center .dds-performance,#doubleDeckerSpecial.jecker-radial .dds-center .dds-performance-row,#doubleDeckerSpecial.jecker-radial .dds-center .dds-perf-buttons,#doubleDeckerSpecial.jecker-radial .dds-center .dds-quantize,#doubleDeckerSpecial.jecker-radial .dds-center .jecker-output{position:relative!important;inset:auto!important;transform:none!important;float:none!important;max-width:100%!important;box-sizing:border-box!important}
#doubleDeckerSpecial.jecker-radial .dds-slot{border-color:#0e6fa0!important;background:radial-gradient(circle at 45% 35%,#08161f,#031019 56%,#020609 100%)!important}
#doubleDeckerSpecial.jecker-radial button.active,#doubleDeckerSpecial.jecker-radial button[aria-pressed=true]{border-color:#30a6cf!important;color:#94e1f0!important;background:#072330!important}
.enoch-context-hint{position:fixed;z-index:2147483646;max-width:230px;padding:5px 7px;border:1px solid #0e6fa0;background:#020a0ff2;color:#a8b5b5;font:700 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;pointer-events:none;box-shadow:0 3px 12px #000b;display:none}.enoch-context-hint.show{display:block}
@media(max-width:600px){.wave{min-height:96px!important}.analyser-help{display:block!important;font-size:5px!important;max-width:112px!important}.wave .analyser-control-widget{right:4px!important;top:30px!important}}
`;d.head.appendChild(style)}
  window.installEnochianDoubleJeckerRadialV1?.(host);
  const radial=d.getElementById('doubleDeckerSpecial');if(radial)radial.classList.add('jecker-radial');
  const two=d.getElementById('twoMixToggle');
  if(two){const master=d.querySelector('#masterDeck,[data-master-deck],.master-deck,.master')||d.querySelector('.console');const place=()=>{const r=master?.getBoundingClientRect();two.style.setProperty('position','fixed','important');two.style.setProperty('left','auto','important');two.style.setProperty('top','auto','important');two.style.setProperty('right',r?Math.max(8,w.innerWidth-r.right+8)+'px':'10px','important');two.style.setProperty('bottom',r?Math.max(8,w.innerHeight-r.bottom+8)+'px':'10px','important');two.dataset.masterDeckAnchor='v2';two.setAttribute('title','2MIX · UNO dual virtual mice');two.setAttribute('aria-label','2MIX UNO dual virtual mice');};place();if(!two.dataset.anchorResize){two.dataset.anchorResize='1';w.addEventListener('resize',place)}}
  const explicit=[
   ['#twoMixToggle','2MIX · UNO dual virtual mice · activate two independent virtual pointers'],['#twoJToggle,#doubleDeckerLauncher,[data-double-jecker-launcher],[data-2j-launcher]','2J · open or spin the 2JECKER roundtable'],['#signalModToggle','SIGNAL MOD · sculpt the live 3D mesh'],['.analyser-control-widget','3D SIGNAL · drag mesh · wheel mode · zoom · height · depth · twist'],['[data-stem-toggle],[data-stem-range]','STEMS · enable or mix this stem'],['#low','LOW EQ'],['#mid','MID EQ'],['#high','HIGH EQ'],['#modWheel,#modWheelV,[data-mod]','MOD · modulation control'],['[data-fx],#filter,#drive,#delay,#fb,#wet','FX · effect control'],['#play','PLAY / PAUSE'],['#loop','LOOP'],['#loopIn','LOOP IN'],['#loopOut','LOOP OUT'],['#resetLoop','RESET LOOP'],['#vol','MASTER VOLUME'],['#pitch','PITCH']
  ];
  explicit.forEach(([sel,text])=>d.querySelectorAll(sel).forEach(el=>{el.title=text;if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',text)}));
  d.querySelectorAll('button,[role=button],input[type=range],select').forEach(el=>{if(!el.title){const text=el.getAttribute('aria-label')||el.textContent?.trim();if(text)el.title=text.slice(0,120)}});
  let hint=d.getElementById('enochContextHint');if(!hint){hint=d.createElement('div');hint.id='enochContextHint';hint.className='enoch-context-hint';d.body.appendChild(hint)}
  if(!d.documentElement.dataset.contextHintsV2){d.documentElement.dataset.contextHintsV2='1';let timer=0;const show=(el,e)=>{const text=el?.title||el?.getAttribute?.('aria-label');if(!text)return;clearTimeout(timer);hint.textContent=text;hint.classList.add('show');const r=el.getBoundingClientRect(),x=Math.min(w.innerWidth-235,(e?.clientX??r.left)+12),y=Math.min(w.innerHeight-38,(e?.clientY??r.bottom)+10);hint.style.left=Math.max(4,x)+'px';hint.style.top=Math.max(4,y)+'px'};const hide=(delay=0)=>{clearTimeout(timer);timer=w.setTimeout(()=>hint.classList.remove('show'),delay)};const target=e=>e.target.closest?.('button,[role=button],input[type=range],select,.analyser-control-widget');d.addEventListener('pointerover',e=>{const el=target(e);if(el)show(el,e)});d.addEventListener('pointerout',e=>{if(target(e))hide()});d.addEventListener('focusin',e=>{const el=target(e);if(el)show(el)});d.addEventListener('focusout',()=>hide());d.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){const el=target(e);if(el){show(el,e);hide(1800)}}},{passive:true})}
  const mesh=w.__enochAnalyser3D;if(mesh&&mesh.version)d.documentElement.dataset.meshSculptureReady=mesh.version;
  return true;
 }catch(_){return false}
}
window.installEnochianUiRepairsV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
