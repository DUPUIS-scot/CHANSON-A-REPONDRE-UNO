(()=>{
  const armRecovery=(frame,live,deck)=>{
    try{
      const lw=live.defaultView;if(!lw)return;
      const reinstall=()=>setTimeout(()=>{window.installEnochianSculptAudioMod?.(frame);window.installEnochianPendingUiFixes?.(frame)},0);
      if(deck&&!deck.dataset.enochRecoveryHook){deck.dataset.enochRecoveryHook='v1';deck.addEventListener('load',reinstall)}
      if(lw.__enochPendingRecoveryV1)return;
      const observer=new lw.MutationObserver(()=>{const next=live.getElementById('deck');if(next&&!next.dataset.enochRecoveryHook){next.dataset.enochRecoveryHook='v1';next.addEventListener('load',reinstall)}reinstall()});
      observer.observe(live.documentElement,{childList:true,subtree:true});lw.__enochPendingRecoveryV1={observer};
    }catch(_){}
  };
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      armRecovery(frame,live,deck);
      if(d.documentElement.dataset.pendingUiFixes==='v2'){window.installEnochianSculptAudioMod?.(frame);return true}
      const play=d.getElementById('play'),loop=d.getElementById('loopToggle'),loopIn=d.getElementById('loopIn'),loopOut=d.getElementById('loopOut'),loopReset=d.getElementById('loopReset');
      const mod=d.querySelector('.mod'),modWheel=d.getElementById('modWheel'),wave=d.querySelector('.wave');
      const eqIds=['low','mid','high'];
      if(!play||!loop||!loopIn||!loopOut||!loopReset||!mod||!modWheel||!wave||eqIds.some(id=>!d.getElementById(id)))return false;
      d.documentElement.dataset.pendingUiFixes='v2';

      const style=d.createElement('style');
      style.textContent=`
        .loop-control-row{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;width:100%!important;margin-top:0!important}
        .loop-control-row .btn{min-width:0!important;padding:7px 4px!important;font-size:8px!important;white-space:nowrap!important}
        .mod{grid-template-columns:minmax(0,1fr) 96px!important;align-items:start!important}
        .mod>.wheelbox{align-self:start!important;margin:0!important;justify-self:center!important;width:96px!important;padding:4px 2px!important;gap:3px!important}
        .mod>.wheelbox .wheel{width:78px!important;height:78px!important}
        .mod>.wheelbox .wheel:before{top:7px!important;height:20px!important;transform-origin:2px 32px!important}
        .mod>.wheelbox .wheel-label{font-size:8px!important}
        .mod>.wheelbox .wheel-value{font-size:10px!important;min-height:12px!important}
        .mod>.wheelbox .wheel-hint{font-size:6px!important;line-height:1.2!important}
        .eq-kill-btn{min-width:52px!important;padding:4px 6px!important;font-size:7px!important;letter-spacing:.08em!important}
        .eq-kill-btn.active{background:#4a0909!important;color:#ffd5cf!important;border-color:#b74d45!important;box-shadow:0 0 10px #d14a3f44!important}
        .eq-kill-row{grid-template-columns:1fr auto auto!important}
        @media(max-width:1000px){.mod{grid-template-columns:1fr!important}.mod>.wheelbox{margin:0 auto!important;width:auto!important}.mod>.wheelbox .wheel{width:110px!important;height:110px!important}.mod>.wheelbox .wheel:before{top:9px!important;height:29px!important;transform-origin:2px 46px!important}}
      `;
      d.head.appendChild(style);

      let loopRow=d.getElementById('loopControlRow');
      if(!loopRow){
        loopRow=d.createElement('div');loopRow.id='loopControlRow';loopRow.className='loop-control-row';
        const transport=play.closest('.transport');
        if(transport?.parentNode)transport.insertAdjacentElement('afterend',loopRow);else play.parentNode?.insertAdjacentElement('afterend',loopRow);
      }
      [loop,loopIn,loopOut,loopReset].forEach(el=>loopRow.appendChild(el));

      const kills=w.__enochEqKills={version:'v2',bands:{}};
      eqIds.forEach(id=>{
        const range=d.getElementById(id),box=range.closest('.fxbox');if(!box)return;
        const row=box.querySelector('.row');if(!row||row.querySelector(`[data-eq-kill="${id}"]`))return;
        row.classList.add('eq-kill-row');
        const button=d.createElement('button');button.type='button';button.className='btn eq-kill-btn';button.dataset.eqKill=id;button.textContent='KILL';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',id.toUpperCase()+' EQ kill');
        const state=kills.bands[id]={killed:false,saved:Number(range.value)||0,min:Number(range.min)||-18};
        const paint=()=>{button.classList.toggle('active',state.killed);button.setAttribute('aria-pressed',String(state.killed));button.textContent=state.killed?'KILLED':'KILL';range.dataset.eqKilled=String(state.killed)};
        const setValue=value=>{range.value=String(value);range.dispatchEvent(new w.Event('input',{bubbles:true}))};
        button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!state.killed){state.saved=Number(range.value)||0;state.killed=true;paint();setValue(state.min)}else{state.killed=false;paint();setValue(state.saved)}});
        range.addEventListener('input',()=>{if(!state.killed)state.saved=Number(range.value)||0});
        paint();row.appendChild(button);
      });

      const previous=w.__enochSignalEngagement;
      const engagement=w.__enochSignalEngagement={version:'v2',grabs:Math.min(5,Math.max(0,previous?.grabs||0)),lastGrabAt:previous?.lastGrabAt||0,sessionMs:5000};
      const registerGrab=(x,y)=>{let picked=null;try{picked=w.__enochAnalyser3D?.pick?.(x,y)||null}catch(_){}if(!picked)return false;engagement.grabs=Math.min(5,engagement.grabs+1);engagement.lastGrabAt=performance.now();return true};
      wave.addEventListener('pointerdown',e=>{if(w.__enochSignalModulation!==true||e.target.closest('button,input,textarea,select'))return;const x=e.clientX,y=e.clientY;if(!registerGrab(x,y))w.requestAnimationFrame(()=>{if(w.__enochSignalModulation===true)registerGrab(x,y)})});
      const decay=()=>{
        const def=w.__enochAnalyserGesture?.deform;
        if(engagement.grabs&&performance.now()-engagement.lastGrabAt>engagement.sessionMs&&def){
          const energy=Math.abs(def.pullY||0)+Math.abs(def.pullZ||0)+Math.abs(def.twist||0)+Math.abs(def.vY||0)*150+Math.abs(def.vZ||0)*150;
          if(energy<.08)engagement.grabs=0;
        }
        w.setTimeout(decay,180);
      };
      w.setTimeout(decay,180);
      d.getElementById('signalModToggle')?.addEventListener('click',()=>{if(w.__enochSignalModulation!==true)engagement.grabs=0});
      window.installEnochianSculptAudioMod?.(frame);
      return true;
    }catch(_){return false}
  }
  let retryTimer=0,retryFrame=null;
  window.installEnochianPendingUiFixes=frame=>{
    if(install(frame)){if(retryTimer){clearInterval(retryTimer);retryTimer=0}return true}
    retryFrame=frame;
    if(!retryTimer){let n=0;retryTimer=setInterval(()=>{if(install(retryFrame)||++n>240){clearInterval(retryTimer);retryTimer=0}},50)}
    return false;
  };
})();
