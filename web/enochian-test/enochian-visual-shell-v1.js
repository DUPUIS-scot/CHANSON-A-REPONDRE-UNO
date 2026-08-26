(()=>{
  const VERSION='20260827-concept-v1';
  const state={frame:null,anchors:new Map(),resizeBound:false,timer:0};
  const anchorNode=(d,node,key)=>{
    if(!node||state.anchors.has(key))return;
    const mark=d.createComment('enoch-shell:'+key);
    node.parentNode?.insertBefore(mark,node);
    state.anchors.set(key,{mark,node});
  };
  const restoreNode=key=>{
    const a=state.anchors.get(key);if(!a?.mark?.parentNode||!a.node)return;
    a.mark.parentNode.insertBefore(a.node,a.mark.nextSibling);
  };
  const makeBay=(d,strip,id,title)=>{
    let bay=d.getElementById(id);
    if(!bay){bay=d.createElement('section');bay.id=id;bay.className='enoch-shell-bay';bay.innerHTML=`<div class="enoch-shell-bay-title">${title}</div><div class="enoch-shell-bay-body"></div>`;strip.appendChild(bay)}
    return bay.querySelector('.enoch-shell-bay-body');
  };
  function ensureStructure(d){
    const grid=d.querySelector('.grid'),stage=d.querySelector('.stage'),sides=[...d.querySelectorAll('.grid>.side')];
    if(!grid||!stage||sides.length<2)return null;
    grid.classList.add('enoch-shell-grid');stage.classList.add('enoch-shell-signal');sides[0].classList.add('enoch-shell-playback');sides[1].classList.add('enoch-shell-fx-rack');
    const title=d.querySelector('.top .title');if(title){title.textContent='ENOCHIAN TERMINAL';title.dataset.subtitle='CHANSON À RÉPONDRE UNO'}
    let analyserTitle=stage.querySelector('.wave h2');if(analyserTitle)analyserTitle.textContent='3D SIGNAL · LIVE ANALYSER';
    let strip=d.getElementById('enochShellBottom');
    if(!strip){strip=d.createElement('section');strip.id='enochShellBottom';strip.className='enoch-shell-bottom';grid.appendChild(strip)}
    const bays={
      stems:makeBay(d,strip,'enochBayStems','STEMS MIX'),
      kills:makeBay(d,strip,'enochBayKills','EQ KILL'),
      instant:makeBay(d,strip,'enochBayInstant','INSTANT FX · HOLD'),
      pad:makeBay(d,strip,'enochBayPad','FX PAD'),
      pipe:makeBay(d,strip,'enochBayPipeline','SIGNAL PIPELINE')
    };
    if(!bays.pipe.querySelector('.enoch-pipeline')){
      bays.pipe.innerHTML='<div class="enoch-pipeline"><span data-stage="master">MASTER</span><i>›</i><span data-stage="stems">STEMS</span><i>›</i><span data-stage="analyser">ANALYSER</span><i>›</i><span data-stage="mod">SIGNAL MOD</span><i>›</i><span data-stage="fx">FX</span><i>›</i><span data-stage="output">OUTPUT</span></div><div class="enoch-authority">AUDIO AUTHORITY <b>MASTER DECK</b></div>';
    }
    return {grid,stage,sides,strip,bays};
  }
  function captureAnchors(d){
    anchorNode(d,d.querySelector('.stem-isolator'),'stems');
    anchorNode(d,d.querySelector('.mod'),'mod');
    anchorNode(d,d.querySelector('.pad-panel .pad-top'),'padTop');
    anchorNode(d,d.querySelector('.pad-panel .xy-pad'),'xyPad');
    anchorNode(d,d.querySelector('.pad-panel .mixer-level'),'mixer');
    anchorNode(d,d.querySelector('.pad-panel .instant-fx'),'instant');
    d.querySelectorAll('.eq-kill-btn').forEach((b,i)=>anchorNode(d,b,'kill'+i));
  }
  function moveDesktop(d,ctx){
    const {stage,sides,bays}=ctx;
    const wave=stage.querySelector('.wave');
    const deckControls=stage.querySelector('.deckarea');
    const eqWheel=deckControls?.querySelector('.wheelbox.eq'),fxWheel=deckControls?.querySelector('.wheelbox.fx');
    if(wave){wave.classList.add('enoch-shell-analyser');const floatBtn=wave.querySelector('.outer-float-launch');if(floatBtn)floatBtn.textContent='FLOAT'}
    if(deckControls){deckControls.classList.add('enoch-shell-corner-controls');if(wave?.parentNode===stage)stage.insertBefore(deckControls,wave.nextSibling)}
    eqWheel?.classList.add('enoch-shell-corner-wheel','enoch-shell-corner-left');fxWheel?.classList.add('enoch-shell-corner-wheel','enoch-shell-corner-right');

    const stems=d.querySelector('.stem-isolator');if(stems)bays.stems.appendChild(stems);
    const kills=[...d.querySelectorAll('.eq-kill-btn')];
    kills.forEach((b,i)=>{let cell=b.closest('.enoch-kill-cell');if(!cell){cell=d.createElement('div');cell.className='enoch-kill-cell';cell.innerHTML=`<span>${['LOW','MID','HIGH'][i]||'BAND'}</span>`;cell.appendChild(b)}bays.kills.appendChild(cell)});
    const instant=d.querySelector('.instant-fx');if(instant)bays.instant.appendChild(instant);
    const padTop=d.querySelector('.pad-panel .pad-top'),xy=d.querySelector('.pad-panel .xy-pad'),mixer=d.querySelector('.pad-panel .mixer-level');
    if(padTop)bays.pad.appendChild(padTop);if(xy)bays.pad.appendChild(xy);if(mixer)bays.pad.appendChild(mixer);
    const mod=d.querySelector('.mod');if(mod){mod.classList.add('enoch-shell-transform');const consoleNode=sides[1].querySelector('.console');if(consoleNode)sides[1].insertBefore(mod,consoleNode);else sides[1].appendChild(mod)}
    const fxTitle=sides[1].querySelector('.fx-title');if(fxTitle)fxTitle.textContent='FX RACK · FINE';
    const leftTitle=sides[0].querySelector('.fx-title');if(leftTitle)leftTitle.textContent='PLAYBACK';
    ctx.strip.hidden=false;d.documentElement.classList.add('enoch-shell-desktop');
  }
  function restoreCompact(d,ctx){
    ['stems','mod','padTop','xyPad','mixer','instant','kill0','kill1','kill2'].forEach(restoreNode);
    d.querySelectorAll('.enoch-kill-cell').forEach(cell=>cell.remove());
    ctx.strip.hidden=true;d.documentElement.classList.remove('enoch-shell-desktop');
  }
  function syncPipeline(d,ctx){
    const pipe=ctx.bays.pipe.querySelector('.enoch-pipeline');if(!pipe)return;
    const mark=(name,on)=>pipe.querySelector(`[data-stage="${name}"]`)?.classList.toggle('live',!!on);
    mark('master',true);mark('analyser',true);mark('output',true);
    const stems=d.querySelector('.stem-isolator');mark('stems',!!stems&&!stems.classList.contains('disabled'));
    const signal=d.getElementById('signalModToggle');mark('mod',!!signal?.classList.contains('active')||d.defaultView?.__enochSignalModulation===true);
    const wet=Number(d.getElementById('wet')?.value||0),drive=Number(d.getElementById('drive')?.value||0),delay=Number(d.getElementById('delay')?.value||0);mark('fx',wet>0||drive>0||delay>0);
  }
  function addStyle(d){
    if(d.getElementById('enochVisualShellV1Style'))return;
    const s=d.createElement('style');s.id='enochVisualShellV1Style';s.textContent=`
      :root{--shell-bg:#02080d;--shell-panel:#031017;--shell-line:#9b6b2e;--shell-line-soft:rgba(201,139,52,.42);--shell-cyan:#35e1f4;--shell-cyan-soft:rgba(53,225,244,.18);--shell-amber:#f1a72d;--shell-dim:#79a8ad}
      html.enoch-shell-desktop,html.enoch-shell-desktop body{background:#01060a!important}
      html.enoch-shell-desktop .app{max-width:none!important;width:100%!important;height:100dvh!important;min-height:0!important;padding:5px!important;gap:5px!important;grid-template-rows:54px minmax(0,1fr) 18px!important;transform:none!important}
      html.enoch-shell-desktop .top{height:54px!important;min-height:54px!important;border:1px solid var(--shell-line)!important;background:#031018!important}
      html.enoch-shell-desktop .top .title{font-size:19px!important;letter-spacing:.26em!important;color:var(--shell-amber)!important;line-height:1!important}
      html.enoch-shell-desktop .top .title:after{content:attr(data-subtitle);display:block;margin-top:5px;font-size:7px;letter-spacing:.32em;color:var(--shell-cyan)}
      html.enoch-shell-desktop .frame,html.enoch-shell-desktop .box,html.enoch-shell-desktop .fxbox,html.enoch-shell-desktop .mod,html.enoch-shell-desktop .console,html.enoch-shell-desktop .pad-panel,html.enoch-shell-desktop .stem-isolator{border-radius:1px!important;border-color:var(--shell-line-soft)!important;background:linear-gradient(180deg,#04121a,#020a0f)!important;box-shadow:inset 0 0 0 1px rgba(255,171,46,.035)!important}
      html.enoch-shell-desktop .enoch-shell-grid{display:grid!important;height:100%!important;min-height:0!important;grid-template-columns:minmax(250px,22%) minmax(500px,56%) minmax(250px,22%)!important;grid-template-rows:minmax(0,1fr) 230px!important;gap:5px!important;overflow:hidden!important}
      html.enoch-shell-desktop .enoch-shell-playback{grid-column:1;grid-row:1;overflow:hidden!important;padding:6px!important;gap:4px!important}
      html.enoch-shell-desktop .enoch-shell-signal{grid-column:2;grid-row:1;position:relative!important;padding:5px!important;display:grid!important;grid-template-rows:minmax(0,1fr)!important;overflow:hidden!important;gap:0!important}
      html.enoch-shell-desktop .enoch-shell-fx-rack{grid-column:3;grid-row:1;overflow:hidden!important;padding:6px!important;gap:4px!important}
      html.enoch-shell-desktop .enoch-shell-bottom{grid-column:1/-1;grid-row:2;display:grid;grid-template-columns:1.15fr .78fr .92fr .86fr 1.38fr;gap:5px;min-height:0}
      html.enoch-shell-desktop .enoch-shell-bay{min-width:0;min-height:0;border:1px solid var(--shell-line);background:linear-gradient(180deg,#031018,#02090e);display:grid;grid-template-rows:26px minmax(0,1fr);overflow:hidden;box-shadow:inset 0 0 18px #0008}
      html.enoch-shell-desktop .enoch-shell-bay-title{display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--shell-line-soft);font:800 9px/1 "Arial Narrow",ui-monospace,monospace;letter-spacing:.18em;color:var(--shell-amber);text-transform:uppercase}
      html.enoch-shell-desktop .enoch-shell-bay-body{min-height:0;padding:6px;overflow:hidden}
      html.enoch-shell-desktop .enoch-shell-analyser{position:relative!important;inset:auto!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;border:1px solid rgba(53,225,244,.48)!important;background:linear-gradient(rgba(53,225,244,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(53,225,244,.035) 1px,transparent 1px),radial-gradient(circle at 50% 55%,rgba(0,95,119,.26),transparent 62%),#01080d!important;background-size:24px 24px,24px 24px,auto,auto!important;box-shadow:inset 0 0 50px #000,0 0 24px rgba(53,225,244,.06)!important}
      html.enoch-shell-desktop .enoch-shell-analyser h2{font-size:11px!important;letter-spacing:.22em!important;color:var(--shell-amber)!important;margin:10px 120px 0!important}
      html.enoch-shell-desktop .enoch-shell-analyser canvas{top:44px!important;bottom:88px!important;height:auto!important;width:calc(100% - 18px)!important}
      html.enoch-shell-desktop .enoch-shell-analyser .signals{left:14px!important;right:14px!important;top:48px!important;bottom:auto!important;grid-template-columns:repeat(4,1fr)!important;z-index:12!important}
      html.enoch-shell-desktop .enoch-shell-analyser .sig{background:rgba(2,12,17,.82)!important;border-color:rgba(53,225,244,.38)!important}
      html.enoch-shell-desktop .outer-float-launch{top:8px!important;right:8px!important;border-color:var(--shell-line)!important;color:var(--shell-amber)!important;background:#0b0d0b!important}
      html.enoch-shell-desktop .enoch-shell-corner-controls{position:absolute!important;inset:0!important;display:block!important;z-index:40!important;pointer-events:none!important;margin:0!important;padding:0!important;max-width:none!important;width:auto!important;min-height:0!important}
      html.enoch-shell-desktop .enoch-shell-corner-controls>.platter-wrap,html.enoch-shell-desktop .enoch-shell-corner-controls>.seek{display:none!important}
      html.enoch-shell-desktop .enoch-shell-corner-controls:before{display:none!important}
      html.enoch-shell-desktop .enoch-shell-corner-wheel{position:absolute!important;bottom:14px!important;width:94px!important;padding:4px!important;pointer-events:auto!important;background:rgba(2,10,15,.9)!important;border:1px solid var(--shell-line)!important}
      html.enoch-shell-desktop .enoch-shell-corner-left{left:14px!important}html.enoch-shell-desktop .enoch-shell-corner-right{right:14px!important}
      html.enoch-shell-desktop .enoch-shell-corner-wheel .wheel{width:66px!important;height:66px!important;border-color:var(--shell-line)!important}
      html.enoch-shell-desktop .enoch-shell-corner-wheel .wheel:before{top:6px!important;height:17px!important;transform-origin:2px 27px!important;background:var(--shell-amber)!important}
      html.enoch-shell-desktop .wheel-value,html.enoch-shell-desktop output,html.enoch-shell-desktop .stem-value,html.enoch-shell-desktop .pad-readout{color:var(--shell-cyan)!important}
      html.enoch-shell-desktop .range::-webkit-slider-runnable-track{background:linear-gradient(90deg,var(--shell-cyan) 0 var(--pct),#0a171b var(--pct) 100%)!important}
      html.enoch-shell-desktop .range::-webkit-slider-thumb{border-color:#ffd277!important;background:radial-gradient(circle at 35% 30%,#fff2b7 0 8%,#f1a72d 14%,#8f5512 55%,#1a0d04 100%)!important}
      html.enoch-shell-desktop #enochBayStems .stem-isolator{height:100%!important;padding:5px!important;gap:4px!important;border:0!important;background:transparent!important}
      html.enoch-shell-desktop #enochBayStems .stem-row{grid-template-columns:72px minmax(0,1fr) 34px!important;gap:4px!important}
      html.enoch-shell-desktop #enochBayKills .enoch-shell-bay-body{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;align-items:stretch}
      html.enoch-shell-desktop .enoch-kill-cell{display:grid;grid-template-rows:auto 1fr;gap:7px;align-items:center;justify-items:stretch;border:1px solid rgba(53,225,244,.18);padding:8px;background:#020b10}
      html.enoch-shell-desktop .enoch-kill-cell>span{text-align:center;font-size:8px;letter-spacing:.16em;color:var(--shell-dim)}
      html.enoch-shell-desktop .enoch-kill-cell .eq-kill-btn{width:100%!important;height:100%!important;min-height:54px!important;font-size:9px!important}
      html.enoch-shell-desktop #enochBayInstant .instant-fx{height:100%!important;display:grid!important;grid-template-rows:1fr!important;padding:0!important;border:0!important}
      html.enoch-shell-desktop #enochBayInstant .instant-fx-title{display:none!important}
      html.enoch-shell-desktop #enochBayInstant .instant-fx-grid{height:100%!important;display:grid!important;grid-template-columns:1fr!important;grid-template-rows:repeat(3,1fr)!important;gap:5px!important}
      html.enoch-shell-desktop #enochBayInstant .instant-fx-btn{min-height:0!important;border-radius:1px!important}
      html.enoch-shell-desktop #enochBayPad .enoch-shell-bay-body{position:relative;display:grid;grid-template-rows:auto minmax(0,1fr);padding:6px}
      html.enoch-shell-desktop #enochBayPad .pad-top{grid-row:1!important;display:flex!important;min-height:22px!important}.enoch-shell-desktop #enochBayPad .pad-mode{display:none!important}
      html.enoch-shell-desktop #enochBayPad .xy-pad{grid-row:2!important;height:100%!important;min-height:0!important;border-radius:1px!important;border-color:var(--shell-line-soft)!important}
      html.enoch-shell-desktop #enochBayPad .mixer-level{position:absolute!important;right:4px!important;top:30px!important;bottom:4px!important;width:46px!important;min-width:0!important;z-index:5!important;background:rgba(2,9,13,.82)!important;border:1px solid var(--shell-line-soft)!important;padding:4px!important}
      html.enoch-shell-desktop #enochBayPad .mixer-level-title{font-size:6px!important}html.enoch-shell-desktop #enochBayPad .mixer-level-value{min-width:32px!important;font-size:8px!important;padding:2px!important}
      html.enoch-shell-desktop .enoch-shell-transform{padding:5px!important;grid-template-columns:minmax(0,1fr) 74px!important;transform:none!important;max-height:150px!important;overflow:hidden!important}
      html.enoch-shell-desktop .enoch-shell-transform .mod-main{gap:3px!important}.enoch-shell-desktop .enoch-shell-transform textarea{height:30px!important;min-height:30px!important}.enoch-shell-desktop .enoch-shell-transform .mod-glyphs{display:none!important}.enoch-shell-desktop .enoch-shell-transform .mod-state{grid-template-columns:repeat(5,1fr)!important;gap:2px!important}.enoch-shell-desktop .enoch-shell-transform>.wheelbox{width:68px!important}.enoch-shell-desktop .enoch-shell-transform>.wheelbox .wheel{width:54px!important;height:54px!important}.enoch-shell-desktop .enoch-shell-transform>.wheelbox .wheel:before{top:5px!important;height:14px!important;transform-origin:2px 22px!important}
      html.enoch-shell-desktop .enoch-shell-fx-rack .console{min-height:0!important;flex:1!important}.enoch-shell-desktop .enoch-shell-fx-rack .console-lines{height:70px!important}
      html.enoch-shell-desktop .enoch-pipeline{display:grid;grid-template-columns:repeat(11,auto);gap:5px;align-items:center;justify-content:center;height:76px}
      html.enoch-shell-desktop .enoch-pipeline span{min-width:58px;height:48px;border:1px solid #36565d;display:grid;place-items:center;padding:4px;text-align:center;font-size:7px;letter-spacing:.08em;color:#7d9ea5;background:#020b10}
      html.enoch-shell-desktop .enoch-pipeline span.live{border-color:var(--shell-cyan);color:var(--shell-cyan);box-shadow:inset 0 0 12px var(--shell-cyan-soft)}
      html.enoch-shell-desktop .enoch-pipeline i{color:var(--shell-cyan);font-style:normal}.enoch-shell-desktop .enoch-authority{text-align:center;font-size:7px;letter-spacing:.15em;color:var(--shell-dim)}.enoch-shell-desktop .enoch-authority b{display:block;width:160px;margin:8px auto 0;padding:8px;border:1px solid rgba(53,225,244,.45);color:var(--shell-cyan);font-size:11px;letter-spacing:.13em}
      html.enoch-shell-desktop .foot{font-size:6px!important;padding:2px!important;color:#8b6330!important;letter-spacing:.18em!important}
      @media(max-width:1000px){#enochShellBottom{display:none!important}}
    `;d.head.appendChild(s);
  }
  function sync(frame){
    try{
      const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;if(!d||!w)return false;
      const ctx=ensureStructure(d);if(!ctx)return false;addStyle(d);captureAnchors(d);
      if(w.innerWidth>=1001)moveDesktop(d,ctx);else restoreCompact(d,ctx);
      syncPipeline(d,ctx);d.documentElement.dataset.enochVisualShellV1=VERSION;
      if(!d.defaultView.__enochVisualShellTicker){d.defaultView.__enochVisualShellTicker=d.defaultView.setInterval(()=>syncPipeline(d,ctx),220)}
      return true;
    }catch(_){return false}
  }
  window.installEnochianVisualShellV1=frame=>{
    state.frame=frame;
    if(sync(frame)){if(state.timer){clearInterval(state.timer);state.timer=0}if(!state.resizeBound){state.resizeBound=true;addEventListener('resize',()=>setTimeout(()=>sync(state.frame),40));addEventListener('orientationchange',()=>setTimeout(()=>sync(state.frame),120))}return true}
    if(!state.timer){let n=0;state.timer=setInterval(()=>{if(sync(state.frame)||++n>240){clearInterval(state.timer);state.timer=0}},50)}
    return false;
  };
})();
