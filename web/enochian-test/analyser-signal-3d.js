(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const source=d&&d.getElementById('wave'),wave=source&&source.closest('.wave');
      if(!d||!w||!source||!wave)return false;
      if(d.documentElement.dataset.analyserSignal3d==='v2')return true;
      d.documentElement.dataset.analyserSignal3d='v2';
      const style=d.createElement('style');style.textContent=`.wave{perspective:700px!important}.wave #wave{opacity:.05!important}.analyser-3d{position:absolute;left:8px;right:8px;top:30px;width:calc(100% - 16px);height:70px;z-index:1;pointer-events:none;display:block;transform:none!important}html.terminal-fullscreen .analyser-3d{top:22px!important}`;d.head.appendChild(style);
      const prior=wave.querySelector('.analyser-3d');if(prior)prior.remove();
      const canvas=d.createElement('canvas');canvas.className='analyser-3d';canvas.setAttribute('aria-hidden','true');source.insertAdjacentElement('afterend',canvas);
      const history=[];const ROWS=34,BINS=52;let latest=null,lastPush=0,lastPaint=0;
      const sample=arr=>{if(!arr||!arr.length)return null;const out=new Uint8Array(BINS);for(let i=0;i<BINS;i++){const a=Math.floor(i*arr.length/BINS),b=Math.max(a+1,Math.floor((i+1)*arr.length/BINS));let sum=0,n=0;for(let j=a;j<b&&j<arr.length;j++){sum+=arr[j];n++}out[i]=n?Math.round(sum/n):0}return out};
      if(typeof w.draw==='function'&&!w.draw.__enoch3dCaptureV2){const original=w.draw.__original||w.draw;const wrapped=function(c,arr){latest=sample(arr);return original.call(this,c,arr)};wrapped.__enoch3dCaptureV2=true;wrapped.__original=original;w.draw=wrapped}
      const pushHistory=t=>{if(!latest||t-lastPush<50)return;lastPush=t;history.unshift(new Uint8Array(latest));if(history.length>ROWS)history.length=ROWS};
      const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(2,w.devicePixelRatio||1),cw=Math.max(1,Math.floor(r.width*dpr)),ch=Math.max(1,Math.floor(r.height*dpr));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}return {w:cw,h:ch,dpr}};
      const project=(bin,row,val,W,H,gesture)=>{const nx=bin/(BINS-1)-.5,nz=row/Math.max(1,ROWS-1),amp=val/255;const yaw=clamp((gesture?.x||0)/Math.max(160,wave.clientWidth*.8),-.55,.55),pitch=clamp(-(gesture?.y||0)/Math.max(120,wave.clientHeight*.9),-.38,.38);let x=nx*W*.88,z=nz*H*1.9,y=(amp-.28)*H*.92;const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),xr=x*cy-z*sy,zr=x*sy+z*cy,yr=y*cp-zr*sp,z2=y*sp+zr*cp,p=1/(1+z2/(H*1.9));return {x:W*.5+xr*p,y:H*.76-yr*p-z2*.09}};
      const drawSurface=t=>{w.requestAnimationFrame(drawSurface);pushHistory(t);if(t-lastPaint<32)return;lastPaint=t;const {w:W,h:H,dpr}=resize(),c=canvas.getContext('2d');c.clearRect(0,0,W,H);if(!history.length)return;const gesture=w.__enochAnalyserGesture||{x:0,y:0};const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'rgba(2,12,10,.10)');bg.addColorStop(1,'rgba(2,8,7,.48)');c.fillStyle=bg;c.fillRect(0,0,W,H);c.lineJoin='round';c.lineCap='round';for(let r=history.length-1;r>=0;r--){const alpha=.12+(1-r/ROWS)*.62;c.strokeStyle=`rgba(121,234,219,${alpha})`;c.lineWidth=(r===0?1.7:1)*dpr;c.beginPath();const row=history[r];for(let i=0;i<BINS;i++){const p=project(i,r,row[i],W,H,gesture);if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y)}c.stroke()}c.strokeStyle='rgba(213,170,99,.26)';c.lineWidth=.7*dpr;for(let g=0;g<8;g++){const i=Math.round(g*(BINS-1)/7);c.beginPath();for(let r=0;r<history.length;r++){const p=project(i,r,history[r][i],W,H,gesture);if(r===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y)}c.stroke()}if(history[0]){c.strokeStyle='rgba(213,170,99,.95)';c.lineWidth=1.35*dpr;c.beginPath();for(let i=0;i<BINS;i++){const p=project(i,0,history[0][i],W,H,gesture);if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y)}c.stroke()}};
      w.requestAnimationFrame(drawSurface);return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserSignal3D=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();