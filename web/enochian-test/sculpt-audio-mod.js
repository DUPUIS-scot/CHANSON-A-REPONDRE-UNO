(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const low=d.getElementById('low'),mid=d.getElementById('mid'),high=d.getElementById('high');
      if(!low||!mid||!high)return false;
      if(d.documentElement.dataset.sculptAudioMod==='v3')return true;
      d.documentElement.dataset.sculptAudioMod='v3';

      const fxMix=d.getElementById('fxMix')||d.querySelector('.mixer-level-range');
      const modDepth=()=>clamp((parseFloat(d.getElementById('modWheelV')?.textContent||'0')||0)/100,0,1);
      const signalOn=()=>w.__enochSignalModulation===true||d.getElementById('signalModToggle')?.getAttribute('aria-pressed')==='true';
      const n=e=>parseFloat(e?.value)||0;
      const base={low:n(low),mid:n(mid),high:n(high),mix:fxMix?n(fxMix):50};
      const current={low:base.low,mid:base.mid,high:base.high,mix:base.mix};
      const grabCurve=[0,.28,.48,.67,.87,1];
      let writing=false,raf=0,lastLog=0;

      const setControl=(el,value)=>{
        if(!el)return;
        const min=Number.isFinite(parseFloat(el.min))?parseFloat(el.min):-Infinity,max=Number.isFinite(parseFloat(el.max))?parseFloat(el.max):Infinity;
        const next=clamp(value,min,max);
        if(Math.abs((parseFloat(el.value)||0)-next)<.02)return;
        writing=true;el.value=String(next);el.dispatchEvent(new Event('input',{bubbles:true}));writing=false;
      };
      const bindBase=(el,key)=>{if(!el)return;const capture=()=>{if(!writing){base[key]=n(el);current[key]=base[key]}};el.addEventListener('input',capture);el.addEventListener('change',capture)};
      bindBase(low,'low');bindBase(mid,'mid');bindBase(high,'high');bindBase(fxMix,'mix');

      const restoreBase=()=>{
        current.low=base.low;current.mid=base.mid;current.high=base.high;current.mix=base.mix;
        setControl(low,base.low);setControl(mid,base.mid);setControl(high,base.high);if(fxMix)setControl(fxMix,base.mix);
        if(w.__enochAnalyserGesture?.deform)Object.assign(w.__enochAnalyserGesture.deform,{pullY:0,pullZ:0,twist:0,vY:0,vZ:0,grabBin:null,grabRow:null});
        if(w.__enochSignalEngagement)w.__enochSignalEngagement.grabs=0;
      };

      const update=()=>{
        const g=w.__enochAnalyserGesture||{},def=g.deform||{},depth=modDepth(),on=signalOn();
        const pullY=on?clamp(def.pullY||0,-1,1):0,pullZ=on?clamp(def.pullZ||0,-1,1):0,twist=on?clamp(def.twist||0,-1,1):0;
        const speed=on?clamp(Math.hypot(def.vY||0,def.vZ||0)*600,0,1):0;
        const force=on?clamp((Math.abs(pullY)+Math.abs(pullZ)+Math.abs(twist)*.7+speed*.35)/2.15,0,1):0;
        const tracked=clamp(Math.round(w.__enochSignalEngagement?.grabs||0),0,5);
        const grabs=tracked||((on&&force>.04)?clamp(Math.ceil(force*5),1,5):0);
        const baseEngagement=grabCurve[grabs]||0;
        const engagement=on?clamp(baseEngagement+(grabs?force*.08:0),0,1):0;
        const strength=depth*engagement;

        const targetLow=base.low+(-pullY*9.0+Math.max(0,-pullZ)*3.0)*strength;
        const targetMid=base.mid+(pullY*6.5-twist*7.0)*strength;
        const targetHigh=base.high+(pullY*12.0+twist*7.0+speed*3.0)*strength;
        const targetMix=base.mix+(Math.max(0,pullZ)*36-Math.max(0,-pullZ)*24+Math.abs(twist)*12+speed*9)*strength;
        const smoothing=on?.20:.12;
        current.low=lerp(current.low,targetLow,smoothing);current.mid=lerp(current.mid,targetMid,smoothing);current.high=lerp(current.high,targetHigh,smoothing);current.mix=lerp(current.mix,targetMix,smoothing);
        setControl(low,current.low);setControl(mid,current.mid);setControl(high,current.high);if(fxMix)setControl(fxMix,current.mix);

        w.__enochSculptAudio={version:'v3',active:on&&strength>0,strength,depth,engagement,grabs,pullY,pullZ,twist,speed,offsets:{low:current.low-base.low,mid:current.mid-base.mid,high:current.high-base.high,mix:current.mix-base.mix},restore:restoreBase};
        const now=performance.now();
        if(now-lastLog>900&&on&&strength>.01&&(Math.abs(pullY)+Math.abs(pullZ)+Math.abs(twist)+speed)>.04){
          lastLog=now;try{const log=d.getElementById('log');if(log){const row=d.createElement('div');row.className='signal-flow-line sculpt-audio-line';row.textContent='SCULPT AUDIO · GRABS '+grabs+'/5 · ENG '+Math.round(engagement*100)+'% · DEPTH '+Math.round(depth*100)+'% · Y '+Math.round(pullY*100)+' · Z '+Math.round(pullZ*100);log.prepend(row)}}catch(_){}
        }
        raf=w.requestAnimationFrame(update);
      };

      const kill=d.querySelector('.btn.danger');if(kill)kill.addEventListener('click',()=>setTimeout(restoreBase,0));
      d.getElementById('track')?.addEventListener('change',()=>setTimeout(restoreBase,0));
      w.addEventListener('pagehide',()=>{restoreBase();if(raf)w.cancelAnimationFrame(raf);delete w.__enochSculptAudio},{once:true});
      raf=w.requestAnimationFrame(update);return true;
    }catch(_){return false}
  }
  window.installEnochianSculptAudioMod=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
