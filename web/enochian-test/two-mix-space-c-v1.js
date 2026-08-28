(()=>{
'use strict';
const VERSION='v1';
function install(host){
 try{
  const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
  if(!d||!w)return false;
  if(d.documentElement.dataset.twoMixSpaceC===VERSION)return true;
  d.documentElement.dataset.twoMixSpaceC=VERSION;
  d.getElementById('two-mix-space-c-style')?.remove();
  d.getElementById('twoMixC')?.remove();
  d.getElementById('twoMixCTether')?.remove();
  const style=d.createElement('style');style.id='two-mix-space-c-style';style.textContent=`
#twoMixC{position:fixed;z-index:2147482999;width:18px;height:18px;border:2px solid #dffcff;border-radius:50%;background:#16c8ef;box-shadow:0 0 5px #fff,0 0 14px #19d9ff,0 0 28px #087fc9;pointer-events:none;display:none;transform:translate(-50%,-50%)}
#twoMixC.active{display:block}
#twoMixCTether{position:fixed;z-index:2147482997;inset:0;width:100%;height:100%;pointer-events:none;display:none;overflow:visible}
#twoMixCTether.active{display:block}
#twoMixCTether path{fill:none;stroke:#38dfff;stroke-width:2;filter:drop-shadow(0 0 4px #18bfe8);stroke-linecap:round}
html.two-mix-space-c #twoMixTether{opacity:.28}
`;
  d.head.appendChild(style);
  const c=d.createElement('div');c.id='twoMixC';c.setAttribute('aria-hidden','true');d.body.appendChild(c);
  const svg=d.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='twoMixCTether';svg.setAttribute('aria-hidden','true');const path=d.createElementNS('http://www.w3.org/2000/svg','path');svg.appendChild(path);d.body.appendChild(svg);
  const state={space:false,grab:false,x:0,y:0,t:.5,lastTarget:null};
  const center=el=>{const r=el?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null};
  const active=()=>d.getElementById('twoMixToggle')?.getAttribute('aria-pressed')==='true';
  const anchors=()=>{const A=center(d.getElementById('twoMixA')),B=center(d.getElementById('twoMixB'));return A&&B?{A,B}:null};
  const nearestT=(p,A,B)=>{const vx=B.x-A.x,vy=B.y-A.y,l=vx*vx+vy*vy||1;return Math.max(0,Math.min(1,((p.x-A.x)*vx+(p.y-A.y)*vy)/l))};
  const linePoint=(t,A,B)=>({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t});
  const distToLine=(p,A,B)=>{const q=linePoint(nearestT(p,A,B),A,B);return Math.hypot(p.x-q.x,p.y-q.y)};
  const render=()=>{const ab=anchors();if(!ab||!state.grab){c.classList.remove('active');svg.classList.remove('active');return}c.classList.add('active');svg.classList.add('active');c.style.left=state.x+'px';c.style.top=state.y+'px';path.setAttribute('d',`M ${ab.A.x} ${ab.A.y} Q ${state.x} ${state.y} ${ab.B.x} ${ab.B.y}`)};
  const adjustTarget=(target,dy)=>{if(!target)return;const range=target.matches?.('input[type="range"]')?target:target.querySelector?.('input[type="range"]');if(range){const min=Number(range.min)||0,max=Number(range.max)||100,step=Number(range.step)||Math.max((max-min)/100,.01),next=Math.max(min,Math.min(max,(Number(range.value)||0)+(dy<0?step:-step)));range.value=String(next);range.dispatchEvent(new Event('input',{bubbles:true}));range.dispatchEvent(new Event('change',{bubbles:true}));return}target.dispatchEvent?.(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:state.x,clientY:state.y,deltaY:dy}))};
  const sculpt=()=>{const ab=anchors();if(!ab)return;const q=linePoint(state.t,ab.A,ab.B),bend=Math.hypot(state.x-q.x,state.y-q.y),balance=state.t;try{w.__enochTwoMixSpaceC={version:VERSION,active:state.grab,x:state.x/w.innerWidth,y:state.y/w.innerHeight,balance,bend};w.dispatchEvent(new CustomEvent('enoch:two-mix-sculpt',{detail:{source:'space-c',balance,bend,x:state.x/w.innerWidth,y:state.y/w.innerHeight}}))}catch(_){}};
  d.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||!active())return;state.space=true;d.documentElement.classList.add('two-mix-space-c');e.preventDefault()},{capture:true});
  d.addEventListener('keyup',e=>{if(e.code!=='Space')return;state.space=false;state.grab=false;state.lastTarget=null;d.documentElement.classList.remove('two-mix-space-c');render();try{if(w.__enochTwoMixSpaceC)w.__enochTwoMixSpaceC.active=false}catch(_){ }e.preventDefault()},{capture:true});
  d.addEventListener('pointerdown',e=>{if(!state.space||!active())return;const ab=anchors();if(!ab||distToLine(e,ab.A,ab.B)>28)return;state.grab=true;state.x=e.clientX;state.y=e.clientY;state.t=nearestT(e,ab.A,ab.B);render();sculpt();e.preventDefault();e.stopImmediatePropagation()},{capture:true});
  d.addEventListener('pointermove',e=>{if(!state.space||!state.grab)return;state.x=e.clientX;state.y=e.clientY;const ab=anchors();if(ab)state.t=nearestT(e,ab.A,ab.B);render();sculpt();e.preventDefault();e.stopImmediatePropagation()},{capture:true});
  d.addEventListener('pointerup',e=>{if(!state.grab)return;state.grab=false;render();e.preventDefault();e.stopImmediatePropagation()},{capture:true});
  d.addEventListener('wheel',e=>{if(!state.space||!state.grab)return;const old=c.style.display;c.style.display='none';const target=d.elementFromPoint(state.x,state.y);c.style.display=old;state.lastTarget=target;adjustTarget(target,e.deltaY);sculpt();e.preventDefault();e.stopImmediatePropagation()},{capture:true,passive:false});
  w.addEventListener('blur',()=>{state.space=false;state.grab=false;d.documentElement.classList.remove('two-mix-space-c');render()});
  return true;
 }catch(_){return false}
}
window.installEnochianTwoMixSpaceCV1=install;
})();
