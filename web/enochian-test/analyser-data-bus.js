(()=>{
  const clampByte=v=>Math.max(0,Math.min(255,Math.round(v||0)));
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      if(w.__enochAnalyserBus?.version==='v1')return true;
      const listeners=new Set();
      const bus={version:'v1',rawSignal:[0,0,0,0],waveform:null,signalFrame:0,waveFrame:0,subscribe(fn){if(typeof fn==='function')listeners.add(fn);return()=>listeners.delete(fn)},emit(type,payload){listeners.forEach(fn=>{try{fn(type,payload,bus)}catch(_){}})}};
      w.__enochAnalyserBus=bus;
      if(typeof w.signal==='function'&&!w.signal.__enochBusWrapped){
        const original=w.signal.__original||w.signal;
        const wrapped=function(frameData){const vals=original.call(this,frameData);if(Array.isArray(vals)&&vals.length>=4){bus.rawSignal=vals.slice(0,4).map(clampByte);bus.signalFrame++;bus.emit('signal',bus.rawSignal)}return vals};
        wrapped.__enochBusWrapped=true;wrapped.__original=original;w.signal=wrapped;
      }
      if(typeof w.draw==='function'&&!w.draw.__enochBusWrapped){
        const original=w.draw.__original||w.draw;
        const wrapped=function(c,arr){if(arr&&arr.length){bus.waveform=arr instanceof Uint8Array?new Uint8Array(arr):Uint8Array.from(arr);bus.waveFrame++;bus.emit('waveform',bus.waveform)}return original.call(this,c,arr)};
        wrapped.__enochBusWrapped=true;wrapped.__original=original;w.draw=wrapped;
      }
      d.documentElement.dataset.analyserDataBus='v1';return true;
    }catch(_){return false}
  }
  window.installEnochianAnalyserDataBus=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();