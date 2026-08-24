(()=>{
  const GLYPHS=['Un','Pa','Veh','Gal','Graph','Or','Na','Gon','Ur','Tal','Gisa','Fam','Ged','Don','Med','Mals','Ger','Drux','Pal','Ceph','Van'];
  const glyphUrl=i=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/Enochian%20-%20'+encodeURIComponent(GLYPHS[i])+'.svg';
  const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
  const pct=v=>Math.max(0,Math.min(1,(parseFloat(v)||0)/100));
  const active=e=>!!e&&(e.classList.contains('active')||e.getAttribute('aria-pressed')==='true');
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView,bus=w&&w.__enochAnalyserBus;
      if(!d||!d.body||!w||!bus||!d.getElementById('b0')||!d.getElementById('log'))return false;
      if(d.documentElement.dataset.compositeAnalyser==='v9')return true;d.documentElement.dataset.compositeAnalyser='v9';
      const get=id=>parseFloat(d.getElementById(id)?.value)||0;
      const modDepthNow=()=>pct(d.getElementById('modWheelV')?.textContent||0);
      const stemLevel=key=>{const r=d.querySelector('[data-stem-range="'+key+'"]'),b=d.querySelector('[data-stem-toggle="'+key+'"]');return active(b)?pct(r?.value??100):0};
      let raw=bus.rawSignal.slice(0,4),lastLog=0,lastState='',raf=0;
      const unsubscribe=bus.subscribe((type,payload)=>{if(type==='signal'&&Array.isArray(payload))raw=payload.slice(0,4).map(clamp)});
      const tick=()=>{
        const vocals=stemLevel('vocals'),drums=stemLevel('drums'),instruments=stemLevel('instruments'),master=Math.max(0,Math.min(1,get('vol'))),low=Math.max(0,Math.min(1,(get('low')+18)/36)),mid=Math.max(0,Math.min(1,(get('mid')+18)/36)),high=Math.max(0,Math.min(1,(get('high')+18)/36));
        const eqMacro=(parseFloat((d.getElementById('eqWheelV')?.textContent||'').match(/-?\d+/)?.[0])||0)/100,fxMacro=pct((d.getElementById('fxWheelV')?.textContent||'0').replace('%',''));
        const padText=d.getElementById('padReadout')?.textContent||'',xy=[...padText.matchAll(/(?:X|Y)\s*(\d+)/g)].map(m=>(+m[1]||0)/100),padX=xy[0]??.5,padY=xy[1]??.5,mix=pct(d.getElementById('fxMixV')?.textContent||50);
        const instant=[...d.querySelectorAll('.instant-fx-btn')].some(active)?1:0,modOn=active(d.getElementById('modActivate'))?1:0,modDepth=modDepthNow(),pitch=Math.min(1,Math.abs(get('pitch'))/12),signalMod=active(d.getElementById('signalModToggle'))||w.__enochSignalModulation===true;
        const gesture=w.__enochAnalyserGesture||{},def=gesture.deform||{},defY=signalMod?Math.max(-1,Math.min(1,def.pullY||0)):0,defZ=signalMod?Math.max(-1,Math.min(1,def.pullZ||0)):0,twist=signalMod?Math.max(-1,Math.min(1,def.twist||0)):0;
        const defSpeed=signalMod?Math.max(0,Math.min(1,Math.hypot(def.vY||0,def.vZ||0)*650)):0,defEnergy=signalMod?Math.max(0,Math.min(1,(Math.abs(defY)*.42+Math.abs(defZ)*.38+Math.abs(twist)*.20)*modDepth)):0;
        const vals=[clamp(raw[0]*.72+42*drums+26*instruments+25*low+10*master+10*Math.max(0,-eqMacro)+10*fxMacro+24*Math.max(0,-defZ)*modDepth+12*defEnergy+8*defSpeed),clamp(raw[1]*.72+38*vocals+22*instruments+25*mid+10*master+10*modOn*modDepth+7*padX+28*Math.max(0,defY)*modDepth+14*Math.abs(twist)*modDepth+8*defEnergy),clamp(raw[2]*.72+26*vocals+30*instruments+25*high+10*master+14*fxMacro+10*mix*padY+10*instant+24*Math.max(0,defZ)*modDepth+18*Math.max(0,-defY)*modDepth+16*Math.abs(twist)*modDepth),clamp(raw[3]*.76+46*drums+10*pitch+10*instant+8*modOn*modDepth+28*defSpeed+18*defEnergy)];
        vals.forEach((n,i)=>{const b=d.getElementById('b'+i),g=d.getElementById('g'+i);if(b)b.textContent=n.toString(2).padStart(8,'0');if(g)g.src=glyphUrl(n%21)});
        const now=performance.now(),bits=vals.map(v=>v.toString(2).padStart(8,'0')),state=bits.join('|')+'|'+signalMod+'|'+Math.round(defY*100)+'|'+Math.round(defZ*100)+'|'+Math.round(twist*100)+'|'+Math.round(modDepth*100);
        if(now-lastLog>600&&state!==lastState&&!d.getElementById('audio')?.paused){lastLog=now;lastState=state;const row=d.createElement('div');row.className='signal-flow-line';row.textContent='ENOCHIAN FLOW · '+bits.join(' ')+' · V'+Math.round(vocals*100)+' D'+Math.round(drums*100)+' I'+Math.round(instruments*100)+' M'+Math.round(master*100)+' · EQ '+Math.round(low*100)+'/'+Math.round(mid*100)+'/'+Math.round(high*100)+' · FX '+Math.round(fxMacro*100)+' PAD '+Math.round(padX*100)+'/'+Math.round(padY*100)+' MIX '+Math.round(mix*100)+' MOD '+Math.round(modOn*modDepth*100)+' · SIGNAL MOD '+(signalMod?'SCULPT '+Math.round(defY*100)+'/'+Math.round(defZ*100)+' T'+Math.round(twist*100)+' S'+Math.round(defEnergy*100)+' D'+Math.round(modDepth*100):'OFF');const log=d.getElementById('log');log.prepend(row);while(log.querySelectorAll('.signal-flow-line').length>18){const rows=log.querySelectorAll('.signal-flow-line');rows[rows.length-1]?.remove()}}
        raf=w.requestAnimationFrame(tick);
      };
      w.addEventListener('pagehide',()=>{unsubscribe();if(raf)w.cancelAnimationFrame(raf)},{once:true});raf=w.requestAnimationFrame(tick);return true;
    }catch(_){return false}
  }
  window.installEnochianCompositeAnalyser=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();