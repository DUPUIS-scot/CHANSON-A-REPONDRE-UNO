(()=>{'use strict';
  const VERSION='v1', clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function install(host){
    try{
      const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
      if(!d||!w)return false;
      if(d.documentElement.dataset.twoMix===VERSION)return true;
      d.documentElement.dataset.twoMix=VERSION;
      const style=d.createElement('style');style.id='two-mix-style';style.textContent=
        '.two-mix-toggle{border-color:#f0c97e!important;color:#f7d88f!important;background:#160f05!important}.two-mix-toggle.active{background:#f0c97e!important;color:#160b02!important;box-shadow:0 0 18px #f0c97e99!important}.two-mix-status{font:800 8px/1 ui-monospace,monospace;color:#9eece9;letter-spacing:.08em;white-space:nowrap}.two-mix-overlay{position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:none}.two-mix-overlay.active{display:block}.two-mix-pointer{position:fixed;width:18px;height:18px;border-radius:50% 50% 50% 4px;transform:translate3d(-50%,-50%,0) rotate(-45deg);border:2px solid currentColor;box-shadow:0 0 14px currentColor;background:#06110dcc;will-change:transform;display:grid;place-items:center;font:900 7px/1 ui-monospace,monospace}.two-mix-pointer span{transform:rotate(45deg)}.two-mix-pointer.a{color:#f0c97e}.two-mix-pointer.b{color:#63f5cf}.two-mix-help{position:fixed;right:12px;bottom:10px;padding:5px 7px;border:1px solid #315b56;background:#020706dd;color:#a9eee7;font:800 7px/1.35 ui-monospace,monospace;border-radius:3px}';
      d.head.appendChild(style);
      const header=d.querySelector('header')||d.body;
      const toggle=d.createElement('button');toggle.type='button';toggle.className='btn two-mix-toggle';toggle.textContent='CHANSON A REPONDRE UNO';toggle.title='Enable 2MIX virtual pointer performance routing';
      const status=d.createElement('output');status.className='two-mix-status';status.textContent='2MIX OFF';
      header.append(toggle,status);
      const overlay=d.createElement('div');overlay.className='two-mix-overlay';overlay.innerHTML='<div class="two-mix-pointer a"><span>A</span></div><div class="two-mix-pointer b"><span>B</span></div><div class="two-mix-help">A: PLATTER · B: FX PAD<br>DRAG = BOTH · SHIFT = WIDTH · ALT = ROTATE<br>WHEEL = FINE · RIGHT-CLICK / ESC = RELEASE</div>';d.body.appendChild(overlay);
      const pa=overlay.querySelector('.a'),pb=overlay.querySelector('.b');
      const platter=d.querySelector('.platter'),pad=d.getElementById('xyPad'),pitch=d.getElementById('pitch'),audio=d.getElementById('audio');
      const state={on:false,armed:false,last:null,a:{x:0,y:0},b:{x:0,y:0},sep:220,angle:0,padX:.5,padY:.5,pitch:Number(pitch?.value||0)};
      const place=()=>{pa.style.left=state.a.x+'px';pa.style.top=state.a.y+'px';pb.style.left=state.b.x+'px';pb.style.top=state.b.y+'px'};
      const seed=()=>{const ar=platter?.getBoundingClientRect(),br=pad?.getBoundingClientRect();state.a.x=ar?ar.left+ar.width/2:w.innerWidth*.38;state.a.y=ar?ar.top+ar.height/2:w.innerHeight*.55;state.b.x=br?br.left+br.width/2:w.innerWidth*.66;state.b.y=br?br.top+br.height/2:w.innerHeight*.62;state.sep=Math.hypot(state.b.x-state.a.x,state.b.y-state.a.y);state.angle=Math.atan2(state.b.y-state.a.y,state.b.x-state.a.x);place()};
      const setPitch=delta=>{if(!pitch)return;state.pitch=clamp(state.pitch+delta,-12,12);pitch.value=String(state.pitch);pitch.dispatchEvent(new w.Event('input',{bubbles:true}));};
      const applyPad=()=>{const r=pad?.getBoundingClientRect();if(r){state.padX=clamp((state.b.x-r.left)/Math.max(1,r.width),0,1);state.padY=clamp(1-(state.b.y-r.top)/Math.max(1,r.height),0,1)}const api=w.__enochPadFxAuthorityV2;if(api?.apply){void api.apply(api.mode||'phaser',state.padX,state.padY)}else if(pad){const dot=d.getElementById('padDot'),readout=d.getElementById('padReadout');if(dot){dot.style.left=(state.padX*100)+'%';dot.style.top=((1-state.padY)*100)+'%'}if(readout)readout.textContent='X '+Math.round(state.padX*100)+' · Y '+Math.round(state.padY*100)}};
      const paint=()=>{overlay.classList.toggle('active',state.on);toggle.classList.toggle('active',state.on);status.textContent=state.on?(state.armed?'2MIX ARMED · A PLATTER / B FX PAD':'2MIX READY · A PLATTER / B FX PAD'):'2MIX OFF';};
      const disable=()=>{state.on=false;state.armed=false;state.last=null;paint()};
      const enable=()=>{state.on=true;seed();paint()};
      toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();state.on?disable():enable()});
      d.addEventListener('pointerdown',e=>{if(!state.on||e.button!==0||!e.target.closest('.stage'))return;state.armed=true;state.last={x:e.clientX,y:e.clientY};try{d.documentElement.setPointerCapture?.(e.pointerId)}catch(_){};paint();e.preventDefault()},{capture:true});
      d.addEventListener('pointermove',e=>{if(!state.on)return;const dx=Number(e.movementX)||0,dy=Number(e.movementY)||0;if(!dx&&!dy)return;if(!state.armed){state.a.x=clamp(state.a.x+dx,0,w.innerWidth);state.a.y=clamp(state.a.y+dy,0,w.innerHeight);state.b.x=clamp(state.b.x+dx,0,w.innerWidth);state.b.y=clamp(state.b.y+dy,0,w.innerHeight);place();return}if(e.shiftKey){state.sep=clamp(state.sep+dx*1.8,56,Math.max(w.innerWidth,w.innerHeight));state.b.x=state.a.x+Math.cos(state.angle)*state.sep;state.b.y=state.a.y+Math.sin(state.angle)*state.sep}else if(e.altKey){state.angle+=dx*.012;state.b.x=state.a.x+Math.cos(state.angle)*state.sep;state.b.y=state.a.y+Math.sin(state.angle)*state.sep}else{state.a.x=clamp(state.a.x+dx,0,w.innerWidth);state.a.y=clamp(state.a.y+dy,0,w.innerHeight);state.b.x=clamp(state.b.x+dx,0,w.innerWidth);state.b.y=clamp(state.b.y+dy,0,w.innerHeight)}place();setPitch(dx*.025);applyPad();e.preventDefault()},{capture:true});
      const release=e=>{if(!state.on)return;state.armed=false;state.last=null;paint();if(e?.type==='contextmenu')e.preventDefault()};d.addEventListener('pointerup',release,{capture:true});d.addEventListener('pointercancel',release,{capture:true});d.addEventListener('contextmenu',release,{capture:true});
      d.addEventListener('wheel',e=>{if(!state.on||!e.target.closest('.stage'))return;setPitch(-e.deltaY*.006);state.padY=clamp(state.padY-e.deltaY*.001,0,1);applyPad();e.preventDefault()},{capture:true,passive:false});
      d.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.on){disable();e.preventDefault()}},{capture:true});
      w.__enochTwoMix={version:VERSION,enable,disable,get state(){return {...state}}};seed();paint();return true;
    }catch(_){return false}
  }
  window.installEnochianTwoMix=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();