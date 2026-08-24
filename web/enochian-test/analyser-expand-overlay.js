(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument, deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument, w=d&&d.defaultView;
      const wave=d&&d.querySelector('.stage .wave'), stage=wave&&wave.closest('.stage');
      if(!d||!w||!wave||!stage)return false;
      if(d.documentElement.dataset.analyserExpandOverlay==='v3')return true;
      d.documentElement.dataset.analyserExpandOverlay='v3';

      const style=d.createElement('style');
      style.textContent=`
        .stage{position:relative!important}
        .analyser-expand-btn{position:absolute;left:8px;top:5px;z-index:62;min-height:24px;padding:3px 7px;border:1px solid #315b56;border-radius:4px;background:#020706f2;color:#9dece0;font-size:7px;font-weight:800;letter-spacing:.12em;cursor:pointer;touch-action:manipulation}
        .analyser-expand-btn:hover,.analyser-expand-btn:focus-visible{border-color:#68d8bd;color:#d7fff8;outline:none}
        .wave.analyser-expanded{position:fixed!important;left:var(--af-left)!important;top:var(--af-top)!important;right:auto!important;bottom:auto!important;width:var(--af-width)!important;height:var(--af-height)!important;min-width:260px!important;min-height:180px!important;max-width:none!important;max-height:none!important;z-index:9999!important;background:linear-gradient(180deg,#03100df7,#010504fc)!important;border-color:#68d8bd!important;box-shadow:0 0 0 1px #17332e,0 14px 46px #000e!important;overflow:hidden!important;touch-action:none!important;cursor:grab!important;user-select:none!important}
        .wave.analyser-expanded.analyser-dragging{cursor:grabbing!important}
        .wave.analyser-expanded h2{margin:8px 86px 6px!important;font-size:clamp(8px,1.2vw,14px)!important;pointer-events:none}
        .wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{top:38px!important;bottom:66px!important;height:auto!important;width:calc(100% - 16px)!important}
        .wave.analyser-expanded #wave{opacity:.035!important}.wave.analyser-expanded .signals{bottom:7px!important;z-index:8!important}.wave.analyser-expanded .analyser-glide-readout{right:8px!important;top:5px!important}
        .analyser-resize-hint{display:none;position:absolute;right:7px;bottom:4px;z-index:65;color:#6ba99e;font:600 6px monospace;letter-spacing:.08em;pointer-events:none}.analyser-expanded .analyser-resize-hint{display:block}
        @media(max-width:620px){.wave.analyser-expanded h2{margin-left:74px!important;margin-right:74px!important}.analyser-expand-btn{padding:3px 5px;font-size:6px}.wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{bottom:60px!important}}
      `; d.head.appendChild(style);

      const btn=d.createElement('button'); btn.type='button'; btn.className='analyser-expand-btn'; btn.textContent='EXPAND'; btn.setAttribute('aria-expanded','false'); wave.appendChild(btn);
      const hint=d.createElement('span'); hint.className='analyser-resize-hint'; hint.textContent='DRAG · WHEEL/PINCH SCALE'; wave.appendChild(hint);
      let x=0,y=0,width=0,height=0,drag=null,pinch=null;
      const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
      const apply=()=>{wave.style.setProperty('--af-left',x+'px');wave.style.setProperty('--af-top',y+'px');wave.style.setProperty('--af-width',width+'px');wave.style.setProperty('--af-height',height+'px')};
      const fit=()=>{const vw=w.innerWidth,vh=w.innerHeight;width=clamp(width||Math.min(vw*.62,760),260,vw-12);height=clamp(height||Math.min(vh*.48,430),180,vh-12);x=clamp(x||((vw-width)/2),6,Math.max(6,vw-width-6));y=clamp(y||Math.max(6,(vh-height)*.18),6,Math.max(6,vh-height-6));apply()};
      const setExpanded=on=>{wave.classList.toggle('analyser-expanded',on);btn.textContent=on?'RESTORE':'EXPAND';btn.setAttribute('aria-expanded',String(on));if(on){const r=wave.getBoundingClientRect();width=Math.max(320,Math.min(w.innerWidth-12,r.width*1.15));height=Math.max(210,Math.min(w.innerHeight-12,r.height*1.8));x=(w.innerWidth-width)/2;y=Math.max(6,(w.innerHeight-height)*.18);fit()}try{w.dispatchEvent(new Event('resize'))}catch(_){}};
      btn.addEventListener('pointerdown',e=>e.stopPropagation()); btn.addEventListener('click',e=>{e.stopPropagation();setExpanded(!wave.classList.contains('analyser-expanded'))});
      wave.addEventListener('wheel',e=>{if(!wave.classList.contains('analyser-expanded'))return;e.preventDefault();const r=wave.getBoundingClientRect(),scale=e.deltaY<0?1.08:.92,cx=e.clientX-r.left,cy=e.clientY-r.top,nw=clamp(width*scale,260,w.innerWidth-12),nh=clamp(height*scale,180,w.innerHeight-12);x-=cx*(nw/width-1);y-=cy*(nh/height-1);width=nw;height=nh;fit()},{passive:false});
      wave.addEventListener('pointerdown',e=>{if(!wave.classList.contains('analyser-expanded')||e.target===btn||e.target.closest('button,input,textarea,select'))return;wave.setPointerCapture?.(e.pointerId);drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,x,y};wave.classList.add('analyser-dragging')});
      wave.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;x=drag.x+e.clientX-drag.sx;y=drag.y+e.clientY-drag.sy;fit()});
      const end=e=>{if(drag&&(!e||drag.id===e.pointerId)){drag=null;wave.classList.remove('analyser-dragging')}}; wave.addEventListener('pointerup',end);wave.addEventListener('pointercancel',end);
      wave.addEventListener('touchstart',e=>{if(!wave.classList.contains('analyser-expanded')||e.touches.length!==2)return;const a=e.touches[0],b=e.touches[1];pinch={dist:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),w:width,h:height};e.preventDefault()},{passive:false});
      wave.addEventListener('touchmove',e=>{if(!pinch||e.touches.length!==2)return;const a=e.touches[0],b=e.touches[1],s=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.dist;width=clamp(pinch.w*s,260,w.innerWidth-12);height=clamp(pinch.h*s,180,w.innerHeight-12);fit();e.preventDefault()},{passive:false}); wave.addEventListener('touchend',()=>pinch=null);
      d.addEventListener('keydown',e=>{if(e.key==='Escape'&&wave.classList.contains('analyser-expanded'))setExpanded(false)}); w.addEventListener('resize',()=>{if(wave.classList.contains('analyser-expanded'))fit()});
      return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserExpandOverlay=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();