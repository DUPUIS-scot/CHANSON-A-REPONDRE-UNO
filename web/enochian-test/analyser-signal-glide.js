(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const wave=d&&d.querySelector('.wave'),canvas=d&&d.getElementById('wave');
      if(!d||!w||!wave||!canvas)return false;
      if(d.documentElement.dataset.analyserSignalGlide==='v5')return true;
      d.documentElement.dataset.analyserSignalGlide='v5';

      const style=d.createElement('style');
      style.textContent=`
        .wave{cursor:grab!important;touch-action:none!important;user-select:none!important}
        .wave.analyser-signal-dragging{cursor:grabbing!important}
        .wave.analyser-signal-sculpting{cursor:crosshair!important}
        .wave canvas,.analyser-3d{will-change:contents!important;transform:none!important;pointer-events:none!important}
        .analyser-glide-readout{position:absolute;right:8px;top:5px;z-index:64;font-size:7px;letter-spacing:.12em;color:#d5aa63;background:#020706cc;border:1px solid #315b56;border-radius:4px;padding:3px 5px;pointer-events:none;white-space:nowrap}
        .signal-mod-toggle{position:absolute;left:8px;top:5px;z-index:65;min-height:20px!important;padding:3px 6px!important;font-size:7px!important;letter-spacing:.1em!important}
        .signal-mod-toggle.active{background:#083128!important;color:#63f5cf!important;border-color:#68d8bd!important;box-shadow:0 0 10px #40e6b433!important}
      `;
      d.head.appendChild(style);

      let readout=wave.querySelector('.analyser-glide-readout');
      if(!readout){readout=d.createElement('div');readout.className='analyser-glide-readout';wave.appendChild(readout)}
      let mod=d.getElementById('signalModToggle');
      if(!mod){mod=d.createElement('button');mod.id='signalModToggle';mod.type='button';mod.className='btn signal-mod-toggle';mod.setAttribute('aria-pressed','false');mod.textContent='SIGNAL MOD OFF';wave.appendChild(mod)}

      const prior=w.__enochAnalyserGesture||{};
      const state=w.__enochAnalyserGesture={
        version:'v5',dragging:false,mode:'view',pointerCount:0,x:0,y:0,vx:0,vy:0,
        view:Object.assign({yaw:0,pitch:0,zoom:1,yawV:0,pitchV:0},prior.view||{}),
        deform:Object.assign({grabBin:null,grabRow:null,pullY:0,pullZ:0,twist:0,radius:.22,strength:1,vY:0,vZ:0},prior.deform||{})
      };
      w.__enochSignalModulation=mod.getAttribute('aria-pressed')==='true'||w.__enochSignalModulation===true;

      const getModDepth=()=>clamp((parseFloat(d.getElementById('modWheelV')?.textContent||'0')||0)/100,0,1);
      const invalidate=()=>{try{w.__enochAnalyser3D?.invalidate?.()}catch(_){}};
      const syncCompat=()=>{
        state.x=state.view.yaw*Math.max(160,wave.clientWidth*.8);
        state.y=-state.view.pitch*Math.max(120,wave.clientHeight*.9);
        state.vx=state.view.yawV/.006;
        state.vy=-state.view.pitchV/.006;
      };
      const render=()=>{
        syncCompat();
        const speed=state.mode==='deform'?Math.hypot(state.deform.vY,state.deform.vZ):Math.hypot(state.view.yawV,state.view.pitchV);
        const modOn=w.__enochSignalModulation===true;
        const mode=state.dragging?(state.mode==='deform'?'SCULPT':'DRAG'):speed>.00008?(state.mode==='deform'?'SCULPT GLIDE':'GLIDE'):'LIVE';
        readout.textContent=`3D SIGNAL · ${mode} · Z${state.view.zoom.toFixed(2)}`+(modOn?` · MOD ${Math.round(getModDepth()*100)}%`:'');
        invalidate();
      };

      let raf=0;
      const stop=()=>{if(raf){w.cancelAnimationFrame(raf);raf=0}}
      const momentum=()=>{
        if(state.dragging){raf=0;return}
        if(state.mode==='deform'){
          state.deform.pullY=clamp(state.deform.pullY+state.deform.vY*16.67,-1.5,1.5);
          state.deform.pullZ=clamp(state.deform.pullZ+state.deform.vZ*16.67,-1.5,1.5);
          state.deform.twist=clamp(state.deform.twist+state.deform.vZ*7.5,-1.6,1.6);
          state.deform.vY*=.94;state.deform.vZ*=.94;
          if(Math.abs(state.deform.vY)<.00002)state.deform.vY=0;
          if(Math.abs(state.deform.vZ)<.00002)state.deform.vZ=0;
          render();
          if(state.deform.vY||state.deform.vZ)raf=w.requestAnimationFrame(momentum);else raf=0;
        }else{
          state.view.yaw=clamp(state.view.yaw+state.view.yawV*16.67,-1.15,1.15);
          state.view.pitch=clamp(state.view.pitch+state.view.pitchV*16.67,-.72,.72);
          state.view.yawV*=.945;state.view.pitchV*=.945;
          if(Math.abs(state.view.yawV)<.00002)state.view.yawV=0;
          if(Math.abs(state.view.pitchV)<.00002)state.view.pitchV=0;
          render();
          if(state.view.yawV||state.view.pitchV)raf=w.requestAnimationFrame(momentum);else raf=0;
        }
      };

      const pointers=new Map();
      let activeId=null,lx=0,ly=0,lt=0,pinchDistance=0,pinchZoom=1;
      const pointerDistance=()=>{const p=[...pointers.values()];return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};
      const beginMode=e=>{
        if(w.__enochSignalModulation===true){
          let picked=null;try{picked=w.__enochAnalyser3D?.pick?.(e.clientX,e.clientY)||null}catch(_){}
          state.mode='deform';
          if(picked){state.deform.grabBin=picked.bin;state.deform.grabRow=picked.row}else{state.deform.grabBin=null;state.deform.grabRow=0}
          state.deform.vY=state.deform.vZ=0;wave.classList.add('analyser-signal-sculpting');
        }else{state.mode='view';state.view.yawV=state.view.pitchV=0;wave.classList.remove('analyser-signal-sculpting')}
      };

      if(!mod.dataset.boundV5){
        mod.dataset.boundV5='1';mod.addEventListener('pointerdown',e=>e.stopPropagation());
        mod.addEventListener('click',e=>{e.stopPropagation();const on=mod.getAttribute('aria-pressed')!=='true';w.__enochSignalModulation=on;mod.classList.toggle('active',on);mod.setAttribute('aria-pressed',String(on));mod.textContent=on?'SIGNAL MOD ON':'SIGNAL MOD OFF';state.mode=on?'deform':'view';render()});
      }

      wave.addEventListener('pointerdown',e=>{
        if(e.target.closest('button,input,textarea,select')||e.button>0)return;
        stop();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});state.pointerCount=pointers.size;
        if(pointers.size===2){pinchDistance=Math.max(1,pointerDistance());pinchZoom=state.view.zoom;state.dragging=true;state.mode='pinch';render();return}
        activeId=e.pointerId;state.dragging=true;lx=e.clientX;ly=e.clientY;lt=performance.now();beginMode(e);wave.classList.add('analyser-signal-dragging');
        try{wave.setPointerCapture(activeId)}catch(_){}render();
      });
      wave.addEventListener('pointermove',e=>{
        if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});state.pointerCount=pointers.size;
        if(pointers.size>=2){const dist=Math.max(1,pointerDistance());state.mode='pinch';state.dragging=true;state.view.zoom=clamp(pinchZoom*(dist/pinchDistance),.55,2.6);render();return}
        if(!state.dragging||e.pointerId!==activeId)return;
        const now=performance.now(),dt=Math.max(8,now-lt),dx=e.clientX-lx,dy=e.clientY-ly;
        if(state.mode==='deform'){
          const sy=Math.max(120,wave.clientHeight),sx=Math.max(160,wave.clientWidth),dY=-dy/sy*1.8,dZ=dx/sx*1.8;
          state.deform.pullY=clamp(state.deform.pullY+dY,-1.5,1.5);state.deform.pullZ=clamp(state.deform.pullZ+dZ,-1.5,1.5);state.deform.twist=clamp(state.deform.twist+dZ*.55,-1.6,1.6);
          state.deform.vY=state.deform.vY*.45+(dY/dt)*.55;state.deform.vZ=state.deform.vZ*.45+(dZ/dt)*.55;
        }else{
          const dYaw=dx*.006,dPitch=dy*.005;state.view.yaw=clamp(state.view.yaw+dYaw,-1.15,1.15);state.view.pitch=clamp(state.view.pitch+dPitch,-.72,.72);state.view.yawV=state.view.yawV*.45+(dYaw/dt)*.55;state.view.pitchV=state.view.pitchV*.45+(dPitch/dt)*.55;
        }
        lx=e.clientX;ly=e.clientY;lt=now;render();
      });
      const release=e=>{
        pointers.delete(e.pointerId);state.pointerCount=pointers.size;
        if(pointers.size===1&&state.mode==='pinch'){const [id,p]=pointers.entries().next().value;activeId=id;lx=p.x;ly=p.y;lt=performance.now();state.mode=w.__enochSignalModulation===true?'deform':'view';return}
        if(pointers.size||!state.dragging)return;state.dragging=false;wave.classList.remove('analyser-signal-dragging','analyser-signal-sculpting');
        try{if(activeId!==null&&wave.hasPointerCapture(activeId))wave.releasePointerCapture(activeId)}catch(_){}activeId=null;render();
        const moving=state.mode==='deform'?(Math.abs(state.deform.vY)>.00002||Math.abs(state.deform.vZ)>.00002):(Math.abs(state.view.yawV)>.00002||Math.abs(state.view.pitchV)>.00002);if(moving)raf=w.requestAnimationFrame(momentum);
      };
      wave.addEventListener('pointerup',release);wave.addEventListener('pointercancel',release);wave.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))release(e)});
      wave.addEventListener('wheel',e=>{if(e.target.closest('button,input,textarea,select'))return;e.preventDefault();state.view.zoom=clamp(state.view.zoom*Math.exp(-e.deltaY*.0015),.55,2.6);render()},{passive:false});
      wave.addEventListener('dblclick',e=>{if(e.target.closest('button'))return;stop();state.view.yaw=state.view.pitch=0;state.view.zoom=1;state.view.yawV=state.view.pitchV=0;if(w.__enochSignalModulation===true)Object.assign(state.deform,{grabBin:null,grabRow:null,pullY:0,pullZ:0,twist:0,vY:0,vZ:0});render()});
      render();return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserSignalGlide=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();