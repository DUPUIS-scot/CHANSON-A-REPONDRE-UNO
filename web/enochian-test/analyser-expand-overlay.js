(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument, deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument, w=d&&d.defaultView;
      const wave=d&&d.querySelector('.stage .wave'), stage=wave&&wave.closest('.stage');
      if(!d||!w||!wave||!stage)return false;
      if(d.documentElement.dataset.analyserExpandOverlay==='v7')return true;
      d.documentElement.dataset.analyserExpandOverlay='v7';

      wave.querySelector('.analyser-expand-btn')?.remove();
      wave.querySelector('.analyser-resize-hint')?.remove();
      wave.querySelector('.analyser-float-bar')?.remove();

      const style=d.createElement('style');
      style.textContent=`
        .stage{position:relative!important}
        .analyser-expand-btn{position:absolute;left:112px;top:5px;z-index:10004;min-height:24px;padding:3px 7px;border:1px solid #315b56;border-radius:4px;background:#020706f2;color:#9dece0;font-size:7px;font-weight:800;letter-spacing:.12em;cursor:pointer;touch-action:manipulation}
        .analyser-expand-btn:hover,.analyser-expand-btn:focus-visible{border-color:#68d8bd;color:#d7fff8;outline:none}
        .analyser-float-bar{display:none}
        .wave.analyser-expanded{position:fixed!important;inset:auto!important;min-width:320px!important;min-height:220px!important;max-width:calc(100vw - 8px)!important;max-height:calc(100dvh - 8px)!important;z-index:9999!important;background:linear-gradient(180deg,#03100df8,#010504fd)!important;border:1px solid #68d8bd!important;border-radius:8px!important;box-shadow:0 0 0 1px #17332e,0 18px 60px #000e!important;overflow:hidden!important;resize:both!important;touch-action:auto!important;user-select:none!important}
        .wave.analyser-expanded .analyser-float-bar{display:flex;position:absolute;left:0;right:0;top:0;height:34px;z-index:10001;align-items:center;justify-content:center;padding:0 168px 0 112px;border-bottom:1px solid #17332e;background:linear-gradient(180deg,#071713f5,#020706e8);color:#9dece0;font:800 8px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.16em;cursor:move;touch-action:none;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wave.analyser-expanded.analyser-moving .analyser-float-bar{cursor:grabbing;background:linear-gradient(180deg,#0a251ef8,#03100df2)}
        .wave.analyser-expanded h2{margin:36px 8px 4px!important;padding:3px 8px!important;font-size:8px!important;letter-spacing:.18em!important;cursor:default!important;pointer-events:none!important}
        .wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{top:58px!important;bottom:72px!important;height:auto!important;width:calc(100% - 16px)!important;left:8px!important;right:8px!important}
        .wave.analyser-expanded #wave{opacity:.025!important}
        .wave.analyser-expanded .signals{left:8px!important;right:8px!important;bottom:7px!important;height:60px!important;z-index:8!important}
        .wave.analyser-expanded .signal-mod-toggle{top:6px!important;left:8px!important;z-index:10005!important}
        .wave.analyser-expanded .analyser-expand-btn{top:5px!important;left:auto!important;right:8px!important;z-index:10005!important}
        .wave.analyser-expanded .analyser-glide-readout{right:76px!important;top:7px!important;z-index:10005!important}
        .analyser-resize-hint{display:none}
        .wave.analyser-expanded .analyser-resize-hint{display:block;position:absolute;left:8px;right:8px;bottom:68px;z-index:65;color:#6ba99e;font:600 7px monospace;letter-spacing:.06em;text-align:center;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wave.analyser-expanded:after{content:'↘';position:absolute;right:3px;bottom:1px;z-index:80;color:#79eadb;font:700 12px monospace;pointer-events:none;opacity:.8}
        @media(max-width:620px){.wave.analyser-expanded{min-width:250px!important;min-height:190px!important}.wave.analyser-expanded .analyser-float-bar{height:31px;padding-left:90px;padding-right:126px;font-size:6px!important}.wave.analyser-expanded h2{margin-top:33px!important;font-size:7px!important}.analyser-expand-btn{left:96px;padding:3px 5px;font-size:6px}.wave.analyser-expanded .analyser-expand-btn{right:5px!important}.wave.analyser-expanded .analyser-glide-readout{right:60px!important;top:6px!important;font-size:6px!important}.wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{top:52px!important;bottom:62px!important}.wave.analyser-expanded .signals{height:52px!important}.wave.analyser-expanded .analyser-resize-hint{bottom:58px!important;font-size:6px!important}}
      `;
      d.head.appendChild(style);

      const btn=d.createElement('button');btn.type='button';btn.className='analyser-expand-btn';btn.textContent='FLOAT';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Float analyser over terminal viewport');wave.appendChild(btn);
      const floatBar=d.createElement('div');floatBar.className='analyser-float-bar';floatBar.setAttribute('role','presentation');floatBar.textContent='DRAG ANALYSER WINDOW';wave.appendChild(floatBar);
      const hint=d.createElement('span');hint.className='analyser-resize-hint';hint.textContent='DRAG TOP BAR = MOVE · DRAG SIGNAL = ORBIT · SIGNAL MOD = SCULPT · WHEEL/PINCH = DEPTH';wave.appendChild(hint);

      let saved=null;
      const notifyResize=()=>{try{w.dispatchEvent(new Event('resize'))}catch(_){}};
      const viewportBounds=()=>({width:Math.max(1,w.innerWidth),height:Math.max(1,w.innerHeight)});
      const clampPosition=()=>{
        if(!wave.classList.contains('analyser-expanded'))return;
        const r=wave.getBoundingClientRect(),vp=viewportBounds();
        const maxL=Math.max(4,vp.width-r.width-4),maxT=Math.max(4,vp.height-r.height-4);
        const left=Math.min(Math.max(4,Number.isFinite(parseFloat(wave.style.left))?parseFloat(wave.style.left):r.left),maxL);
        const top=Math.min(Math.max(4,Number.isFinite(parseFloat(wave.style.top))?parseFloat(wave.style.top):r.top),maxT);
        wave.style.left=`${left}px`;wave.style.top=`${top}px`;
      };
      const setExpanded=on=>{
        if(on){
          const r=wave.getBoundingClientRect(),vp=viewportBounds();
          saved={left:wave.style.left,top:wave.style.top,width:wave.style.width,height:wave.style.height};
          const width=Math.min(Math.max(r.width*1.55,560),Math.max(320,vp.width-24)),height=Math.min(Math.max(r.height*2.1,340),Math.max(220,vp.height-24));
          wave.classList.add('analyser-expanded');wave.style.width=`${width}px`;wave.style.height=`${height}px`;wave.style.left=`${Math.max(4,(vp.width-width)/2)}px`;wave.style.top=`${Math.max(4,(vp.height-height)/2)}px`;
          btn.textContent='RESTORE';btn.setAttribute('aria-expanded','true');btn.setAttribute('aria-label','Restore analyser to deck');clampPosition();
        } else {
          wave.classList.remove('analyser-expanded','analyser-moving');wave.style.left=saved?.left||'';wave.style.top=saved?.top||'';wave.style.width=saved?.width||'';wave.style.height=saved?.height||'';
          btn.textContent='FLOAT';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Float analyser over terminal viewport');
        }
        notifyResize();
      };
      btn.addEventListener('pointerdown',e=>e.stopPropagation());btn.addEventListener('click',e=>{e.stopPropagation();setExpanded(!wave.classList.contains('analyser-expanded'))});

      const beginMove=e=>{
        if(!wave.classList.contains('analyser-expanded')||(e.button!==undefined&&e.button!==0))return;
        e.preventDefault();e.stopPropagation();
        const r=wave.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
        wave.classList.add('analyser-moving');
        try{floatBar.setPointerCapture(e.pointerId)}catch(_){}
        const move=ev=>{
          const vp=viewportBounds(),maxL=Math.max(4,vp.width-wave.offsetWidth-4),maxT=Math.max(4,vp.height-wave.offsetHeight-4);
          wave.style.left=`${Math.min(Math.max(4,ev.clientX-dx),maxL)}px`;wave.style.top=`${Math.min(Math.max(4,ev.clientY-dy),maxT)}px`;
        };
        const end=ev=>{
          wave.classList.remove('analyser-moving');
          try{floatBar.releasePointerCapture(ev.pointerId)}catch(_){}
          floatBar.removeEventListener('pointermove',move);floatBar.removeEventListener('pointerup',end);floatBar.removeEventListener('pointercancel',end);
        };
        floatBar.addEventListener('pointermove',move);floatBar.addEventListener('pointerup',end);floatBar.addEventListener('pointercancel',end);
      };
      floatBar.addEventListener('pointerdown',beginMove);

      if(w.ResizeObserver){new w.ResizeObserver(()=>{if(wave.classList.contains('analyser-expanded')){clampPosition();notifyResize()}}).observe(wave)}
      w.addEventListener('resize',()=>{clampPosition();notifyResize()});d.addEventListener('keydown',e=>{if(e.key==='Escape'&&wave.classList.contains('analyser-expanded'))setExpanded(false)});
      return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserExpandOverlay=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
