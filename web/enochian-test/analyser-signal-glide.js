(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const wave=d&&d.querySelector('.wave'),canvas=d&&d.getElementById('wave');
      if(!d||!w||!wave||!canvas)return false;
      if(d.documentElement.dataset.analyserSignalGlide==='v2')return true;
      d.documentElement.dataset.analyserSignalGlide='v2';
      const style=d.createElement('style');style.textContent=`.wave{cursor:grab!important;touch-action:none!important;user-select:none!important}.wave.analyser-signal-dragging{cursor:grabbing!important}.wave canvas,.analyser-3d{will-change:transform!important;transform-origin:50% 50%!important;pointer-events:none!important}.analyser-glide-readout{position:absolute;right:8px;top:5px;z-index:64;font-size:7px;letter-spacing:.12em;color:#d5aa63;background:#020706cc;border:1px solid #315b56;border-radius:4px;padding:3px 5px;pointer-events:none;white-space:nowrap}`;d.head.appendChild(style);
      let readout=wave.querySelector('.analyser-glide-readout');if(!readout){readout=d.createElement('div');readout.className='analyser-glide-readout';wave.appendChild(readout)}
      const state=w.__enochAnalyserGesture||{};Object.assign(state,{x:state.x||0,y:state.y||0,vx:0,vy:0,dragging:false});w.__enochAnalyserGesture=state;
      let id=null,lx=0,ly=0,lt=0,raf=0;
      const limits=()=>({x:Math.max(28,wave.clientWidth*.32),y:Math.max(18,wave.clientHeight*.28)});
      const render=()=>{const scaleY=clamp(1-state.y/220,.7,1.4),tr=`translate3d(${state.x}px,${state.y}px,0) scaleY(${scaleY})`;canvas.style.transform=tr;const c3=wave.querySelector('.analyser-3d');if(c3)c3.style.transform=tr;const speed=Math.hypot(state.vx,state.vy);readout.textContent=state.dragging?'3D SIGNAL · DRAG':speed>.06?'3D SIGNAL · GLIDE':'3D SIGNAL · LIVE'};
      const stop=()=>{if(raf){w.cancelAnimationFrame(raf);raf=0}};
      const glide=()=>{if(state.dragging){raf=0;return}const m=limits();state.x+=state.vx*16.67;state.y+=state.vy*16.67;if(Math.abs(state.x)>m.x){state.x=clamp(state.x,-m.x,m.x);state.vx*=-.3}if(Math.abs(state.y)>m.y){state.y=clamp(state.y,-m.y,m.y);state.vy*=-.3}state.vx*=.945;state.vy*=.945;if(Math.abs(state.vx)<.012)state.vx=0;if(Math.abs(state.vy)<.012)state.vy=0;render();if(state.vx||state.vy)raf=w.requestAnimationFrame(glide);else raf=0};
      wave.addEventListener('pointerdown',e=>{if(e.target.closest('button,input,textarea,select'))return;if(e.button!==undefined&&e.button!==0)return;stop();id=e.pointerId;state.dragging=true;state.vx=state.vy=0;lx=e.clientX;ly=e.clientY;lt=performance.now();wave.classList.add('analyser-signal-dragging');try{wave.setPointerCapture(id)}catch(_){}render()});
      wave.addEventListener('pointermove',e=>{if(!state.dragging||e.pointerId!==id)return;const now=performance.now(),dt=Math.max(8,now-lt),dx=e.clientX-lx,dy=e.clientY-ly,m=limits();state.x=clamp(state.x+dx,-m.x,m.x);state.y=clamp(state.y+dy,-m.y,m.y);state.vx=state.vx*.48+(dx/dt)*.52;state.vy=state.vy*.48+(dy/dt)*.52;lx=e.clientX;ly=e.clientY;lt=now;render()});
      const release=e=>{if(!state.dragging||(e&&e.pointerId!==id))return;state.dragging=false;wave.classList.remove('analyser-signal-dragging');try{if(id!==null&&wave.hasPointerCapture(id))wave.releasePointerCapture(id)}catch(_){}id=null;render();if(Math.abs(state.vx)>.012||Math.abs(state.vy)>.012)raf=w.requestAnimationFrame(glide)};
      wave.addEventListener('pointerup',release);wave.addEventListener('pointercancel',release);wave.addEventListener('lostpointercapture',()=>release());wave.addEventListener('dblclick',e=>{if(e.target.closest('button'))return;stop();state.x=state.y=state.vx=state.vy=0;render()});render();return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserSignalGlide=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();