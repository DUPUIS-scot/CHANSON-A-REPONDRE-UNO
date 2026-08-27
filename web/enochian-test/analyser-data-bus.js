(()=>{
  const clampByte=v=>Math.max(0,Math.min(255,Math.round(v||0)));
  const ensureBuffer=(current,source)=>current instanceof Uint8Array&&current.length===source.length?current:new Uint8Array(source.length);
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      if(w.__enochAnalyserBus?.version==='v3')return true;
      const listeners=new Set();
      const bus={version:'v3',rawSignal:[0,0,0,0],waveform:null,frequency:null,signalFrame:0,waveFrame:0,frequencyFrame:0,subscribe(fn){if(typeof fn==='function')listeners.add(fn);return()=>listeners.delete(fn)},emit(type,payload){listeners.forEach(fn=>{try{fn(type,payload,bus)}catch(_){}})}};
      w.__enochAnalyserBus=bus;
      if(typeof w.signal==='function'&&!w.signal.__enochBusWrapped){
        const original=w.signal.__original||w.signal;
        const wrapped=function(frameData){
          if(frameData&&frameData.length){
            bus.frequency=ensureBuffer(bus.frequency,frameData);
            bus.frequency.set(frameData);
            bus.frequencyFrame++;
            bus.emit('frequency',bus.frequency);
          }
          const vals=original.call(this,frameData);
          if(Array.isArray(vals)&&vals.length>=4){
            bus.rawSignal[0]=clampByte(vals[0]);bus.rawSignal[1]=clampByte(vals[1]);bus.rawSignal[2]=clampByte(vals[2]);bus.rawSignal[3]=clampByte(vals[3]);
            bus.signalFrame++;
            bus.emit('signal',bus.rawSignal);
          }
          return vals;
        };
        wrapped.__enochBusWrapped=true;wrapped.__original=original;w.signal=wrapped;
      }
      if(typeof w.draw==='function'&&!w.draw.__enochBusWrapped){
        const original=w.draw.__original||w.draw;
        const wrapped=function(c,arr){
          if(arr&&arr.length){
            bus.waveform=ensureBuffer(bus.waveform,arr);
            bus.waveform.set(arr);
            bus.waveFrame++;
            bus.emit('waveform',bus.waveform);
          }
          return original.call(this,c,arr);
        };
        wrapped.__enochBusWrapped=true;wrapped.__original=original;w.draw=wrapped;
      }
      d.documentElement.dataset.analyserDataBus='v3';return true;
    }catch(_){return false}
  }
  let retryTimer=0,retryFrame=null;
  window.installEnochianAnalyserDataBus=frame=>{
    if(install(frame)){if(retryTimer){clearInterval(retryTimer);retryTimer=0}return true}
    retryFrame=frame;
    if(!retryTimer){let n=0;retryTimer=setInterval(()=>{if(install(retryFrame)||++n>80){clearInterval(retryTimer);retryTimer=0}},100)}
    return false;
  };
})();
