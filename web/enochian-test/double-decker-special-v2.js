(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const api=w.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial'),launcher=d.getElementById('doubleDeckerSpecialLaunch');
      if(!api||!panel||!launcher)return false;
      if(panel.dataset.ddsControls==='v11')return true;
      panel.dataset.ddsControls='v11';
      const catalog=['ai_comptroller','caesar_spitter','the_kraken','heliogabal_design','vivid_void'];
      const stems=['vocals','drums','bass','other'];
      const master=d.getElementById('audio'),stemMaster=d.getElementById('stemMasterToggle'),mainPlay=d.getElementById('play');
      const oldStyle=document.getElementById('dds-v2-controls-style');if(oldStyle)oldStyle.remove();
      const style=document.createElement('style');style.id='dds-v2-controls-style';style.textContent=`
        .dds-v2-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.dds-v2-actions button{min-height:28px;border:1px solid #6d5836;border-radius:4px;background:#120d06;color:#f0c97e;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-v2-actions button:active{transform:translateY(1px)}
        .dds-deck-shuffle{width:100%;min-height:24px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-engine-live{box-shadow:0 0 16px #d5aa6366!important}
        .dds-slot{grid-template-columns:58px minmax(90px,1fr) 72px 34px 62px!important}.dds-slot .stem-toggle{min-width:0!important;padding:7px 5px!important;font-size:8px!important;white-space:nowrap!important;background:#07100e!important;color:#7a9a94!important;border-color:#315b56!important;box-shadow:none!important}.dds-slot .stem-toggle.active{background:#19c98f!important;color:#001f16!important;border-color:#63f5cf!important;box-shadow:0 0 12px #40e6b477!important;font-weight:1000!important}.dds-slot.stem-off select,.dds-slot.stem-off input,.dds-slot.stem-off output{opacity:.5}
        .dds-master-hold{color:#f0c97e!important;font-weight:900}.dds-master-hold.active{color:#ffe4a4!important;text-shadow:0 0 8px #d5aa6366}
        .dds-engine-control{position:relative;z-index:50;display:grid;gap:3px}.dds-engine-control button{min-height:32px;border:1px solid #d5aa63;border-radius:5px;background:#24190a;color:#ffe3a0;font:1000 9px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.08em;cursor:pointer;box-shadow:0 0 15px #d5aa6355}.dds-engine-control button.active{border-color:#63f5cf;background:#083128;color:#63f5cf;box-shadow:0 0 15px #40e6b477}.dds-engine-control small{display:block;color:#a9eee7;font:800 6px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-align:center}
        #play.jecker-main-live{position:relative!important;border-color:#63f5cf!important;color:#63f5cf!important;background:#071d17!important;box-shadow:0 0 14px #19c98f66!important;text-shadow:0 0 8px #19c98f}.jecker-main-badge{position:absolute;right:-7px;top:-7px;min-width:18px;height:18px;padding:0 3px;border:1px solid #63f5cf;border-radius:999px;background:#06110f;color:#63f5cf;font:1000 7px/18px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:0 0 10px #19c98f77;pointer-events:none}
        .dds-performance{display:grid;gap:5px;border:1px solid #315b56;border-radius:4px;padding:6px;background:#020706}.dds-performance-row{display:grid;grid-template-columns:42px minmax(90px,1fr) 42px;gap:5px;align-items:center}.dds-performance label,.dds-performance output{font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#f0c97e}.dds-performance output{text-align:right;color:#63f5cf}.dds-performance input{width:100%;accent-color:#19c98f}.dds-perf-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.dds-perf-buttons button{min-height:25px;border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.dds-perf-buttons button.active{background:#19c98f;color:#001f16;border-color:#63f5cf}.dds-quantize{display:grid;grid-template-columns:auto 1fr;gap:5px;align-items:center}.dds-quantize select{min-height:24px;background:#07100e;color:#a9eee7;border:1px solid #315b56;border-radius:4px;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
        .double-jecker-takeover #terminalLive{opacity:1!important;filter:none!important;pointer-events:auto!important}.double-jecker-takeover #doubleDeckerSpecial{position:fixed!important;right:12px!important;bottom:12px!important;left:auto!important;top:auto!important;inset:auto!important;z-index:2147483190!important;width:min(680px,calc(100vw - 24px))!important;max-width:none!important;max-height:min(72dvh,760px)!important;border-radius:8px!important;overflow:auto!important;background:radial-gradient(circle at 50% 18%,#16382f 0,#06100d 31%,#020302 80%)!important;box-shadow:0 18px 55px #000b!important}.dds-takeover-hud{display:none}.jecker-takeover .dds-takeover-hud{display:grid;grid-template-columns:auto 1fr auto auto;gap:8px;align-items:center;margin:0 0 8px;padding:10px;border:1px solid #63f5cf;background:#06110f;color:#a9eee7;font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.dds-takeover-hud strong{color:#63f5cf;letter-spacing:.13em}.dds-takeover-hud output{color:#f0c97e;text-align:center}.dds-takeover-hud button{min-height:30px;border:1px solid #63f5cf;border-radius:3px;background:#0b211a;color:#a9eee7;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dds-takeover-hud button[data-dds-return]{border-color:#8c7447;color:#f0c97e;background:#171006}.jecker-takeover .dds-grid{max-width:1180px;margin:auto}.jecker-takeover .dds-center{max-width:760px;margin:0 auto}.jecker-takeover .dds-foot{padding-bottom:24px}
        @media(max-width:720px){.dds-slot{grid-template-columns:43px minmax(72px,1fr) 56px!important;grid-template-rows:auto auto!important}.dds-slot [data-level],.dds-slot [data-value]{grid-row:2!important}.dds-slot .stem-toggle{grid-column:3!important;grid-row:1/3!important;align-self:stretch!important;padding:4px 3px!important;font-size:7px!important}.jecker-takeover .dds-takeover-hud{grid-template-columns:1fr 1fr;gap:5px;padding:7px}.jecker-takeover .dds-takeover-hud output{grid-column:1/-1;order:3}.jecker-takeover .dds-grid{padding:0 7px}}
      `;document.head.appendChild(style);
      const center=panel.querySelector('.dds-center');
      let takeoverHud=panel.querySelector('[data-dds-takeover-hud]');
      if(!takeoverHud){
        takeoverHud=document.createElement('div');
        takeoverHud.className='dds-takeover-hud';
        takeoverHud.dataset.ddsTakeoverHud='';
        takeoverHud.innerHTML='<strong>2JESTER MASTER</strong><output data-dds-phase>ARMED · MASTER CLOCK</output><button type="button" data-dds-transport>PLAY</button><button type="button" data-dds-return>RETURN MAIN</button>';
        panel.insertBefore(takeoverHud,panel.firstChild);
      }
      let engineControl=panel.querySelector('[data-dds-engine-control]');
      if(!engineControl){
        engineControl=document.createElement('div');
        engineControl.className='dds-engine-control';
        engineControl.dataset.ddsEngineControl='';
        engineControl.innerHTML='<button type="button" data-dds-engine-direct aria-pressed="false">▶ START 2JESTER</button><small>MAIN GOES ON HOLD · ROUNDTABLE PLAYS</small>';
        panel.insertBefore(engineControl,panel.firstChild);
      }
      let actions=panel.querySelector('.dds-v2-actions');
      if(!actions){actions=document.createElement('div');actions.className='dds-v2-actions';actions.innerHTML='<button type="button" data-dds-shuffle="A">SHUFFLE A</button><button type="button" data-dds-shuffle="B">SHUFFLE B</button>';center?.insertBefore(actions,center.querySelector('.dds-status'))}
      ['A','B'].forEach(name=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;let b=deckEl.querySelector('[data-dds-deck-shuffle]');if(!b){b=document.createElement('button');b.type='button';b.className='dds-deck-shuffle';b.textContent='RANDOM / SHUFFLE STEM SOURCES';b.dataset.ddsDeckShuffle=name;deckEl.insertBefore(b,deckEl.children[1]||null)}});
      const status=panel.querySelector('.dds-status');
      let holdLine=panel.querySelector('[data-dds-master-hold]');
      if(status&&!holdLine){holdLine=document.createElement('div');holdLine.className='dds-master-hold';holdLine.dataset.ddsMasterHold='';holdLine.textContent='MASTER LIVE';status.appendChild(holdLine)}
      if(!api.state.deckGain)api.state.deckGain={A:1,B:0};
      if(typeof api.state.crossfader!=='number')api.state.crossfader=0;
      if(typeof api.state.quantize!=='string')api.state.quantize='1bar';
      let perf=panel.querySelector('[data-dds-performance]');
      if(!perf){perf=document.createElement('div');perf.className='dds-performance';perf.dataset.ddsPerformance='';perf.innerHTML='<div class="dds-performance-row"><label>DECK A</label><input data-dds-crossfader type="range" min="0" max="100" step="1" value="0" aria-label="2JESTER A B crossfader"><output data-dds-crossfader-value>A 100%</output></div><div class="dds-perf-buttons"><button type="button" data-dds-take="A" class="active">TAKE A</button><button type="button" data-dds-cue-b>PREP B</button><button type="button" data-dds-take="B">TAKE B</button></div><div class="dds-quantize"><label>QUANTIZE</label><select data-dds-quantize><option value="now">NOW</option><option value="1beat">1 BEAT</option><option value="1bar" selected>1 BAR</option><option value="4bar">4 BARS</option></select></div>';center?.insertBefore(perf,status||null)}
      const xf=perf.querySelector('[data-dds-crossfader]'),xfOut=perf.querySelector('[data-dds-crossfader-value]'),quant=perf.querySelector('[data-dds-quantize]');
      const randomKey=avoid=>{const pool=catalog.filter(x=>x!==avoid);return pool[Math.floor(Math.random()*pool.length)]||catalog[0]};
      const slotState=(deckName,stem)=>api.state?.slots?.[deckName]?.[stem]||null;
      const deckFactor=name=>Math.max(0,Math.min(1,Number(api.state.deckGain?.[name])||0));
      const applyDeckGain=name=>{stems.forEach(stem=>{const slot=slotState(name,stem);if(!slot)return;const gain=slot.gain?.gain,ctx=api.state?.ctx,target=slot.on===false?0:Math.max(0,Math.min(1,(Number(slot.level)||0)*deckFactor(name)));if(gain){try{const now=ctx?.currentTime||0;gain.cancelScheduledValues?.(now);gain.setTargetAtTime?gain.setTargetAtTime(target,now,.01):gain.value=target}catch(_){gain.value=target}}})};
      const setCrossfader=value=>{const x=Math.max(0,Math.min(1,Number(value)||0));api.state.crossfader=x;api.state.deckGain.A=Math.cos(x*Math.PI*.5);api.state.deckGain.B=Math.sin(x*Math.PI*.5);applyDeckGain('A');applyDeckGain('B');if(xf)xf.value=String(Math.round(x*100));if(xfOut)xfOut.textContent=x<=.5?`A ${Math.round(api.state.deckGain.A*100)}%`:`B ${Math.round(api.state.deckGain.B*100)}%`;perf.querySelector('[data-dds-take="A"]')?.classList.toggle('active',x<.05);perf.querySelector('[data-dds-take="B"]')?.classList.toggle('active',x>.95);return x};
      const syncSlot=(slot,force=false)=>{if(!slot?.media||!master)return;try{const t=Number(master.currentTime)||0,rate=Math.max(.25,Math.min(4,Number(master.playbackRate)||1)),diff=t-(Number(slot.media.currentTime)||0);slot.media.playbackRate=rate;slot.media.preservesPitch=false;slot.media.webkitPreservesPitch=false;if(force||Math.abs(diff)>.045)slot.media.currentTime=t}catch(_){}};
      const enforceSlotPlayback=async(deckName,stem,force=false)=>{const slot=slotState(deckName,stem);if(!slot?.media)return false;if(slot.on===false||!api.state?.enabled){try{slot.media.pause()}catch(_){}return false}syncSlot(slot,force);try{await slot.media.play();return true}catch(_){return false}};
      const enforceActivePlayback=async(force=false)=>Promise.all(['A','B'].flatMap(deckName=>stems.map(stem=>enforceSlotPlayback(deckName,stem,force))));
      const applyStemState=(deckName,stem)=>{const slot=slotState(deckName,stem);if(!slot)return false;if(typeof slot.on!=='boolean')slot.on=true;const gain=slot.gain?.gain,ctx=api.state?.ctx,target=slot.on?Math.max(0,Math.min(1,(Number(slot.level)||0)*deckFactor(deckName))):0;if(gain){try{const now=ctx?.currentTime||0;gain.cancelScheduledValues?.(now);if(gain.setTargetAtTime)gain.setTargetAtTime(target,now,.01);else gain.value=target}catch(_){gain.value=target}}const slotEl=panel.querySelector(`[data-dds-deck="${deckName}"] .dds-slot[data-slot="${stem}"]`),button=slotEl?.querySelector('[data-dds-stem-toggle]');slotEl?.classList.toggle('stem-off',!slot.on);if(button){button.classList.toggle('active',slot.on);button.textContent=stem.toUpperCase();button.setAttribute('aria-pressed',String(slot.on));button.title=stem.toUpperCase()+' '+(slot.on?'ON':'OFF')}void enforceSlotPlayback(deckName,stem,false);return true};
      const setStemOn=(deckName,stem,on)=>{const slot=slotState(deckName,stem);if(!slot)return false;slot.on=!!on;return applyStemState(deckName,stem)};
      const setStemLevel=(deckName,stem,level)=>{const slot=slotState(deckName,stem);if(!slot)return false;slot.level=Math.max(0,Math.min(1,Number(level)||0));return applyStemState(deckName,stem)};
      const nextBoundaryMs=()=>{if(api.state.quantize==='now'||!master)return 0;const bpm=Number(api.state.bpm||w.__enochBpm||120)||120,beat=60000/bpm,bars=api.state.quantize==='4bar'?16:api.state.quantize==='1bar'?4:1,unit=beat*bars,pos=(Number(master.currentTime)||0)*1000;return Math.max(0,unit-(pos%unit))};
      const quantized=fn=>{const wait=nextBoundaryMs();if(wait<20)return Promise.resolve().then(fn);return new Promise(resolve=>w.setTimeout(()=>Promise.resolve(fn()).then(resolve),wait))};
      const shuffleDeck=async name=>quantized(async()=>{const deckEl=panel.querySelector(`[data-dds-deck="${name}"]`);if(!deckEl)return;const jobs=[];deckEl.querySelectorAll('.dds-slot').forEach(slot=>{const stem=slot.dataset.slot,select=slot.querySelector('[data-source]');if(!stem||!select)return;const next=randomKey(select.value);select.value=next;jobs.push(Promise.resolve(api.setSource(name,stem,next)));});await Promise.all(jobs);stems.forEach(st=>applyStemState(name,st));await enforceActivePlayback(true);api.sync?.();});
      const shuffle=async scope=>{if(scope==='ALL')await Promise.all([shuffleDeck('A'),shuffleDeck('B')]);else await shuffleDeck(scope)};
      panel.querySelectorAll('[data-dds-shuffle]').forEach(b=>{if(b.dataset.ddsBound==='v7')return;b.dataset.ddsBound='v7';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffle(b.dataset.ddsShuffle)})});
      panel.querySelectorAll('[data-dds-deck-shuffle]').forEach(b=>{if(b.dataset.ddsBound==='v7')return;b.dataset.ddsBound='v7';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shuffleDeck(b.dataset.ddsDeckShuffle)})});
      panel.querySelectorAll('[data-dds-deck]').forEach(deckEl=>{const deckName=deckEl.dataset.ddsDeck;deckEl.querySelectorAll('.dds-slot').forEach(slotEl=>{const stem=slotEl.dataset.slot;if(!stem)return;let button=slotEl.querySelector('[data-dds-stem-toggle]');if(!button){button=document.createElement('button');button.type='button';button.className='btn stem-toggle active';button.dataset.ddsStemToggle='';slotEl.appendChild(button)}button.className='btn stem-toggle';if(button.dataset.ddsBound!=='v7'){button.dataset.ddsBound='v7';button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const slot=slotState(deckName,stem);quantized(()=>setStemOn(deckName,stem,slot?.on===false))})}const range=slotEl.querySelector('[data-level]');if(range&&range.dataset.ddsStemBound!=='v7'){range.dataset.ddsStemBound='v7';range.addEventListener('input',()=>applyStemState(deckName,stem))}applyStemState(deckName,stem)})});
      let normalStemWasEnabled=null,stemJeckerModeBefore=null;
      let mainWasPlaying=null;
      const normalStemEnabled=()=>{const desired=w.__enochStemAuthority?.desired;if(typeof desired==='boolean')return desired;return !!(stemMaster&&(stemMaster.getAttribute('aria-pressed')==='true'||stemMaster.classList.contains('active')))};
      const clickStemMaster=async()=>{if(!stemMaster)return;stemMaster.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,view:w}));await new Promise(resolve=>w.setTimeout(resolve,35))};
      const suspendNormalStems=async()=>{
        if(normalStemWasEnabled!==null)return;
        normalStemWasEnabled=normalStemEnabled();
        const jecker=w.__enochStemJecker||w.__enochStemDecker;
        if(jecker&&stemJeckerModeBefore===null)stemJeckerModeBefore=jecker.mode||'off';
        if(normalStemWasEnabled)await clickStemMaster();
        try{await w.__enochNativeStemEngine?.setEnabled?.(false)}catch(_){}
        if(jecker){jecker.setMode?.('jecker');await new Promise(resolve=>w.setTimeout(resolve,55));jecker.sync?.()}
      };
      const restoreNormalStems=async()=>{
        const restore=normalStemWasEnabled,mode=stemJeckerModeBefore;
        normalStemWasEnabled=null;stemJeckerModeBefore=null;
        const jecker=w.__enochStemJecker||w.__enochStemDecker;
        if(jecker&&mode)jecker.setMode?.(mode);
        if(restore&&!normalStemEnabled())await clickStemMaster();
      };
      const setMasterHold=on=>{
        if(master){
          try{
            if(on){
              if(mainWasPlaying===null)mainWasPlaying=!master.paused;
              // Keep the muted master running as the shared beat clock. Pausing it would trigger the base engine's pause listener and silence every 2JESTER stem along with it.
              master.muted=true;
            }else{
              master.muted=false;
              const resume=mainWasPlaying;
              mainWasPlaying=null;
              if(resume)void master.play().catch(()=>{});
            }
          }catch(_){}
        }
        if(holdLine){
          holdLine.classList.toggle('active',!!on);
          holdLine.textContent=on?'MAIN HOLD · 2JESTER LIVE':'MASTER LIVE';
        }
      };
      const jeckerPlaying=()=>['A','B'].some(deckName=>stems.some(stem=>{const slot=slotState(deckName,stem);return slot?.on!==false&&slot?.media&&!slot.media.paused&&!slot.media.ended}));
      const setMainPlayIndicator=on=>{
        if(!mainPlay)return;
        let badge=mainPlay.querySelector('.jecker-main-badge');
        if(on){
          if(!badge){badge=d.createElement('i');badge.className='jecker-main-badge';badge.setAttribute('aria-hidden','true');mainPlay.appendChild(badge)}
          const playing=jeckerPlaying();mainPlay.classList.add('jecker-main-live');mainPlay.firstChild&&(mainPlay.firstChild.textContent=playing?'❚❚':'▶');badge.textContent='2J';
          mainPlay.title=playing?'2JESTER LIVE · pause hybrid master':'2JESTER LIVE · play hybrid master';mainPlay.setAttribute('aria-label',mainPlay.title);
        }else{badge?.remove();mainPlay.classList.remove('jecker-main-live');mainPlay.removeAttribute('title');mainPlay.removeAttribute('aria-label')}
      };
      const toggleJeckerTransport=async()=>{
        if(!api.state?.enabled)return false;
        if(jeckerPlaying())['A','B'].forEach(deckName=>stems.forEach(stem=>{try{slotState(deckName,stem)?.media?.pause()}catch(_){}}));else await enforceActivePlayback(true);
        setMasterHold(true);setMainPlayIndicator(true);return jeckerPlaying();
      };
      const setTakeover=on=>{
        // STEMS MIX remains the live performance surface while it routes 2JESTER.
        const active=false;
        panel.classList.toggle('jecker-takeover',active);
        document.documentElement.classList.toggle('double-jecker-takeover',active);
        const phase=takeoverHud?.querySelector('[data-dds-phase]');
        const play=takeoverHud?.querySelector('[data-dds-transport]');
        if(phase)phase.textContent=active?(jeckerPlaying()?'2JESTER · MASTER LIVE':'2JESTER · PAUSED'):'ARMED · MASTER CLOCK';
        if(play)play.textContent=jeckerPlaying()?'PAUSE':'PLAY';
      };
      const paint=()=>{const on=!!api.state?.enabled;setTakeover(on);const btn=panel.querySelector('[data-dds-enable]');btn?.classList.toggle('active',on);btn?.classList.toggle('dds-engine-live',on);if(btn)btn.textContent=on?'2JESTER LIVE · MAIN HOLD':'START 2JESTER';const direct=engineControl?.querySelector('[data-dds-engine-direct]');if(direct){direct.classList.toggle('active',on);direct.setAttribute('aria-pressed',String(on));direct.textContent=on?'■ STOP 2JESTER':'▶ START 2JESTER';direct.title=on?'Stop 2JESTER and return main stems':'Start 2JESTER roundtable'}launcher.classList.toggle('active',on);setMasterHold(on);setMainPlayIndicator(on);w.__enochStemJecker?.syncUi?.()};
      if(mainPlay&&mainPlay.dataset.ddsJeckerTransportBound!=='v9'){mainPlay.dataset.ddsJeckerTransportBound='v9';mainPlay.addEventListener('click',e=>{if(!api.state?.enabled)return;e.preventDefault();e.stopImmediatePropagation();void toggleJeckerTransport()},{capture:true})}
      takeoverHud?.querySelector('[data-dds-transport]')?.addEventListener('click',async()=>{await toggleJeckerTransport();paint()});
      takeoverHud?.querySelector('[data-dds-return]')?.addEventListener('click',async()=>{if(api.state?.enabled){api.disable?.();await restoreNormalStems();setMasterHold(false)}paint();if(panel.classList.contains('open'))launcher.click()});
      const engineBtn=panel.querySelector('[data-dds-enable]');
      if(engineBtn&&engineBtn.dataset.ddsEngineBound!=='v7'){engineBtn.dataset.ddsEngineBound='v7';engineBtn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(api.state?.enabled){api.disable?.();await restoreNormalStems();setMasterHold(false)}else{await suspendNormalStems();await api.enable?.();if(api.state?.enabled){await enforceActivePlayback(true);setCrossfader(api.state.crossfader);setMasterHold(true)}else await restoreNormalStems()}paint()},{capture:true})}
      const directEngine=engineControl?.querySelector('[data-dds-engine-direct]');
      if(directEngine&&directEngine.dataset.ddsEngineBound!=='v1'){
        directEngine.dataset.ddsEngineBound='v1';
        directEngine.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();engineBtn?.click()});
      }
      const syncBtn=panel.querySelector('[data-dds-sync]');if(syncBtn&&syncBtn.dataset.ddsSyncBound!=='v7'){syncBtn.dataset.ddsSyncBound='v7';syncBtn.addEventListener('click',async e=>{e.preventDefault();api.sync?.();await enforceActivePlayback(true);syncBtn.classList.add('active');setTimeout(()=>syncBtn.classList.remove('active'),180)})}
      xf?.addEventListener('input',()=>setCrossfader(Number(xf.value)/100));
      perf.querySelector('[data-dds-take="A"]')?.addEventListener('click',()=>setCrossfader(0));
      perf.querySelector('[data-dds-take="B"]')?.addEventListener('click',()=>setCrossfader(1));
      perf.querySelector('[data-dds-cue-b]')?.addEventListener('click',()=>{setCrossfader(0);api.sync?.();void enforceActivePlayback(true)});
      quant?.addEventListener('change',()=>{api.state.quantize=quant.value});quant.value=api.state.quantize;
      if(master&&master.dataset.ddsPerfBound!=='v8'){
        master.dataset.ddsPerfBound='v8';
        master.addEventListener('play',()=>{
          if(api.state?.enabled){
            // 2JESTER keeps the master transport running but muted as its shared beat clock.
            // Pausing it would fire the base pause handler and silence every special stem.
            master.muted=true;
            setMasterHold(true);
            w.setTimeout(()=>void enforceActivePlayback(false),0);
            return;
          }
          w.setTimeout(()=>void enforceActivePlayback(true),0);
          w.setTimeout(()=>void enforceActivePlayback(false),40);
        });
        master.addEventListener('seeking',()=>{if(api.state?.enabled)w.setTimeout(()=>void enforceActivePlayback(true),0)});
        master.addEventListener('ratechange',()=>{if(api.state?.enabled)w.setTimeout(()=>void enforceActivePlayback(false),0)})
      }
      panel.querySelectorAll('[data-source]').forEach(select=>{
        select.disabled=false;select.style.pointerEvents='auto';
        if(select.dataset.ddsQuantizedSource!=='v10'){
          select.dataset.ddsQuantizedSource='v10';
          select.addEventListener('change',e=>{
            if(!api.state?.enabled)return;
            e.stopImmediatePropagation();
            const slotEl=select.closest('.dds-slot'),deckEl=select.closest('[data-dds-deck]'),stem=slotEl?.dataset.slot,deckName=deckEl?.dataset.ddsDeck;
            if(!deckName||!stem)return;
            void quantized(async()=>{await api.setSource?.(deckName,stem,select.value);applyStemState(deckName,stem);await enforceActivePlayback(true);paint()});
          },{capture:true});
        }
      });panel.querySelectorAll('[data-level]').forEach(range=>{range.disabled=false;range.style.pointerEvents='auto'});
      launcher.disabled=false;launcher.style.pointerEvents='auto';setCrossfader(api.state.crossfader);paint();
      api.version='v12';api.shuffle=shuffle;api.shuffleDeck=shuffleDeck;api.setStemOn=setStemOn;api.setStemLevel=setStemLevel;api.toggleStem=(deckName,stem)=>{const slot=slotState(deckName,stem);return quantized(()=>setStemOn(deckName,stem,slot?.on===false))};api.setMasterHold=setMasterHold;api.enforceActivePlayback=enforceActivePlayback;api.suspendNormalStems=suspendNormalStems;api.restoreNormalStems=restoreNormalStems;api.setCrossfader=setCrossfader;api.quantized=quantized;api.toggleTransport=toggleJeckerTransport;
      w.__enochDoubleJeckerEngine=api;
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleDeckerSpecialV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
