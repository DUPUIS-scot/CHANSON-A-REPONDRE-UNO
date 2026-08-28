(()=>{
'use strict';
const VERSION='v1';
function install(frame){
  try{
    const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
    if(!d||!w)return false;
    if(d.documentElement.dataset.twoMixLiveContextHelp===VERSION)return true;
    const toggle=d.getElementById('twoMixToggle');
    if(!toggle)return false;
    d.getElementById('two-mix-live-context-help-style')?.remove();
    d.getElementById('twoMixUsbHelp')?.remove();
    const style=d.createElement('style');
    style.id='two-mix-live-context-help-style';
    style.textContent=`
#twoMixCursorHelp{display:none!important}
#twoMixUsbHelp{position:fixed!important;z-index:2147483003!important;left:0;top:0;display:none;max-width:300px;padding:6px 8px;border:1px solid #63f5cf;border-radius:5px 5px 5px 1px;background:#03110ff2;color:#c9fff0;font:800 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.05em;white-space:normal;pointer-events:none!important;box-shadow:0 4px 16px #000c,0 0 12px #19c98f55;transform:translate(14px,14px)}
#twoMixUsbHelp.visible{display:block!important}#twoMixUsbHelp b{color:#f0c97e;letter-spacing:.13em}#twoMixUsbHelp .ctx{color:#dffcff}#twoMixUsbHelp .live{display:block;margin-top:2px;color:#63f5cf;letter-spacing:.08em}#twoMixUsbHelp .hint{display:block;margin-top:2px;color:#9de8dc}
@media(max-width:720px){#twoMixUsbHelp{max-width:220px;padding:5px 6px;font-size:6px;transform:translate(11px,11px)}}`;
    d.head.appendChild(style);
    const hud=d.createElement('div');hud.id='twoMixUsbHelp';hud.setAttribute('role','status');hud.setAttribute('aria-live','polite');d.body.appendChild(hud);
    let x=Math.round(w.innerWidth*.68),y=Math.round(w.innerHeight*.62),signal=0,ctx='FREE',hint='LEFT MOVE A+B · SHIFT SPLIT · ALT ROTATE · SPACE C';
    const isOn=()=>toggle.getAttribute('aria-pressed')==='true'||toggle.classList.contains('active');
    const center=el=>{const r=el?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null};
    const anchors=()=>{const A=center(d.getElementById('twoMixA')),B=center(d.getElementById('twoMixB'));return A&&B?{A,B}:null};
    const distLine=(px,py,A,B)=>{const vx=B.x-A.x,vy=B.y-A.y,l=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,((px-A.x)*vx+(py-A.y)*vy)/l)),qx=A.x+vx*t,qy=A.y+vy*t;return Math.hypot(px-qx,py-qy)};
    const isControl=el=>!!el?.closest?.('input[type="range"],input[type="number"],[role="slider"],.knob,.wheel,.bar,.level,.fader');
    const inspect=(px,py)=>{
      const el=d.elementFromPoint(px,py),A=d.getElementById('twoMixA'),B=d.getElementById('twoMixB'),C=d.getElementById('twoMixC'),ab=anchors(),cState=w.__enochTwoMixSpaceC;
      if(cState?.active){ctx='C ACTIVE';hint='DRAG SCULPT · WHEEL ADJUST CONTROL · RELEASE SPACE EXIT C';return}
      if(el&&(el===A||A?.contains?.(el))){ctx='A';hint='LEFT SELECT/MOVE · SHIFT SPLIT · SPACE+LINE CREATE C';return}
      if(el&&(el===B||B?.contains?.(el))){ctx='B';hint='LEFT SELECT/MOVE · SHIFT SPLIT · SPACE+LINE CREATE C';return}
      if(C?.classList.contains('active')){ctx='C';hint='SPACE HELD · DRAG C TO SCULPT · WHEEL ADJUST';return}
      if(isControl(el)){ctx='CONTROL';hint='WHEEL ADJUST · SPACE+C CAN SCULPT THIS LEVEL';return}
      if(ab&&distLine(px,py,ab.A,ab.B)<=28){ctx='A↔B LINE';hint='HOLD SPACE + CLICK = C · DRAG AWAY TO BEND SIGNAL';return}
      const aOn=A?.classList.contains('active'),bOn=B?.classList.contains('active');
      if(aOn&&bOn){ctx='A+B ARMED';hint='SPACE + USB ON A↔B LINE = C · WHEEL ADJUST';return}
      if(aOn||bOn){ctx=(aOn?'A':'B')+' ARMED';hint='SPACE + USB ON A↔B LINE = C';return}
      ctx='FREE';hint='LEFT MOVE A+B · SHIFT SPLIT · ALT ROTATE · SPACE C';
    };
    const place=()=>{const r=hud.getBoundingClientRect(),pad=10;let px=x,py=y;if(px+r.width+30>w.innerWidth)px=Math.max(pad,x-r.width-24);if(py+r.height+30>w.innerHeight)py=Math.max(pad,y-r.height-24);hud.style.left=Math.max(pad,px)+'px';hud.style.top=Math.max(pad,py)+'px'};
    const render=()=>{if(!isOn()){hud.classList.remove('visible');return}inspect(x,y);hud.innerHTML='<b>2MIX</b> <span class="ctx">'+ctx+'</span><span class="hint">'+hint+'</span><span class="live">ENOCHIAN SIGNAL '+String(Math.round(signal*100)).padStart(3,'0')+'% · MEMORY 36</span>';hud.classList.add('visible');place()};
    d.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;render()},{passive:true});
    d.addEventListener('keydown',e=>{if(isOn()){if(e.code==='Space')ctx='SPACE · C ARMED';render()}},{capture:true});
    d.addEventListener('keyup',()=>{if(isOn())render()},{capture:true});
    d.addEventListener('wheel',()=>{if(isOn())w.requestAnimationFrame(render)},{capture:true,passive:true});
    toggle.addEventListener('click',()=>w.requestAnimationFrame(render));
    const bind=()=>{const bus=w.__enochAnalyserBus;if(!bus?.subscribe)return false;bus.subscribe((type,payload)=>{if(type!=='signal'||!Array.isArray(payload)||payload.length<4)return;signal=Math.max(0,Math.min(1,(Number(payload[0])+Number(payload[1])+Number(payload[2])+Number(payload[3]))/(255*4)));if(isOn())render()});return true};
    if(!bind())setTimeout(bind,100);
    w.addEventListener('resize',()=>{if(isOn())render()});
    d.documentElement.dataset.twoMixLiveContextHelp=VERSION;
    w.__enochTwoMixLiveContextHelp={version:VERSION,render,hud};
    render();
    return true;
  }catch(_){return false}
}
window.installEnochianTwoMixLiveContextHelpV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)};
})();
