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

(()=>{
  const load=src=>new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src&&s.src.includes(src.split('?')[0]));
    if(existing){if(existing.dataset.enochReady==='1')return resolve(existing);existing.addEventListener('load',()=>resolve(existing),{once:true});existing.addEventListener('error',reject,{once:true});return}
    const s=document.createElement('script');s.src=src;s.async=false;s.addEventListener('load',()=>{s.dataset.enochReady='1';resolve(s)},{once:true});s.addEventListener('error',reject,{once:true});document.head.appendChild(s);
  });
  const boot=async()=>{
    const frame=document.getElementById('terminalLive');if(!frame)return;
    try{
      await load('/enochian-test/track-midi-reference-v1.js?v=20260829-mp3-midi-v1');
      await load('/enochian-test/midi-audio-pairing-v1.js?v=20260829-mp3-midi-v1');
      window.installEnochianTrackMidiReferenceV1?.(frame);
      window.installEnochianMidiAudioPairingV1?.(frame);
      const run=()=>{window.installEnochianTrackMidiReferenceV1?.(frame);window.installEnochianMidiAudioPairingV1?.(frame)};
      frame.addEventListener('load',run);
      setTimeout(run,250);
    }catch(_){ }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
})();
