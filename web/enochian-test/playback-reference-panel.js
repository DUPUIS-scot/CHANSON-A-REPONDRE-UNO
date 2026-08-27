(()=>{
  'use strict';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const fmt=v=>{v=Math.max(0,Number(v)||0);const m=Math.floor(v/60),s=Math.floor(v%60);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')};
  function resolve(frame){
    try{
      const live=frame&&frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      return d&&w?{d,w}:null;
    }catch(_){return null}
  }
  function install(frame){
    const ctx=resolve(frame);if(!ctx)return false;
    const {d,w}=ctx;
    if(d.documentElement.dataset.playbackReferencePanel==='v2')return true;
    const audio=d.getElementById('audio'),name=d.getElementById('name'),nativeWave=d.getElementById('trackWave');
    const prev=d.getElementById('prev'),play=d.getElementById('play'),next=d.getElementById('next'),track=d.getElementById('track');
    const pitch=d.getElementById('pitch'),loopToggle=d.getElementById('loopToggle'),loopIn=d.getElementById('loopIn'),loopOut=d.getElementById('loopOut'),loopReset=d.getElementById('loopReset');
    if(!audio||!name||!nativeWave||!prev||!play||!next||!pitch||!loopIn||!loopOut)return false;
    const side=name.closest('aside.side')||name.closest('.side');if(!side)return false;
    d.querySelector('.ref-playback')?.remove();
    d.documentElement.dataset.playbackReferencePanel='v2';

    const style=d.createElement('style');
    style.textContent=`
      .ref-playback{border:1px solid #164c59!important;border-radius:0!important;background:#02090d!important;padding:7px!important;display:grid!important;gap:6px!important;box-shadow:inset 0 0 18px #00151c!important;color:#9debf4!important}
      .ref-playback *{box-sizing:border-box}.ref-playback-head{display:flex;align-items:center;gap:7px;height:22px;border-bottom:1px solid #0c3440;color:#8de8f1;font-size:9px;letter-spacing:.14em;font-weight:800}.ref-playback-head:before{content:'▰';font-size:7px;color:#65d8e6}.ref-playback-track{display:grid;grid-template-columns:54px minmax(0,1fr);gap:7px;align-items:center}.ref-cover{width:54px;height:46px;border:1px solid #124654;background:radial-gradient(circle at 50% 50%,#073b47 0 18%,#03151b 19% 42%,#0a2c35 43% 45%,#02080b 46%);display:grid;place-items:center;color:#43d5e8;font-size:22px;text-shadow:0 0 10px #2ed9ee}.ref-track-title{font-size:10px;color:#42d6e6;font-weight:900;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ref-track-sub{margin-top:2px;font-size:7px;color:#22b9cd;font-weight:800;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ref-meta{margin-top:4px;display:flex;gap:12px;align-items:center;font-size:7px;color:#96cbd0}
      .ref-wave-shell,.ref-overview-shell{position:relative;border:1px solid #164c59;background:#110504;overflow:hidden;cursor:pointer}.ref-wave-shell{height:54px}.ref-overview-shell{height:30px}.ref-main-wave,.ref-overview{display:block;width:100%;height:100%}.ref-playhead{position:absolute;top:0;bottom:0;width:2px;background:#ff9d1d;box-shadow:0 0 8px #ff9d1d;pointer-events:none;z-index:8}.ref-loop-region{position:absolute;top:0;bottom:0;border-left:1px solid #ffb43c;border-right:1px solid #ffb43c;background:#ff8a141c;pointer-events:none;display:none;z-index:6}.ref-loop-region:before,.ref-loop-region:after{content:'';position:absolute;top:0;bottom:0;width:1px;background:#ffb43c;box-shadow:0 0 5px #ff9d1d}.ref-loop-region:before{left:0}.ref-loop-region:after{right:0}
      .ref-transport{display:grid;grid-template-columns:1fr 1fr 1.15fr 1fr 1fr;gap:4px}.ref-playback .ref-btn,.ref-playback button{min-width:0;border:1px solid #1a5664!important;border-radius:0!important;background:#020b0f!important;color:#9bdde5!important;height:27px;padding:3px 4px!important;font-size:8px!important;box-shadow:none!important}.ref-playback button:hover,.ref-playback button:focus-visible{border-color:#43d5e8!important;color:#d7fbff!important;outline:none}.ref-playback #play{border-color:#c77412!important;color:#f1a01d!important;font-size:14px!important}.ref-loop-title{font-size:7px;color:#7199a0;letter-spacing:.12em}.ref-loop-controls{display:grid;grid-template-columns:minmax(92px,1.35fr) .7fr .7fr .7fr;gap:4px}.ref-bars{display:grid;grid-template-columns:28px 1fr 28px;gap:0;border:1px solid #16505c}.ref-bars button{border:0!important;height:25px!important}.ref-bars-value{display:flex;align-items:center;justify-content:center;color:#ee9b18;font-size:8px;font-weight:900;border-left:1px solid #164955;border-right:1px solid #164955}.ref-pitch-title{display:flex;justify-content:space-between;align-items:end;font-size:7px;color:#7199a0;letter-spacing:.12em}.ref-pitch-value{color:#ef9a17;font-weight:900;letter-spacing:0}.ref-pitch-row{display:grid;grid-template-columns:16px minmax(0,1fr) 16px 45px;gap:4px;align-items:center}.ref-pitch-row span{font-size:7px;color:#779da3;text-align:center}.ref-pitch{width:100%;height:18px;margin:0;accent-color:#ee9917}.ref-reset{height:24px!important;font-size:7px!important}.ref-native-hidden{display:none!important}
      @media(max-width:1000px){.ref-playback{grid-column:1/-1}.ref-playback-track{grid-template-columns:46px minmax(0,1fr)}.ref-cover{width:46px;height:42px}}
    `;
    d.head.appendChild(style);

    const panel=d.createElement('section');panel.className='ref-playback';panel.setAttribute('aria-label','Playback');
    panel.innerHTML=`<div class="ref-playback-head">PLAYBACK</div><div class="ref-playback-track"><div class="ref-cover" aria-hidden="true">⟁</div><div><div class="ref-track-title"></div><div class="ref-track-sub">ENOCHIAN ORAL TRADITIONS</div><div class="ref-meta"><span class="ref-time">00:00 / 00:00</span><span class="ref-bitrate">320 KBPS</span><span class="ref-key">Am</span></div></div></div><div class="ref-wave-shell"><canvas class="ref-main-wave"></canvas><div class="ref-loop-region ref-loop-main"></div><div class="ref-playhead ref-main-playhead"></div></div><div class="ref-overview-shell"><canvas class="ref-overview"></canvas><div class="ref-loop-region ref-loop-overview"></div><div class="ref-playhead ref-overview-playhead"></div></div><div class="ref-transport"><button class="ref-btn ref-cue" type="button">CUE</button></div><div class="ref-loop-title">LOOP</div><div class="ref-loop-controls"><div class="ref-bars"><button class="ref-bars-down" type="button">‹</button><div class="ref-bars-value">8 BARS</div><button class="ref-bars-up" type="button">›</button></div></div><div class="ref-pitch-title"><span>PITCH</span><span class="ref-pitch-value">0.00%</span></div><div class="ref-pitch-row"><span>-8</span><input class="ref-pitch" type="range" min="-8" max="8" step="0.05" value="0" aria-label="Pitch percentage"><span>+8</span><button class="ref-reset" type="button">RESET</button></div>`;
    const oldNow=name.closest('.box');if(oldNow)side.insertBefore(panel,oldNow);else side.prepend(panel);
    const transport=panel.querySelector('.ref-transport');transport.append(prev,play,next);
    const pause=d.createElement('button');pause.type='button';pause.className='ref-btn ref-pause';pause.textContent='Ⅱ';transport.appendChild(pause);
    const loopControls=panel.querySelector('.ref-loop-controls'),bars=panel.querySelector('.ref-bars');loopControls.append(bars,loopIn,loopOut);
    const x2=d.createElement('button');x2.type='button';x2.className='ref-btn ref-x2';x2.textContent='X2';loopControls.appendChild(x2);
    if(oldNow)oldNow.classList.add('ref-native-hidden');if(track)track.classList.add('ref-native-hidden');nativeWave.classList.add('ref-native-hidden');
    const oldTransport=prev.closest('.transport');if(oldTransport&&oldTransport!==transport)oldTransport.classList.add('ref-native-hidden');const pitchBox=pitch.closest('.box');if(pitchBox)pitchBox.classList.add('ref-native-hidden');if(loopToggle)loopToggle.classList.add('ref-native-hidden');if(loopReset)loopReset.classList.add('ref-native-hidden');

    const title=panel.querySelector('.ref-track-title'),sub=panel.querySelector('.ref-track-sub'),time=panel.querySelector('.ref-time'),bitrate=panel.querySelector('.ref-bitrate'),key=panel.querySelector('.ref-key');
    const mainWave=panel.querySelector('.ref-main-wave'),overview=panel.querySelector('.ref-overview'),mainHead=panel.querySelector('.ref-main-playhead'),overviewHead=panel.querySelector('.ref-overview-playhead'),regions=[panel.querySelector('.ref-loop-main'),panel.querySelector('.ref-loop-overview')];
    const barValue=panel.querySelector('.ref-bars-value'),refPitch=panel.querySelector('.ref-pitch'),refPitchValue=panel.querySelector('.ref-pitch-value'),cue=panel.querySelector('.ref-cue');
    const barsSet=[1,2,4,8,16,32];let barsCount=8,cuePoint=0,peaks=null,decodeToken=0,lastSource='';
    const selectionMeta=()=>track&&track.selectedOptions&&track.selectedOptions[0]?track.selectedOptions[0]:null;
    const bpm=()=>Math.max(40,Math.min(240,Number(selectionMeta()?.dataset?.bpm||audio.dataset.bpm||120)||120));
    const syncMeta=()=>{const opt=selectionMeta();title.textContent=name.textContent||opt?.textContent||'CHANSON À RÉPONDRE';sub.textContent=opt?.dataset?.subtitle||audio.dataset.subtitle||'ENOCHIAN ORAL TRADITIONS';bitrate.textContent=opt?.dataset?.bitrate||audio.dataset.bitrate||'320 KBPS';key.textContent=opt?.dataset?.key||audio.dataset.key||'Am'};

    const sourceUrl=()=>audio.currentSrc||audio.src||'';
    async function decodeTrack(){
      const src=sourceUrl();if(!src||src===lastSource&&peaks)return;lastSource=src;const token=++decodeToken;peaks=null;
      try{
        const response=await w.fetch(src,{cache:'force-cache'});if(!response.ok)throw new Error('wave fetch '+response.status);
        const bytes=await response.arrayBuffer(),AC=w.AudioContext||w.webkitAudioContext;if(!AC)throw new Error('AudioContext unavailable');
        const ac=new AC(),buffer=await ac.decodeAudioData(bytes.slice(0));try{await ac.close()}catch(_){}if(token!==decodeToken)return;
        const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),count=2048,out=new Float32Array(count);
        for(let i=0;i<count;i++){const a=Math.floor(i*buffer.length/count),b=Math.max(a+1,Math.floor((i+1)*buffer.length/count));let peak=0;for(const ch of channels){for(let j=a;j<b;j+=Math.max(1,Math.floor((b-a)/12)))peak=Math.max(peak,Math.abs(ch[j]||0))}out[i]=peak}peaks=out;drawAll();
      }catch(_){peaks=null;drawAll()}
    }
    const sizeCanvas=canvas=>{const rect=canvas.getBoundingClientRect(),ratio=Math.max(1,Math.min(2,w.devicePixelRatio||1)),W=Math.max(2,Math.floor(rect.width*ratio)),H=Math.max(2,Math.floor(rect.height*ratio));if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}return{W,H}};
    const drawWave=(canvas,progress)=>{const {W,H}=sizeCanvas(canvas),c=canvas.getContext('2d');c.clearRect(0,0,W,H);c.fillStyle='#110504';c.fillRect(0,0,W,H);const draw=color=>{c.strokeStyle=color;c.lineWidth=Math.max(1,W/900);c.beginPath();for(let x=0;x<W;x++){const p=peaks?peaks[Math.min(peaks.length-1,Math.floor(x/W*peaks.length))]:.16+.08*Math.sin(x*.07),amp=Math.max(1,p*H*.46),mid=H*.5;c.moveTo(x,mid-amp);c.lineTo(x,mid+amp)}c.stroke()};draw('#7e2118');c.save();c.beginPath();c.rect(0,0,W*progress,H);c.clip();draw('#ff9d1d');c.restore();c.strokeStyle='#4c1611';c.lineWidth=1;c.beginPath();c.moveTo(0,H*.5);c.lineTo(W,H*.5);c.stroke()};
    const drawAll=()=>{const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,p=duration?clamp(audio.currentTime/duration,0,1):0;drawWave(mainWave,p);drawWave(overview,p)};
    const syncTime=()=>{const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,pct=duration?clamp(audio.currentTime/duration,0,1):0;time.textContent=fmt(audio.currentTime)+' / '+fmt(duration);mainHead.style.left=overviewHead.style.left=(pct*100)+'%';const authority=w.__enochLoopAuthority;if(authority&&authority.end!=null&&duration){const a=clamp(authority.start/duration,0,1),b=clamp(authority.end/duration,0,1);regions.forEach(region=>{region.style.display='block';region.style.left=(a*100)+'%';region.style.width=(Math.max(0,b-a)*100)+'%'})}else regions.forEach(region=>region.style.display='none');drawAll()};
    const seekFrom=e=>{const rect=e.currentTarget.getBoundingClientRect(),duration=Number.isFinite(audio.duration)?audio.duration:0;if(!duration)return;audio.currentTime=clamp((e.clientX-rect.left)/Math.max(1,rect.width),0,1)*duration};
    panel.querySelector('.ref-wave-shell').addEventListener('pointerdown',seekFrom);panel.querySelector('.ref-overview-shell').addEventListener('pointerdown',seekFrom);

    const setAuthoritativeRange=(start,end)=>{const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;if(!duration)return false;start=clamp(start,0,duration-.05);end=clamp(end,start+.05,duration);const pos=audio.currentTime,wasPlaying=!audio.paused&&!audio.ended;if(wasPlaying)audio.pause();audio.currentTime=start;loopIn.click();audio.currentTime=end;loopOut.click();audio.currentTime=clamp(pos,0,duration);if(wasPlaying)audio.play().catch(()=>{});syncTime();return true};
    const applyBars=()=>{const authority=w.__enochLoopAuthority,start=authority?.end!=null?Number(authority.start)||0:Number(audio.currentTime)||0,length=barsCount*4*60/bpm();return setAuthoritativeRange(start,start+length)};
    const setBars=count=>{barsCount=count;barValue.textContent=barsCount+' BARS';applyBars()};
    panel.querySelector('.ref-bars-down').addEventListener('click',()=>{const i=Math.max(0,barsSet.indexOf(barsCount));setBars(barsSet[Math.max(0,i-1)])});
    panel.querySelector('.ref-bars-up').addEventListener('click',()=>{const i=Math.max(0,barsSet.indexOf(barsCount));setBars(barsSet[Math.min(barsSet.length-1,i+1)])});
    x2.addEventListener('click',()=>{const i=Math.max(0,barsSet.indexOf(barsCount));setBars(barsSet[Math.min(barsSet.length-1,i+1)])});

    const syncPitch=()=>{const pct=clamp(((Number(audio.playbackRate)||1)-1)*100,-8,8);refPitch.value=pct.toFixed(2);refPitchValue.textContent=(pct>0?'+':'')+pct.toFixed(2)+'%'};
    const applyPitch=()=>{const pct=Number(refPitch.value)||0,rate=1+pct/100;refPitchValue.textContent=(pct>0?'+':'')+pct.toFixed(2)+'%';const semi=12*Math.log2(rate);pitch.value=String(semi);pitch.dispatchEvent(new w.Event('input',{bubbles:true}));if(Math.abs((Number(audio.playbackRate)||1)-rate)>.002)audio.playbackRate=rate};
    refPitch.addEventListener('input',applyPitch);panel.querySelector('.ref-reset').addEventListener('click',()=>{refPitch.value='0';applyPitch()});audio.addEventListener('ratechange',syncPitch);
    cue.addEventListener('click',()=>{if(audio.paused){cuePoint=Math.max(0,Number(audio.currentTime)||0);cue.textContent='CUE '+fmt(cuePoint)}else{audio.pause();audio.currentTime=cuePoint}});pause.addEventListener('click',()=>audio.pause());
    if(track)track.addEventListener('change',()=>w.setTimeout(()=>{syncMeta();decodeTrack()},0));
    audio.addEventListener('timeupdate',syncTime);audio.addEventListener('durationchange',syncTime);audio.addEventListener('loadedmetadata',()=>{syncMeta();syncTime();decodeTrack()});audio.addEventListener('loadeddata',decodeTrack);audio.addEventListener('emptied',()=>{peaks=null;lastSource='';decodeToken++;drawAll()});
    const observer=new w.MutationObserver(()=>syncMeta());observer.observe(name,{childList:true,characterData:true,subtree:true});
    const resize=()=>drawAll();w.addEventListener('resize',resize);w.addEventListener('orientationchange',()=>w.setTimeout(resize,80));
    w.__enochPlaybackWaveform={version:'v2',get peaks(){return peaks},decode:decodeTrack,draw:drawAll,setLoopBars:setBars,get bars(){return barsCount}};
    w.addEventListener('pagehide',()=>{observer.disconnect();w.removeEventListener('resize',resize);delete w.__enochPlaybackWaveform},{once:true});
    syncMeta();syncTime();syncPitch();decodeTrack();
    return true;
  }
  function boot(frame){let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)}
  window.installEnochianPlaybackReference=boot;
  if(window.__enochPlaybackFrame)boot(window.__enochPlaybackFrame);
})();