(()=>{
  const VERSION='v2';
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
      const raw=e.clientY-lastY;lastY=e.clientY;residual+=raw*0.55;
      if(Math.abs(residual)<1){e.stopImmediatePropagation();e.preventDefault();return}
      if(Math.abs(raw)<2.2){e.stopImmediatePropagation();e.preventDefault();return}
      residual=0;
    },{capture:true,passive:false});
    const end=e=>{if(active&&e.pointerId===pid){active=false;pid=null;residual=0}};
    el.addEventListener('pointerup',end,{capture:true});el.addEventListener('pointercancel',end,{capture:true});
  }
  function installStemMasterPanel(d){
    const isolator=d.querySelector('.stem-isolator'),button=d.getElementById('stemMasterToggle');
    if(!isolator||!button)return false;
    const title=isolator.querySelector('.stem-title');
    let slot=isolator.querySelector('.stem-master-slot');
    if(!slot){slot=d.createElement('div');slot.className='stem-master-slot';if(title)title.insertAdjacentElement('afterend',slot);else isolator.prepend(slot)}
    if(button.parentElement!==slot)slot.appendChild(button);
    button.classList.add('stem-master-in-panel');
    button.style.display='inline-flex';
    button.style.visibility='visible';
    button.style.opacity='1';
    return true;
  }
  function tune(frame){
    const d=innerDoc(frame);if(!d)return false;
    d.documentElement.dataset.iosTouchTuning=VERSION;
    const styleId='ios-touch-tuning-style';
    if(!d.getElementById(styleId)){
      const s=d.createElement('style');s.id=styleId;s.textContent=`
        .stem-master-slot{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important;min-width:0!important;margin:1px 0 3px!important;position:relative!important;z-index:6!important}
        #stemMasterToggle.stem-master-in-panel{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;min-height:32px!important;padding:7px 8px!important;margin:0!important;visibility:visible!important;opacity:1!important;position:relative!important;inset:auto!important;transform:none!important;white-space:nowrap!important;pointer-events:auto!important}
        html.terminal-fullscreen .stem-master-slot{margin:0 0 2px!important}
        html.terminal-fullscreen #stemMasterToggle.stem-master-in-panel{min-height:26px!important;padding:4px 5px!important;font-size:7px!important}
        @media (pointer:coarse){.range{min-height:44px}.wheel{touch-action:none}.wheelbox{position:relative}.wheelbox:has(.wheel)::after{content:"";position:absolute;inset:-6px;pointer-events:none}.xy-pad{touch-action:none}.instant-fx-btn,.btn{touch-action:manipulation}#stemMasterToggle.stem-master-in-panel{min-height:40px!important;touch-action:manipulation!important}}
      `;d.head.appendChild(s);
    }
    installStemMasterPanel(d);
    d.querySelectorAll('input[type="range"]').forEach(installRange);
    d.querySelectorAll('.wheel').forEach(installWheel);
    return true;
  }
  window.installEnochianIOSTouchTuning=function(frame){let n=0;const run=()=>{if(tune(frame)||++n>160)return;setTimeout(run,50)};run()};
})();
