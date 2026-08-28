(()=>{
  'use strict';
  const VERSION='v1',STORE='doubleJesterPortalSpinnerSizeV1',RATE=.82;

  function install(host){
    try{
      const live=host?.contentDocument,deck=live?.getElementById('deck'),inner=deck?.contentDocument;
      const panel=document.getElementById('doubleDeckerSpecial');
      const shield=document.getElementById('doubleJeckerShield');
      if(!inner||!panel||!shield)return false;
      if(shield.dataset.portalSpinner===VERSION)return true;
      shield.dataset.portalSpinner=VERSION;
      panel.classList.add('jester-mirror-format');
      shield.style.setProperty('--j2-portal-rate',`${(Math.PI*2/RATE).toFixed(3)}s`);

      let style=document.getElementById('double-jester-portal-spinner-v1-style');
      style?.remove();
      style=document.createElement('style');
      style.id='double-jester-portal-spinner-v1-style';
      style.textContent=`
        #doubleJeckerShield{width:var(--j2-size,150px)!important;height:var(--j2-size,150px)!important;min-width:112px!important;min-height:112px!important;max-width:min(38vmin,360px)!important;max-height:min(38vmin,360px)!important;overflow:visible!important}
        #doubleJeckerShield:not(.panel-open) .djs-platter{animation:djs-portal-y-axis var(--j2-portal-rate) linear infinite!important;animation-play-state:running!important}
        #doubleJeckerShield.panel-open .djs-platter,#doubleJeckerShield.panel-open::before,#doubleJeckerShield.panel-open::after{animation-play-state:paused!important}
        @keyframes djs-portal-y-axis{to{transform:rotate(360deg)}}
        #doubleDeckerSpecial.jecker-radial.jester-mirror-format{background:radial-gradient(ellipse at 31% 21%,rgba(197,235,245,.19) 0 2%,transparent 8%),radial-gradient(ellipse at 69% 75%,rgba(51,123,147,.26) 0 5%,transparent 22%),radial-gradient(circle at 50% 50%,#132d38 0 22%,#071116 38%,#020608 63%,#151716 64%,#020405 74%,#010203 100%)!important;box-shadow:inset 0 0 0 2px #8bc4d1,inset 0 0 0 7px #10191d,inset 0 0 0 10px #b98939,inset 0 0 52px #000,0 18px 56px #000d!important}
        #doubleJeckerShield .djs-resize-handle{position:absolute;right:-4px;bottom:-4px;width:18px;height:18px;border:1px solid #f3b542;border-radius:50%;z-index:30;background:#061018;box-shadow:0 0 8px #28dcff,0 0 12px #ff9b24;cursor:nwse-resize;touch-action:none}
        #doubleJeckerShield .djs-resize-handle::before,#doubleJeckerShield .djs-resize-handle::after{content:'';position:absolute;background:#f3b542;opacity:.9}#doubleJeckerShield .djs-resize-handle::before{width:8px;height:1px;left:4px;top:8px}#doubleJeckerShield .djs-resize-handle::after{width:1px;height:8px;left:8px;top:4px}
        @media(max-width:720px){#doubleJeckerShield{width:var(--j2-size,112px)!important;height:var(--j2-size,112px)!important}}
      `;
      document.head.appendChild(style);

      const saved=Number.parseFloat(localStorage.getItem(STORE)||'');
      if(Number.isFinite(saved))shield.style.setProperty('--j2-size',`${Math.max(112,Math.min(360,saved))}px`);
      let handle=shield.querySelector('.djs-resize-handle');
      if(!handle){handle=document.createElement('i');handle.className='djs-resize-handle';handle.setAttribute('aria-hidden','true');shield.appendChild(handle)}
      let resize=null;
      const clamp=size=>Math.max(112,Math.min(Math.min(innerWidth,innerHeight)*.38,360,size));
      handle.addEventListener('pointerdown',event=>{
        event.preventDefault();event.stopImmediatePropagation();
        const rect=shield.getBoundingClientRect();resize={id:event.pointerId,x:event.clientX,y:event.clientY,size:rect.width};
        try{handle.setPointerCapture(event.pointerId)}catch(_){}
      });
      handle.addEventListener('pointermove',event=>{
        if(!resize||resize.id!==event.pointerId)return;
        event.preventDefault();event.stopImmediatePropagation();
        const size=clamp(resize.size+Math.max(event.clientX-resize.x,event.clientY-resize.y));
        shield.style.setProperty('--j2-size',`${size}px`);
      });
      const finish=event=>{
        if(!resize||resize.id!==event.pointerId)return;
        const size=shield.getBoundingClientRect().width;resize=null;
        try{localStorage.setItem(STORE,String(Math.round(size)));handle.releasePointerCapture(event.pointerId)}catch(_){}
      };
      handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
      const onResize=()=>{const size=shield.getBoundingClientRect().width;if(size>clamp(size))shield.style.setProperty('--j2-size',`${clamp(size)}px`)};
      window.addEventListener('resize',onResize);
      inner.defaultView.__enochDoubleJesterPortalSpinner={version:VERSION,rate:RATE,secondsPerTurn:Math.PI*2/RATE,shield};
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJesterPortalSpinnerV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
