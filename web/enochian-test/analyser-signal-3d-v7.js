(()=> {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const source=d&&d.getElementById('wave'),wave=source&&source.closest('.wave'),bus=w&&w.__enochAnalyserBus,audio=d&&d.getElementById('audio');
      if(!d||!w||!source||!wave||!bus)return false;
      if(d.documentElement.dataset.analyserSignal3d==='v7')return true;
      d.documentElement.dataset.analyserSignal3d='v7';
      const style=d.createElement('style');
      style.textContent='.wave{perspective:700px!important}.wave #wave{opacity:.025!important}.analyser-3d{position:absolute;left:8px;right:8px;top:30px;width:calc(100% - 16px);height:70px;z-index:1;display:block;transform:none!important}html.terminal-fullscreen .analyser-3d{top:22px!important}';
      d.head.appendChild(style);
      wave.querySelector('.analyser-3d')?.remove();
      const canvas=d.createElement('canvas');canvas.className='analyser-3d';canvas.setAttribute('aria-hidden','true');source.insertAdjacentElement('afterend',canvas);
      const ROWS=16,BINS=16,history=Array.from({length:ROWS},()=>new Uint8Array(BINS));
      let latest=null,sourceType='internal-idle',write=0,count=0,lastPush=0,lastPaint=0,dirty=true,raf=0,projected=[],lastControl='';
      // Map FFT bins logarithmically: bass has useful visual space, rather than being compressed into a few linear bins.
      const sample=arr=>{
        if(!arr?.length)return null;
        const out=new Uint8Array(BINS),max=arr.length-1;
        for(let i=0;i<BINS;i++){
          const lo=Math.floor((Math.pow(max+1,i/BINS)-1)),hi=Math.max(lo+1,Math.floor(Math.pow(max+1,(i+1)/BINS)-1));
          let sum=0,n=0;for(let j=lo;j<=hi&&j<arr.length;j++){sum+=arr[j];n++}
          out[i]=n?Math.round(sum/n):0;
        } return out;
      };
      const accept=arr=>{const next=sample(arr);if(next){latest=next;sourceType='internal-master';dirty=true}};
      const off=bus.subscribe((type,payload)=>{if(type==='frequency')accept(payload)});
      if(bus.frequency)accept(bus.frequency);
      const idle=t=>{const out=new Uint8Array(BINS);for(let i=0;i<BINS;i++)out[i]=Math.round(10+8*(Math.sin(t*.0018+i*.58)+1));return out};
      const push=t=>{
        if(t-lastPush<62)return false;lastPush=t;
        const playing=!!audio&&!audio.paused&&!audio.ended;
        history[write]=playing&&latest?new Uint8Array(latest):idle(t);sourceType=playing&&latest?'internal-master':'internal-idle';
        write=(write+1)%ROWS;count=Math.min(ROWS,count+1);return true;
      };
      const rowAt=r=>history[(write-1-r+ROWS)%ROWS];
      const state=()=>w.__enochAnalyserGesture||{view:{yaw:0,pitch:0,zoom:1},deform:{}};
      const depth=()=>clamp((parseFloat(d.getElementById('modWheelV')?.textContent)||0)/100,0,1);
      const mod=()=>w.__enochSignalModulation===true||d.getElementById('signalModToggle')?.getAttribute('aria-pressed')==='true';
      const project=(bin,row,val,W,H,s)=>{
        const view=s.view||{},def=s.deform||{},zoom=clamp(view.zoom||1,.55,2.6),nx=bin/(BINS-1)-.5,nz=row/(ROWS-1);
        let x=nx*W*.88,z=nz*H*1.58*zoom,y=(val/255-.08)*H*.92;
        const gb=Number.isFinite(def.grabBin)?def.grabBin:(BINS-1)/2,gr=Number.isFinite(def.grabRow)?def.grabRow:0;
        const dx=(bin-gb)/(BINS-1),dz=(row-gr)/(ROWS-1),radius=clamp(def.radius||.25,.08,.65);
        const influence=mod()?Math.exp(-(dx*dx+dz*dz*1.5)/(2*radius*radius))*depth():0;
        y+=(def.pullY||0)*H*.62*influence;z+=(def.pullZ||0)*H*.94*influence;
        const a=(def.twist||0)*influence,c=Math.cos(a),si=Math.sin(a),ox=x,oz=z;x=ox*c-oz*si;z=ox*si+oz*c;
        const yaw=clamp(view.yaw||0,-1.15,1.15),pitch=clamp(view.pitch||0,-.72,.72),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
        const xr=x*cy-z*sy,zr=x*sy+z*cy,yr=y*cp-zr*sp,z2=y*sp+zr*cp,p=1/(1+Math.max(-H*1.2,z2)/(H*2.05));
        return{x:W*.5+xr*p,y:H*.79-yr*p-z2*.1,p,influence};
      };
      const paint=t=>{
        raf=w.requestAnimationFrame(paint);const advanced=push(t),s=state(),v=s.view||{},df=s.deform||{};
        const control=[v.yaw,v.pitch,v.zoom,df.grabBin,df.grabRow,df.pullY,df.pullZ,df.twist,mod(),depth(),sourceType].join('|');
        if(control!==lastControl){lastControl=control;dirty=true}
        const moving=s.dragging||Math.abs(v.yawV||0)>.00002||Math.abs(v.pitchV||0)>.00002||Math.abs(df.vY||0)>.00002||Math.abs(df.vZ||0)>.00002;
        if(!advanced&&!dirty&&!moving||t-lastPaint<33)return;lastPaint=t;dirty=false;
        const rect=canvas.getBoundingClientRect(),dpr=Math.min(1.75,w.devicePixelRatio||1),W=Math.max(1,Math.floor(rect.width*dpr)),H=Math.max(1,Math.floor(rect.height*dpr));
        if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
        const c=canvas.getContext('2d');c.clearRect(0,0,W,H);projected=Array.from({length:ROWS},()=>Array(BINS));
        for(let r=ROWS-1;r>=0;r--){const row=rowAt(r),alpha=.1+(1-r/ROWS)*.62;c.strokeStyle='rgba(121,234,219,'+alpha+')';c.lineWidth=(r===0?1.7:1)*dpr;c.beginPath();for(let i=0;i<BINS;i++){const p=project(i,r,row[i],W,H,s);projected[r][i]=p;if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y)}c.stroke()}
        c.strokeStyle='rgba(213,170,99,.28)';c.lineWidth=.75*dpr;
        for(let i=0;i<BINS;i+=2){c.beginPath();for(let r=0;r<ROWS;r++){const p=projected[r][i];if(r)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y)}c.stroke()}
        if(mod()&&Number.isFinite(df.grabBin)){const p=projected[clamp(Math.round(df.grabRow||0),0,ROWS-1)]?.[clamp(Math.round(df.grabBin),0,BINS-1)];if(p){c.strokeStyle='rgba(255,157,52,.98)';c.lineWidth=1.25*dpr;c.beginPath();c.arc(p.x,p.y,4*dpr,0,Math.PI*2);c.stroke()}}
      };
      const pick=(x,y)=>{const r=canvas.getBoundingClientRect();if(!r.width||!projected.length)return null;const sx=canvas.width/r.width,sy=canvas.height/r.height,px=(x-r.left)*sx,py=(y-r.top)*sy;let best=null,dist=Infinity;for(let row=0;row<ROWS;row++)for(let bin=0;bin<BINS;bin++){const p=projected[row]?.[bin];if(!p)continue;const q=(p.x-px)**2+(p.y-py)**2;if(q<dist){dist=q;best={bin,row,distance:Math.sqrt(q)/Math.max(sx,sy)}}}return best};
      w.__enochAnalyser3D={version:'v7',input:'internal-master-mix',mode:()=>sourceType,pick,invalidate:()=>{dirty=true},getHistory:()=>Array.from({length:ROWS},(_,r)=>new Uint8Array(rowAt(r))),getProjected:()=>projected};
      w.addEventListener('resize',()=>{dirty=true});w.addEventListener('pagehide',()=>{off();if(raf)w.cancelAnimationFrame(raf);delete w.__enochAnalyser3D},{once:true});
      raf=w.requestAnimationFrame(paint);return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserSignal3D=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();