(()=>{
  const GLYPHS=['Un','Pa','Veh','Gal','Graph','Or','Na','Gon','Ur','Tal','Gisa','Fam','Ged','Don','Med','Mals','Ger','Drux','Pal','Ceph','Van'];
  const glyphUrl=i=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/Enochian%20-%20'+encodeURIComponent(GLYPHS[i])+'.svg';
  const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
  const pct=v=>Math.max(0,Math.min(1,(parseFloat(v)||0)/100));
  const active=e=>!!e&&(e.classList.contains('active')||e.getAttribute('aria-pressed')==='true');
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!d.body||!w||!d.getElementById('b0')||!d.getElementById('log'))return false;
      if(d.documentElement.dataset.compositeAnalyser==='v6')return true;
      d.documentElement.dataset.compositeAnalyser='v6';
      const get=id=>parseFloat(d.getElementById(id)?.value)||0;
      const stemLevel=key=>{const r=d.querySelector('[data-stem-range="'+key+'"]'),b=d.querySelector('[data-stem-toggle="'+key+'"]');return active(b)?pct(r?.value??100):0};
      let raw=[0,0,0,0],lastLog=0,lastState='';
      if(typeof w.signal==='function'&&!w.signal.__compositeCapture){const original=w.signal;const wrapped=function(frameData){const vals=original.call(this,frameData);if(Array.isArray(vals)&&vals.length>=4)raw=vals.slice(0,4).map(clamp);return vals};wrapped.__compositeCapture=true;wrapped.__original=original;w.signal=wrapped}
      const tick=()=>{
        const vocals=stemLevel('vocals'),drums=stemLevel('drums'),instruments=stemLevel('instruments');
        const master=Math.max(0,Math.min(1,get('vol'))),low=Math.max(0,Math.min(1,(get('low')+18)/36)),mid=Math.max(0,Math.min(1,(get('mid')+18)/36)),high=Math.max(0,Math.min(1,(get('high')+18)/36));
        const eqMacro=(parseFloat((d.getElementById('eqWheelV')?.textContent||'').match(/-?\d+/)?.[0])||0)/100,fxMacro=pct((d.getElementById('fxWheelV')?.textContent||'0').replace('%',''));
        const padText=d.getElementById('padReadout')?.textContent||'',xy=[...padText.matchAll(/(?:X|Y)\s*(\d+)/g)].map(m=>(+m[1]||0)/100),padX=xy[0]??.5,padY=xy[1]??.5,mix=pct(d.getElementById('fxMixV')?.textContent||50);
        const instant=[...d.querySelectorAll('.instant-fx-btn')].some(active)?1:0,modOn=active(d.getElementById('modActivate'))?1:0,modDepth=Math.max(0,Math.min(1,get('modDepth'))),pitch=Math.min(1,Math.abs(get('pitch'))/12);
        const signalMod=active(d.getElementById('signalModToggle'))||w.__enochSignalModulation===true;
        const gesture=w.__enochAnalyserGesture||{x:0,y:0,vx:0,vy:0},wave=d.getElementById('wave'),gw=Math.max(1,wave?.clientWidth||1),gh=Math.max(1,wave?.clientHeight||1);
        const glideX=signalMod?Math.max(-1,Math.min(1,gesture.x/(gw*.28))):0,glideY=signalMod?Math.max(-1,Math.min(1,-gesture.y/(gh*.22))):0,glideSpeed=signalMod?Math.max(0,Math.min(1,Math.hypot(gesture.vx||0,gesture.vy||0)/1.2)):0;
        const vals=[clamp(raw[0]*.72+42*drums+26*instruments+25*low+10*master+10*Math.max(0,-eqMacro)+10*fxMacro+18*Math.max(0,-glideX)+12*glideSpeed),clamp(raw[1]*.72+38*vocals+22*instruments+25*mid+10*master+10*modOn*modDepth+7*padX+16*Math.abs(glideX)+10*Math.max(0,glideY)),clamp(raw[2]*.72+26*vocals+30*instruments+25*high+10*master+14*fxMacro+10*mix*padY+10*instant+18*Math.max(0,glideX)+12*Math.max(0,glideY)),clamp(raw[3]*.76+46*drums+10*pitch+10*instant+8*modOn*modDepth+26*glideSpeed+10*Math.abs(glideY))];
        vals.forEach((n,i)=>{const b=d.getElementById('b'+i),g=d.getElementById('g'+i);if(b)b.textContent=n.toString(2).padStart(8,'0');if(g)g.src=glyphUrl(n%21)});
        const now=performance.now(),bits=vals.map(v=>v.toString(2).padStart(8,'0')),state=bits.join('|')+'|'+signalMod;
        if(now-lastLog>500&&state!==lastState&&!d.getElementById('audio')?.paused){lastLog=now;lastState=state;const row=d.createElement('div');row.className='signal-flow-line';row.textContent='ENOCHIAN FLOW · '+bits.join(' ')+' · V'+Math.round(vocals*100)+' D'+Math.round(drums*100)+' I'+Math.round(instruments*100)+' M'+Math.round(master*100)+' · EQ '+Math.round(low*100)+'/'+Math.round(mid*100)+'/'+Math.round(high*100)+' · FX '+Math.round(fxMacro*100)+' PAD '+Math.round(padX*100)+'/'+Math.round(padY*100)+' MIX '+Math.round(mix*100)+' MOD '+Math.round(modOn*modDepth*100)+' · SIGNAL MOD '+(signalMod?'ON '+Math.round(glideX*100)+'/'+Math.round(glideY*100)+' V'+Math.round(glideSpeed*100):'OFF');const log=d.getElementById('log');log.prepend(row);while(log.querySelectorAll('.signal-flow-line').length>18){const rows=log.querySelectorAll('.signal-flow-line');rows[rows.length-1]?.remove()}}
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);return true;
    }catch(_){return false}
  }
  window.installEnochianCompositeAnalyser=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();