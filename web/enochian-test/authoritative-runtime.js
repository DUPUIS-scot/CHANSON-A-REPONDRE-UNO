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
      if(d.documentElement.dataset.authoritativeRuntime==='v1')return true;
      d.documentElement.dataset.authoritativeRuntime='v1';

      const style=d.createElement('style');
      style.textContent=`#loopToggle.loop-authority-on{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important;box-shadow:0 0 12px #d5aa6355!important;font-weight:900!important}#stemMasterToggle.stem-loading{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important}#stemMasterToggle.stem-fallback{color:#ffb2a5!important;border-color:#633c35!important;background:#170806!important}.stem-value{color:#f0c97e!important}`;
      d.head.appendChild(style);

      // One authoritative loop controller. Native loop onclick handlers are detached;
      // the older native timer remains inert because its private loopEnabled flag is never toggled.
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
      const loopTick=()=>{
        if(loopTimer)w.clearTimeout(loopTimer);
        if(loopEnabled&&loopEnd!=null&&!master.paused&&master.currentTime>=loopEnd-.025)wrap();
        loopUi();loopTimer=w.setTimeout(loopTick,40);
      };
      loopIn.addEventListener('click',()=>{loopStart=Math.max(0,Number(master.currentTime)||0);if(loopEnd!=null&&loopEnd<=loopStart+.05)loopEnd=null;loopUi()});
      loopOut.addEventListener('click',()=>{const out=Math.max(0,Number(master.currentTime)||0);if(out<=loopStart+.05)return;loopEnd=out;loopEnabled=true;loopUi()});
      loop.addEventListener('click',()=>{if(loopEnd==null){loopStart=0;loopEnd=Number.isFinite(master.duration)&&master.duration>0?master.duration:null}loopEnabled=!loopEnabled;loopUi()});
      loopReset.addEventListener('click',()=>{loopEnabled=false;loopStart=0;loopEnd=null;loopUi()});
      master.addEventListener('timeupdate',()=>{if(loopEnabled&&loopEnd!=null&&master.currentTime>=loopEnd-.025)wrap();loopUi()});
      master.addEventListener('ended',()=>{if(!loopEnabled)return;wrap();Promise.resolve(master.play()).catch(()=>{})});

      // Audible stem authority. The master transport remains the clock; when all stems are
      // actually running the full mixed master is muted, so stem gains truly define the output.
      const rows=()=>[...isolator.querySelectorAll('.stem-toggle')];
      const active=b=>!!b&&(b.classList.contains('active')||b.getAttribute('aria-pressed')==='true');
      const media=()=>[...d.querySelectorAll('audio')].filter(m=>m!==master&&/(vocals|drums|bass|other)/i.test(String(m.dataset?.src||m.src||'')));
      const keyOfMedia=m=>{const s=String(m.dataset?.src||m.src||'').toLowerCase();return s.includes('vocals')?'vocals':s.includes('drums')?'drums':s.includes('bass')?'bass':s.includes('other')?'other':''};
      const rowOn=key=>active(isolator.querySelector(`[data-stem-toggle="${key}"]`));
      const level=key=>clamp((parseFloat(isolator.querySelector(`[data-stem-range="${key}"]`)?.value)||0)/100,0,1);
      const wanted=key=>key==='bass'||key==='other'?rowOn('instruments'):rowOn(key);
      const gain=key=>key==='bass'||key==='other'?level('instruments'):level(key);
      let stemEnabled=stemMaster.getAttribute('aria-pressed')!=='false',stemReady=false,activating=false;
      const applyStemMix=()=>media().forEach(m=>{const k=keyOfMedia(m);try{m.volume=wanted(k)?gain(k):0;m.muted=!wanted(k)}catch(_){}});
      const alignStems=force=>media().forEach(m=>{try{m.playbackRate=master.playbackRate||1;m.preservesPitch=false;m.webkitPreservesPitch=false;const drift=Math.abs((m.currentTime||0)-(master.currentTime||0));if(force||drift>.055)m.currentTime=Math.max(0,master.currentTime||0)}catch(_){}});
      const pauseStems=()=>media().forEach(m=>{try{m.pause()}catch(_){}});
      const setStemStatus=(state)=>{
        stemMaster.classList.toggle('stem-loading',state==='loading');stemMaster.classList.toggle('stem-fallback',state==='fallback');
        if(state==='on'){stemMaster.classList.add('active');stemMaster.setAttribute('aria-pressed','true');stemMaster.textContent=rows().every(active)?'STEMS ON':'STEMS MIX'}
        else if(state==='off'){stemMaster.classList.remove('active');stemMaster.setAttribute('aria-pressed','false');stemMaster.textContent='STEMS OFF'}
        else if(state==='loading'){stemMaster.textContent='STEMS LOADING'}
        else {stemMaster.classList.remove('active');stemMaster.setAttribute('aria-pressed','false');stemMaster.textContent='STEMS FALLBACK'}
      };
      const prepare=()=>media().forEach(m=>{try{if(!m.src&&m.dataset.src){m.src=m.dataset.src;m.preload='auto';m.load()}}catch(_){}});
      const activateStems=async()=>{
        if(!stemEnabled||master.paused||activating)return;activating=true;setStemStatus('loading');prepare();applyStemMix();alignStems(true);
        const ms=media();
        try{
          if(ms.length<4)throw new Error('missing stem media');
          const results=await Promise.allSettled(ms.map(m=>m.play()));
          if(results.some(r=>r.status!=='fulfilled'))throw new Error('stem playback rejected');
          alignStems(true);applyStemMix();master.muted=true;stemReady=true;setStemStatus('on');
        }catch(_){stemReady=false;master.muted=false;pauseStems();setStemStatus('fallback')}
        activating=false;
      };
      const deactivateStems=()=>{stemReady=false;activating=false;pauseStems();master.muted=false;setStemStatus('off')};

      // Preserve the native master toggle because it reconnects/disconnects its Web Audio source.
      stemMaster.addEventListener('click',()=>setTimeout(()=>{
        stemEnabled=stemMaster.getAttribute('aria-pressed')==='true';
        if(stemEnabled){prepare();if(!master.paused)activateStems()}else deactivateStems();
      },0));
      rows().forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{applyStemMix();if(stemReady)setStemStatus('on')},0)));
      isolator.querySelectorAll('.stem-range').forEach(r=>r.addEventListener('input',()=>{const out=isolator.querySelector(`[data-stem-value="${r.dataset.stemRange}"]`);if(out)out.textContent=Math.round(parseFloat(r.value)||0)+'%';applyStemMix()}));
      if(play)play.addEventListener('pointerdown',prepare,true);
      master.addEventListener('play',()=>{if(stemEnabled)activateStems();else master.muted=false});
      master.addEventListener('pause',pauseStems);
      master.addEventListener('seeking',()=>alignStems(true));
      master.addEventListener('seeked',()=>{alignStems(true);if(stemEnabled&&!master.paused)activateStems()});
      master.addEventListener('ratechange',()=>alignStems(false));
      const drift=()=>{if(stemReady&&!master.paused){alignStems(false);applyStemMix()}w.setTimeout(drift,250)};w.setTimeout(drift,250);
      prepare();applyStemMix();loopUi();loopTick();
      w.addEventListener('pagehide',()=>{if(loopTimer)w.clearTimeout(loopTimer);master.muted=false},{once:true});
      return true;
    }catch(_){return false}
  }
  window.installEnochianAuthoritativeRuntime=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
