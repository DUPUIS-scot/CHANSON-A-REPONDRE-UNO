(()=>{
  'use strict';
  const STORE='doubleJeckerRadialPanelRectV1';
  function install(host){
    try{
      const live=host&&host.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      const w=d&&d.defaultView;
      const panel=document.getElementById('doubleDeckerSpecial');
      if(!d||!w||!panel)return false;
      if(panel.dataset.jeckerRadial==='v1')return true;
      panel.dataset.jeckerRadial='v1';
      panel.classList.add('jecker-radial');

      let style=document.getElementById('double-jecker-radial-style');
      if(!style){
        style=document.createElement('style');
        style.id='double-jecker-radial-style';
        style.textContent=`
          #doubleDeckerSpecial.jecker-radial{position:fixed!important;inset:auto!important;left:50%!important;top:50%!important;width:min(88vmin,780px)!important;height:min(88vmin,780px)!important;max-width:calc(100vw - 18px)!important;max-height:calc(100vh - 18px)!important;aspect-ratio:1/1!important;border-radius:50%!important;box-sizing:border-box!important;padding:0!important;overflow:hidden!important;z-index:2147483100!important;background:radial-gradient(circle at 50% 50%,#20190f 0 18%,#090806 18.5% 37%,#19130b 37.5% 38.2%,#070707 38.8% 67%,#1d160c 67.4% 69%,#050505 69.5% 100%)!important;border:2px solid #8c7447!important;box-shadow:inset 0 0 0 7px #070604,inset 0 0 0 9px #44351d,inset 0 0 48px #000,0 18px 52px #000d!important;transform:translate(-50%,-50%)}
          #doubleDeckerSpecial.jecker-radial::before{content:'';position:absolute;inset:3.8%;border:1px solid #4e3e21;border-radius:50%;pointer-events:none;box-shadow:inset 0 0 30px #000c}
          #doubleDeckerSpecial.jecker-radial::after{content:'2JECKER';position:absolute;left:50%;top:3.5%;transform:translateX(-50%);z-index:40;color:#d5aa63;font:1000 clamp(7px,1.15vmin,10px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.22em;pointer-events:none;text-shadow:0 1px 3px #000}
          #doubleDeckerSpecial.jecker-radial .dds-engine-control{position:absolute!important;z-index:45!important;left:50%!important;top:8.5%!important;transform:translateX(-50%)!important;width:27%!important;min-width:116px!important;pointer-events:auto!important}
          #doubleDeckerSpecial.jecker-radial .dds-engine-control button{width:100%!important;min-height:clamp(25px,3.8vmin,32px)!important;border-radius:999px!important;padding:4px 8px!important;border:1px solid #d5aa63!important;background:#24190a!important;color:#ffe3a0!important;font:1000 clamp(6px,.88vmin,8px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;letter-spacing:.06em!important;box-shadow:0 0 16px #d5aa6366!important}
          #doubleDeckerSpecial.jecker-radial .dds-engine-control button.active{border-color:#63f5cf!important;background:#083128!important;color:#63f5cf!important;box-shadow:0 0 16px #40e6b477!important}
          #doubleDeckerSpecial.jecker-radial .dds-engine-control small{display:none!important}
          #doubleDeckerSpecial.jecker-radial.jecker-panel-dragging{cursor:grabbing!important}
          #doubleDeckerSpecial.jecker-radial .dds-grid{position:absolute!important;inset:0!important;display:block!important;margin:0!important;padding:0!important;max-width:none!important;pointer-events:none}
          #doubleDeckerSpecial.jecker-radial .dds-deck{position:absolute!important;inset:0!important;display:block!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;pointer-events:none}
          #doubleDeckerSpecial.jecker-radial .dds-slot{position:absolute!important;z-index:20!important;width:18.5%!important;height:18.5%!important;aspect-ratio:1/1!important;box-sizing:border-box!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;border:1px solid #315b56!important;background:radial-gradient(circle at 45% 35%,#17201e,#07100e 56%,#030504 100%)!important;box-shadow:inset 0 0 0 3px #050706,0 0 12px #000c!important;padding:6px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;overflow:hidden!important;pointer-events:auto!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot.stem-off{opacity:.58!important;border-color:#3d3425!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot>*{position:relative!important;inset:auto!important;transform:none!important;margin:0!important;min-width:0!important;box-sizing:border-box!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot select{width:82%!important;min-height:16px!important;height:20%!important;border:1px solid #44351d!important;border-radius:999px!important;background:#080705!important;color:#d5aa63!important;padding:0 5px!important;font:800 clamp(5px,.72vmin,7px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;text-align:center!important;text-overflow:ellipsis!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot input[type=range]{width:70%!important;height:9px!important;accent-color:#19c98f!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot output,#doubleDeckerSpecial.jecker-radial .dds-slot label,#doubleDeckerSpecial.jecker-radial .dds-slot span{max-width:86%!important;color:#a9eee7!important;font-size:clamp(5px,.72vmin,7px)!important;line-height:1!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot .stem-toggle,#doubleDeckerSpecial.jecker-radial .dds-slot [data-dds-stem-toggle]{width:40%!important;height:40%!important;aspect-ratio:1/1!important;min-width:0!important;min-height:0!important;padding:2px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:#07100e!important;color:#7a9a94!important;border:1px solid #315b56!important;font:1000 clamp(5px,.7vmin,7px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;white-space:normal!important;text-align:center!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot .stem-toggle.active,#doubleDeckerSpecial.jecker-radial .dds-slot [data-dds-stem-toggle].active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 10px #40e6b477!important}
          #doubleDeckerSpecial.jecker-radial .dds-center{position:absolute!important;z-index:28!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:31%!important;height:31%!important;aspect-ratio:1/1!important;border-radius:50%!important;box-sizing:border-box!important;margin:0!important;padding:5.2%!important 3.2%!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;gap:3px!important;overflow:auto!important;scrollbar-width:none!important;border:1px solid #8c7447!important;background:radial-gradient(circle,#251c0e,#0b0905 68%,#030302)!important;box-shadow:inset 0 0 0 4px #050403,0 0 17px #000!important;pointer-events:auto!important}
          #doubleDeckerSpecial.jecker-radial .dds-center::-webkit-scrollbar{display:none}
          #doubleDeckerSpecial.jecker-radial .dds-center button,#doubleDeckerSpecial.jecker-radial .dds-center select{min-height:18px!important;border-radius:999px!important;font-size:clamp(5px,.7vmin,7px)!important;padding:2px 5px!important}
          #doubleDeckerSpecial.jecker-radial .dds-v2-actions{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:2px!important}
          #doubleDeckerSpecial.jecker-radial .dds-v2-actions button{min-height:18px!important;padding:2px!important;border-radius:50%!important;aspect-ratio:1/1!important}
          #doubleDeckerSpecial.jecker-radial .dds-performance{display:grid!important;gap:2px!important;padding:3px!important;border-radius:18px!important;background:#020706cc!important}
          #doubleDeckerSpecial.jecker-radial .dds-performance-row{grid-template-columns:27px 1fr 27px!important;gap:2px!important}
          #doubleDeckerSpecial.jecker-radial .dds-perf-buttons{gap:2px!important}
          #doubleDeckerSpecial.jecker-radial .dds-perf-buttons button{min-height:18px!important;padding:2px!important;border-radius:999px!important}
          #doubleDeckerSpecial.jecker-radial .dds-quantize{gap:2px!important}
          #doubleDeckerSpecial.jecker-radial .stem-jecker-toggle,#doubleDeckerSpecial.jecker-radial .dds-deck-shuffle{min-height:18px!important;border-radius:999px!important;padding:2px 5px!important;font-size:clamp(5px,.7vmin,7px)!important}
          #doubleDeckerSpecial.jecker-radial .dds-deck>.dds-deck-shuffle{position:absolute!important;z-index:24!important;width:12%!important;height:12%!important;min-width:0!important;min-height:0!important;aspect-ratio:1/1!important;border-radius:50%!important;padding:7px!important;white-space:normal!important;line-height:1.05!important;pointer-events:auto!important}
          #doubleDeckerSpecial.jecker-radial .dds-deck[data-dds-deck=A]>.dds-deck-shuffle{left:7%!important;top:44%!important}
          #doubleDeckerSpecial.jecker-radial .dds-deck[data-dds-deck=B]>.dds-deck-shuffle{right:7%!important;bottom:44%!important}
          #doubleDeckerSpecial.jecker-radial .dds-head{display:none!important}
          #doubleDeckerSpecial.jecker-radial .dds-foot{position:absolute!important;z-index:35!important;left:50%!important;bottom:8.5%!important;transform:translateX(-50%)!important;width:34%!important;max-width:none!important;margin:0!important;padding:0!important;text-align:center!important;background:transparent!important;border:0!important;pointer-events:none!important}
          #doubleDeckerSpecial.jecker-radial .dds-foot button,#doubleDeckerSpecial.jecker-radial .dds-foot a{pointer-events:auto!important}
          #doubleDeckerSpecial.jecker-radial .dds-takeover-hud{display:none!important}
          @media(max-width:720px),(max-height:560px){#doubleDeckerSpecial.jecker-radial{width:min(96vmin,640px)!important;height:min(96vmin,640px)!important}.dds-takeover-hud{display:none!important}#doubleDeckerSpecial.jecker-radial .dds-slot{width:19.5%!important;height:19.5%!important;padding:4px!important}#doubleDeckerSpecial.jecker-radial .dds-center{width:33%!important;height:33%!important;padding:5.6% 3%!important}}
        `;
        document.head.appendChild(style);
      }

      const coords={
        A:{vocals:[36,22],drums:[58,17],bass:[78,31],other:[82,52]},
        B:{vocals:[64,78],drums:[42,83],bass:[22,69],other:[18,48]}
      };
      const place=()=>{
        ['A','B'].forEach(deckName=>{
          const deckEl=panel.querySelector(`[data-dds-deck="${deckName}"]`);if(!deckEl)return;
          deckEl.querySelectorAll('.dds-slot').forEach(slot=>{
            const stem=slot.dataset.slot;
            const p=coords[deckName]?.[stem];if(!p)return;
            slot.style.setProperty('left',p[0]+'%','important');
            slot.style.setProperty('top',p[1]+'%','important');
          });
        });
      };
      place();
      new MutationObserver(place).observe(panel,{childList:true,subtree:true});

      const saved=(()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch(_){return null}})();
      if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){
        panel.style.setProperty('left',saved.left+'px','important');
        panel.style.setProperty('top',saved.top+'px','important');
        panel.style.setProperty('transform','none','important');
      }
      const clamp=()=>{
        const r=panel.getBoundingClientRect();
        let left=r.left,top=r.top;
        left=Math.max(0,Math.min(innerWidth-r.width,left));
        top=Math.max(0,Math.min(innerHeight-r.height,top));
        panel.style.setProperty('left',left+'px','important');
        panel.style.setProperty('top',top+'px','important');
        panel.style.setProperty('transform','none','important');
        return{left,top};
      };
      let drag=null;
      panel.addEventListener('pointerdown',e=>{
        if(e.target.closest('button,input,select,a,label,.dds-slot,.dds-center,.dds-takeover-hud'))return;
        const r=panel.getBoundingClientRect();
        drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
        panel.classList.add('jecker-panel-dragging');
        try{panel.setPointerCapture(e.pointerId)}catch(_){}
      });
      panel.addEventListener('pointermove',e=>{
        if(!drag||drag.id!==e.pointerId)return;
        e.preventDefault();
        panel.style.setProperty('left',(e.clientX-drag.dx)+'px','important');
        panel.style.setProperty('top',(e.clientY-drag.dy)+'px','important');
        panel.style.setProperty('transform','none','important');
        clamp();
      });
      const end=e=>{
        if(!drag||drag.id!==e.pointerId)return;
        drag=null;panel.classList.remove('jecker-panel-dragging');
        const pos=clamp();try{localStorage.setItem(STORE,JSON.stringify(pos))}catch(_){}
        try{panel.releasePointerCapture(e.pointerId)}catch(_){}
      };
      panel.addEventListener('pointerup',end);panel.addEventListener('pointercancel',end);
      window.addEventListener('resize',()=>{if(panel.classList.contains('open'))clamp()});
      w.__enochDoubleJeckerRadial={version:'v1',panel,place,clamp};
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerRadialV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
