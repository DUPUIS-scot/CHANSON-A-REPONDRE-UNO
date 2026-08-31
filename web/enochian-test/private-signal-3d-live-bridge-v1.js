(()=>{
'use strict';
const VERSION='20260831-private-signal-3d-live-v2';
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
  const waveHost=d.querySelector('.wave');
  if(!waveHost)return false;
  let style=d.getElementById('private-signal-source-colours-v2');
  if(!style){style=d.createElement('style');style.id='private-signal-source-colours-v2';style.textContent='html[data-private-signal-line="on"] .wave .analyser-3d{filter:hue-rotate(92deg) saturate(1.7) brightness(1.06) drop-shadow(0 0 5px rgba(55,255,118,.34))!important}.private-midi-3d-overlay{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:5!important;pointer-events:none!important;mix-blend-mode:screen;opacity:0;transition:opacity .08s linear}html[data-private-signal-midi="on"] .private-midi-3d-overlay{opacity:.95}';d.head.appendChild(style)}
  waveHost.querySelector('.private-midi-3d-overlay')?.remove();
  const midiCanvas=d.createElement('canvas');midiCanvas.className='private-midi-3d-overlay';midiCanvas.setAttribute('aria-hidden','true');waveHost.appendChild(midiCanvas);
  const onMidi=e=>{const x=e?.detail||{},kind=x.kind||'';midi.stamp=w.performance.now();if(kind==='on'){midi.held.set(byte(x.note),byte(x.velocity||100));midi.lastNote=byte(x.note);midi.energy=Math.max(midi.energy,(x.velocity||100)/127)}else if(kind==='off'){midi.held.delete(byte(x.note))}else if(kind==='cc'){midi.cc=clamp((x.value||0)/127,0,1);midi.energy=Math.max(midi.energy,midi.cc*.65)}else if(kind==='bend'){midi.bend=clamp(((x.value||64)-64)/63,-1,1);midi.energy=Math.max(midi.energy,Math.abs(midi.bend)*.55)}};
  w.addEventListener('enoch:midi-input',onMidi);
  let freq=null,wave=null,raf=0,lastBeat=0;
  const activePrivate=()=>!!(w.__enochFourLineLooper?.state?.started||d.querySelector('#enoch-four-line-looper')||d.documentElement.dataset.fourLineLooperAccess==='authorized');
  const midiActive=()=>midi.held.size>0||midi.energy>.02||w.performance.now()-midi.stamp<180;
  const mixMidi=arr=>{
    midi.energy*=midi.held.size?.974:.91;
    if(!midi.held.size&&midi.energy<.006)return;
    const n=Math.max(1,arr.length),notes=[...midi.held.entries()];
    notes.forEach(([note,vel])=>{const center=clamp(Math.round((note-21)/87*(n-1)),0,n-1),amp=(vel/127)*118;for(let i=Math.max(0,center-8);i<=Math.min(n-1,center+8);i++){const g=Math.exp(-Math.pow((i-center)/4.2,2));arr[i]=byte(arr[i]+amp*g)}});
    const lift=32*midi.energy;for(let i=0;i<n;i++)arr[i]=byte(arr[i]+lift*(.28+.72*Math.sin((i/n)*Math.PI)));
  };
  const drawMidi=t=>{const r=midiCanvas.getBoundingClientRect(),dpr=Math.min(1.75,w.devicePixelRatio||1),W=Math.max(1,Math.floor(r.width*dpr)),H=Math.max(1,Math.floor(r.height*dpr));if(midiCanvas.width!==W||midiCanvas.height!==H){midiCanvas.width=W;midiCanvas.height=H}const c=midiCanvas.getContext('2d');c.clearRect(0,0,W,H);if(!midiActive())return;const notes=[...midi.held.entries()],energy=clamp(midi.energy,0,1),rows=10;for(let row=0;row<rows;row++){const depth=row/(rows-1),baseY=H*(.77-depth*.42),alpha=(.16+.54*(1-depth))*clamp(.25+energy,0,1);c.beginPath();for(let i=0;i<40;i++){const x=W*(.08+i/39*.84);let amp=0;for(const [note,vel] of notes){const pos=clamp((note-21)/87,0,1),g=Math.exp(-Math.pow((i/39-pos)/.08,2));amp+=g*(vel/127)}amp=Math.max(amp,energy*.22*(.5+.5*Math.sin(i*.55+t*.008+midi.lastNote*.04)));const y=baseY-amp*H*(.11+.09*(1-depth))+Math.sin(i*.32+t*.004+row*.7)*H*.005;c[i?'lineTo':'moveTo'](x,y)}c.strokeStyle=`rgba(255,42,42,${alpha})`;c.lineWidth=(.7+1.7*(1-depth))*dpr;c.shadowBlur=(4+10*energy)*dpr;c.shadowColor='rgba(255,0,0,.88)';c.stroke()}c.shadowBlur=0;};
  const publish=(analyser)=>{
    const bins=analyser.frequencyBinCount||256;if(!freq||freq.length!==bins){freq=new Uint8Array(bins);wave=new Uint8Array(analyser.fftSize||bins*2)}
    analyser.getByteFrequencyData(freq);analyser.getByteTimeDomainData(wave);
    const mixed=new Uint8Array(freq);mixMidi(mixed);
    bus.frequency=mixed;bus.waveform=new Uint8Array(wave);bus.frequencyFrame=(bus.frequencyFrame||0)+1;bus.waveFrame=(bus.waveFrame||0)+1;
    const n=mixed.length,loEnd=Math.max(1,Math.floor(n*.12)),midEnd=Math.max(loEnd+1,Math.floor(n*.38));let lo=0,mi=0,hi=0,peak=0;
    for(let i=0;i<n;i++){const v=mixed[i];peak=Math.max(peak,v);if(i<loEnd)lo+=v;else if(i<midEnd)mi+=v;else hi+=v}
    lo/=loEnd;mi/=Math.max(1,midEnd-loEnd);hi/=Math.max(1,n-midEnd);const now=w.performance.now(),beat=byte(Math.max(peak,lo*1.35,midi.energy*255));if(beat>185&&now-lastBeat>100)lastBeat=now;
    bus.rawSignal=[byte(lo),byte(mi),byte(hi),beat];bus.signalFrame=(bus.signalFrame||0)+1;
    bus.emit?.('frequency',bus.frequency);bus.emit?.('waveform',bus.waveform);bus.emit?.('signal',bus.rawSignal);bus.emit?.('private-live-3d',{source:'line-in+midi',lineIn:activePrivate(),midi:midiActive(),lineColor:'green',midiColor:'red'});
    d.documentElement.dataset.privateSignalLine=activePrivate()?'on':'off';d.documentElement.dataset.privateSignalMidi=midiActive()?'on':'off';
    d.documentElement.dataset.analyserLiveHealth='live';d.documentElement.dataset.analyserLiveSource=midiActive()?'private-line-in+midi-3d':'private-line-in-3d';w.__enochAnalyser3D?.invalidate?.();
  };
  const tick=t=>{const analyser=resolveAnalyser(w);const line=activePrivate();d.documentElement.dataset.privateSignalLine=line?'on':'off';d.documentElement.dataset.privateSignalMidi=midiActive()?'on':'off';if(analyser&&line)publish(analyser);drawMidi(t||w.performance.now());raf=w.requestAnimationFrame(tick)};raf=w.requestAnimationFrame(tick);
  w.__enochPrivateSignal3DLive={version:VERSION,status:()=>({active:activePrivate(),midiNotes:midi.held.size,source:d.documentElement.dataset.analyserLiveSource||'idle',lineColor:'green',midiColor:'red'})};
  d.documentElement.dataset.privateSignal3dLive=VERSION;
  w.addEventListener('pagehide',()=>{w.removeEventListener('enoch:midi-input',onMidi);if(raf)w.cancelAnimationFrame(raf)},{once:true});
  return true;
}
function boot(){const host=document.getElementById('terminalLive');if(!host)return;let n=0,t=setInterval(()=>{if(install(host)||++n>320)clearInterval(t)},50);host.addEventListener('load',()=>{n=0;t=setInterval(()=>{if(install(host)||++n>320)clearInterval(t)},50)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.installEnochianPrivateSignal3DLiveV1=install;
})();