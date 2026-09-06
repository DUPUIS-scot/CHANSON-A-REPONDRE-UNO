(()=>{
'use strict';
const VERSION='v6-20260906-terrain-anchored',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function install(host){
 try{
  const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
  if(!d||!w)return false;
  if(d.documentElement.dataset.twoMixVirtualMice===VERSION)return true;
  d.documentElement.dataset.twoMixVirtualMice=VERSION;
  ['two-mix-virtual-mice-style','twoMixToggle','twoMixHelp','twoMixTether','twoMixState','twoMixA','twoMixB','threeMixC'].forEach(id=>d.getElementById(id)?.remove());
  const wave=d.querySelector('.wave'),mesh=()=>wave?.querySelector('.analyser-3d-unified');
  if(!wave)return false;
  const style=d.createElement('style');style.id='two-mix-virtual-mice-style';style.textContent='#twoMixToggle{position:absolute;right:12px;top:12px;z-index:16;width:48px;height:28px;border-radius:4px;border:1px solid #f0c97e;background:#090504;color:#ffe4a6;font:900 8px/1 ui-monospace,monospace;letter-spacing:.08em;cursor:pointer;touch-action:manipulation;box-shadow:0 0 12px #f0c97e55}#twoMixToggle.active{background:#211207;color:#ffe4a6;box-shadow:0 0 18px #f0c97ebb}.threeMixPointer{position:absolute;z-index:15;width:27px;height:27px;border-radius:50%;transform:translate(-50%,-50%);pointer-events:auto;display:none;place-items:center;font:900 8px/1 ui-monospace,monospace;cursor:grab;touch-action:none}.threeMixPointer.on{display:grid}.threeMixPointer.main{border:2px solid #f0c97e;color:#f0c97e;box-shadow:0 0 15px #f0c97eaa;background:#120b03ed}.threeMixPointer.midi{border:2px solid #63f5cf;color:#63f5cf;box-shadow:0 0 15px #63f5cfaa;background:#03120fed}.threeMixPointer.input{border:2px solid #d5fbff;color:#d5fbff;box-shadow:0 0 15px #a8f1ffaa;background:#04101aed}#twoMixTether{position:absolute;inset:0;z-index:14;pointer-events:none;display:none}#twoMixTether.on{display:block}#twoMixState{position:absolute;right:68px;top:18px;z-index:16;padding:4px 6px;border:1px solid #315b56;border-radius:4px;background:#020706e8;color:#cffff8;font:800 7px/1 ui-monospace,monospace;letter-spacing:.06em;display:none}#twoMixState.on{display:block}.wave.three-mix-sculpt-active{box-shadow:inset 0 0 38px #63f5cf18}';
  d.head.appendChild(style);
  if(w.getComputedStyle(wave).position==='static')wave.style.position='relative';
  const toggle=d.createElement('button');toggle.id='twoMixToggle';toggle.type='button';toggle.textContent='3MIX';toggle.setAttribute('aria-pressed','false');
  const stateEl=d.createElement('div');stateEl.id='twoMixState';stateEl.textContent='3MIX OFF';
  const make=(id,cls,label)=>{const e=d.createElement('div');e.id=id;e.className='threeMixPointer '+cls;e.textContent=label;e.setAttribute('aria-label',cls+' terrain anchor');return e};
  const a=make('twoMixA','main','A'),b=make('twoMixB','midi','B'),c=make('threeMixC','input','C');
  const tether=d.createElement('canvas');tether.id='twoMixTether';wave.append(tether,a,b,c,toggle,stateEl);
  const S={on:false,armed:false,drag:null,cx:0,cy:0,spread:100,ang:-Math.PI/2,depth:0,twist:0,lastX:0,lastY:0,poles:{a:{x:0,y:0,bin:2,row:7},b:{x:0,y:0,bin:8,row:8},c:{x:0,y:0,bin:13,row:7}}};
  const gesture=()=>w.__enochAnalyserGesture?.deform||null;
  const terrain=()=>{const canvas=mesh(),rect=canvas?.getBoundingClientRect(),rows=canvas?.__enochProjected||w.__enochAnalyser3D?.getProjected?.()||[];if(!canvas||!rect?.width||!rect?.height||!rows.length)return null;return{canvas,rect,rows,sx:rect.width/canvas.width,sy:rect.height/canvas.height}};
  function snap(x,y){
   const t=terrain(),wr=wave.getBoundingClientRect();if(!t)return{x:clamp(x,0,wr.width),y:clamp(y,0,wr.height),bin:7.5,row:7.5};
   let best=null,dist=Infinity;t.rows.forEach((line,ri)=>line.forEach((q,bi)=>{const px=(q.x*t.sx+t.rect.left)-wr.left,py=(q.y*t.sy+t.rect.top)-wr.top,dd=(px-x)*(px-x)+(py-y)*(py-y);if(dd<dist){dist=dd;best={x:px,y:py,bin:bi/(Math.max(1,line.length-1))*15,row:(t.rows.length-1-ri)/(Math.max(1,t.rows.length-1))*15}}}));
   return best||{x:clamp(x,0,wr.width),y:clamp(y,0,wr.height),bin:7.5,row:7.5};
  }
  function setPole(key,x,y){Object.assign(S.poles[key],snap(x,y))}
  function resetTriangle(){const wr=wave.getBoundingClientRect();for(const [i,k] of ['a','b','c'].entries()){const q=S.ang+i*Math.PI*2/3;setPole(k,S.cx+Math.cos(q)*S.spread,S.cy+Math.sin(q)*S.spread)}}
  function drawTether(){const wr=wave.getBoundingClientRect(),ratio=Math.min(2,w.devicePixelRatio||1),W=Math.max(1,Math.round(wr.width*ratio)),H=Math.max(1,Math.round(wr.height*ratio));if(tether.width!==W||tether.height!==H){tether.width=W;tether.height=H;tether.style.width=wr.width+'px';tether.style.height=wr.height+'px'}const x=tether.getContext('2d');x.clearRect(0,0,W,H);if(!S.on)return;x.save();x.scale(ratio,ratio);x.strokeStyle='rgba(168,241,255,.58)';x.shadowColor='rgba(57,200,245,.55)';x.shadowBlur=7;x.lineWidth=1;x.beginPath();x.moveTo(S.poles.a.x,S.poles.a.y);x.lineTo(S.poles.b.x,S.poles.b.y);x.lineTo(S.poles.c.x,S.poles.c.y);x.closePath();x.stroke();x.restore()}
  function paint(){a.style.left=S.poles.a.x+'px';a.style.top=S.poles.a.y+'px';b.style.left=S.poles.b.x+'px';b.style.top=S.poles.b.y+'px';c.style.left=S.poles.c.x+'px';c.style.top=S.poles.c.y+'px';[a,b,c,tether,stateEl].forEach(el=>el.classList.toggle('on',S.on));toggle.classList.toggle('active',S.on);toggle.setAttribute('aria-pressed',String(S.on));stateEl.textContent=S.on?'3MIX · ANCHORED':'3MIX OFF';wave.classList.toggle('three-mix-sculpt-active',S.on);drawTether()}
  function apply3D(){
   const def=gesture();if(!def)return;const anchors=Array.isArray(def.anchors)?def.anchors:[],map=[['a',[0,1]],['c',[2]],['b',[3,4]]];
   for(const [key,ids] of map){const p=S.poles[key];ids.forEach((idx,j)=>{const q=anchors[idx];if(!q)return;q.bin=clamp(p.bin+(j?.72:-.72),0,15);q.row=clamp(p.row+(j?.62:-.62),0,15);q.pullY=clamp((7.5-p.row)/7.5*.9,-1.25,1.25);q.pullZ=clamp((p.bin-7.5)/7.5*.85+S.depth,-1.3,1.3);q.twist=clamp(S.twist+(key==='a'?-1:key==='b'?1:0)*.42,-Math.PI,Math.PI);q.radius=key==='c'?.22:.18;q.strength=1})}
   def.selectedAnchor=2;w.__enochSignalModulation=true;w.__enochSignalEngagement=Object.assign(w.__enochSignalEngagement||{},{threeMix:true,twoMix:false,signalMice:3,mode:'main-midi-input-360'});w.__enochThreeMixField={on:S.on,space:'terrain-vertices-v1',poles:JSON.parse(JSON.stringify(S.poles)),depth:S.depth,twist:S.twist};w.__enochAnalyser3D?.invalidate?.();
  }
  async function setOn(on){S.on=!!on;S.armed=false;S.drag=null;if(S.on){const wr=wave.getBoundingClientRect();S.cx=wr.width*.5;S.cy=wr.height*.60;S.spread=Math.min(wr.width,wr.height)*.18;resetTriangle();await w.__enochSignalSourceAuthority?.set?.('mix');apply3D()}else{w.__enochSignalEngagement=Object.assign(w.__enochSignalEngagement||{},{threeMix:false,signalMice:0})}paint()}
  toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setOn(!S.on)});
  toggle.addEventListener('enochian:two-mix-toggle',e=>setOn(!!e.detail?.active));d.addEventListener('enochian:two-mix-toggle',e=>setOn(!!e.detail?.active));
  for(const [el,key] of [[a,'a'],[b,'b'],[c,'c']])el.addEventListener('pointerdown',e=>{if(!S.on)return;S.drag=key;S.lastX=e.clientX;S.lastY=e.clientY;try{el.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();e.stopPropagation()});
  wave.addEventListener('pointerdown',e=>{if(!S.on||e.button!==0||e.target.closest('button,input,textarea,select,.threeMixPointer'))return;S.armed=true;S.lastX=e.clientX;S.lastY=e.clientY;e.preventDefault()},{capture:true});
  d.addEventListener('pointermove',e=>{if(!S.on||(!S.armed&&!S.drag))return;const dx=e.clientX-S.lastX,dy=e.clientY-S.lastY;S.lastX=e.clientX;S.lastY=e.clientY;if(S.drag){const p=S.poles[S.drag];setPole(S.drag,p.x+dx,p.y+dy)}else if(e.shiftKey){S.spread=clamp(S.spread+dx,30,Math.min(wave.clientWidth,wave.clientHeight)*.42);resetTriangle()}else if(e.altKey){S.ang+=dx*.012;resetTriangle()}else{S.cx+=dx;S.cy+=dy;for(const [k,p] of Object.entries(S.poles))setPole(k,p.x+dx,p.y+dy)}apply3D();paint();e.preventDefault()},{capture:true});
  d.addEventListener('pointerup',()=>{S.armed=false;S.drag=null},{capture:true});d.addEventListener('pointercancel',()=>{S.armed=false;S.drag=null},{capture:true});
  wave.addEventListener('wheel',e=>{if(!S.on)return;S.depth=clamp(S.depth-e.deltaY*.002,-1.2,1.2);S.twist=clamp(S.twist+e.deltaX*.006+e.deltaY*.0015,-Math.PI,Math.PI);apply3D();paint();e.preventDefault()},{capture:true,passive:false});
  const realign=()=>{if(!S.on)return;for(const [k,p] of Object.entries(S.poles))setPole(k,p.x,p.y);apply3D();paint()};w.addEventListener('resize',realign);
  w.__enochThreeMix={version:VERSION,enable:()=>setOn(true),disable:()=>setOn(false),toggle:()=>setOn(!S.on),get state(){return {...S}},snapToTerrain:realign};w.__enochTwoMix=w.__enochThreeMix;w.__enochTwoMixVirtualMice=w.__enochThreeMix;paint();return true;
 }catch(_){return false}
}
window.installEnochianTwoMixVirtualMice=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();