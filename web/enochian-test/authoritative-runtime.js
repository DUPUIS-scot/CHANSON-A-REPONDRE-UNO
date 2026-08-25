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
      const eqWheel=d.getElementById('eqWheel'),eqReadout=d.getElementById('eqWheelV');
      const eqControls=['low','mid','high'].map(id=>d.getElementById(id));
      if(!master||!isolator||!loop||!loopIn||!loopOut||!loopReset||!stemMaster||!eqWheel||!eqReadout||eqControls.some(control=>!control))return false;
      if(d.documentElement.dataset.authoritativeRuntime==='v6')return true;

      if(!w.__enochNativeStemEngine||w.__enochNativeStemEngine.version!=='v2'){
        const bridge=d.createElement('script');
        bridge.textContent=`(()=>{try{
          if(window.__enochNativeStemEngine?.version==='v2')return;
          if(typeof setStemMode!=='function'||typeof applyStemGains!=='function'||typeof stemState==='undefined'||typeof stemGains==='undefined')return;
          const rawSetStemMode=setStemMode;let operation=null;
          setStemMode=async function(){if(operation)return operation;operation=Promise.resolve().then(()=>rawSetStemMode()).finally(()=>{operation=null});return operation};
          const keys=['vocals','drums','bass','other'];
          const smoothApply=()=>{try{const now=(typeof ctx!=='undefined'&&ctx)?ctx.currentTime:0;keys.forEach(key=>{const node=stemGains[key],st=stemState[key];if(!node||!st)return;const target=st.on?Math.max(0,Math.min(1,Number(st.level)||0)):0;const p=node.gain;if(typeof p.cancelScheduledValues==='function')p.cancelScheduledValues(now);if(typeof p.setTargetAtTime==='function')p.setTargetAtTime(target,now,.018);else p.value=target})}catch(_){try{applyStemGains()}catch(__){}}};
          const status=()=>({enabled:typeof stemsEnabled!=='undefined'?!!stemsEnabled:false,mode:typeof stemMode!=='undefined'?!!stemMode:false,ready:typeof stemsReady!=='undefined'?!!stemsReady:false,masterConnected:typeof originalDeckConnected!=='undefined'?!!originalDeckConnected:true,routed:typeof stemMode!=='undefined'&&!!stemMode&&typeof originalDeckConnected!=='undefined'&&!originalDeckConnected,states:Object.fromEntries(keys.map(k=>[k,{on:!!stemState[k]?.on,level:Number(stemState[k]?.level)||0}]))});
          window.__enochNativeStemEngine={version:'v2',status,
            async setEnabled(on){stemsEnabled=!!on;if(!on){await setStemMode();return status()}if(typeof a!=='undefined'&&a?.paused){stemMode=false;return status()}await setStemMode();return status()},
            async activate(){stemsEnabled=true;if(typeof a!=='undefined'&&a?.paused)return status();if(typeof originalDeckConnected!=='undefined'&&originalDeckConnected)stemMode=false;await setStemMode();return status()},
            setRow(key,on){const value=!!on;if(key==='instruments'){stemState.bass.on=value;stemState.other.on=value}else if(stemState[key])stemState[key].on=value;smoothApply();return status()},
            setLevel(key,value){const v=Math.max(0,Math.min(1,Number(value)||0));if(key==='instruments'){stemState.bass.level=v;stemState.other.level=v}else if(stemState[key])stemState[key].level=v;smoothApply();return status()},
            smoothApply,
            sync(force=false){try{if(force)setStemRate();syncStemTimes(!!force)}catch(_){}return status()}
          };
        }catch(_){}})();`;
        d.documentElement.appendChild(bridge);bridge.remove();
      }
      const engine=w.__enochNativeStemEngine;
      if(!engine||engine.version!=='v2')return false;
      d.documentElement.dataset.authoritativeRuntime='v6';

      const style=d.createElement('style');
      style.textContent=`#loopToggle.loop-authority-on{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important;box-shadow:0 0 12px #d5aa6355!important;font-weight:900!important}#loopIn,#loopOut{color:#f0c97e!important}#stemMasterToggle.stem-loading{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important}#stemMasterToggle.stem-fallback{color:#ffb2a5!important;border-color:#633c35!important;background:#170806!important}.stem-value{color:#f0c97e!important}`;
      d.head.appendChild(style);

      // One authoritative EQ owner. Native range events still feed the established audio graph.
      let eqValue=0,eqDrag=null,lastEqTap=0;
      const eqProfile=value=>{const u=value/100;return[-u*10,-Math.abs(u)*3,u*10]};
      const renderEq=(value,custom=false)=>{
        eqValue=clamp(Number(value)||0,-100,100);
        eqWheel.style.setProperty('--angle',(-135+(eqValue+100)/200*270)+'deg');
        eqWheel.setAttribute('role','slider');eqWheel.setAttribute('tabindex','0');
        eqWheel.setAttribute('aria-label','Channel EQ');eqWheel.setAttribute('aria-valuemin','-100');
        eqWheel.setAttribute('aria-valuemax','100');eqWheel.setAttribute('aria-valuenow',String(Math.round(eqValue)));
        const u=eqValue/100;
        eqReadout.textContent=custom?'CUSTOM':Math.abs(u)<.03?'FLAT':u<0?'BASS '+Math.round(-u*100)+'%':'BRIGHT '+Math.round(u*100)+'%';
      };
      const syncEqFromFine=()=>{
        const actual=eqControls.map(control=>Number(control.value)||0);
        let best=0,bestError=Infinity;
        for(let candidate=-100;candidate<=100;candidate++){const profile=eqProfile(candidate),error=actual.reduce((sum,value,index)=>sum+Math.abs(value-profile[index]),0);if(error<bestError){bestError=error;best=candidate}}
        renderEq(best,bestError>2.25);
      };
      const applyEq=value=>{
        const next=clamp(value,-100,100),profile=eqProfile(next);
        eqControls.forEach((control,index)=>{control.value=String(Math.round(profile[index]));control.dispatchEvent(new w.Event('input',{bubbles:true}))});
        renderEq(next);
      };
      eqWheel.onpointerdown=eqWheel.onpointermove=eqWheel.onpointerup=eqWheel.onpointercancel=null;
      eqWheel.addEventListener('pointerdown',async event=>{event.preventDefault();try{if(typeof w.ensureAudio==='function')await w.ensureAudio()}catch(_){};eqWheel.setPointerCapture(event.pointerId);eqDrag={y:event.clientY,value:eqValue};eqWheel.classList.add('active')});
      eqWheel.addEventListener('pointermove',event=>{if(!eqDrag)return;event.preventDefault();applyEq(eqDrag.value+(eqDrag.y-event.clientY)/140*200)});
      const endEqDrag=event=>{if(!eqDrag)return;eqDrag=null;eqWheel.classList.remove('active');try{if(eqWheel.hasPointerCapture(event.pointerId))eqWheel.releasePointerCapture(event.pointerId)}catch(_){};const now=performance.now();if(now-lastEqTap<400)applyEq(0);lastEqTap=now};
      eqWheel.addEventListener('pointerup',endEqDrag);eqWheel.addEventListener('pointercancel',endEqDrag);
      eqWheel.addEventListener('keydown',event=>{const step=event.shiftKey?10:2;if(event.key==='ArrowUp'||event.key==='ArrowRight'){event.preventDefault();applyEq(eqValue+step)}else if(event.key==='ArrowDown'||event.key==='ArrowLeft'){event.preventDefault();applyEq(eqValue-step)}else if(event.key==='Home'){event.preventDefault();applyEq(0)}});
      eqControls.forEach(control=>control.addEventListener('input',()=>w.queueMicrotask(syncEqFromFine)));
      syncEqFromFine();

      // One authoritative loop owner. The audio transport is the clock; visual RAF is never used.
      [loopIn,loopOut].forEach(control=>{control.classList.add('loop-timer');control.hidden=false;control.style.removeProperty('display');control.setAttribute('aria-live','polite')});
      [loop,loopIn,loopOut,loopReset].forEach(control=>control.style.removeProperty('display'));
      const loopTransport=loop.parentElement;if(loopTransport)loopTransport.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';
      loop.onclick=loopIn.onclick=loopOut.onclick=loopReset.onclick=null;
      let loopEnabled=false,loopStart=0,loopEnd=null,loopTimer=0,lastWrapAt=0,wrapping=false;
      const validDuration=()=>Number.isFinite(master.duration)&&master.duration>0?master.duration:null;
      const loopUi=()=>{loop.classList.toggle('active',loopEnabled);loop.classList.toggle('loop-authority-on',loopEnabled);loop.setAttribute('aria-pressed',String(loopEnabled));loop.textContent=loopEnabled?'LOOP ON':'LOOP OFF';loopIn.textContent='IN '+fmt(loopStart);loopOut.textContent='OUT '+(loopEnd==null?'--:--.-':fmt(loopEnd))};
      const syncAfterSeek=()=>{try{engine.sync(true)}catch(_){}};
      const wrap=async(force=false)=>{
        if(!loopEnabled||loopEnd==null||wrapping)return false;
        const now=performance.now();
        if(!force&&now-lastWrapAt<70)return false;
        wrapping=true;lastWrapAt=now;
        const wasPlaying=!master.paused&&!master.ended;
        try{
          const target=Math.max(0,Math.min(loopStart,validDuration()??loopStart));
          if(typeof master.fastSeek==='function')master.fastSeek(target);else master.currentTime=target;
          syncAfterSeek();
          if(wasPlaying||master.ended){try{await master.play()}catch(_){}}
          try{d.getElementById('log')?.prepend(Object.assign(d.createElement('div'),{className:'signal-flow-line',textContent:'LOOP CYCLE · '+fmt(loopStart)+' → '+fmt(loopEnd)}))}catch(_){}
          return true;
        }finally{
          w.setTimeout(()=>{syncAfterSeek();wrapping=false},18);
        }
      };
      const remainingMs=()=>{
        if(!loopEnabled||loopEnd==null||master.paused)return 120;
        const rate=Math.max(.05,Math.abs(Number(master.playbackRate)||1));
        return Math.max(8,Math.min(120,((loopEnd-(Number(master.currentTime)||0))/rate)*1000-12));
      };
      const loopTick=()=>{
        if(loopTimer)w.clearTimeout(loopTimer);
        if(loopEnabled&&loopEnd!=null&&!master.paused&&master.currentTime>=loopEnd-.012)wrap(false);
        loopUi();
        loopTimer=w.setTimeout(loopTick,remainingMs());
      };
      loopIn.addEventListener('click',()=>{loopStart=Math.max(0,Number(master.currentTime)||0);if(loopEnd!=null&&loopEnd<=loopStart+.05)loopEnd=null;loopUi()});
      loopOut.addEventListener('click',()=>{const out=Math.max(0,Number(master.currentTime)||0);if(out<=loopStart+.05)return;loopEnd=out;loopEnabled=true;loopUi();loopTick()});
      loop.addEventListener('click',()=>{if(loopEnd==null){loopStart=0;loopEnd=validDuration()}loopEnabled=!loopEnabled;loopUi();loopTick()});
      loopReset.addEventListener('click',()=>{loopEnabled=false;loopStart=0;loopEnd=null;wrapping=false;loopUi();loopTick()});
      master.addEventListener('timeupdate',()=>{if(loopEnabled&&loopEnd!=null&&master.currentTime>=loopEnd-.012)wrap(false)});
      master.addEventListener('ended',()=>{if(loopEnabled&&loopEnd!=null)wrap(true)});
      master.addEventListener('play',loopTick);master.addEventListener('ratechange',loopTick);master.addEventListener('seeked',()=>{syncAfterSeek();loopTick()});

      const rows=()=>[...isolator.querySelectorAll('.stem-toggle')],ranges=()=>[...isolator.querySelectorAll('.stem-range')];
      const rowKey=b=>b?.dataset?.stemToggle||'',rangeKey=r=>r?.dataset?.stemRange||'';
      stemMaster.onclick=null;rows().forEach(b=>b.onclick=null);ranges().forEach(r=>r.oninput=null);
      let desiredEnabled=engine.status().enabled,activating=false,lastStemState='';
      const isCustomMix=()=>{const s=engine.status().states;return !s.vocals.on||!s.drums.on||!s.bass.on||!s.other.on||s.vocals.level<.995||s.drums.level<.995||s.bass.level<.995||s.other.level<.995};
      const setStemStatus=state=>{lastStemState=state;stemMaster.classList.toggle('stem-loading',state==='loading');stemMaster.classList.toggle('stem-fallback',state==='fallback');const routed=state==='on'||state==='mix';stemMaster.classList.toggle('active',routed);stemMaster.setAttribute('aria-pressed',String(desiredEnabled));stemMaster.textContent=state==='loading'?'STEMS LOADING':state==='fallback'?'STEMS FALLBACK':state==='off'?'STEMS OFF':state==='mix'?'STEMS MIX':'STEMS ON'};
      const syncRowsFromEngine=()=>{const s=engine.status().states;rows().forEach(b=>{const k=rowKey(b),on=k==='instruments'?(s.bass.on&&s.other.on):!!s[k]?.on;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});ranges().forEach(r=>{const k=rangeKey(r),v=k==='instruments'?Math.round(((s.bass.level+s.other.level)/2)*100):Math.round((s[k]?.level||0)*100);if(Math.abs((parseFloat(r.value)||0)-v)>.5)r.value=String(v);const out=isolator.querySelector(`[data-stem-value="${k}"]`);if(out)out.textContent=v+'%'})};
      const refresh=()=>{const s=engine.status();syncRowsFromEngine();if(!desiredEnabled){setStemStatus('off');return s}if(s.routed){setStemStatus(isCustomMix()?'mix':'on');return s}if(master.paused){setStemStatus('loading');return s}setStemStatus(activating?'loading':'fallback');return s};
      const activate=async()=>{if(activating||!desiredEnabled)return;activating=true;setStemStatus('loading');try{const s=await engine.activate();if(!s.routed)throw new Error('stem graph not routed')}catch(_){desiredEnabled=false;try{await engine.setEnabled(false)}catch(__){};setStemStatus('fallback')}finally{activating=false;refresh()}};

      stemMaster.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(activating)return;if(desiredEnabled){desiredEnabled=false;activating=true;try{await engine.setEnabled(false)}finally{activating=false;refresh()}}else{desiredEnabled=true;if(master.paused){setStemStatus('loading')}else await activate()}});
      rows().forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const k=rowKey(b),s=engine.status().states,on=k==='instruments'?(s.bass.on&&s.other.on):!!s[k]?.on;engine.setRow(k,!on);refresh()}));
      ranges().forEach(r=>r.addEventListener('input',()=>{engine.setLevel(rangeKey(r),clamp((parseFloat(r.value)||0)/100,0,1));refresh()}));
      if(play)play.addEventListener('pointerdown',()=>{if(desiredEnabled)setStemStatus('loading')},true);
      master.addEventListener('play',()=>{if(desiredEnabled)setTimeout(()=>{const s=engine.status();if(s.routed)refresh();else activate()},0);else refresh()});
      master.addEventListener('pause',refresh);master.addEventListener('seeking',()=>engine.sync(true));master.addEventListener('ratechange',()=>engine.sync(true));
      const drift=()=>{if(desiredEnabled&&engine.status().routed&&!master.paused)engine.sync(false);refresh();w.setTimeout(drift,300)};w.setTimeout(drift,300);

      refresh();loopUi();loopTick();
      w.__enochEqAuthority={version:'v1',get value(){return eqValue},sync:syncEqFromFine,set:applyEq};
      w.__enochStemAuthority={version:'v6',get state(){return lastStemState},get desired(){return desiredEnabled},get native(){return engine.status()},isCustomMix};
      w.__enochLoopAuthority={version:'v6',get enabled(){return loopEnabled},get start(){return loopStart},get end(){return loopEnd},wrap:()=>wrap(true)};
      w.addEventListener('pagehide',()=>{if(loopTimer)w.clearTimeout(loopTimer)},{once:true});return true;
    }catch(_){return false}
  }
  window.installEnochianAuthoritativeRuntime=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
