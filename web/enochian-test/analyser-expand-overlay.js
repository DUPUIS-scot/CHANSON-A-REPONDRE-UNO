(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      const w=d&&d.defaultView;
      const wave=d&&d.querySelector('.stage .wave');
      const stage=wave&&wave.closest('.stage');
      if(!d||!w||!wave||!stage)return false;
      if(d.documentElement.dataset.analyserExpandOverlay==='v1')return true;
      d.documentElement.dataset.analyserExpandOverlay='v1';

      const style=d.createElement('style');
      style.textContent=`
        .stage{position:relative!important}
        .analyser-expand-btn{position:absolute;left:8px;top:5px;z-index:12;min-height:24px;padding:3px 7px;border:1px solid #315b56;border-radius:4px;background:#020706e8;color:#9dece0;font-size:7px;font-weight:800;letter-spacing:.12em;cursor:pointer;touch-action:manipulation}
        .analyser-expand-btn:hover,.analyser-expand-btn:focus-visible{border-color:#68d8bd;color:#d7fff8;outline:none}
        .wave.analyser-expanded{position:absolute!important;inset:5px!important;width:auto!important;height:auto!important;min-height:0!important;z-index:40!important;background:linear-gradient(180deg,#03100dF2,#010504FA)!important;border-color:#68d8bd!important;box-shadow:0 0 0 1px #17332e,0 12px 40px #000d!important}
        .wave.analyser-expanded h2{margin:8px 86px 6px!important;font-size:9px!important}
        .wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{top:38px!important;bottom:66px!important;height:auto!important;width:calc(100% - 16px)!important}
        .wave.analyser-expanded #wave{opacity:.035!important}
        .wave.analyser-expanded .signals{bottom:7px!important;z-index:8!important}
        .wave.analyser-expanded .analyser-glide-readout{right:8px!important;top:5px!important}
        html.terminal-fullscreen .wave.analyser-expanded{inset:4px!important}
        @media(max-width:620px){.wave.analyser-expanded h2{margin-left:74px!important;margin-right:74px!important;letter-spacing:.14em!important}.analyser-expand-btn{padding:3px 5px;font-size:6px}.wave.analyser-expanded #wave,.wave.analyser-expanded .analyser-3d{bottom:60px!important}}
      `;
      d.head.appendChild(style);

      const btn=d.createElement('button');
      btn.type='button';
      btn.className='analyser-expand-btn';
      btn.textContent='EXPAND';
      btn.setAttribute('aria-expanded','false');
      btn.setAttribute('aria-label','Expand analyser over turntable');
      wave.appendChild(btn);

      const setExpanded=on=>{
        wave.classList.toggle('analyser-expanded',on);
        btn.textContent=on?'RESTORE':'EXPAND';
        btn.setAttribute('aria-expanded',String(on));
        btn.setAttribute('aria-label',on?'Restore analyser size':'Expand analyser over turntable');
        try{w.dispatchEvent(new Event('resize'))}catch(_){}
      };

      btn.addEventListener('pointerdown',e=>e.stopPropagation());
      btn.addEventListener('click',e=>{e.stopPropagation();setExpanded(!wave.classList.contains('analyser-expanded'))});
      wave.addEventListener('keydown',e=>{if(e.key==='Escape'&&wave.classList.contains('analyser-expanded')){e.preventDefault();setExpanded(false)}});
      return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserExpandOverlay=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();