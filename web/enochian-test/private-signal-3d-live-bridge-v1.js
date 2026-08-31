(()=>{
'use strict';
const VERSION='20260831-private-signal-3d-live-v1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const byte=v=>clamp(Math.round(v||0),0,255);
function inner(host){try{const live=host?.contentDocument,deck=live?.getElementById('deck');return{d:deck?.contentDocument,w:deck?.contentWindow}}catch(_){return{}}}
function resolveAnalyser(w){
  if(w.__enochMainAnalyser?.getByteFrequencyData)return w.__enochMainAnalyser;
  try{const node=w.eval('typeof an!=="undefined"&&an&&typeof an.getByteFrequencyData==="function"?an:null');if(node)return node}catch(_){}
  return null;
}
function install(host){
  const {d,w}=inner(host);if(!d||!w||!w.__enochAnalyserBus||!w.__enochAnalyser3D)return false;
  if(d.documentElement.dataset.privateSignal3dLive===VERSION)return true;
  const bus=w.__enochAnalyserBus;
  const midi={held:new Map(),energy:0,lastNote:60,cc:0,bend:0,stamp:0};
  const onMidi=e=>{const x=e?.detail||{},kind=x.kind||'';midi.stamp=w.performance.now();if(kind==='on'){midi.held.set(byte(x.note),byte(x.velocity||100));midi.lastNote=byte(x.note);midi.energy=Math.max(midi.energy,(x.velocity||100)/127)}else if(kind==='off'){midi.held.delete(byte(x.note))}else if(kind==='cc'){midi.cc=clamp((x.value||0)/127,0,1);midi.energy=Math.max(midi.energy,midi.cc*.65)}else if(kind==='bend'){midi.bend=clamp(((x.value||64)-64)/63,-1,1);midi.energy=Math.max(midi.energy,Math.abs(midi.bend)*.55)}};
  w.addEventListener('enoch:midi-input',onMidi);
  let freq=null,wave=null,raf=0,lastBeat=0;
  const activePrivate=()=>!!(w.__enochFourLineLooper?.state?.started||d.querySelector('#enoch-four-line-looper')||d.documentElement.dataset.fourLineLooperAccess==='authorized');
  const mixMidi=arr=>{
    midi.energy*=midi.held.size?.974:.91;
    if(!midi.held.size&&midi.energy<.006)return;
    const n=Math.max(1,arr.length),notes=[...midi.held.entries()];
    notes.forEach(([note,vel])=>{const center=clamp(Math.round((note-21)/87*(n-1)),0,n-1),amp=(vel/127)*118;for(let i=Math.max(0,center-8);i<=Math.min(n-1,center+8);i++){const g=Math.exp(-Math.pow((i-center)/4.2,2));arr[i]=byte(arr[i]+amp*g)}});
    const lift=32*midi.energy;for(let i=0;i<n;i++)arr[i]=byte(arr[i]+lift*(.28+.72*Math.sin((i/n)*Math.PI)));
  };
  const publish=(analyser)=>{
    const bins=analyser.frequencyBinCount||256;if(!freq||freq.length!==bins){freq=new Uint8Array(bins);wave=new Uint8Array(analyser.fftSize||bins*2)}
    analyser.getByteFrequencyData(freq);analyser.getByteTimeDomainData(wave);
    const mixed=new Uint8Array(freq);mixMidi(mixed);
    bus.frequency=mixed;bus.waveform=new Uint8Array(wave);bus.frequencyFrame=(bus.frequencyFrame||0)+1;bus.waveFrame=(bus.waveFrame||0)+1;
    const n=mixed.length,loEnd=Math.max(1,Math.floor(n*.12)),midEnd=Math.max(loEnd+1,Math.floor(n*.38));let lo=0,mi=0,hi=0,peak=0;
    for(let i=0;i<n;i++){const v=mixed[i];peak=Math.max(peak,v);if(i<loEnd)lo+=v;else if(i<midEnd)mi+=v;else hi+=v}
    lo/=loEnd;mi/=Math.max(1,midEnd-loEnd);hi/=Math.max(1,n-midEnd);const now=w.performance.now(),beat=byte(Math.max(peak,lo*1.35,midi.energy*255));if(beat>185&&now-lastBeat>100)lastBeat=now;
    bus.rawSignal=[byte(lo),byte(mi),byte(hi),beat];bus.signalFrame=(bus.signalFrame||0)+1;
    bus.emit?.('frequency',bus.frequency);bus.emit?.('waveform',bus.waveform);bus.emit?.('signal',bus.rawSignal);bus.emit?.('private-live-3d',{source:'line-in+midi',lineIn:activePrivate(),midi:midi.held.size>0||midi.energy>.02});
    d.documentElement.dataset.analyserLiveHealth='live';d.documentElement.dataset.analyserLiveSource=(midi.held.size||midi.energy>.02)?'private-line-in+midi-3d':'private-line-in-3d';w.__enochAnalyser3D?.invalidate?.();
  };
  const tick=()=>{const analyser=resolveAnalyser(w);if(analyser&&activePrivate())publish(analyser);raf=w.requestAnimationFrame(tick)};raf=w.requestAnimationFrame(tick);
  w.__enochPrivateSignal3DLive={version:VERSION,status:()=>({active:activePrivate(),midiNotes:midi.held.size,source:d.documentElement.dataset.analyserLiveSource||'idle'})};
  d.documentElement.dataset.privateSignal3dLive=VERSION;
  w.addEventListener('pagehide',()=>{w.removeEventListener('enoch:midi-input',onMidi);if(raf)w.cancelAnimationFrame(raf)},{once:true});
  return true;
}
function boot(){const host=document.getElementById('terminalLive');if(!host)return;let n=0,t=setInterval(()=>{if(install(host)||++n>320)clearInterval(t)},50);host.addEventListener('load',()=>{n=0;t=setInterval(()=>{if(install(host)||++n>320)clearInterval(t)},50)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.installEnochianPrivateSignal3DLiveV1=install;
})();