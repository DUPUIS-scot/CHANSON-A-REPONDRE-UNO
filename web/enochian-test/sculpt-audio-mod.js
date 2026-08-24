(()=>{
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      const low=d.getElementById('low'),mid=d.getElementById('mid'),high=d.getElementById('high');
      if(!low||!mid||!high)return false;
      if(d.documentElement.dataset.sculptAudioMod==='v1')return true;
      d.documentElement.dataset.sculptAudioMod='v1';

      const fxMix=d.getElementById('fxMix')||d.querySelector('.mixer-level-range');
      const modToggle=d.getElementById('signalModToggle');
      const modDepth=()=>clamp((parseFloat(d.getElementById('modWheelV')?.textContent||'0')||0)/100,0,1);
      const signalOn=()=>w.__enochSignalModulation===true||modToggle?.getAttribute('aria-pressed')==='true';
      const n=e=>parseFloat(e?.value)||0;
      const base={low:n(low),mid:n(mid),high:n(high),mix:fxMix?n(fxMix):50};
      const current={low:base.low,mid:base.mid,high:base.high,mix:base.mix};
      let writing=false,raf=0,lastLog=0;

      const setControl=(el,value)=>{
        if(!el)return;
        const min=Number.isFinite(parseFloat(el.min))?parseFloat(el.min):-Infinity,max=Number.isFinite(parseFloat(el.max))?parseFloat(el.max):Infinity;
        const next=clamp(value,min,max);
        if(Math.abs((parseFloat(el.value)||0)-next)<.02)return;
        writing=true;el.value=String(next);el.dispatchEvent(new Event('input',{bubbles:true}));writing=false;
      };
      const bindBase=(el,key)=>{if(!el)return;const capture=()=>{if(!writing)base[key]=n(el)};el.addEventListener('input',capture);el.addEventListener('change',capture)};
      bindBase(low,'low');bindBase(mid,'mid');bindBase(high,'high');bindBase(fxMix,'mix');

      const update=()=>{
        const g=w.__enochAnalyserGesture||{},def=g.deform||{},depth=modDepth(),on=signalOn();
        const pullY=on?clamp(def.pullY||0,-1,1):0,pullZ=on?clamp(def.pullZ||0,-1,1):0,twist=on?clamp(def.twist||0,-1,1):0;
        const speed=on?clamp(Math.hypot(def.vY||0,def.vZ||0)*600,0,1):0;
        const strength=on?depth:0;

        // Bounded sculpt offsets. Vertical motion is tonal, depth is wet/dry space,
        // twist adds contrasting mid/high colour, and fast throws add a small transient lift.
        const targetLow=base.low+(-pullY*5.5+Math.max(0,-pullZ)*2.0)*strength;
        const targetMid=base.mid+(pullY*3.5-twist*4.0)*strength;
        const targetHigh=base.high+(pullY*6.0+twist*4.5+speed*2.0)*strength;
        const targetMix=base.mix+(Math.max(0,pullZ)*24-Math.max(0,-pullZ)*16+Math.abs(twist)*8+speed*6)*strength;
        const smoothing=on?.18:.12;
        current.low=lerp(current.low,targetLow,smoothing);current.mid=lerp(current.mid,targetMid,smoothing);current.high=lerp(current.high,targetHigh,smoothing);current.mix=lerp(current.mix,targetMix,smoothing);
        setControl(low,current.low);setControl(mid,current.mid);setControl(high,current.high);if(fxMix)setControl(fxMix,current.mix);

        w.__enochSculptAudio={version:'v1',active:on&&strength>0,strength,pullY,pullZ,twist,speed,offsets:{low:current.low-base.low,mid:current.mid-base.mid,high:current.high-base.high,mix:current.mix-base.mix}};
        const now=performance.now();
        if(now-lastLog>900&&on&&strength>.01&&(Math.abs(pullY)+Math.abs(pullZ)+Math.abs(twist)+speed)>.04){
          lastLog=now;try{const log=d.getElementById('log');if(log){const row=d.createElement('div');row.className='signal-flow-line sculpt-audio-line';row.textContent='SCULPT AUDIO · Y '+Math.round(pullY*100)+' · Z '+Math.round(pullZ*100)+' · TWIST '+Math.round(twist*100)+' · SPEED '+Math.round(speed*100)+' · MOD '+Math.round(strength*100)+'%';log.prepend(row)}}catch(_){}
        }
        raf=w.requestAnimationFrame(update);
      };

      const reset=()=>{base.low=n(low);base.mid=n(mid);base.high=n(high);if(fxMix)base.mix=n(fxMix);current.low=base.low;current.mid=base.mid;current.high=base.high;current.mix=base.mix};
      d.getElementById('loopReset')?.addEventListener('click',()=>{});
      d.querySelector('.btn.danger')?.addEventListener('click',()=>setTimeout(reset,0));
      d.getElementById('track')?.addEventListener('change',()=>setTimeout(reset,0));
      w.addEventListener('pagehide',()=>{if(raf)w.cancelAnimationFrame(raf);delete w.__enochSculptAudio},{once:true});
      raf=w.requestAnimationFrame(update);return true;
    }catch(_){return false}
  }
  window.installEnochianSculptAudioMod=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
