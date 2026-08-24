(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function install(frame){
    try{
      const live=frame.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      const w=d&&d.defaultView;
      const canvas=d&&d.getElementById('wave');
      const wave=canvas&&canvas.closest('.wave');
      if(!d||!w||!canvas||!wave)return false;
      if(d.documentElement.dataset.analyserSignalGlide==='v1')return true;
      d.documentElement.dataset.analyserSignalGlide='v1';

      const style=d.createElement('style');
      style.textContent=`
        .wave{cursor:grab!important;touch-action:none!important;user-select:none!important}
        .wave.analyser-dragging{cursor:grabbing!important}
        .wave canvas{will-change:transform!important;transform-origin:50% 50%!important;pointer-events:none!important}
        .analyser-glide-readout{position:absolute;right:8px;top:5px;z-index:5;font-size:7px;letter-spacing:.12em;color:#d5aa63;background:#020706cc;border:1px solid #315b56;border-radius:4px;padding:3px 5px;pointer-events:none;white-space:nowrap}
      `;
      d.head.appendChild(style);

      const readout=d.createElement('div');
      readout.className='analyser-glide-readout';
      readout.textContent='SIGNAL · LIVE';
      wave.appendChild(readout);

      const state=w.__enochAnalyserGesture={x:0,y:0,vx:0,vy:0,dragging:false};
      let pointerId=null,lastX=0,lastY=0,lastT=0,raf=0;

      const render=()=>{
        const scaleY=clamp(1-state.y/180,.72,1.35);
        canvas.style.transform=`translate3d(${state.x}px,${state.y}px,0) scaleY(${scaleY})`;
        const speed=Math.hypot(state.vx,state.vy);
        readout.textContent=state.dragging?'SIGNAL · DRAG':speed>.08?'SIGNAL · GLIDE':'SIGNAL · LIVE';
      };

      const stopMomentum=()=>{if(raf){cancelAnimationFrame(raf);raf=0}};
      const glide=()=>{
        if(state.dragging){raf=0;return}
        state.x+=state.vx*16.6667;
        state.y+=state.vy*16.6667;
        const maxX=Math.max(24,wave.clientWidth*.28),maxY=Math.max(16,wave.clientHeight*.22);
        if(Math.abs(state.x)>maxX){state.x=clamp(state.x,-maxX,maxX);state.vx*=-.35}
        if(Math.abs(state.y)>maxY){state.y=clamp(state.y,-maxY,maxY);state.vy*=-.35}
        state.vx*=.94;state.vy*=.94;
        if(Math.abs(state.vx)<.015)state.vx=0;
        if(Math.abs(state.vy)<.015)state.vy=0;
        render();
        if(state.vx||state.vy)raf=requestAnimationFrame(glide);else raf=0;
      };

      wave.addEventListener('pointerdown',e=>{
        if(e.button!==undefined&&e.button!==0)return;
        stopMomentum();
        pointerId=e.pointerId;state.dragging=true;state.vx=state.vy=0;
        lastX=e.clientX;lastY=e.clientY;lastT=performance.now();
        wave.classList.add('analyser-dragging');
        try{wave.setPointerCapture(pointerId)}catch(_){}
        render();
      });
      wave.addEventListener('pointermove',e=>{
        if(!state.dragging||e.pointerId!==pointerId)return;
        const now=performance.now(),dt=Math.max(8,now-lastT),dx=e.clientX-lastX,dy=e.clientY-lastY;
        const maxX=Math.max(24,wave.clientWidth*.28),maxY=Math.max(16,wave.clientHeight*.22);
        state.x=clamp(state.x+dx,-maxX,maxX);
        state.y=clamp(state.y+dy,-maxY,maxY);
        const ivx=dx/dt,ivy=dy/dt;
        state.vx=state.vx*.55+ivx*.45;state.vy=state.vy*.55+ivy*.45;
        lastX=e.clientX;lastY=e.clientY;lastT=now;
        render();
      });
      const release=e=>{
        if(!state.dragging||(e&&e.pointerId!==pointerId))return;
        state.dragging=false;wave.classList.remove('analyser-dragging');
        try{if(pointerId!==null&&wave.hasPointerCapture(pointerId))wave.releasePointerCapture(pointerId)}catch(_){}
        pointerId=null;
        render();
        if(Math.abs(state.vx)>.015||Math.abs(state.vy)>.015)raf=requestAnimationFrame(glide);
      };
      wave.addEventListener('pointerup',release);
      wave.addEventListener('pointercancel',release);
      wave.addEventListener('lostpointercapture',()=>release());
      wave.addEventListener('dblclick',()=>{stopMomentum();state.x=state.y=state.vx=state.vy=0;render()});
      render();
      return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserSignalGlide=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();