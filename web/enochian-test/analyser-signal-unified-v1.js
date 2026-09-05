(()=>{
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const SIGNAL_PALETTE={
 bgDeep:'#02070B',bgMid:'#031019',bgRaised:'#041A27',
 lineDark:'#0B4F73',lineMid:'#1492C8',lineBright:'#39C8F5',lineHot:'#A8F1FF',
 fill:'rgba(20,146,200,0.06)',fillPeak:'rgba(57,200,245,0.10)',
 glowPrimary:'rgba(57,200,245,0.35)',glowSecondary:'rgba(120,230,255,0.18)'
};
const RGB={lineDark:[11,79,115],lineMid:[20,146,200],lineBright:[57,200,245],lineHot:[168,241,255]};
const mixRgb=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*clamp(t)));
const signalRgb=v=>v<.3?mixRgb(RGB.lineDark,RGB.lineMid,v/.3):v<.7?mixRgb(RGB.lineMid,RGB.lineBright,(v-.3)/.4):mixRgb(RGB.lineBright,RGB.lineHot,(v-.7)/.3);
const signalColour=(v,a=1)=>{const c=signalRgb(v);return `rgba(${c[0]},${c[1]},${c[2]},${a})`};
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=deckDoc(frame),w=d?.defaultView,bus=w?.__enochAnalyserBus;if(!d||!w||!bus)return false;if(d.documentElement.dataset.analyserSignalUnified==='v5')return true;const chamber=d.querySelector('.stage .wave')||d.querySelector('.wave');if(!chamber||chamber.tagName==='CANVAS')return false;d.documentElement.dataset.analyserSignalUnified='v5';
 const css=d.createElement('style');css.textContent=`.wave{background:linear-gradient(rgba(48,166,207,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(48,166,207,.025) 1px,transparent 1px),radial-gradient(circle at 50% 52%,rgba(14,111,160,.18),transparent 60%),${SIGNAL_PALETTE.bgDeep}!important;background-size:24px 24px,24px 24px,auto,auto!important}.wave .analyser-3d:not(.analyser-3d-unified){display:none!important;opacity:0!important}.wave .analyser-3d-unified{display:block!important;opacity:.96!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:4!important;pointer-events:none!important;filter:drop-shadow(0 0 3px ${SIGNAL_PALETTE.glowSecondary})!important}`;d.head.appendChild(css);chamber.querySelectorAll('.analyser-3d').forEach(c=>{if(!c.classList.contains('analyser-3d-unified')){c.style.setProperty('display','none','important');c.style.setProperty('opacity','0','important')}});chamber.querySelector('.analyser-3d-unified')?.remove();const canvas=d.createElement('canvas');canvas.className='analyser-3d analyser-3d-unified';canvas.setAttribute('aria-hidden','true');chamber.appendChild(canvas);
 // Audio history stays compact; the visible terrain is a bilinearly interpolated 40 × 28 field.
 const AUDIO_ROWS=16,AUDIO_BINS=16,VISUAL_ROWS=28,VISUAL_BINS=40,ROWS=VISUAL_ROWS,BINS=VISUAL_BINS,history=Array.from({length:AUDIO_ROWS},()=>new Float32Array(AUDIO_BINS));let write=0,latest=null,latestStamp=0,latestSource='idle',raf=0,lastPush=0,lastPaint=0,lastFrameSerial=0,lastProjected=[];
 const pct=v=>clamp((parseFloat(v)||0)/100),active=e=>!!e&&(e.classList.contains('active')||e.getAttribute('aria-pressed')==='true'),stem=k=>{const t=d.querySelector(`[data-stem-toggle="${k}"]`),r=d.querySelector(`[data-stem-range="${k}"]`);return active(t)?pct(r?.value??100):0};
 const controlNorm=(id,fallback=.5)=>{const e=d.getElementById(id);if(!e)return fallback;const v=parseFloat(e.value);if(!Number.isFinite(v))return fallback;const min=parseFloat(e.min),max=parseFloat(e.max);if(Number.isFinite(min)&&Number.isFinite(max)&&max>min)return clamp((v-min)/(max-min));return Math.abs(v)<=1?clamp(v):pct(v)};
 const textPct=id=>pct((d.getElementById(id)?.textContent||'0').replace('%',''));
 const shape=arr=>{if(!arr?.length)return null;const out=new Float32Array(AUDIO_BINS),low=clamp(((parseFloat(d.getElementById('low')?.value)||0)+18)/36),mid=clamp(((parseFloat(d.getElementById('mid')?.value)||0)+18)/36),high=clamp(((parseFloat(d.getElementById('high')?.value)||0)+18)/36),fxMix=textPct('fxMixV')||controlNorm('fxMix',.5),fxMacro=textPct('fxWheelV'),filter=controlNorm('filter',.5),drive=controlNorm('drive',0),delay=controlNorm('delay',0),feedback=controlNorm('fb',0),wet=controlNorm('wet',0),stemEnergy=(stem('vocals')+stem('drums')+stem('bass')+stem('other'))/4,instant=[...d.querySelectorAll('.instant-fx-btn')].some(active)?1:0;for(let i=0;i<AUDIO_BINS;i++){const a=Math.floor(i*arr.length/AUDIO_BINS),b=Math.max(a+1,Math.floor((i+1)*arr.length/AUDIO_BINS));let sum=0,n=0;for(let j=a;j<b&&j<arr.length;j++){sum+=arr[j];n++}const x=i/(AUDIO_BINS-1),eq=x<.33?low:x<.67?mid:high,filterTilt=clamp(1+(filter-.5)*(x-.5)*1.9,.45,1.55),fxEnergy=.10*fxMix+.08*fxMacro+.09*drive+.06*delay+.06*feedback+.08*wet+.07*instant,mult=(.56+.52*eq+.18*stemEnergy+fxEnergy)*filterTilt;out[i]=clamp((n?sum/n:0)*mult,0,255)}return out};
 const acceptPayload=(payload,source,serial=0)=>{const next=shape(payload);if(next){latest=next;latestStamp=performance.now();latestSource=source;lastFrameSerial=serial||lastFrameSerial}};
 const off=bus.subscribe((type,payload)=>{const selected=w.__enochSignalSource||'main';if(type==='frequency'){if(selected==='main')acceptPayload(payload,'main')}else if(type==='authoritative-frequency'&&payload?.source&&payload?.data){if(selected!=='main'&&payload.source===selected)acceptPayload(payload.data,payload.source,Number(payload.serial)||0)}});if((w.__enochSignalSource||'main')==='main'&&bus.frequency)acceptPayload(bus.frequency,'main');
 const idle=t=>{const a=new Float32Array(AUDIO_BINS);for(let i=0;i<AUDIO_BINS;i++)a[i]=8+7*(1+Math.sin(t*.0014+i*.55));return a};const push=t=>{if(t-lastPush<58)return;lastPush=t;const live=latest&&performance.now()-latestStamp<500;history[write]=new Float32Array(live?latest:idle(t));write=(write+1)%AUDIO_ROWS};const row=r=>history[(write-1-r+AUDIO_ROWS)%AUDIO_ROWS];
 const bilinearSample=(visualX,visualZ)=>{const x=visualX/(VISUAL_BINS-1)*(AUDIO_BINS-1),z=visualZ/(VISUAL_ROWS-1)*(AUDIO_ROWS-1),x0=Math.floor(x),x1=Math.min(AUDIO_BINS-1,x0+1),z0=Math.floor(z),z1=Math.min(AUDIO_ROWS-1,z0+1),tx=x-x0,tz=z-z0,a=row(z0)[x0]*(1-tx)+row(z0)[x1]*tx,b=row(z1)[x0]*(1-tx)+row(z1)[x1]*tx;return a*(1-tz)+b*tz};
 const anchorCoords=a=>{const rawBin=Number(a?.bin),rawRow=Number(a?.row),bin=Number.isFinite(rawBin)?rawBin:7.5,row=Number.isFinite(rawRow)?rawRow:0;return{bin:clamp(bin*(BINS-1)/15,0,BINS-1),row:clamp(row*(ROWS-1)/15,0,ROWS-1)}};
 const paint=t=>{
  raf=w.requestAnimationFrame(paint);push(t);if(t-lastPaint<30)return;lastPaint=t;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(1.75,w.devicePixelRatio||1),W=Math.max(1,Math.floor(rect.width*dpr)),H=Math.max(1,Math.floor(rect.height*dpr));
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
  const c=canvas.getContext('2d');c.clearRect(0,0,W,H);
  const gesture=w.__enochAnalyserGesture||{},view=gesture.view||{},def=gesture.deform||{},mod=w.__enochSignalModulation===true||d.getElementById('signalModToggle')?.getAttribute('aria-pressed')==='true',depth=clamp((parseFloat(d.getElementById('modWheelV')?.textContent)||0)/100),anchors=mod?(def.anchors||[]):[];
  const yaw=clamp(view.yaw||0,-1.15,1.15),pitch=clamp(view.pitch||0,-.72,.72),zoom=clamp(view.zoom||1,.55,2.6),pts=[],live=!!latest&&performance.now()-latestStamp<500;
  for(let r=ROWS-1;r>=0;r--){
   const line=[];
   for(let i=0;i<BINS;i++){
    const amp=clamp(bilinearSample(i,r)/255),nx=i/(BINS-1)-.5,nz=r/(ROWS-1),baseX=nx*W*.88,baseZ=nz*H*1.15*zoom;
    const turbulence=Math.sin(i*.52+t*.0017)*Math.cos(r*.41-t*.0011)*H*.012*(live?1:.42);
    let y=Math.pow(amp,1.35)*H*.42+turbulence,dy=0,dz=0,tw=0,modEnergy=0;
    for(const a of anchors.slice(0,5)){const ac=anchorCoords(a),dx=(i-ac.bin)/BINS,dr=(r-ac.row)/ROWS,rad=clamp(a.radius||.2,.08,.55),inf=Math.exp(-(dx*dx+dr*dr)/(2*rad*rad))*depth*(a.strength||1);dy+=(a.pullY||0)*inf;dz+=(a.pullZ||0)*inf;tw+=(a.twist||0)*inf;modEnergy=Math.max(modEnergy,inf)}
    y+=dy*H*.38;
    let x=baseX,z=baseZ+dz*H*.45,cs=Math.cos(tw),sn=Math.sin(tw),tx=x*cs-z*sn,tz=x*sn+z*cs,cy=Math.cos(yaw),sy=Math.sin(yaw),xr=tx*cy-tz*sy,zr=tx*sy+tz*cy,cp=Math.cos(pitch),sp=Math.sin(pitch),yr=y*cp-zr*sp,z2=y*sp+zr*cp,p=1/(1+Math.max(-H,z2)/(H*2));
    line.push({x:W*.5+xr*p,y:H*.78-yr*p-z2*.08,amp,energy:clamp(amp+modEnergy*.12)});
   }
   pts.push(line);
  }
  // Nearly transparent body: enough volume to read without becoming an opaque mountain.
  for(let r=0;r<pts.length-1;r++){
   const near=pts[r],far=pts[r+1],avg=(near.reduce((s,p)=>s+p.energy,0)+far.reduce((s,p)=>s+p.energy,0))/(BINS*2);
   c.globalAlpha=avg>.72 ? .8 : .75;c.fillStyle=avg>.72?SIGNAL_PALETTE.fillPeak:SIGNAL_PALETTE.fill;c.beginPath();near.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));for(let i=far.length-1;i>=0;i--)c.lineTo(far[i].x,far[i].y);c.closePath();c.fill();c.globalAlpha=1;
  }
  // Deep longitudinal lattice.
  c.lineWidth=.55*dpr;
  for(let i=0;i<BINS;i+=2){const energy=pts.reduce((s,line)=>s+line[i].energy,0)/ROWS;c.strokeStyle=`rgba(11,79,115,${.22+energy*.14})`;c.beginPath();pts.forEach((line,r)=>r?c.lineTo(line[i].x,line[i].y):c.moveTo(line[i].x,line[i].y));c.stroke()}
  // Broad contour aura, then sharp amplitude-coloured topographic lines.
  c.save();c.globalAlpha=live ? .18 : .10;c.shadowColor=SIGNAL_PALETTE.glowPrimary;c.shadowBlur=8*dpr;
  for(const line of pts){const avg=line.reduce((s,p)=>s+p.energy,0)/BINS;c.strokeStyle=signalColour(avg,.58);c.lineWidth=.9*dpr;c.beginPath();line.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}
  c.restore();
  for(let r=0;r<pts.length;r++){const line=pts[r],frontRow=r===pts.length-1;c.lineCap='round';for(let i=1;i<line.length;i++){const energy=(line[i-1].energy+line[i].energy)*.5;c.strokeStyle=signalColour(energy,.50+energy*.46);c.lineWidth=(frontRow?1.15:.75)*dpr;c.beginPath();c.moveTo(line[i-1].x,line[i-1].y);c.lineTo(line[i].x,line[i].y);c.stroke()}}
  // Only hot amplitude segments whiten and bloom.
  c.save();c.shadowColor=SIGNAL_PALETTE.lineBright;c.shadowBlur=5*dpr;
  for(const line of pts){for(let i=1;i<line.length;i++){const energy=Math.max(line[i-1].energy,line[i].energy),peak=Math.max(0,(energy-.72)/.28);if(!peak)continue;c.strokeStyle=signalColour(.78+peak*.22,.55+peak*.4);c.lineWidth=(.8+peak*.45)*dpr;c.beginPath();c.moveTo(line[i-1].x,line[i-1].y);c.lineTo(line[i].x,line[i].y);c.stroke()}}
  c.restore();
  // Dedicated foreground waveform: soft aura underneath, razor-sharp hot-cyan core above.
  const front=pts[pts.length-1];c.save();c.strokeStyle=SIGNAL_PALETTE.lineBright;c.lineWidth=2.3*dpr;c.globalAlpha=live ? .48 : .22;c.shadowColor='rgba(57,200,245,.65)';c.shadowBlur=7*dpr;c.beginPath();front.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore();
  c.strokeStyle=SIGNAL_PALETTE.lineHot;c.lineWidth=1.65*dpr;c.lineJoin='round';c.beginPath();front.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
  // Sparse downward spectral drops from strong foreground bins, never a full EQ curtain.
  if(live){c.lineWidth=.45*dpr;for(let i=1;i<front.length-1;i+=2){const p=front[i],amp=p.amp;if(amp<=.58)continue;const length=(4+amp*18+(i%5)*1.2)*dpr;c.strokeStyle=`rgba(57,200,245,${.10+amp*.22})`;c.beginPath();c.moveTo(p.x,p.y+1*dpr);c.lineTo(p.x,p.y+length);c.stroke()}}
  lastProjected=pts;w.__enochAnalyserUnifiedState={version:'v5',source:latestSource,live,frameSerial:lastFrameSerial,grid:{rows:ROWS,bins:BINS},stems:{vocals:stem('vocals'),drums:stem('drums'),bass:stem('bass'),other:stem('other')}};d.documentElement.dataset.analyserUnifiedHealth=live?'live':'idle';d.documentElement.dataset.analyserUnifiedSource=latestSource;
 };
 const pick=(clientX,clientY)=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height||!lastProjected.length)return null;const tx=(clientX-r.left)*(canvas.width/r.width),ty=(clientY-r.top)*(canvas.height/r.height);let best=null,dist=Infinity;lastProjected.forEach((line,pr)=>line.forEach((q,pb)=>{const dd=(q.x-tx)*(q.x-tx)+(q.y-ty)*(q.y-ty);if(dd<dist){dist=dd;best={bin:pb/(BINS-1)*15,row:(ROWS-1-pr)/(ROWS-1)*15}}}));return best};const api={version:'v5',grid:{rows:ROWS,bins:BINS},invalidate:()=>{},pick,getProjected:()=>lastProjected,get source(){return latestSource},get live(){return performance.now()-latestStamp<500}};w.__enochAnalyser3DUnified=api;w.__enochAnalyser3D=api;
 raf=w.requestAnimationFrame(paint);w.addEventListener('pagehide',()=>{off?.();if(raf)w.cancelAnimationFrame(raf)},{once:true});return true;
}
let timer=0;window.installEnochianAnalyserSignalUnifiedV1=frame=>{if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>240){clearInterval(timer);timer=0}},50)}return false};
})();
