(()=>{
'use strict';
function install(host){
 try{
  const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
  if(!d||!w)return false;
  let style=d.getElementById('enochian-ui-repairs-v1-style');
  if(!style){style=d.createElement('style');style.id='enochian-ui-repairs-v1-style';style.textContent=`
/* Keep the live waveform and its 3D sculpture usable. */
.wave{min-height:118px!important;overflow:hidden!important;position:relative!important}
.wave .analyser-3d,.wave .enoch-reference-mesh{inset:0!important;width:100%!important;height:100%!important}
/* 3D sculpture controller belongs to SIGNAL and must remain over SIGNAL only. */
.wave .analyser-control-widget{position:absolute!important;right:7px!important;top:31px!important;left:auto!important;bottom:auto!important;z-index:66!important;pointer-events:auto!important}
.wave .analyser-glide-readout{position:absolute!important;right:8px!important;top:5px!important;z-index:64!important}
.wave .signal-mod-toggle{position:absolute!important;left:8px!important;top:5px!important;z-index:65!important}
.analyser-help{display:block!important;white-space:normal!important;line-height:1.15!important;max-width:150px!important}
/* 2JECKER is a self-contained circular performance surface. */
#doubleDeckerSpecial.jecker-radial{overflow:hidden!important;isolation:isolate!important}
#doubleDeckerSpecial.jecker-radial .dds-grid,#doubleDeckerSpecial.jecker-radial .dds-deck{inset:0!important;max-width:none!important;max-height:none!important}
#doubleDeckerSpecial.jecker-radial .dds-center{left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;overflow:hidden!important;contain:layout paint!important}
#doubleDeckerSpecial.jecker-radial .dds-center .dds-performance,#doubleDeckerSpecial.jecker-radial .dds-center .dds-performance-row,#doubleDeckerSpecial.jecker-radial .dds-center .dds-perf-buttons,#doubleDeckerSpecial.jecker-radial .dds-center .dds-quantize,#doubleDeckerSpecial.jecker-radial .dds-center .jecker-output{position:relative!important;inset:auto!important;transform:none!important;float:none!important;max-width:100%!important;box-sizing:border-box!important}
/* Current Enochian cyan/aged-gold identity, scoped to the roundtable. */
#doubleDeckerSpecial.jecker-radial{background:radial-gradient(circle at 50% 50%,#071b25 0 18%,#02070b 18.5% 37%,#50422e 37.5% 38.2%,#020609 38.8% 67%,#74674b 67.4% 69%,#020609 69.5% 100%)!important;border-color:#74674b!important}
#doubleDeckerSpecial.jecker-radial .dds-slot{border-color:#0e6fa0!important;background:radial-gradient(circle at 45% 35%,#08161f,#031019 56%,#020609 100%)!important}
#doubleDeckerSpecial.jecker-radial .dds-center{border-color:#74674b!important;background:radial-gradient(circle,#08161f,#020a0f 68%,#020609)!important}
#doubleDeckerSpecial.jecker-radial button.active,#doubleDeckerSpecial.jecker-radial button[aria-pressed=true]{border-color:#30a6cf!important;color:#94e1f0!important;background:#072330!important}
/* Context help is compact, never the obsolete large help overlay. */
.enoch-context-hint{position:fixed;z-index:2147483646;max-width:230px;padding:5px 7px;border:1px solid #0e6fa0;background:#020a0ff2;color:#a8b5b5;font:700 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;pointer-events:none;box-shadow:0 3px 12px #000b;display:none}
.enoch-context-hint.show{display:block}
@media(max-width:600px){.wave{min-height:96px!important}.analyser-help{display:block!important;font-size:5px!important;max-width:112px!important}.wave .analyser-control-widget{right:4px!important;top:30px!important}}
`;d.head.appendChild(style)}
  const two=d.getElementById('twoMixToggle');
  if(two){
    const master=d.querySelector('.master,.master-deck,[data-master-deck],#masterDeck')||d.querySelector('.console')||d.body;
    const place=()=>{const r=master.getBoundingClientRect();const size=Math.max(40,two.getBoundingClientRect().width||48);two.style.setProperty('position','fixed','important');two.style.setProperty('right',Math.max(8,w.innerWidth-r.right+8)+'px','important');two.style.setProperty('bottom',Math.max(8,w.innerHeight-r.bottom+8)+'px','important');two.style.setProperty('left','auto','important');two.style.setProperty('top','auto','important');two.style.setProperty('z-index','2147483000','important');two.dataset.masterDeckAnchor='v1';two.setAttribute('title','2MIX · dual virtual mice');two.setAttribute('aria-label','2MIX dual virtual mice');};place();if(!two.dataset.anchorResize){two.dataset.anchorResize='1';w.addEventListener('resize',place)}}
  const hints={
   twoMixToggle:'2MIX · dual virtual mice',signalModToggle:'SIGNAL MOD · sculpt the live 3D mesh',play:'PLAY / PAUSE',loop:'LOOP',loopIn:'LOOP IN',loopOut:'LOOP OUT',resetLoop:'RESET LOOP',vol:'MASTER VOLUME',pitch:'PITCH',low:'LOW EQ',mid:'MID EQ',high:'HIGH EQ'
  };
  Object.entries(hints).forEach(([id,text])=>{const el=d.getElementById(id);if(el&&!el.title)el.title=text});
  d.querySelectorAll('button,[role=button],input[type=range],select').forEach(el=>{if(!el.title){const text=el.getAttribute('aria-label')||el.textContent?.trim();if(text)el.title=text.slice(0,120)}});
  let hint=d.getElementById('enochContextHint');if(!hint){hint=d.createElement('div');hint.id='enochContextHint';hint.className='enoch-context-hint';d.body.appendChild(hint)}
  if(!d.documentElement.dataset.contextHintsV1){d.documentElement.dataset.contextHintsV1='1';const show=(el,e)=>{const text=el?.title||el?.getAttribute?.('aria-label');if(!text)return;hint.textContent=text;hint.classList.add('show');const x=Math.min(w.innerWidth-245,(e?.clientX||el.getBoundingClientRect().left)+12),y=Math.min(w.innerHeight-40,(e?.clientY||el.getBoundingClientRect().bottom)+10);hint.style.left=Math.max(4,x)+'px';hint.style.top=Math.max(4,y)+'px'};const hide=()=>hint.classList.remove('show');d.addEventListener('pointerover',e=>{const el=e.target.closest?.('button,[role=button],input[type=range],select');if(el)show(el,e)});d.addEventListener('pointerout',e=>{if(e.target.closest?.('button,[role=button],input[type=range],select'))hide()});d.addEventListener('focusin',e=>{const el=e.target.closest?.('button,[role=button],input[type=range],select');if(el)show(el)});d.addEventListener('focusout',hide)}
  w.installEnochianDoubleJeckerRadialV1&&window.installEnochianDoubleJeckerRadialV1?.(host);
  return true;
 }catch(_){return false}
}
window.installEnochianUiRepairsV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();