(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const fmt=v=>{v=Math.max(0,Number(v)||0);const m=Math.floor(v/60),s=(v-m*60).toFixed(1).padStart(4,'0');return String(m).padStart(2,'0')+':'+s};
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const master=d.getElementById('audio'),play=d.getElementById('play'),isolator=d.querySelector('.stem-isolator');
      const loop=d.getElementById('loopToggle'),loopIn=d.getElementById('loopIn'),loopOut=d.getElementById('loopOut'),loopReset=d.getElementById('loopReset');
      const stemMaster=d.getElementById('stemMasterToggle');
      if(!master||!isolator||!loop||!loopIn||!loopOut||!loopReset||!stemMaster)return false;
      if(d.documentElement.dataset.authoritativeRuntime==='v2')return true;
      d.documentElement.dataset.authoritativeRuntime='v2';

      const style=d.createElement('style');
      style.textContent=`#loopToggle.loop-authority-on{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important;box-shadow:0 0 12px #d5aa6355!important;font-weight:900!important}#stemMasterToggle.stem-loading{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important}#stemMasterToggle.stem-fallback{color:#ffb2a5!important;border-color:#633c35!important;background:#170806!important}.stem-value{color:#f0c97e!important}`;
      d.head.appendChild(style);

      // One authoritative loop controller. The older native handlers are detached so only
      // this controller owns loop state, timer, labels and wrap timing.
      loop.onclick=loopIn.onclick=loopOut.onclick=loopReset.onclick=null;
      let loopEnabled=false,loopStart=0,loopEnd=null,loopTimer=0,lastWrap=0;
      const loopUi=()=>{
        loop.classList.toggle('active',loopEnabled);loop.classList.toggle('loop-authority-on',loopEnabled);
        loop.setAttribute('aria-pressed',String(loopEnabled));
        loop.textContent=loopEnabled?'LOOP '+fmt(master.currentTime||0):'LOOP OFF';
        loopIn.textContent='IN '+fmt(loopStart);
        loopOut.textContent='OUT '+(loopEnd==null?'--:--.-':fmt(loopEnd));
      };
      const wrap=()=>{
        if(!loopEnabled||loopEnd==null)return;
        const now=performance.now();if(now-lastWrap<80)return;lastWrap=now;
        try{master.currentTime=loopStart}catch(_){}
        try{d.getElementById('log')?.prepend(Object.assign(d.createElement('div'),{className:'signal-flow-line',textContent:'LOOP CYCLE · '+fmt(loopStart)+' → '+fmt(loopEnd)}))}catch(_){}
      };
      const loopTick=()=>{if(loopTimer)w.clearTimeout(loopTimer);if(loopEnabled&&loopEnd!=null&&!master.paused&&master.currentTime>=loopEnd-.025)wrap();loopUi();loopTimer=w.setTimeout(loopTick,40)};
      loopIn.addEventListener('click',()=>{loopStart=Math.max(0,Number(master.currentTime)||0);if(loopEnd!=null&&loopEnd<=loopStart+.05)loopEnd=null;loopUi()});
      loopOut.addEventListener('click',()=>{const out=Math.max(0,Number(master.currentTime)||0);if(out<=loopStart+.05)return;loopEnd=out;loopEnabled=true;loopUi()});
      loop.addEventListener('click',()=>{if(loopEnd==null){loopStart=0;loopEnd=Number.isFinite(master.duration)&&master.duration>0?master.duration:null}loopEnabled=!loopEnabled;loopUi()});
      loopReset.addEventListener('click',()=>{loopEnabled=false;loopStart=0;loopEnd=null;loopUi()});
      master.addEventListener('timeupdate',()=>{if(loopEnabled&&loopEnd!=null&&master.currentTime>=loopEnd-.025)wrap();loopUi()});
      master.addEventListener('ended',()=>{if(!loopEnabled)return;wrap();Promise.resolve(master.play()).catch(()=>{})});

      // Sole stem authority: reuse the native Web Audio stem graph, but capture its handlers
      // as internal engine calls and remove their direct UI ownership. This preserves the
      // desired route: MASTER TRANSPORT clock -> (master full mix OR stem GainNodes) -> EQ/FX -> output.
      const rows=()=>[...isolator.querySelectorAll('.stem-toggle')];
      const ranges=()=>[...isolator.querySelectorAll('.stem-range')];
      const active=b=>!!b&&(b.classList.contains('active')||b.getAttribute('aria-pressed')==='true');
      const media=()=>[...d.querySelectorAll('audio')].filter(m=>m!==master&&/(vocals|drums|bass|other)/i.test(String(m.dataset?.src||m.src||'')));
      const nativeMasterHandler=stemMaster.onclick;
      const nativeRowHandlers=new Map(rows().map(b=>[b,b.onclick]));
      const nativeRangeHandlers=new Map(ranges().map(r=>[r,r.oninput]));
      if(typeof nativeMasterHandler!=='function'||nativeRowHandlers.size<3||nativeRangeHandlers.size<3)return false;
      stemMaster.onclick=null;rows().forEach(b=>b.onclick=null);ranges().forEach(r=>r.oninput=null);

      let stemEnabled=stemMaster.getAttribute('aria-pressed')!=='false',stemReady=false,activating=false,lastStemState='';
      const prepare=()=>media().forEach(m=>{try{if(!m.src&&m.dataset.src){m.src=m.dataset.src;m.preload='auto';m.load()}}catch(_){}});
      const align=force=>media().forEach(m=>{try{m.playbackRate=master.playbackRate||1;const drift=Math.abs((m.currentTime||0)-(master.currentTime||0));if(force||drift>.055)m.currentTime=Math.max(0,master.currentTime||0)}catch(_){}});
      const allStemMediaRunning=()=>{const ms=media();return ms.length>=4&&ms.every(m=>!m.paused&&!m.ended&&m.readyState>=2)};
      const isCustomMix=()=>rows().some(b=>!active(b))||ranges().some(r=>(parseFloat(r.value)||0)<99.5);
      const setStemStatus=state=>{
        lastStemState=state;stemMaster.classList.toggle('stem-loading',state==='loading');stemMaster.classList.toggle('stem-fallback',state==='fallback');
        const routed=state==='on'||state==='mix';stemMaster.classList.toggle('active',routed);stemMaster.setAttribute('aria-pressed',String(routed));
        stemMaster.textContent=state==='loading'?'STEMS LOADING':state==='fallback'?'STEMS FALLBACK':state==='off'?'STEMS OFF':state==='mix'?'STEMS MIX':'STEMS ON';
      };
      const refreshRoutedStatus=()=>{if(!stemEnabled){setStemStatus('off');return}if(stemReady&&allStemMediaRunning())setStemStatus(isCustomMix()?'mix':'on')};
      const callNativeMaster=async()=>{const result=nativeMasterHandler.call(stemMaster);if(result&&typeof result.then==='function')await result};
      const activate=async()=>{
        if(!stemEnabled||master.paused||activating)return;activating=true;setStemStatus('loading');prepare();align(true);
        try{
          // Native handler toggles its private stemsEnabled and setStemMode. Only that engine
          // disconnects the master source after every stem has successfully entered the shared Web Audio graph.
          if(stemMaster.getAttribute('aria-pressed')!=='true')stemMaster.setAttribute('aria-pressed','true');
          await callNativeMaster();
          await new Promise(resolve=>w.setTimeout(resolve,40));
          stemReady=allStemMediaRunning();
          if(!stemReady)throw new Error('native stem graph did not become audible');
          align(true);refreshRoutedStatus();
        }catch(_){stemReady=false;stemEnabled=false;setStemStatus('fallback')}
        activating=false;
      };
      const deactivate=async()=>{
        if(activating)return;activating=true;
        try{await callNativeMaster()}catch(_){}
        stemReady=false;stemEnabled=false;setStemStatus('off');activating=false;
      };

      // The UI only requests state changes; captured native handlers perform the actual private
      // stemState/GainNode mutations. No HTML-media volume layer and no master.muted layer remain.
      stemMaster.addEventListener('click',async e=>{
        e.preventDefault();e.stopPropagation();
        if(activating)return;
        if(stemEnabled){await deactivate()}else{stemEnabled=true;if(master.paused){setStemStatus(isCustomMix()?'mix':'on');prepare()}else await activate()}
      });
      rows().forEach(b=>b.addEventListener('click',async e=>{
        e.preventDefault();e.stopPropagation();const fn=nativeRowHandlers.get(b);if(typeof fn==='function'){const r=fn.call(b,e);if(r&&typeof r.then==='function')await r}refreshRoutedStatus()
      }));
      ranges().forEach(r=>r.addEventListener('input',async e=>{
        const fn=nativeRangeHandlers.get(r);if(typeof fn==='function'){const x=fn.call(r,e);if(x&&typeof x.then==='function')await x}const out=isolator.querySelector(`[data-stem-value="${r.dataset.stemRange}"]`);if(out)out.textContent=Math.round(parseFloat(r.value)||0)+'%';refreshRoutedStatus()
      }));
      if(play)play.addEventListener('pointerdown',prepare,true);
      master.addEventListener('play',()=>{if(stemEnabled)activate()});
      master.addEventListener('pause',()=>{stemReady=false;if(stemEnabled)setStemStatus(isCustomMix()?'mix':'on')});
      master.addEventListener('seeking',()=>align(true));
      master.addEventListener('seeked',()=>align(true));
      master.addEventListener('ratechange',()=>align(false));
      const drift=()=>{if(stemEnabled&&!master.paused){align(false);stemReady=allStemMediaRunning();if(stemReady)refreshRoutedStatus()}w.setTimeout(drift,250)};w.setTimeout(drift,250);

      // Native default is stems enabled. Do not invoke the captured toggle here because that
      // would invert its private state; PLAY will let the native engine start them once.
      prepare();setStemStatus(stemEnabled?(isCustomMix()?'mix':'on'):'off');loopUi();loopTick();
      w.__enochStemAuthority={version:'v2',get state(){return lastStemState},get enabled(){return stemEnabled},get ready(){return stemReady},isCustomMix};
      w.addEventListener('pagehide',()=>{if(loopTimer)w.clearTimeout(loopTimer)},{once:true});
      return true;
    }catch(_){return false}
  }
  window.installEnochianAuthoritativeRuntime=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
