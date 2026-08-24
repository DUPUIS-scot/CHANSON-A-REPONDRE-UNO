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
      if(d.documentElement.dataset.authoritativeRuntime==='v4')return true;

      // Bridge into the base.html global lexical realm. This exposes the already-existing
      // native Web Audio stem graph without creating a second MediaElementSource or mixer.
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
            sync(){try{syncStemTimes(true);setStemRate()}catch(_){}return status()}
          };
        }catch(_){}})();`;
        d.documentElement.appendChild(bridge);bridge.remove();
      }
      const engine=w.__enochNativeStemEngine;
      if(!engine||engine.version!=='v2')return false;
      d.documentElement.dataset.authoritativeRuntime='v4';

      const style=d.createElement('style');
      style.textContent=`#loopToggle.loop-authority-on{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important;box-shadow:0 0 12px #d5aa6355!important;font-weight:900!important}#stemMasterToggle.stem-loading{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important}#stemMasterToggle.stem-fallback{color:#ffb2a5!important;border-color:#633c35!important;background:#170806!important}.stem-value{color:#f0c97e!important}`;
      d.head.appendChild(style);

      // One loop owner.
      loop.onclick=loopIn.onclick=loopOut.onclick=loopReset.onclick=null;
      let loopEnabled=false,loopStart=0,loopEnd=null,loopTimer=0,lastWrap=0;
      const loopUi=()=>{loop.classList.toggle('active',loopEnabled);loop.classList.toggle('loop-authority-on',loopEnabled);loop.setAttribute('aria-pressed',String(loopEnabled));loop.textContent=loopEnabled?'LOOP '+fmt(master.currentTime||0):'LOOP OFF';loopIn.textContent='IN '+fmt(loopStart);loopOut.textContent='OUT '+(loopEnd==null?'--:--.-':fmt(loopEnd))};
      const wrap=()=>{if(!loopEnabled||loopEnd==null)return;const now=performance.now();if(now-lastWrap<80)return;lastWrap=now;try{master.currentTime=loopStart;engine.sync()}catch(_){};try{d.getElementById('log')?.prepend(Object.assign(d.createElement('div'),{className:'signal-flow-line',textContent:'LOOP CYCLE · '+fmt(loopStart)+' → '+fmt(loopEnd)}))}catch(_){}};
      const loopTick=()=>{if(loopTimer)w.clearTimeout(loopTimer);if(loopEnabled&&loopEnd!=null&&!master.paused&&master.currentTime>=loopEnd-.025)wrap();loopUi();loopTimer=w.setTimeout(loopTick,40)};
      loopIn.addEventListener('click',()=>{loopStart=Math.max(0,Number(master.currentTime)||0);if(loopEnd!=null&&loopEnd<=loopStart+.05)loopEnd=null;loopUi()});
      loopOut.addEventListener('click',()=>{const out=Math.max(0,Number(master.currentTime)||0);if(out<=loopStart+.05)return;loopEnd=out;loopEnabled=true;loopUi()});
      loop.addEventListener('click',()=>{if(loopEnd==null){loopStart=0;loopEnd=Number.isFinite(master.duration)&&master.duration>0?master.duration:null}loopEnabled=!loopEnabled;loopUi()});
      loopReset.addEventListener('click',()=>{loopEnabled=false;loopStart=0;loopEnd=null;loopUi()});
      master.addEventListener('timeupdate',()=>{if(loopEnabled&&loopEnd!=null&&master.currentTime>=loopEnd-.025)wrap();loopUi()});
      master.addEventListener('ended',()=>{if(!loopEnabled)return;wrap();Promise.resolve(master.play()).catch(()=>{})});

      // Sole stem UI owner. Audio ownership stays inside the native Web Audio graph:
      // STEMS OFF = master src -> EQ/FX; STEMS ON = stem GainNodes -> EQ/FX, master src disconnected.
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
      master.addEventListener('pause',refresh);master.addEventListener('seeking',()=>engine.sync());master.addEventListener('seeked',()=>engine.sync());master.addEventListener('ratechange',()=>engine.sync());
      const drift=()=>{if(desiredEnabled&&engine.status().routed&&!master.paused)engine.sync();refresh();w.setTimeout(drift,300)};w.setTimeout(drift,300);

      refresh();loopUi();loopTick();
      w.__enochStemAuthority={version:'v4',get state(){return lastStemState},get desired(){return desiredEnabled},get native(){return engine.status()},isCustomMix};
      w.addEventListener('pagehide',()=>{if(loopTimer)w.clearTimeout(loopTimer)},{once:true});return true;
    }catch(_){return false}
  }
  window.installEnochianAuthoritativeRuntime=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
