(function(){
  'use strict';
  window.installEnochianConsoleBottom=function(host){
    function apply(){
      try{
        const live=host&&host.contentDocument;
        const deck=live&&live.getElementById('deck');
        const d=deck&&deck.contentDocument;
        const w=d&&d.defaultView;
        if(!d||!w)return false;

        if(!d.getElementById('enoch-console-bottom-style')){
          const s=d.createElement('style');
          s.id='enoch-console-bottom-style';
          s.textContent=`
            @media (min-width:1001px){
              .grid{align-items:stretch!important}
              .side:last-child{min-height:0!important;height:100%!important;display:flex!important;flex-direction:column!important;align-items:stretch!important}
              .side:last-child .console{flex:1 1 auto!important;align-self:stretch!important;min-height:220px!important;height:auto!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;margin-bottom:0!important}
              .side:last-child .console-lines{height:auto!important;min-height:160px!important;max-height:none!important;flex:1 1 auto!important;overflow:auto!important}
              html.terminal-fullscreen .side:last-child{height:100%!important;min-height:0!important}
              html.terminal-fullscreen .side:last-child .console{flex:1 1 auto!important;height:auto!important;min-height:0!important}
              html.terminal-fullscreen .side:last-child .console-lines{height:auto!important;min-height:0!important;max-height:none!important;flex:1 1 auto!important;overflow:auto!important}
            }
            .double-decker-special-launch{width:100%!important;min-height:30px!important;border-color:#7b6339!important;color:#f0c97e!important;background:#171308!important;font-size:7px!important;letter-spacing:.1em!important;font-weight:900!important}
            .double-decker-special-launch.active{border-color:#d5aa63!important;color:#ffe4a4!important;box-shadow:0 0 13px #d5aa6344!important}
          `;
          d.head.appendChild(s);
        }

        const outer=document;
        if(!outer.getElementById('double-decker-special-style')){
          const style=outer.createElement('style');
          style.id='double-decker-special-style';
          style.textContent=`
            #doubleDeckerSpecial{position:fixed;left:50%;top:54px;transform:translateX(-50%);width:min(980px,94vw);height:min(520px,82dvh);z-index:2147483100;display:none;grid-template-rows:34px minmax(0,1fr) 42px;background:linear-gradient(180deg,#06110ff8,#010403fd);border:1px solid #7b6339;border-radius:8px;box-shadow:0 20px 70px #000e;overflow:hidden;color:#d7fff8;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;resize:both}
            #doubleDeckerSpecial.open{display:grid}
            .dds-bar{display:grid;grid-template-columns:auto 1fr auto auto;gap:6px;align-items:center;padding:0 7px;border-bottom:1px solid #4f4027;background:#120d06;color:#f0c97e;cursor:grab;touch-action:none;user-select:none}
            .dds-bar strong{font-size:8px;letter-spacing:.12em;text-align:center}.dds-bar button,.dds-btn{border:1px solid #315b56;border-radius:4px;background:#06110f;color:#a9eee7;padding:5px 7px;font:800 7px/1 inherit;cursor:pointer}.dds-bar button.active,.dds-btn.active{border-color:#d5aa63;color:#ffe4a4;background:#211808}
            .dds-body{display:grid;grid-template-columns:minmax(0,1fr) 170px minmax(0,1fr);gap:7px;padding:7px;min-height:0;overflow:auto}
            .dds-deck{border:1px solid #17332e;border-radius:6px;background:#020706;padding:7px;display:grid;grid-template-rows:auto repeat(4,minmax(54px,1fr));gap:5px;min-width:0}.dds-deck h3{margin:0;text-align:center;font-size:9px;letter-spacing:.15em;color:#f0c97e}.dds-slot{display:grid;grid-template-columns:58px minmax(90px,1fr) 72px 34px;gap:4px;align-items:center;border:1px solid #17332e;border-radius:4px;padding:4px;background:#010403}.dds-slot label{font-size:7px;color:#9dece0;font-weight:900}.dds-slot select{min-width:0;width:100%;background:#06110f;color:#d7fff8;border:1px solid #315b56;border-radius:3px;padding:4px;font-size:7px}.dds-slot input{width:100%;accent-color:#d5aa63}.dds-slot output{font-size:7px;color:#d5aa63;text-align:right}
            .dds-center{display:grid;grid-template-rows:auto auto auto 1fr;gap:6px;border:1px solid #4f4027;border-radius:6px;background:#0b0804;padding:7px;min-width:0}.dds-center h3{margin:0;text-align:center;font-size:8px;color:#f0c97e;letter-spacing:.12em}.dds-cross{display:grid;gap:3px}.dds-cross input{width:100%;accent-color:#d5aa63}.dds-cross div{display:flex;justify-content:space-between;font-size:7px;color:#789f99}.dds-status{border:1px solid #315b56;border-radius:4px;padding:6px;font-size:7px;line-height:1.4;color:#a9eee7;background:#020706}.dds-status b{color:#f0c97e}.dds-note{font-size:6px;color:#789f99;line-height:1.35;align-self:end}.dds-foot{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;padding:5px 7px;border-top:1px solid #4f4027;background:#080603}.dds-foot span{font-size:7px;color:#789f99}.dds-enable{border-color:#7b6339!important;color:#f0c97e!important}.dds-enable.active{background:#3c2607!important;color:#ffe4a4!important;border-color:#d5aa63!important;box-shadow:0 0 14px #d5aa6344!important}
            @media(max-width:720px){#doubleDeckerSpecial{left:4px!important;top:4px!important;transform:none!important;width:calc(100vw - 8px)!important;height:calc(100dvh - 8px)!important;max-width:none!important;max-height:none!important;resize:none!important}.dds-body{grid-template-columns:1fr 132px 1fr;gap:4px;padding:4px}.dds-deck{padding:4px;gap:3px}.dds-slot{grid-template-columns:43px minmax(72px,1fr);grid-template-rows:auto auto}.dds-slot input,.dds-slot output{grid-row:2}.dds-center{padding:4px}.dds-bar strong{font-size:7px}}
          `;
          outer.head.appendChild(style);
        }

        const catalog=[
          {key:'ai_comptroller',label:'AI COMPTROLLER'},
          {key:'caesar_spitter',label:'CAESAR-SPITTER'},
          {key:'the_kraken',label:'THE KRAKEN'},
          {key:'heliogabal_design',label:'HELIOGABAL//DESIGN'},
          {key:'vivid_void',label:'VIVID VOID'}
        ];
        const stems=['vocals','drums','bass','other'];
        const stemPath=(track,stem)=>'/assets/assets/audio/stems/'+track+'/'+track+'_'+stem+'.mp3';
        const api=w.__enochStemRuntimeApi;
        const masterAudio=api&&api.audio?api.audio:d.getElementById('audio');
        if(!masterAudio)return false;

        let launcher=d.getElementById('doubleDeckerSpecialLaunch');
        if(!launcher){
          launcher=d.createElement('button');launcher.type='button';launcher.id='doubleDeckerSpecialLaunch';launcher.className='btn double-decker-special-launch';launcher.textContent='DOUBLE DECKER SPECIAL';launcher.setAttribute('aria-label','Open DOUBLE DECKER SPECIAL');
          const left=d.querySelector('.grid>aside:first-child');
          const stemBox=d.querySelector('.stem-isolator');
          if(stemBox&&stemBox.parentNode)stemBox.insertAdjacentElement('beforebegin',launcher);else if(left)left.appendChild(launcher);else d.body.appendChild(launcher);
        }

        let panel=outer.getElementById('doubleDeckerSpecial');
        if(!panel){
          panel=outer.createElement('section');panel.id='doubleDeckerSpecial';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','DOUBLE DECKER SPECIAL');
          const options=catalog.map(x=>`<option value="${x.key}">${x.label}</option>`).join('');
          const deckMarkup=name=>`<section class="dds-deck" data-dds-deck="${name}"><h3>DECK ${name}</h3>${stems.map(st=>`<div class="dds-slot" data-slot="${st}"><label>${st.toUpperCase()}</label><select data-source>${options}</select><input data-level type="range" min="0" max="100" value="100"><output data-value>100%</output></div>`).join('')}</section>`;
          panel.innerHTML=`<div class="dds-bar"><button type="button" data-dds-enable>ENGINE OFF</button><strong>DOUBLE DECKER SPECIAL · HYBRID STEM ROUTING</strong><button type="button" data-dds-reset>RESET</button><button type="button" data-dds-close>RESTORE</button></div><div class="dds-body">${deckMarkup('A')}<section class="dds-center"><h3>HYBRID MASTER</h3><div class="dds-cross"><div><span>DECK A</span><span>DECK B</span></div><input data-cross type="range" min="0" max="100" value="0"></div><div class="dds-status"><b data-dds-state>READY</b><br>8 LIVE STEM SLOTS<br>TRANSPORT LOCK · MASTER CLOCK</div><div class="dds-note">Each slot can load a stem from a different source track. Opening the panel does not change sound. ENGINE ON routes the eight special slots and uses the normal deck transport as clock.</div></section>${deckMarkup('B')}</div><div class="dds-foot"><span>DOUBLE DECKER SPECIAL · ATTACHED TO DECK ENGINE</span><button class="dds-btn" type="button" data-dds-sync>SYNC NOW</button><button class="dds-btn" type="button" data-dds-close>HIDE</button></div>`;
          outer.body.appendChild(panel);
        }

        if(panel.dataset.ddsInstalled==='v1')return true;
        panel.dataset.ddsInstalled='v1';
        launcher.dataset.ddsInstalled='v1';

        const state={version:'v1',enabled:false,crossfade:0,ctx:null,deckGain:{},masterGain:null,slots:{A:{},B:{}},savedMasterMuted:false,move:null};
        const currentTrack=()=>{try{const idx=Number(d.getElementById('track')?.value)||0;return catalog[idx]||catalog[0]}catch(_){return catalog[0]}};
        const setStateText=text=>{const el=panel.querySelector('[data-dds-state]');if(el)el.textContent=text};
        const applyCrossfade=()=>{if(!state.ctx)return;const x=Math.max(0,Math.min(1,state.crossfade)),aGain=Math.cos(x*Math.PI*.5),bGain=Math.sin(x*Math.PI*.5),now=state.ctx.currentTime;[['A',aGain],['B',bGain]].forEach(([k,v])=>{const g=state.deckGain[k]?.gain;if(!g)return;g.cancelScheduledValues?.(now);g.setTargetAtTime?.(v,now,.015)??(g.value=v)})};
        const applySlotLevel=(deckName,stem)=>{const slot=state.slots[deckName][stem];if(!slot?.gain||!state.ctx)return;const now=state.ctx.currentTime,target=Math.max(0,Math.min(1,slot.level));slot.gain.gain.cancelScheduledValues?.(now);if(slot.gain.gain.setTargetAtTime)slot.gain.gain.setTargetAtTime(target,now,.012);else slot.gain.gain.value=target};
        const syncOne=(slot,force=false)=>{if(!slot?.media)return;try{const t=Number(masterAudio.currentTime)||0,rate=Math.max(.25,Math.min(4,Number(masterAudio.playbackRate)||1)),diff=t-(Number(slot.media.currentTime)||0);slot.media.playbackRate=rate;slot.media.preservesPitch=false;slot.media.webkitPreservesPitch=false;if(force||Math.abs(diff)>.045)slot.media.currentTime=t;else slot.media.playbackRate=Math.max(.25,Math.min(4,rate*(1+Math.max(-.012,Math.min(.012,diff*.12)))))}catch(_){}};
        const syncAll=(force=false)=>{['A','B'].forEach(deckName=>stems.forEach(st=>syncOne(state.slots[deckName][st],force)))};
        const playAll=async()=>{if(!state.enabled)return;syncAll(true);await Promise.all(['A','B'].flatMap(deckName=>stems.map(st=>state.slots[deckName][st]?.media?.play?.().catch(()=>{}))))};
        const pauseAll=()=>['A','B'].forEach(deckName=>stems.forEach(st=>{try{state.slots[deckName][st]?.media?.pause()}catch(_){}}));
        const ensureAudio=async()=>{
          if(state.ctx){if(state.ctx.state!=='running')await state.ctx.resume();return}
          const C=outer.AudioContext||outer.webkitAudioContext;if(!C)throw new Error('WEB AUDIO UNAVAILABLE');state.ctx=new C();state.masterGain=state.ctx.createGain();state.masterGain.gain.value=.92;state.masterGain.connect(state.ctx.destination);
          ['A','B'].forEach(deckName=>{const dg=state.ctx.createGain();dg.gain.value=deckName==='A'?1:0;dg.connect(state.masterGain);state.deckGain[deckName]=dg;stems.forEach(st=>{const m=outer.createElement('audio');m.preload='auto';m.crossOrigin='anonymous';m.setAttribute('aria-hidden','true');m.style.display='none';outer.body.appendChild(m);const source=state.ctx.createMediaElementSource(m),gain=state.ctx.createGain();gain.gain.value=1;source.connect(gain).connect(dg);state.slots[deckName][st]={media:m,source,gain,level:1,track:currentTrack().key};m.src=stemPath(currentTrack().key,st);m.load()})});applyCrossfade();
        };
        const loadSlot=async(deckName,stem,track)=>{await ensureAudio();const slot=state.slots[deckName][stem];if(!slot)return;slot.track=track;try{slot.media.pause();slot.media.src=stemPath(track,stem);slot.media.load();slot.media.currentTime=Math.max(0,Number(masterAudio.currentTime)||0);slot.media.playbackRate=Number(masterAudio.playbackRate)||1;if(state.enabled&&!masterAudio.paused)await slot.media.play()}catch(_){setStateText('SOURCE ERROR')}};
        const resetAssignments=async()=>{const key=currentTrack().key;panel.querySelectorAll('[data-dds-deck]').forEach(deckEl=>{const deckName=deckEl.dataset.ddsDeck;deckEl.querySelectorAll('.dds-slot').forEach(slotEl=>{const st=slotEl.dataset.slot,select=slotEl.querySelector('[data-source]'),range=slotEl.querySelector('[data-level]'),out=slotEl.querySelector('[data-value]');select.value=key;range.value='100';out.textContent='100%';if(state.slots[deckName]?.[st]){state.slots[deckName][st].level=1;applySlotLevel(deckName,st);loadSlot(deckName,st,key)}})});state.crossfade=0;panel.querySelector('[data-cross]').value='0';applyCrossfade();setStateText(state.enabled?'ENGINE ON':'READY')};
        const enable=async()=>{try{await ensureAudio();state.enabled=true;state.savedMasterMuted=!!masterAudio.muted;masterAudio.muted=true;panel.querySelector('[data-dds-enable]').classList.add('active');panel.querySelector('[data-dds-enable]').textContent='ENGINE ON';launcher.classList.add('active');setStateText('ENGINE ON');if(!masterAudio.paused)await playAll()}catch(_){state.enabled=false;masterAudio.muted=state.savedMasterMuted;setStateText('ENGINE ERROR')}};
        const disable=()=>{state.enabled=false;pauseAll();masterAudio.muted=state.savedMasterMuted;panel.querySelector('[data-dds-enable]').classList.remove('active');panel.querySelector('[data-dds-enable]').textContent='ENGINE OFF';launcher.classList.remove('active');setStateText('READY')};
        const open=()=>{panel.classList.add('open');launcher.textContent='DOUBLE DECKER SPECIAL · OPEN';try{const saved=JSON.parse(localStorage.getItem('doubleDeckerSpecialRect')||'null');if(saved&&innerWidth>720){panel.style.left=saved.left+'px';panel.style.top=saved.top+'px';panel.style.width=saved.width+'px';panel.style.height=saved.height+'px';panel.style.transform='none'}}catch(_){}};
        const close=()=>{try{if(innerWidth>720){const r=panel.getBoundingClientRect();localStorage.setItem('doubleDeckerSpecialRect',JSON.stringify({left:r.left,top:r.top,width:r.width,height:r.height}))}}catch(_){}panel.classList.remove('open');launcher.textContent='DOUBLE DECKER SPECIAL'};
        launcher.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();panel.classList.contains('open')?close():open()});
        panel.querySelectorAll('[data-dds-close]').forEach(b=>b.addEventListener('click',close));
        panel.querySelector('[data-dds-enable]').addEventListener('click',()=>state.enabled?disable():enable());
        panel.querySelector('[data-dds-reset]').addEventListener('click',resetAssignments);
        panel.querySelector('[data-dds-sync]').addEventListener('click',()=>{syncAll(true);setStateText(state.enabled?'SYNCED':'READY')});
        panel.querySelector('[data-cross]').addEventListener('input',e=>{state.crossfade=(Number(e.target.value)||0)/100;applyCrossfade()});
        panel.querySelectorAll('[data-dds-deck]').forEach(deckEl=>{const deckName=deckEl.dataset.ddsDeck;deckEl.querySelectorAll('.dds-slot').forEach(slotEl=>{const st=slotEl.dataset.slot,select=slotEl.querySelector('[data-source]'),range=slotEl.querySelector('[data-level]'),out=slotEl.querySelector('[data-value]');select.value=currentTrack().key;select.addEventListener('change',()=>loadSlot(deckName,st,select.value));range.addEventListener('input',()=>{const v=Math.max(0,Math.min(100,Number(range.value)||0));out.textContent=Math.round(v)+'%';if(state.slots[deckName]?.[st]){state.slots[deckName][st].level=v/100;applySlotLevel(deckName,st)}})})});
        const bar=panel.querySelector('.dds-bar');bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||innerWidth<=720)return;const r=panel.getBoundingClientRect();state.move={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};panel.style.transform='none';try{bar.setPointerCapture(e.pointerId)}catch(_){}});bar.addEventListener('pointermove',e=>{if(!state.move||e.pointerId!==state.move.id)return;const maxL=Math.max(4,innerWidth-panel.offsetWidth-4),maxT=Math.max(4,innerHeight-panel.offsetHeight-4);panel.style.left=Math.min(Math.max(4,e.clientX-state.move.dx),maxL)+'px';panel.style.top=Math.min(Math.max(4,e.clientY-state.move.dy),maxT)+'px'});const endMove=e=>{if(!state.move||e.pointerId!==state.move.id)return;state.move=null};bar.addEventListener('pointerup',endMove);bar.addEventListener('pointercancel',endMove);
        masterAudio.addEventListener('play',()=>{if(state.enabled)playAll()});masterAudio.addEventListener('pause',()=>{if(state.enabled)pauseAll()});masterAudio.addEventListener('seeking',()=>{if(state.enabled)syncAll(true)});masterAudio.addEventListener('seeked',()=>{if(state.enabled)syncAll(true)});masterAudio.addEventListener('ratechange',()=>{if(state.enabled)syncAll(true)});
        let driftTimer=0;const drift=()=>{if(state.enabled&&!masterAudio.paused)syncAll(false);driftTimer=w.setTimeout(drift,280)};driftTimer=w.setTimeout(drift,280);
        w.addEventListener('pagehide',()=>{if(driftTimer)w.clearTimeout(driftTimer);disable()},{once:true});
        w.__enochDoubleDeckerSpecial={version:'v1',name:'DOUBLE DECKER SPECIAL',state,open,close,enable,disable,sync:()=>syncAll(true),setSource:loadSlot};
        return true;
      }catch(_){return false}
    }
    let n=0;
    const t=setInterval(()=>{if(apply()||++n>200)clearInterval(t)},50);
    apply();
  };
})();
