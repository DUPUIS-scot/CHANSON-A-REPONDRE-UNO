(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const play=d.getElementById('play'),pitch=d.getElementById('pitch'),kill=d.getElementById('killfx');
      const loop=d.getElementById('loopToggle'),loopIn=d.getElementById('loopIn'),loopOut=d.getElementById('loopOut'),loopReset=d.getElementById('loopReset');
      const mod=d.querySelector('.mod'),modWheel=d.getElementById('modWheel');
      if(!play||!pitch||!kill||!loop||!loopIn||!loopOut||!loopReset||!mod||!modWheel)return false;

      let style=d.getElementById('enochPerformanceLayoutV1');
      if(!style){
        style=d.createElement('style');style.id='enochPerformanceLayoutV1';style.textContent=`
          #loopControlRow{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-flow:column!important;grid-auto-columns:minmax(0,1fr)!important;gap:3px!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;overflow:hidden!important}
          #loopControlRow>.btn{display:block!important;min-width:0!important;max-width:100%!important;width:100%!important;padding:6px 2px!important;font-size:7px!important;letter-spacing:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important}
          .mod{grid-template-columns:minmax(0,1fr) 110px!important;align-items:center!important}
          .mod>.wheelbox{align-self:center!important;justify-self:center!important;margin:0!important;width:110px!important}
          @media(min-width:1001px){
            .grid>aside.side:first-child{padding:4px!important;gap:2px!important;align-content:start!important;overflow:hidden!important;grid-auto-rows:min-content!important}
            .grid>aside.side:first-child>.fx-title{font-size:7px!important;line-height:1.05!important;padding:1px 0!important}
            .grid>aside.side:first-child>.box,.grid>aside.side:first-child>.fxbox,.grid>aside.side:first-child>.stem-isolator{padding:3px!important;gap:1px!important;border-radius:4px!important;min-height:0!important}
            .grid>aside.side:first-child>.box .range,.grid>aside.side:first-child>.fxbox .range{height:27px!important}
            .grid>aside.side:first-child>.transport{gap:3px!important}
            .grid>aside.side:first-child>.transport>.btn{padding:5px 3px!important;min-height:27px!important}
            .grid>aside.side:first-child>#loopControlRow{min-height:27px!important}
            .grid>aside.side:first-child>.stem-isolator{padding:3px!important;gap:2px!important}
            .grid>aside.side:first-child .stem-title,.grid>aside.side:first-child .stem-note{font-size:6px!important;line-height:1.05!important}
            .grid>aside.side:first-child .stem-row{grid-template-columns:64px minmax(0,1fr) 30px!important;gap:2px!important;min-height:21px!important}
            .grid>aside.side:first-child .stem-toggle{padding:3px 2px!important;font-size:6px!important;min-height:20px!important}
            .grid>aside.side:first-child .stem-range{height:20px!important;min-height:20px!important}
            .grid>aside.side:first-child .stem-value{font-size:7px!important}
            .grid>aside.side:first-child .eq-kill-row{gap:3px!important}
            .grid>aside.side:first-child .eq-kill-btn{min-width:42px!important;padding:3px!important;font-size:6px!important}
          }
          @media(max-width:1000px){.mod{grid-template-columns:1fr!important}.mod>.wheelbox{margin:0 auto!important;width:auto!important}}
        `;d.head.appendChild(style);
      }

      const ensureLoopRow=()=>{
        const transport=play.closest('.transport');if(!transport)return false;
        transport.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
        let row=d.getElementById('loopControlRow');
        if(!row){row=d.createElement('div');row.id='loopControlRow';row.className='loop-control-row';transport.insertAdjacentElement('afterend',row)}
        [loopIn,loopOut,loop,loopReset].forEach(el=>{if(el.parentElement!==row)row.appendChild(el)});
        loopReset.textContent='RESET';
        return true;
      };
      ensureLoopRow();

      if(d.documentElement.dataset.performanceResetV1==='1')return true;
      d.documentElement.dataset.performanceResetV1='1';

      let pitchRaf=0;
      const cancelPitchReturn=()=>{if(pitchRaf){w.cancelAnimationFrame(pitchRaf);pitchRaf=0}};
      const setPitch=value=>{pitch.value=String(value);pitch.dispatchEvent(new w.Event('input',{bubbles:true}))};
      const returnPitch=()=>{
        cancelPitchReturn();
        const start=Number(pitch.value)||0;if(Math.abs(start)<.005){setPitch(0);return}
        const started=w.performance.now(),duration=220;
        const tick=now=>{const t=clamp((now-started)/duration,0,1),ease=1-Math.pow(1-t,3);setPitch(start*(1-ease));if(t<1)pitchRaf=w.requestAnimationFrame(tick);else{pitchRaf=0;setPitch(0)}};
        pitchRaf=w.requestAnimationFrame(tick);
      };
      pitch.addEventListener('pointerdown',cancelPitchReturn);
      pitch.addEventListener('pointerup',returnPitch);
      pitch.addEventListener('pointercancel',returnPitch);
      pitch.addEventListener('lostpointercapture',returnPitch);

      const nativeKill=kill.onclick;
      const setInput=(id,value)=>{const el=d.getElementById(id);if(!el)return;el.value=String(value);el.dispatchEvent(new w.Event('input',{bubbles:true}))};
      const resetEqKills=()=>{
        d.querySelectorAll('.eq-kill-btn[aria-pressed="true"]').forEach(button=>{try{button.click()}catch(_){}});
        const state=w.__enochEqKills?.bands;if(state)Object.values(state).forEach(band=>{if(band){band.killed=false;band.saved=0}});
        d.querySelectorAll('.eq-kill-btn').forEach(button=>{button.classList.remove('active');button.setAttribute('aria-pressed','false');button.textContent='KILL'});
        ['low','mid','high'].forEach(id=>{const el=d.getElementById(id);if(el)el.dataset.eqKilled='false'});
      };
      const resetPerformanceState=async(fromKill=false)=>{
        if(!fromKill&&typeof nativeKill==='function'){try{await nativeKill.call(kill)}catch(_){}}
        cancelPitchReturn();setPitch(0);
        try{w.__enochSculptAudio?.restore?.()}catch(_){}

        resetEqKills();
        if(w.__enochEqAuthority?.set)w.__enochEqAuthority.set(0);else ['low','mid','high'].forEach(id=>setInput(id,0));

        setInput('filter',1000);setInput('drive',0);setInput('delay',0);setInput('fb',.25);setInput('wet',0);
        const fxWheel=d.getElementById('fxWheel'),fxWheelV=d.getElementById('fxWheelV');
        if(fxWheel){fxWheel.style.setProperty('--angle','-135deg');fxWheel.classList.remove('active');fxWheel.setAttribute('aria-valuenow','0')}
        if(fxWheelV)fxWheelV.textContent='0%';
        setInput('mixerLevel',50);const mixerV=d.getElementById('mixerLevelV');if(mixerV)mixerV.textContent='50%';
        const dot=d.getElementById('padDot'),padReadout=d.getElementById('padReadout');
        if(dot){dot.style.left='50%';dot.style.top='50%'}if(padReadout)padReadout.textContent='X 50 · Y 50';
        d.querySelectorAll('[data-pad-fx],.instant-fx-btn').forEach(button=>button.classList.remove('active'));
        const padActivate=d.getElementById('padActivate');if(padActivate?.classList.contains('active'))try{padActivate.click()}catch(_){}

        const modActivate=d.getElementById('modActivate');if(modActivate?.classList.contains('active'))try{modActivate.click()}catch(_){}
        const phrase=d.getElementById('phrase');if(phrase&&phrase.value){phrase.value='';phrase.dispatchEvent(new w.Event('input',{bubbles:true}))}
        modWheel.style.setProperty('--angle','-135deg');modWheel.classList.remove('active');modWheel.setAttribute('aria-valuenow','0');
        const modV=d.getElementById('modWheelV');if(modV)modV.textContent='0%';
        if(modActivate){modActivate.classList.remove('active');modActivate.textContent='MOD OFF';modActivate.setAttribute('aria-pressed','false')}

        const signal=d.getElementById('signalModToggle');
        if(w.__enochSignalModulation===true||signal?.getAttribute('aria-pressed')==='true'){try{signal?.click()}catch(_){}}
        w.__enochSignalModulation=false;
        if(signal){signal.classList.remove('active');signal.setAttribute('aria-pressed','false');if(/ON/i.test(signal.textContent||''))signal.textContent=(signal.textContent||'SIGNAL MOD').replace(/ON/ig,'OFF')}
        if(w.__enochSignalEngagement){w.__enochSignalEngagement.grabs=0;w.__enochSignalEngagement.lastGrabAt=0}
        if(w.__enochAnalyserGesture?.deform)Object.assign(w.__enochAnalyserGesture.deform,{pullY:0,pullZ:0,twist:0,vY:0,vZ:0,grabBin:null,grabRow:null});

        try{loopReset.click()}catch(_){}
        ensureLoopRow();

        const stemMaster=d.getElementById('stemMasterToggle');
        if(w.__enochStemAuthority?.desired===true){try{stemMaster?.click()}catch(_){}}
        else if(w.__enochNativeStemEngine?.status?.().enabled){try{await w.__enochNativeStemEngine.setEnabled(false)}catch(_){}}
        try{['vocals','drums','bass','other'].forEach(key=>{w.__enochNativeStemEngine?.setRow?.(key,true);w.__enochNativeStemEngine?.setLevel?.(key,1)})}catch(_){}
        if(stemMaster){stemMaster.classList.remove('active','stem-loading');stemMaster.setAttribute('aria-pressed','false');stemMaster.textContent='STEMS OFF'}
        d.querySelectorAll('[data-stem-toggle]').forEach(button=>{button.classList.add('active');button.setAttribute('aria-pressed','true')});
        d.querySelectorAll('[data-stem-range]').forEach(range=>{range.value='100';const key=range.dataset.stemRange,out=d.querySelector(`[data-stem-value="${key}"]`);if(out)out.textContent='100%'});

        try{d.getElementById('log')?.prepend(Object.assign(d.createElement('div'),{className:'signal-flow-line',textContent:'GLOBAL RESET · FX / MOD / EQ / STEMS / LOOP / SIGNAL / PITCH → ORIGIN'}))}catch(_){}
        return true;
      };

      kill.addEventListener('click',()=>w.setTimeout(()=>{resetPerformanceState(true)},0));
      w.__enochPerformanceReset={version:'v1',reset:()=>resetPerformanceState(false),ensureLayout:ensureLoopRow,returnPitch};

      const guard=w.setInterval(ensureLoopRow,500);
      w.addEventListener('pagehide',()=>{w.clearInterval(guard);cancelPitchReturn();delete w.__enochPerformanceReset},{once:true});
      return true;
    }catch(_){return false}
  }
  let retryTimer=0,retryFrame=null;
  window.installEnochianPerformanceResetV1=frame=>{
    if(install(frame)){if(retryTimer){clearInterval(retryTimer);retryTimer=0}return true}
    retryFrame=frame;
    if(!retryTimer){let n=0;retryTimer=setInterval(()=>{if(install(retryFrame)||++n>240){clearInterval(retryTimer);retryTimer=0}},50)}
    return false;
  };
})();
