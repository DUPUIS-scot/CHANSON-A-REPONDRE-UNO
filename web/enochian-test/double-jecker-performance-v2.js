(()=>{
'use strict';
const VERSION='v5';
function install(host){
  try{
    const live=host&&host.contentDocument;
    const deck=live&&live.getElementById('deck');
    const d=deck&&deck.contentDocument;
    const w=d&&d.defaultView;
    const api=w&&w.__enochDoubleDeckerSpecial;
    const panel=document.getElementById('doubleDeckerSpecial');
    const shield=document.getElementById('doubleJeckerShield');
    if(!d||!w||!api||!panel||!shield)return false;
    if(w.__enochDoubleJesterPerformance?.version===VERSION)return true;
    const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number(n)||0));
    const crossfader=()=>panel.querySelector('[data-dds-crossfader]');
    const readX=()=>clamp(Number(crossfader()?.value||0)/100);
    const setX=value=>{const el=crossfader();if(!el)return false;el.value=String(Math.round(clamp(value)*100));el.dispatchEvent(new Event('input',{bubbles:true}));return true};
    document.getElementById('double-jester-performance-v4-style')?.remove();
    document.getElementById('double-jester-performance-v5-style')?.remove();
    const style=document.createElement('style');style.id='double-jester-performance-v5-style';style.textContent=`
#doubleJeckerShield{touch-action:none!important;cursor:grab!important;will-change:left,top!important}
#doubleJeckerShield.j2-moving{cursor:grabbing!important}
#doubleJeckerShield .djs-platter{touch-action:none!important;cursor:crosshair!important;position:relative!important;z-index:2!important}
#doubleJeckerShield::before{content:'';position:absolute;inset:-5px;border-radius:50%;border:2px solid #39dff0;box-shadow:0 0 9px #22d9ff,0 0 18px #e69a27,inset 0 0 8px #0bc9e8;pointer-events:none;z-index:1;animation:j2OuterRigSpin 5.6s linear infinite}
#doubleJeckerShield::after{content:'2J';position:absolute;left:50%;top:-9px;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;display:grid;place-items:center;border:1px solid #f3b542;background:#061018;color:#ffd36a;font:900 8px/1 monospace;box-shadow:0 0 8px #28dcff,0 0 12px #ff9b24;pointer-events:none;z-index:8;animation:j2CounterSpin 5.6s linear infinite}
@keyframes j2OuterRigSpin{to{transform:rotate(360deg)}}
@keyframes j2CounterSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
#doubleJeckerShield .djs-performance-readout{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:9;min-width:72px;padding:3px 6px;border:1px solid #63f5cf88;border-radius:999px;background:#03110ddd;color:#a9eee7;text-align:center;font:900 7px/1 monospace;pointer-events:none}
.stem-jecker-split,[data-stem-jecker-split]{display:none!important}
@media(prefers-reduced-motion:reduce){#doubleJeckerShield::before,#doubleJeckerShield::after{animation-duration:18s!important}}
`;document.head.appendChild(style);
    d.querySelectorAll('.stem-jecker-split,[data-stem-jecker-split]').forEach(node=>node.remove());
    let readout=shield.querySelector('.djs-performance-readout');if(!readout){readout=document.createElement('div');readout.className='djs-performance-readout';shield.appendChild(readout)}
    const paint=()=>{const x=readX();readout.textContent=x<.495?`A ${Math.round((1-x)*100)}%`:x>.505?`B ${Math.round(x*100)}%`:'A/B 50%'};
    const platter=shield.querySelector('.djs-platter')||shield;let spin=null;
    const angle=e=>{const r=platter.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    platter.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.stopPropagation();spin={id:e.pointerId,a:angle(e),x:readX(),moved:false};try{platter.setPointerCapture?.(e.pointerId)}catch(_){}e.preventDefault()});
    platter.addEventListener('pointermove',e=>{if(!spin||spin.id!==e.pointerId)return;e.stopPropagation();let a=angle(e),delta=a-spin.a;if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;spin.a=a;if(Math.abs(delta)>.002)spin.moved=true;spin.x=clamp(spin.x+delta/(Math.PI*1.35));setX(spin.x);paint();e.preventDefault()});
    const endSpin=e=>{if(!spin||spin.id!==e.pointerId)return;e.stopPropagation();try{platter.releasePointerCapture?.(e.pointerId)}catch(_){}const click=!spin.moved;spin=null;if(click){const authority=w.__enochDoubleJesterAuthority||window.__enochDoubleJesterAuthority;if(authority?.toggle)authority.toggle();else d.getElementById('doubleDeckerSpecialLaunch')?.click()}e.preventDefault()};
    platter.addEventListener('pointerup',endSpin);platter.addEventListener('pointercancel',endSpin);
    platter.addEventListener('wheel',e=>{e.stopPropagation();setX(readX()+Math.sign(e.deltaY)*.025);paint();e.preventDefault()},{passive:false});
    platter.addEventListener('dblclick',e=>{e.stopPropagation();setX(.5);paint();e.preventDefault()});
    let move=null;
    shield.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.djs-platter'))return;const r=shield.getBoundingClientRect();move={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};shield.classList.add('j2-moving');try{shield.setPointerCapture?.(e.pointerId)}catch(_){}e.preventDefault()});
    shield.addEventListener('pointermove',e=>{if(!move||move.id!==e.pointerId)return;const r=shield.getBoundingClientRect();const left=Math.max(4,Math.min(innerWidth-r.width-4,e.clientX-move.dx));const top=Math.max(4,Math.min(innerHeight-r.height-4,e.clientY-move.dy));shield.style.left=left+'px';shield.style.top=top+'px';shield.style.right='auto';shield.style.bottom='auto';e.preventDefault()});
    const endMove=e=>{if(!move||move.id!==e.pointerId)return;move=null;shield.classList.remove('j2-moving');try{shield.releasePointerCapture?.(e.pointerId)}catch(_){}try{const r=shield.getBoundingClientRect();localStorage.setItem('doubleJeckerTurntableShieldRect',JSON.stringify({left:r.left,top:r.top}))}catch(_){}};
    shield.addEventListener('pointerup',endMove);shield.addEventListener('pointercancel',endMove);
    try{const saved=JSON.parse(localStorage.getItem('doubleJeckerTurntableShieldRect')||'null');if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){const r=shield.getBoundingClientRect();shield.style.left=Math.max(4,Math.min(innerWidth-r.width-4,saved.left))+'px';shield.style.top=Math.max(4,Math.min(innerHeight-r.height-4,saved.top))+'px';shield.style.right='auto';shield.style.bottom='auto'}}catch(_){}
    const xf=crossfader();if(xf&&!xf.dataset.jesterSpinnerPaint){xf.dataset.jesterSpinnerPaint=VERSION;xf.addEventListener('input',paint)}
    const controller={version:VERSION,setCrossfader:setX,get crossfader(){return readX()},paint,mode:'mix',continuousSpin:true,dragOuterRig:true};w.__enochDoubleJesterPerformance=controller;w.__enochDoubleJeckerPerformance=controller;paint();return true;
  }catch(_){return false}
}
window.installEnochianDoubleJeckerPerformanceV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();