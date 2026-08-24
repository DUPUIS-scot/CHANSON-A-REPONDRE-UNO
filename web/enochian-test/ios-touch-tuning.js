(()=>{
  const VERSION='v1';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function innerDoc(frame){try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}}
  function fireInput(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
  function installRange(el){
    if(!el||el.dataset.iosTouchTune===VERSION)return;
    el.dataset.iosTouchTune=VERSION;
    let active=false,startX=0,startY=0,startV=0,pid=null;
    el.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='touch')return;
      active=true;pid=e.pointerId;startX=e.clientX;startY=e.clientY;startV=Number(el.value);
      try{el.setPointerCapture(pid)}catch(_){}
      e.preventDefault();
    },{passive:false});
    el.addEventListener('pointermove',e=>{
      if(!active||e.pointerId!==pid||e.pointerType!=='touch')return;
      const min=Number(el.min||0),max=Number(el.max||100),span=max-min;
      const r=el.getBoundingClientRect();
      const vertical=el.classList.contains('mixer-level-range')&&r.height>r.width*1.5;
      const travel=Math.max(80,vertical?r.height:r.width);
      const delta=vertical?(startY-e.clientY):(e.clientX-startX);
      // Sliders remain direct but slightly damped for deliberate iOS adjustment.
      const sensitivity=el.id==='pitch'?0.72:0.86;
      el.value=String(clamp(startV+(delta/travel)*span*sensitivity,min,max));
      fireInput(el);e.preventDefault();
    },{passive:false});
    const end=e=>{if(active&&e.pointerId===pid){active=false;try{el.releasePointerCapture(pid)}catch(_){}e.preventDefault()}};
    el.addEventListener('pointerup',end,{passive:false});el.addEventListener('pointercancel',end,{passive:false});
  }
  function installWheel(el){
    if(!el||el.dataset.iosTouchTune===VERSION)return;
    el.dataset.iosTouchTune=VERSION;
    let active=false,pid=null,lastY=0,residual=0;
    el.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;active=true;pid=e.pointerId;lastY=e.clientY;residual=0;try{el.setPointerCapture(pid)}catch(_){};e.preventDefault()},{capture:true,passive:false});
    el.addEventListener('pointermove',e=>{
      if(!active||e.pointerId!==pid||e.pointerType!=='touch')return;
      // Feed the existing wheel handler smaller synthetic movement: about 55% sensitivity.
      const raw=e.clientY-lastY;lastY=e.clientY;residual+=raw*0.55;
      if(Math.abs(residual)<1){e.stopImmediatePropagation();e.preventDefault();return}
      // Existing wheel logic receives fewer move events, giving finer control without changing its audio mapping.
      if(Math.abs(raw)<2.2){e.stopImmediatePropagation();e.preventDefault();return}
      residual=0;
    },{capture:true,passive:false});
    const end=e=>{if(active&&e.pointerId===pid){active=false;pid=null;residual=0}};
    el.addEventListener('pointerup',end,{capture:true});el.addEventListener('pointercancel',end,{capture:true});
  }
  function tune(frame){
    const d=innerDoc(frame);if(!d)return false;
    d.documentElement.dataset.iosTouchTuning=VERSION;
    const styleId='ios-touch-tuning-style';
    if(!d.getElementById(styleId)){
      const s=d.createElement('style');s.id=styleId;s.textContent=`@media (pointer:coarse){.range{min-height:44px}.wheel{touch-action:none}.wheelbox{position:relative}.wheelbox:has(.wheel)::after{content:"";position:absolute;inset:-6px;pointer-events:none}.xy-pad{touch-action:none}.instant-fx-btn,.btn{touch-action:manipulation}}`;d.head.appendChild(s);
    }
    d.querySelectorAll('input[type="range"]').forEach(installRange);
    d.querySelectorAll('.wheel').forEach(installWheel);
    return true;
  }
  window.installEnochianIOSTouchTuning=function(frame){let n=0;const run=()=>{if(tune(frame)||++n>160)return;setTimeout(run,50)};run()};
})();
