(()=>{
'use strict';
const STORE='doubleJesterRadialPanelRectV10';
const VERSION='v10';
const COORDS={
  A:{vocals:[34,18],drums:[66,18],other:[22,34],bass:[78,34]},
  B:{other:[22,66],bass:[78,66],vocals:[34,82],drums:[66,82]},
};
function install(host){
  try{
    const live=host&&host.contentDocument;
    const deck=live&&live.getElementById('deck');
    const d=deck&&deck.contentDocument;
    const w=d&&d.defaultView;
    const panel=document.getElementById('doubleDeckerSpecial');
    if(!d||!w||!panel)return false;
    if(panel.dataset.jeckerRadial===VERSION)return true;
    panel.dataset.jeckerRadial=VERSION;
    panel.classList.add('jecker-radial');

    document.getElementById('double-jecker-radial-style')?.remove();
    const style=document.createElement('style');
    style.id='double-jecker-radial-style';
    style.textContent=`
#doubleDeckerSpecial.jecker-radial{position:fixed!important;inset:auto!important;left:50%!important;top:50%!important;width:min(78vmin,700px)!important;height:min(78vmin,700px)!important;max-width:calc(100vw - 20px)!important;max-height:calc(100vh - 20px)!important;aspect-ratio:1/1!important;border-radius:50%!important;box-sizing:border-box!important;padding:0!important;overflow:hidden!important;z-index:2147483100!important;transform:translate(-50%,-50%)!important;isolation:isolate!important;background:radial-gradient(circle at 50% 50%,#100c07 0 31%,#070605 31.5% 63%,#171007 63.5% 64.5%,#050403 65% 100%)!important;box-shadow:inset 0 0 0 2px #f08b24,inset 0 0 0 8px #241506,inset 0 0 0 10px #b45e17,inset 0 0 50px #000,0 18px 56px #000d!important}
#doubleDeckerSpecial.jecker-radial::before{content:'2JESTER SPECIAL';position:absolute;left:50%;top:2.8%;transform:translateX(-50%);z-index:90;color:#ffd37c;font:1000 clamp(8px,1.15vmin,11px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.18em;white-space:nowrap;pointer-events:none;text-shadow:0 0 7px #ff761f}
#doubleDeckerSpecial.jecker-radial>.dds-head,#doubleDeckerSpecial.jecker-radial>.dds-title,#doubleDeckerSpecial.jecker-radial>.dds-subtitle,#doubleDeckerSpecial.jecker-radial>.dds-kicker,#doubleDeckerSpecial.jecker-radial>[data-dds-title],#doubleDeckerSpecial.jecker-radial>.dds-engine-control,#doubleDeckerSpecial.jecker-radial>.dds-foot{display:none!important}
#doubleDeckerSpecial.jecker-radial .dds-grid,#doubleDeckerSpecial.jecker-radial .dds-deck{position:absolute!important;inset:0!important;display:block!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;pointer-events:none!important;transform:none!important;animation:none!important;transition:none!important}
#doubleDeckerSpecial.jecker-radial .dds-grid::before,#doubleDeckerSpecial.jecker-radial .dds-grid::after,#doubleDeckerSpecial.jecker-radial .dds-center::before,#doubleDeckerSpecial.jecker-radial .dds-center::after{content:none!important;display:none!important}
#doubleDeckerSpecial.jecker-radial .dds-deck>*:not(.dds-slot):not(.dds-deck-shuffle){display:none!important}
#doubleDeckerSpecial.jecker-radial .dds-deck::before{position:absolute;left:50%;transform:translateX(-50%);z-index:18;color:#e8b85f;font:1000 clamp(6px,.85vmin,8px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.18em;pointer-events:none;text-shadow:0 0 5px #ff6f18}
#doubleDeckerSpecial.jecker-radial .dds-deck[data-dds-deck=A]::before{content:'DECK A';top:7%}
#doubleDeckerSpecial.jecker-radial .dds-deck[data-dds-deck=B]::before{content:'DECK B';bottom:7%}
#doubleDeckerSpecial.jecker-radial .dds-slot{position:absolute!important;z-index:20!important;width:15%!important;height:15%!important;transform:translate(-50%,-50%)!important;rotate:none!important;translate:none!important;scale:none!important;animation:none!important;transition:none!important;border-radius:50%!important;padding:4px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;overflow:hidden!important;pointer-events:auto!important;box-sizing:border-box!important;will-change:auto!important}
#doubleDeckerSpecial.jecker-radial .dds-slot>*{position:relative!important;inset:auto!important;transform:none!important;rotate:none!important;translate:none!important;scale:none!important;animation:none!important;margin:0!important;min-width:0!important;box-sizing:border-box!important}
#doubleDeckerSpecial.jecker-radial .dds-slot select{width:84%!important;min-height:15px!important;height:20%!important;border-radius:999px!important;padding:0 4px!important;font-size:clamp(5px,.68vmin,7px)!important;text-align:center!important;text-overflow:ellipsis!important}
#doubleDeckerSpecial.jecker-radial .dds-slot input[type=range]{width:70%!important;height:8px!important}
#doubleDeckerSpecial.jecker-radial .dds-slot output,#doubleDeckerSpecial.jecker-radial .dds-slot label,#doubleDeckerSpecial.jecker-radial .dds-slot span{max-width:86%!important;font-size:clamp(5px,.68vmin,7px)!important;line-height:1!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#doubleDeckerSpecial.jecker-radial .dds-slot .stem-toggle,#doubleDeckerSpecial.jecker-radial .dds-slot [data-dds-stem-toggle]{width:36%!important;height:36%!important;min-width:0!important;min-height:0!important;padding:2px!important;border-radius:50%!important;display:grid!important;place-items:center!important;font-size:clamp(5px,.66vmin,7px)!important}
#doubleDeckerSpecial.jecker-radial .dds-deck-shuffle{position:absolute!important;z-index:35!important;top:50%!important;width:10%!important;height:10%!important;min-width:0!important;min-height:0!important;padding:4px!important;border-radius:50%!important;display:grid!important;place-items:center!important;pointer-events:auto!important;transform:translateY(-50%)!important;font-size:clamp(5px,.62vmin,7px)!important;line-height:1.05!important;white-space:normal!important}
#doubleDeckerSpecial.jecker-radial .dds-deck[data-dds-deck=A]>.dds-deck-shuffle{left:8%!important;right:auto!important}
#doubleDeckerSpecial.jecker-radial .dds-deck[data-dds-deck=B]>.dds-deck-shuffle{right:8%!important;left:auto!important}
#doubleDeckerSpecial.jecker-radial .dds-center{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:31%!important;height:auto!important;max-width:none!important;max-height:44%!important;margin:0!important;padding:5px!important;border:1px solid #6d5836!important;border-radius:12px!important;background:#050504f2!important;box-shadow:0 0 22px #000!important;overflow:hidden!important;contain:layout paint!important;pointer-events:auto!important;display:grid!important;gap:3px!important;z-index:45!important;box-sizing:border-box!important}
#doubleDeckerSpecial.jecker-radial .dds-center>.dds-v2-actions,#doubleDeckerSpecial.jecker-radial .dds-center>.dds-performance,#doubleDeckerSpecial.jecker-radial .dds-center>.stem-jecker-toggle,#doubleDeckerSpecial.jecker-radial .dds-center>.stem-jester-toggle,#doubleDeckerSpecial.jecker-radial .dds-center>.jecker-output,#doubleDeckerSpecial.jecker-radial .dds-center>.dds-takeover-hud{position:static!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;transform:none!important;width:100%!important;max-width:100%!important;z-index:auto!important;box-sizing:border-box!important;pointer-events:auto!important;margin:0!important}
#doubleDeckerSpecial.jecker-radial .dds-center>.dds-v2-actions{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:2px!important}
#doubleDeckerSpecial.jecker-radial .dds-center>.dds-performance{display:grid!important;gap:2px!important;padding:3px!important;border-radius:7px!important;overflow:hidden!important}
#doubleDeckerSpecial.jecker-radial .dds-performance-row{grid-template-columns:27px 1fr 27px!important;gap:2px!important}
#doubleDeckerSpecial.jecker-radial .dds-perf-buttons,#doubleDeckerSpecial.jecker-radial .dds-quantize{gap:2px!important}
#doubleDeckerSpecial.jecker-radial .dds-center button,#doubleDeckerSpecial.jecker-radial .dds-center select,#doubleDeckerSpecial.jecker-radial .stem-jecker-toggle,#doubleDeckerSpecial.jecker-radial .stem-jester-toggle,#doubleDeckerSpecial.jecker-radial .jecker-output{min-height:16px!important;border-radius:999px!important;font-size:clamp(5px,.66vmin,7px)!important;padding:2px 4px!important}
#doubleDeckerSpecial.jecker-radial .dds-status,#doubleDeckerSpecial.jecker-radial .dds-master-hold,#doubleDeckerSpecial.jecker-radial [data-stem-jecker-shuffle],#doubleDeckerSpecial.jecker-radial [data-stem-jester-shuffle],#doubleDeckerSpecial.jecker-radial .enoch-jecker-divider,#doubleDeckerSpecial.jecker-radial .enoch-jecker-resize{display:none!important}
#doubleDeckerSpecial.jecker-radial .dds-takeover-hud{display:none!important}
#doubleDeckerSpecial.jecker-radial.jecker-takeover .dds-center>.dds-takeover-hud{display:grid!important;grid-template-columns:1fr 1fr!important;gap:2px!important;padding:2px!important;border-radius:7px!important}
#doubleDeckerSpecial.jecker-radial .dds-center>.dds-takeover-hud strong,#doubleDeckerSpecial.jecker-radial .dds-center>.dds-takeover-hud output{display:none!important}
@media(max-width:720px),(max-height:560px){#doubleDeckerSpecial.jecker-radial{width:min(90vmin,620px)!important;height:min(90vmin,620px)!important}#doubleDeckerSpecial.jecker-radial .dds-slot{width:15.8%!important;height:15.8%!important;padding:3px!important}#doubleDeckerSpecial.jecker-radial .dds-center{width:34%!important;max-height:46%!important;padding:3px!important}}
`;
    document.head.appendChild(style);

    const place=()=>{
      ['A','B'].forEach(name=>{
        const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);
        if(!deckEl)return;
        deckEl.querySelectorAll('.dds-slot').forEach(slot=>{
          const p=COORDS[name]?.[slot.dataset.slot];
          if(!p)return;
          slot.style.setProperty('left',p[0]+'%','important');
          slot.style.setProperty('top',p[1]+'%','important');
          slot.style.setProperty('transform','translate(-50%,-50%)','important');
          slot.style.setProperty('rotate','none','important');
          slot.style.setProperty('translate','none','important');
          slot.style.setProperty('scale','none','important');
          slot.style.setProperty('animation','none','important');
          slot.style.setProperty('transition','none','important');
        });
        const shuffle=deckEl.querySelector(':scope>.dds-deck-shuffle');
        if(shuffle)shuffle.textContent='SHUFFLE '+name;
      });
    };
    place();

    const containsSlot=node=>node?.nodeType===1&&(node.matches?.('.dds-slot,.dds-deck')||node.querySelector?.('.dds-slot'));
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==='childList'&&[...m.addedNodes,...m.removedNodes].some(containsSlot)))place();
    });
    observer.observe(panel,{childList:true,subtree:true});

    const saved=(()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch(_){return null}})();
    if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){
      panel.style.setProperty('left',saved.left+'px','important');
      panel.style.setProperty('top',saved.top+'px','important');
      panel.style.setProperty('transform','none','important');
    }
    const clampPanel=()=>{
      const r=panel.getBoundingClientRect();
      const left=Math.max(0,Math.min(innerWidth-r.width,r.left));
      const top=Math.max(0,Math.min(innerHeight-r.height,r.top));
      if(Math.abs(left-r.left)>.5||Math.abs(top-r.top)>.5){
        panel.style.setProperty('left',left+'px','important');
        panel.style.setProperty('top',top+'px','important');
        panel.style.setProperty('transform','none','important');
      }
      return{left,top};
    };

    let drag=null;
    panel.addEventListener('pointerdown',e=>{
      if(e.button!==0||e.target.closest('button,input,select,a,label,.dds-slot,.dds-center,.dds-takeover-hud'))return;
      const r=panel.getBoundingClientRect();
      drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
      try{panel.setPointerCapture(e.pointerId)}catch(_){}
    },{passive:false});
    panel.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      e.preventDefault();
      panel.style.setProperty('left',(e.clientX-drag.dx)+'px','important');
      panel.style.setProperty('top',(e.clientY-drag.dy)+'px','important');
      panel.style.setProperty('transform','none','important');
      clampPanel();
    },{passive:false});
    const end=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      drag=null;
      const pos=clampPanel();
      try{localStorage.setItem(STORE,JSON.stringify(pos));panel.releasePointerCapture(e.pointerId)}catch(_){}
    };
    panel.addEventListener('pointerup',end);
    panel.addEventListener('pointercancel',end);
    window.addEventListener('resize',()=>{if(panel.classList.contains('open'))clampPanel()});

    w.__enochDoubleJesterRadial={version:VERSION,panel,place,clamp:clampPanel,coords:COORDS};
    w.__enochDoubleJeckerRadial=w.__enochDoubleJesterRadial;
    w.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    return true;
  }catch(_){return false}
}
window.installEnochianDoubleJeckerRadialV1=host=>{
  let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);
  return install(host);
};
})();
