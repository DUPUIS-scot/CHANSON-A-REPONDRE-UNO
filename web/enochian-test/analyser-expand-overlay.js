(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument, deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument, w=d&&d.defaultView;
      const wave=d&&d.querySelector('.stage .wave'), stage=wave&&wave.closest('.stage');
      if(!d||!w||!wave||!stage)return false;
      if(d.documentElement.dataset.analyserExpandOverlay==='v6')return true;
      d.documentElement.dataset.analyserExpandOverlay='v6';

      const oldBtn=wave.querySelector('.analyser-expand-btn');
      const oldHint=wave.querySelector('.analyser-resize-hint');
      if(oldBtn)oldBtn.remove();if(oldHint)oldHint.remove();

      const style=d.createElement('style');
      style.textContent=`
        .stage{position:relative!important}
        .analyser-expand-btn{position:absolute;left:112px;top:5px;z-index:10002;min-height:24px;padding:3px 7px;border:1px solid #315b56;border-radius:4px;background:#020706f2;color:#9dece0;font-size:7px;font-weight:800;letter-spacing:.12em;cursor:pointer;touch-action:manipulation}
        .analyser-expand-btn:hover,.analyser-expand-btn:focus-visible{border-color:#68d8bd;color:#d7fff8;outline:none}
        .wave.analyser-expanded{position:fixed!important;inset:auto!important;min-width:320px!important;min-height:220px!important;max-width:calc(100vw - 8px)!important;max-height:calc(100dvh - 8px)!important;z-index:9999!important;background:linear-gradient(180deg,#03100df8,#010504fd)!important;border:1px solid #68d8bd!important;border-radius:8px!important;box-shadow:0 0 0 1px #17332e,0 18px 60px #000e!important;overflow:hidden!important;resize:both!important;touch-action:auto!important;user-select:none!important}
        .wave.analyser-expanded h2{margin:8px 88px 6px!important;padding:5px 10px!important;font-size:9px!important;letter-spacing:.18em!important;cursor:move!important;touch-action:none!important;user-select:none!important}
        .wave.analyser-expanded.analyser-moving h2{cursor:grabbing!important}
        .wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{top:42px!important;bottom:72px!important;height:auto!important;width:calc(100% - 16px)!important;left:8px!important;right:8px!important}
        .wave.analyser-expanded #wave{opacity:.025!important}
        .wave.analyser-expanded .signals{left:8px!important;right:8px!important;bottom:7px!important;height:60px!important;z-index:8!important}
        .wave.analyser-expanded .analyser-glide-readout{right:8px!important;top:5px!important}
        .analyser-resize-hint{display:none}
        .wave.analyser-expanded .analyser-resize-hint{display:block;position:absolute;left:8px;right:8px;bottom:68px;z-index:65;color:#6ba99e;font:600 7px monospace;letter-spacing:.06em;text-align:center;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wave.analyser-expanded:after{content:'↘';position:absolute;right:3px;bottom:1px;z-index:80;color:#79eadb;font:700 12px monospace;pointer-events:none;opacity:.8}
        @media(max-width:620px){.wave.analyser-expanded{min-width:250px!important;min-height:190px!important}.wave.analyser-expanded h2{margin-left:74px!important;margin-right:74px!important;font-size:7px!important}.analyser-expand-btn{left:96px;padding:3px 5px;font-size:6px}.wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{bottom:62px!important}.wave.analyser-expanded .signals{height:52px!important}.wave.analyser-expanded .analyser-resize-hint{bottom:58px!important;font-size:6px!important}}
      `;
      d.head.appendChild(style);

      const btn=d.createElement('button');btn.type='button';btn.className='analyser-expand-btn';btn.textContent='EXPAND';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Open floating analyser signal box');wave.appendChild(btn);
      const hint=d.createElement('span');hint.className='analyser-resize-hint';hint.textContent='DRAG SIGNAL = ORBIT · SIGNAL MOD = SCULPT · WHEEL/PINCH = DEPTH';wave.appendChild(hint);

      let saved=null;
      const notifyResize=()=>{try{w.dispatchEvent(new Event('resize'))}catch(_){}};
      const clampPosition=()=>{if(!wave.classList.contains('analyser-expanded'))return;const r=wave.getBoundingClientRect();const maxL=Math.max(4,w.innerWidth-r.width-4),maxT=Math.max(4,w.innerHeight-r.height-4);const left=Math.min(Math.max(4,parseFloat(wave.style.left)||r.left),maxL),top=Math.min(Math.max(4,parseFloat(wave.style.top)||r.top),maxT);wave.style.left=`${left}px`;wave.style.top=`${top}px`};
      const setExpanded=on=>{
        if(on){const r=wave.getBoundingClientRect();saved={left:wave.style.left,top:wave.style.top,width:wave.style.width,height:wave.style.height};const width=Math.min(Math.max(r.width*1.55,560),Math.max(320,w.innerWidth-24)),height=Math.min(Math.max(r.height*2.1,340),Math.max(220,w.innerHeight-24));wave.classList.add('analyser-expanded');wave.style.width=`${width}px`;wave.style.height=`${height}px`;wave.style.left=`${Math.max(4,(w.innerWidth-width)/2)}px`;wave.style.top=`${Math.max(4,(w.innerHeight-height)/2)}px`;btn.textContent='RESTORE';btn.setAttribute('aria-expanded','true');btn.setAttribute('aria-label','Restore analyser to deck')}
        else {wave.classList.remove('analyser-expanded','analyser-moving');wave.style.left=saved?.left||'';wave.style.top=saved?.top||'';wave.style.width=saved?.width||'';wave.style.height=saved?.height||'';btn.textContent='EXPAND';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Open floating analyser signal box')}
        notifyResize();
      };
      btn.addEventListener('pointerdown',e=>e.stopPropagation());btn.addEventListener('click',e=>{e.stopPropagation();setExpanded(!wave.classList.contains('analyser-expanded'))});

      const title=wave.querySelector('h2');
      if(title){title.addEventListener('pointerdown',e=>{if(!wave.classList.contains('analyser-expanded')||e.button>0)return;e.preventDefault();e.stopPropagation();const r=wave.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;wave.classList.add('analyser-moving');try{title.setPointerCapture(e.pointerId)}catch(_){}const move=ev=>{const maxL=Math.max(4,w.innerWidth-wave.offsetWidth-4),maxT=Math.max(4,w.innerHeight-wave.offsetHeight-4);wave.style.left=`${Math.min(Math.max(4,ev.clientX-dx),maxL)}px`;wave.style.top=`${Math.min(Math.max(4,ev.clientY-dy),maxT)}px`};const end=ev=>{wave.classList.remove('analyser-moving');try{title.releasePointerCapture(ev.pointerId)}catch(_){};title.removeEventListener('pointermove',move);title.removeEventListener('pointerup',end);title.removeEventListener('pointercancel',end)};title.addEventListener('pointermove',move);title.addEventListener('pointerup',end);title.addEventListener('pointercancel',end)})}
      if(w.ResizeObserver){new w.ResizeObserver(()=>{if(wave.classList.contains('analyser-expanded')){clampPosition();notifyResize()}}).observe(wave)}
      w.addEventListener('resize',()=>{clampPosition();notifyResize()});d.addEventListener('keydown',e=>{if(e.key==='Escape'&&wave.classList.contains('analyser-expanded'))setExpanded(false)});
      return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserExpandOverlay=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
