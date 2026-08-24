(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument, deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument, w=d&&d.defaultView;
      const wave=d&&d.querySelector('.stage .wave'), stage=wave&&wave.closest('.stage');
      if(!d||!w||!wave||!stage)return false;
      if(d.documentElement.dataset.analyserExpandOverlay==='v4')return true;
      d.documentElement.dataset.analyserExpandOverlay='v4';
      const style=d.createElement('style');
      style.textContent=`
        .stage{position:relative!important}.analyser-expand-btn{position:absolute;left:8px;top:5px;z-index:10002;min-height:24px;padding:3px 7px;border:1px solid #315b56;border-radius:4px;background:#020706f2;color:#9dece0;font-size:7px;font-weight:800;letter-spacing:.12em;cursor:pointer;touch-action:manipulation}
        .wave.analyser-expanded{position:fixed!important;inset:0!important;left:0!important;top:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100dvh!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;z-index:9999!important;background:linear-gradient(180deg,#03100dfb,#010504fe)!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important;touch-action:none!important;cursor:grab!important;user-select:none!important}
        .wave.analyser-expanded.analyser-dragging{cursor:grabbing!important}.wave.analyser-expanded h2{margin:14px 110px 6px!important;font-size:clamp(10px,1.5vw,18px)!important;pointer-events:none}.wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{top:48px!important;bottom:92px!important;height:auto!important;width:calc(100% - 24px)!important;left:12px!important;right:12px!important}.wave.analyser-expanded #wave{opacity:.025!important}.wave.analyser-expanded .signals{left:12px!important;right:12px!important;bottom:12px!important;height:76px!important;z-index:8!important}.wave.analyser-expanded .analyser-glide-readout{right:12px!important;top:10px!important}.analyser-resize-hint{display:none}.analyser-expanded .analyser-resize-hint{display:block;position:absolute;right:12px;bottom:94px;z-index:65;color:#6ba99e;font:600 7px monospace;letter-spacing:.08em;pointer-events:none}
        @media(max-width:620px){.wave.analyser-expanded h2{margin-left:78px!important;margin-right:78px!important}.analyser-expand-btn{padding:3px 5px;font-size:6px}.wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{bottom:76px!important}.wave.analyser-expanded .signals{height:62px!important}.analyser-expanded .analyser-resize-hint{bottom:78px!important}}
      `;d.head.appendChild(style);
      const btn=d.createElement('button');btn.type='button';btn.className='analyser-expand-btn';btn.textContent='EXPAND';btn.setAttribute('aria-expanded','false');wave.appendChild(btn);
      const hint=d.createElement('span');hint.className='analyser-resize-hint';hint.textContent='DRAG SIGNAL · PINCH/WHEEL DEPTH';wave.appendChild(hint);
      const setExpanded=on=>{wave.classList.toggle('analyser-expanded',on);btn.textContent=on?'RESTORE':'EXPAND';btn.setAttribute('aria-expanded',String(on));try{w.dispatchEvent(new Event('resize'))}catch(_){}};
      btn.addEventListener('pointerdown',e=>e.stopPropagation());btn.addEventListener('click',e=>{e.stopPropagation();setExpanded(!wave.classList.contains('analyser-expanded'))});
      d.addEventListener('keydown',e=>{if(e.key==='Escape'&&wave.classList.contains('analyser-expanded'))setExpanded(false)});
      return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserExpandOverlay=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();