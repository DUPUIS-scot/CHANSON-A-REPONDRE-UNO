(()=>{
'use strict';
const VERSION='20260904-multipoint-sculpt-v3',ORANGE='#ff9d34';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function install(frame){
 try{
  const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
  const wave=d&&d.querySelector('.wave');
  if(!d||!w||!wave||!w.__enochAnalyser3D||!w.__enochAnalyserGesture)return false;
  if(d.documentElement.dataset.analyserMultipointSculpt===VERSION)return true;
  const g=w.__enochAnalyserGesture,def=g.deform||(g.deform={});
  const defaults=()=>[
   {bin:2,row:2,pullY:0,pullZ:0,twist:0,radius:.17,strength:1,vY:0,vZ:0},
   {bin:5,row:4,pullY:0,pullZ:0,twist:0,radius:.17,strength:1,vY:0,vZ:0},
   {bin:8,row:6,pullY:0,pullZ:0,twist:0,radius:.18,strength:1,vY:0,vZ:0},
   {bin:11,row:4,pullY:0,pullZ:0,twist:0,radius:.17,strength:1,vY:0,vZ:0},
   {bin:14,row:2,pullY:0,pullZ:0,twist:0,radius:.17,strength:1,vY:0,vZ:0}
  ];
  def.anchors=Array.isArray(def.anchors)&&def.anchors.length?def.anchors.slice(0,5):defaults();while(def.anchors.length<5)def.anchors.push(defaults()[def.anchors.length]);
  def.selectedAnchor=clamp(Number.isFinite(def.selectedAnchor)?def.selectedAnchor:2,0,4);
  const syncLegacy=()=>{const a=def.anchors[def.selectedAnchor];if(!a)return;def.grabBin=a.bin;def.grabRow=a.row;def.pullY=a.pullY;def.pullZ=a.pullZ;def.twist=a.twist;def.radius=a.radius;def.vY=a.vY||0;def.vZ=a.vZ||0};syncLegacy();
  const originalPick=w.__enochAnalyser3D.pick?.bind(w.__enochAnalyser3D),projected=()=>w.__enochAnalyser3D.getProjected?.()||[],meshCanvas=()=>wave.querySelector('.analyser-3d-unified');
  const nearestAnchor=(x,y)=>{const p=projected(),canvas=meshCanvas(),rect=canvas?.getBoundingClientRect();if(!rect||!canvas)return null;let best=null,dist=Infinity;def.anchors.forEach((a,i)=>{const q=p[Math.round(a.row)]?.[Math.round(a.bin)];if(!q)return;const dx=q.x/(canvas.width/rect.width)-(x-rect.left),dy=q.y/(canvas.height/rect.height)-(y-rect.top),dd=Math.hypot(dx,dy);if(dd<dist){dist=dd;best=i}});return dist<28?best:null};
  const choose=(x,y)=>{let idx=nearestAnchor(x,y),pick=originalPick?.(x,y);if(idx===null){idx=def.selectedAnchor;if(pick){def.anchors[idx].bin=pick.bin;def.anchors[idx].row=pick.row}}def.selectedAnchor=idx;syncLegacy();w.__enochAnalyser3D.invalidate?.();return idx};
  const applyLegacyToSelected=()=>{const a=def.anchors[def.selectedAnchor];if(!a)return;a.pullY=def.pullY||0;a.pullZ=def.pullZ||0;a.twist=def.twist||0;a.radius=def.radius||.18;a.vY=def.vY||0;a.vZ=def.vZ||0;if(Number.isFinite(def.grabBin))a.bin=def.grabBin;if(Number.isFinite(def.grabRow))a.row=def.grabRow};
  let last='';const watch=()=>{if(w.__enochSignalModulation===true){const sig=[def.selectedAnchor,def.grabBin,def.grabRow,def.pullY,def.pullZ,def.twist,def.vY,def.vZ].join('|');if(sig!==last){last=sig;applyLegacyToSelected()}}w.__enochSignalEngagement=Object.assign(w.__enochSignalEngagement||{},{grabs:w.__enochSignalModulation===true?def.anchors.length:0,anchors:def.anchors,selected:def.selectedAnchor});d.documentElement.dataset.analyserSculptPointCount=String(def.anchors.length);requestAnimationFrame(watch)};requestAnimationFrame(watch);
  wave.addEventListener('pointerdown',e=>{if(w.__enochSignalModulation!==true||e.target.closest('button,input,textarea,select'))return;choose(e.clientX,e.clientY)},true);
  wave.addEventListener('wheel',e=>{if(w.__enochSignalModulation!==true||(w.__enochAnalyserWheelMode||'zoom')==='zoom')return;choose(e.clientX,e.clientY)},true);
  wave.querySelector('.analyser-sculpt-overlay')?.remove();
  const overlay=d.createElement('canvas');overlay.className='analyser-sculpt-overlay';overlay.setAttribute('aria-hidden','true');wave.appendChild(overlay);
  const st=d.createElement('style');st.textContent='.analyser-sculpt-overlay{position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none!important}.wave.analyser-signal-sculpting{cursor:crosshair!important}';d.head.appendChild(st);
  const paint=()=>{requestAnimationFrame(paint);const rect=wave.getBoundingClientRect(),dpr=Math.min(1.75,w.devicePixelRatio||1),W=Math.max(1,Math.floor(rect.width*dpr)),H=Math.max(1,Math.floor(rect.height*dpr));if(overlay.width!==W||overlay.height!==H){overlay.width=W;overlay.height=H}const c=overlay.getContext('2d');c.clearRect(0,0,W,H);const p=projected(),canvas=meshCanvas();if(!p.length||!canvas)return;const sx=W/Math.max(1,canvas.width),sy=H/Math.max(1,canvas.height),modOn=w.__enochSignalModulation===true;def.anchors.forEach((a,i)=>{const q=p[Math.round(a.row)]?.[Math.round(a.bin)];if(!q)return;const selected=i===def.selectedAnchor;c.save();c.globalAlpha=modOn?1:.42;c.strokeStyle=ORANGE;c.fillStyle=selected&&modOn?'rgba(255,157,52,.34)':'rgba(2,7,11,.82)';c.shadowColor=ORANGE;c.shadowBlur=selected&&modOn?9*dpr:3*dpr;c.lineWidth=(selected&&modOn?1.8:1.2)*dpr;c.beginPath();c.arc(q.x*sx,q.y*sy,(selected&&modOn?5:4)*dpr,0,Math.PI*2);c.fill();c.stroke();c.restore()})};requestAnimationFrame(paint);
  const api={version:VERSION,anchors:def.anchors,select:i=>{def.selectedAnchor=clamp(i|0,0,4);syncLegacy()},reset:()=>{def.anchors=defaults();def.selectedAnchor=2;api.anchors=def.anchors;syncLegacy();w.__enochAnalyser3D.invalidate?.()}};w.__enochMultipointSculpt=api;d.documentElement.dataset.analyserMultipointSculpt=VERSION;d.documentElement.dataset.analyserSculptPointCount='5';return true;
 }catch(_){return false}
}
window.installEnochianMultipointSculptV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();