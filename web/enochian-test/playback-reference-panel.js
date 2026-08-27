(()=>{
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
    if(d.documentElement.dataset.playbackReferencePanel==='v1')return true;
    const audio=d.getElementById('audio'),name=d.getElementById('name'),wave=d.getElementById('trackWave');
    const prev=d.getElementById('prev'),play=d.getElementById('play'),next=d.getElementById('next'),track=d.getElementById('track');
    const pitch=d.getElementById('pitch'),pitchVal=d.getElementById('pitchVal');
    const loopToggle=d.getElementById('loopToggle'),loopIn=d.getElementById('loopIn'),loopOut=d.getElementById('loopOut'),loopReset=d.getElementById('loopReset');
    if(!audio||!name||!wave||!prev||!play||!next||!pitch||!loopIn||!loopOut)return false;
    const side=name.closest('aside.side')||name.closest('.side');if(!side)return false;
    d.documentElement.dataset.playbackReferencePanel='v1';

    const style=d.createElement('style');
    style.textContent=`
      .ref-playback{border:1px solid #164c59!important;border-radius:0!important;background:#02090d!important;padding:7px!important;display:grid!important;gap:6px!important;box-shadow:inset 0 0 18px #00151c!important;color:#9debf4!important}
      .ref-playback *{box-sizing:border-box}.ref-playback-head{display:flex;align-items:center;gap:7px;height:22px;border-bottom:1px solid #0c3440;color:#8de8f1;font-size:9px;letter-spacing:.14em;font-weight:800}.ref-playback-head:before{content:'▰';font-size:7px;color:#65d8e6}.ref-playback-track{display:grid;grid-template-columns:54px minmax(0,1fr);gap:7px;align-items:center}.ref-cover{width:54px;height:46px;border:1px solid #124654;background:radial-gradient(circle at 50% 50%,#073b47 0 18%,#03151b 19% 42%,#0a2c35 43% 45%,#02080b 46%);display:grid;place-items:center;color:#43d5e8;font-size:22px;text-shadow:0 0 10px #2ed9ee}.ref-track-title{font-size:10px;color:#42d6e6;font-weight:900;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ref-track-sub{margin-top:2px;font-size:7px;color:#22b9cd;font-weight:800;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ref-meta{margin-top:4px;display:flex;gap:12px;align-items:center;font-size:7px;color:#96cbd0}.ref-wave-shell{position:relative;border:1px solid #164c59;background:#001016;overflow:hidden;height:52px}.ref-wave-shell #trackWave{display:block!important;width:100%!important;height:50px!important;border:0!important;border-radius:0!important;background:#001016!important;filter:hue-rotate(115deg) saturate(1.45) brightness(1.2)}.ref-playhead{position:absolute;top:0;bottom:0;width:1px;background:#f3a11a;box-shadow:0 0 7px #f3a11a;pointer-events:none;z-index:4}.ref-overview-shell{position:relative;height:29px;border:1px solid #164c59;background:#001016;overflow:hidden}.ref-overview{display:block;width:100%;height:27px;opacity:.58}.ref-loop-region{position:absolute;top:0;bottom:0;border:1px solid #ec9816;border-top:0;border-bottom:0;background:#e78d0b18;pointer-events:none;display:none}.ref-loop-region:after{content:'';position:absolute;right:0;top:0;width:1px;height:100%;background:#ef9816;box-shadow:0 0 6px #ef9816}.ref-transport{display:grid;grid-template-columns:1fr 1fr 1.15fr 1fr 1fr;gap:4px}.ref-playback .ref-btn,.ref-playback button{min-width:0;border:1px solid #1a5664!important;border-radius:0!important;background:#020b0f!important;color:#9bdde5!important;height:27px;padding:3px 4px!important;font-size:8px!important;box-shadow:none!important}.ref-playback button:hover,.ref-playback button:focus-visible{border-color:#43d5e8!important;color:#d7fbff!important;outline:none}.ref-playback #play{border-color:#c77412!important;color:#f1a01d!important;font-size:14px!important}.ref-loop-title{font-size:7px;color:#7199a0;letter-spacing:.12em}.ref-loop-controls{display:grid;grid-template-columns:minmax(92px,1.35fr) .7fr .7fr .7fr;gap:4px}.ref-bars{display:grid;grid-template-columns:28px 1fr 28px;gap:0;border:1px solid #16505c}.ref-bars button{border:0!important;height:25px!important}.ref-bars-value{display:flex;align-items:center;justify-content:center;color:#ee9b18;font-size:8px;font-weight:900;border-left:1px solid #164955;border-right:1px solid #164955}.ref-pitch-title{display:flex;justify-content:space-between;align-items:end;font-size:7px;color:#7199a0;letter-spacing:.12em}.ref-pitch-value{color:#ef9a17;font-weight:900;letter-spacing:0}.ref-pitch-row{display:grid;grid-template-columns:16px minmax(0,1fr) 16px 45px;gap:4px;align-items:center}.ref-pitch-row span{font-size:7px;color:#779da3;text-align:center}.ref-pitch{width:100%;height:18px;margin:0;accent-color:#ee9917}.ref-reset{height:24px!important;font-size:7px!important}.ref-native-hidden{display:none!important}
      @media(max-width:1000px){.ref-playback{grid-column:1/-1}.ref-playback-track{grid-template-columns:46px minmax(0,1fr)}.ref-cover{width:46px;height:42px}}
    `;
    d.head.appendChild(style);

    const panel=d.createElement('section');panel.className='ref-playback';panel.setAttribute('aria-label','Playback');
    panel.innerHTML=`<div class="ref-playback-head">PLAYBACK</div><div class="ref-playback-track"><div class="ref-cover" aria-hidden="true">⟁</div><div><div class="ref-track-title"></div><div class="ref-track-sub">ENOCHIAN ORAL TRADITIONS</div><div class="ref-meta"><span class="ref-time">00:00 / 00:00</span><span class="ref-bitrate">320 KBPS</span><span class="ref-key">Am</span></div></div></div><div class="ref-wave-shell"><div class="ref-playhead"></div></div><div class="ref-overview-shell"><canvas class="ref-overview"></canvas><div class="ref-loop-region"></div></div><div class="ref-transport"><button class="ref-btn ref-cue" type="button">CUE</button></div><div class="ref-loop-title">LOOP</div><div class="ref-loop-controls"><div class="ref-bars"><button class="ref-bars-down" type="button">‹</button><div class="ref-bars-value">8 BARS</div><button class="ref-bars-up" type="button">›</button></div></div><div class="ref-pitch-title"><span>PITCH</span><span class="ref-pitch-value">0.00%</span></div><div class="ref-pitch-row"><span>-8</span><input class="ref-pitch" type="range" min="-8" max="8" step="0.05" value="0" aria-label="Pitch percentage"><span>+8</span><button class="ref-reset" type="button">RESET</button></div>`;

    const oldNow=name.closest('.box');
    if(oldNow)side.insertBefore(panel,oldNow);else side.prepend(panel);
    const waveShell=panel.querySelector('.ref-wave-shell');waveShell.appendChild(wave);
    const transport=panel.querySelector('.ref-transport');transport.append(prev,play,next);
    const pause=d.createElement('button');pause.type='button';pause.className='ref-btn ref-pause';pause.textContent='Ⅱ';transport.appendChild(pause);
    const cue=panel.querySelector('.ref-cue');
    const loopControls=panel.querySelector('.ref-loop-controls');
    const bars=panel.querySelector('.ref-bars');loopControls.append(bars,loopIn,loopOut);
    const x2=d.createElement('button');x2.type='button';x2.className='ref-btn ref-x2';x2.textContent='X2';loopControls.appendChild(x2);
    if(oldNow)oldNow.classList.add('ref-native-hidden');
    if(track)track.classList.add('ref-native-hidden');
    const oldTransport=prev.closest('.transport');if(oldTransport&&oldTransport!==transport)oldTransport.classList.add('ref-native-hidden');
    const pitchBox=pitch.closest('.box');if(pitchBox)pitchBox.classList.add('ref-native-hidden');
    if(loopToggle)loopToggle.classList.add('ref-native-hidden');if(loopReset)loopReset.classList.add('ref-native-hidden');

    const title=panel.querySelector('.ref-track-title'),sub=panel.querySelector('.ref-track-sub'),time=panel.querySelector('.ref-time'),bitrate=panel.querySelector('.ref-bitrate'),key=panel.querySelector('.ref-key');
    const playhead=panel.querySelector('.ref-playhead'),overview=panel.querySelector('.ref-overview'),region=panel.querySelector('.ref-loop-region');
    const barValue=panel.querySelector('.ref-bars-value'),refPitch=panel.querySelector('.ref-pitch'),refPitchValue=panel.querySelector('.ref-pitch-value');
    let cuePoint=0,barsCount=8;
    const barsSet=[1,2,4,8,16,32];
    const selectionMeta=()=>track&&track.selectedOptions&&track.selectedOptions[0]?track.selectedOptions[0]:null;
    const syncMeta=()=>{const opt=selectionMeta();title.textContent=name.textContent||opt?.textContent||'CHANSON À RÉPONDRE';sub.textContent=opt?.dataset?.subtitle||audio.dataset.subtitle||'ENOCHIAN ORAL TRADITIONS';bitrate.textContent=opt?.dataset?.bitrate||audio.dataset.bitrate||'320 KBPS';key.textContent=opt?.dataset?.key||audio.dataset.key||'Am'};
    const syncTime=()=>{const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;time.textContent=fmt(audio.currentTime)+' / '+fmt(duration);const pct=duration?clamp(audio.currentTime/duration,0,1):0;playhead.style.left=(pct*100)+'%';const authority=w.__enochLoopAuthority;if(authority&&authority.end!=null&&duration){const a=clamp(authority.start/duration,0,1),b=clamp(authority.end/duration,0,1);region.style.display='block';region.style.left=(a*100)+'%';region.style.width=(Math.max(0,b-a)*100)+'%'}else region.style.display='none'};
    const syncOverview=()=>{try{const ctx2=overview.getContext('2d'),rect=overview.getBoundingClientRect(),ratio=Math.max(1,w.devicePixelRatio||1);const width=Math.max(2,Math.floor(rect.width*ratio)),height=Math.max(2,Math.floor(rect.height*ratio));if(overview.width!==width||overview.height!==height){overview.width=width;overview.height=height}ctx2.clearRect(0,0,width,height);ctx2.globalAlpha=.78;ctx2.drawImage(wave,0,0,width,height)}catch(_){}};
    const syncPitch=()=>{const pct=clamp(((Number(audio.playbackRate)||1)-1)*100,-8,8);refPitch.value=pct.toFixed(2);refPitchValue.textContent=(pct>0?'+':'')+pct.toFixed(2)+'%'};
    const applyPitch=()=>{const pct=Number(refPitch.value)||0,rate=1+pct/100;refPitchValue.textContent=(pct>0?'+':'')+pct.toFixed(2)+'%';const semi=12*Math.log2(rate);pitch.value=String(semi);pitch.dispatchEvent(new w.Event('input',{bubbles:true}));if(Math.abs((Number(audio.playbackRate)||1)-rate)>.002)audio.playbackRate=rate};
    refPitch.addEventListener('input',applyPitch);panel.querySelector('.ref-reset').addEventListener('click',()=>{refPitch.value='0';applyPitch()});audio.addEventListener('ratechange',syncPitch);
    cue.addEventListener('click',()=>{if(audio.paused){cuePoint=Math.max(0,Number(audio.currentTime)||0);cue.textContent='CUE '+fmt(cuePoint)}else{audio.pause();audio.currentTime=cuePoint}});
    pause.addEventListener('click',()=>audio.pause());
    panel.querySelector('.ref-bars-down').addEventListener('click',()=>{const i=Math.max(0,barsSet.indexOf(barsCount));barsCount=barsSet[Math.max(0,i-1)];barValue.textContent=barsCount+' BARS'});
    panel.querySelector('.ref-bars-up').addEventListener('click',()=>{const i=Math.max(0,barsSet.indexOf(barsCount));barsCount=barsSet[Math.min(barsSet.length-1,i+1)];barValue.textContent=barsCount+' BARS'});
    x2.addEventListener('click',()=>{const i=Math.max(0,barsSet.indexOf(barsCount));barsCount=barsSet[Math.min(barsSet.length-1,i+1)];barValue.textContent=barsCount+' BARS'});
    name.addEventListener('DOMSubtreeModified',syncMeta);if(track)track.addEventListener('change',()=>w.setTimeout(syncMeta,0));
    audio.addEventListener('timeupdate',syncTime);audio.addEventListener('durationchange',syncTime);audio.addEventListener('loadedmetadata',()=>{syncMeta();syncTime()});
    const observer=new w.MutationObserver(()=>syncMeta());observer.observe(name,{childList:true,characterData:true,subtree:true});
    let raf=0;const paint=()=>{syncTime();syncOverview();raf=w.requestAnimationFrame(paint)};raf=w.requestAnimationFrame(paint);
    w.addEventListener('pagehide',()=>{if(raf)w.cancelAnimationFrame(raf);observer.disconnect()},{once:true});
    syncMeta();syncTime();syncPitch();syncOverview();
    return true;
  }
  function boot(frame){let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)}
  window.installEnochianPlaybackReference=boot;
  if(window.__enochPlaybackFrame)boot(window.__enochPlaybackFrame);
})();