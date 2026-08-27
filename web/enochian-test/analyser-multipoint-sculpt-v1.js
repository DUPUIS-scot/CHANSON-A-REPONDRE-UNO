(()=>{
'use strict';
const VERSION='20260827-multipoint-sculpt-v1',ORANGE='#ff9d34';
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
  def.anchors=Array.isArray(def.anchors)&&def.anchors.length?def.anchors.slice(0,5):defaults();
  while(def.anchors.length<5)def.anchors.push(defaults()[def.anchors.length]);
  def.selectedAnchor=clamp(Number.isFinite(def.selectedAnchor)?def.selectedAnchor:2,0,4);
  const syncLegacy=()=>{const a=def.anchors[def.selectedAnchor];if(!a)return;def.grabBin=a.bin;def.grabRow=a.row;def.pullY=a.pullY;def.pullZ=a.pullZ;def.twist=a.twist;def.radius=a.radius;def.vY=a.vY||0;def.vZ=a.vZ||0};syncLegacy();
  const originalPick=w.__enochAnalyser3D.pick?.bind(w.__enochAnalyser3D);
  const projected=()=>w.__enochAnalyser3D.getProjected?.()||[];
  const nearestAnchor=(x,y)=>{const p=projected(),rect=wave.querySelector('.analyser-3d')?.getBoundingClientRect();if(!rect)return null;let best=null,dist=Infinity;def.anchors.forEach((a,i)=>{const q=p[Math.round(a.row)]?.[Math.round(a.bin)];if(!q)return;const dx=q.x/(wave.querySelector('.analyser-3d').width/rect.width)-(x-rect.left),dy=q.y/(wave.querySelector('.analyser-3d').height/rect.height)-(y-rect.top),dd=Math.hypot(dx,dy);if(dd<dist){dist=dd;best=i}});return dist<22?best:null};
  const choose=(x,y)=>{let idx=nearestAnchor(x,y);const pick=originalPick?.(x,y);if(idx===null){idx=def.selectedAnchor;if(pick){def.anchors[idx].bin=pick.bin;def.anchors[idx].row=pick.row}}def.selectedAnchor=idx;syncLegacy();w.__enochAnalyser3D.invalidate?.();return idx};
  const applyLegacyToSelected=()=>{const a=def.anchors[def.selectedAnchor];if(!a)return;a.pullY=def.pullY||0;a.pullZ=def.pullZ||0;a.twist=def.twist||0;a.radius=def.radius||.18;a.vY=def.vY||0;a.vZ=def.vZ||0;if(Number.isFinite(def.grabBin))a.bin=def.grabBin;if(Number.isFinite(def.grabRow))a.row=def.grabRow};
  let last='';const watch=()=>{if(w.__enochSignalModulation===true){const sig=[def.selectedAnchor,def.grabBin,def.grabRow,def.pullY,def.pullZ,def.twist,def.vY,def.vZ].join('|');if(sig!==last){last=sig;applyLegacyToSelected()}}w.__enochSignalEngagement=Object.assign(w.__enochSignalEngagement||{},{grabs:w.__enochSignalModulation===true?def.anchors.length:0,anchors:def.anchors,selected:def.selectedAnchor});requestAnimationFrame(watch)};requestAnimationFrame(watch);
  wave.addEventListener('pointerdown',e=>{if(w.__enochSignalModulation!==true||e.target.closest('button,input,textarea,select'))return;choose(e.clientX,e.clientY)},true);
  wave.addEventListener('wheel',e=>{if(w.__enochSignalModulation!==true||(w.__enochAnalyserWheelMode||'zoom')==='zoom')return;choose(e.clientX,e.clientY)},true);
  const baseProject=w.__enochAnalyser3D.getProjected;
  const overlay=d.createElement('canvas');overlay.className='analyser-sculpt-overlay';overlay.setAttribute('aria-hidden','true');wave.appendChild(overlay);
  const st=d.createElement('style');st.textContent='.analyser-sculpt-overlay{position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none!important}.wave.analyser-signal-sculpting{cursor:crosshair!important}';d.head.appendChild(st);
  const paint=()=>{requestAnimationFrame(paint);const rect=wave.getBoundingClientRect(),dpr=Math.min(1.75,w.devicePixelRatio||1),W=Math.max(1,Math.floor(rect.width*dpr)),H=Math.max(1,Math.floor(rect.height*dpr));if(overlay.width!==W||overlay.height!==H){overlay.width=W;overlay.height=H}const c=overlay.getContext('2d');c.clearRect(0,0,W,H);if(w.__enochSignalModulation!==true)return;const p=baseProject?.call(w.__enochAnalyser3D)||[];if(!p.length)return;const sx=W/Math.max(1,wave.querySelector('.analyser-3d')?.width||W),sy=H/Math.max(1,wave.querySelector('.analyser-3d')?.height||H);const influence=(r,b)=>{let prod=1;for(const a of def.anchors){const dx=(b-a.bin)/15,dz=(r-a.row)/15,rad=clamp(a.radius||.18,.08,.5),f=Math.exp(-(dx*dx+dz*dz*1.5)/(2*rad*rad));prod*=1-clamp(f,0,.94)}return 1-prod};c.lineCap='round';for(let r=0;r<p.length;r++){for(let b=1;b<(p[r]?.length||0);b++){const a=p[r][b-1],q=p[r][b];if(!a||!q)continue;const inf=(influence(r,b-1)+influence(r,b))*.5;if(inf<.08)continue;c.strokeStyle=`rgba(255,157,52,${clamp(.12+inf*.88,.12,1)})`;c.lineWidth=(.65+inf*1.35)*dpr;c.beginPath();c.moveTo(a.x*sx,a.y*sy);c.lineTo(q.x*sx,q.y*sy);c.stroke()}}def.anchors.forEach((a,i)=>{const q=p[Math.round(a.row)]?.[Math.round(a.bin)];if(!q)return;const selected=i===def.selectedAnchor;c.save();c.strokeStyle=ORANGE;c.fillStyle=selected?'rgba(255,157,52,.32)':'rgba(2,7,11,.75)';c.shadowColor=ORANGE;c.shadowBlur=selected?8*dpr:3*dpr;c.lineWidth=(selected?1.8:1.2)*dpr;c.beginPath();c.arc(q.x*sx,q.y*sy,(selected?5:4)*dpr,0,Math.PI*2);c.fill();c.stroke();c.restore()})};requestAnimationFrame(paint);
  const api={version:VERSION,anchors:def.anchors,select:i=>{def.selectedAnchor=clamp(i|0,0,4);syncLegacy()},reset:()=>{def.anchors=defaults();def.selectedAnchor=2;api.anchors=def.anchors;syncLegacy()}};w.__enochMultipointSculpt=api;d.documentElement.dataset.analyserMultipointSculpt=VERSION;return true;
 }catch(_){return false}
}
window.installEnochianMultipointSculptV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
