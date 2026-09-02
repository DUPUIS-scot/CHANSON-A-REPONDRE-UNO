(()=>{
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
  const d=deckDoc(frame),w=d?.defaultView;if(!d||!w)return false;
  if(d.documentElement.dataset.signalSourceAutonext==='v1')return true;
  const audio=d.getElementById('audio'),track=d.getElementById('track'),next=d.getElementById('next'),wave=d.getElementById('wave');
  const bus=w.__enochAnalyserBus;
  if(!audio||!track||!next||!wave||!bus?.emit)return false;
  d.documentElement.dataset.signalSourceAutonext='v1';

  const state={source:'main',midiEnergy:0,midiNotes:new Map(),inputStream:null,inputCtx:null,inputAnalyser:null,inputFreq:null,inputRaf:0,inputReady:false};
  const style=d.createElement('style');
  style.textContent='.signal-source-switch{position:absolute;left:7px;top:31px;z-index:67;display:flex;gap:3px;padding:3px;background:#020706e8;border:1px solid #315b56;border-radius:5px;pointer-events:auto}.signal-source-switch button{min-height:19px;padding:2px 5px;font:7px ui-monospace,Consolas,monospace;letter-spacing:.05em;border:1px solid #315b56;border-radius:3px;background:#06110f;color:#a9eee7}.signal-source-switch button.active{border-color:#ff9d34;color:#ffd0a1;background:#211208}.signal-source-switch button.pending{color:#f0c97e}';
  d.head.appendChild(style);
  const ui=d.createElement('div');ui.className='signal-source-switch';ui.setAttribute('aria-label','3D SIGNAL source');ui.innerHTML='<button data-signal-source="main">MAIN</button><button data-signal-source="midi">MIDI</button><button data-signal-source="input">INPUT</button>';
  wave.appendChild(ui);
  const buttons=[...ui.querySelectorAll('[data-signal-source]')];
  const render=()=>buttons.forEach(b=>{const on=b.dataset.signalSource===state.source;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});

  const emitFrequency=(arr,source)=>{if(!arr?.length)return;const copy=arr instanceof Uint8Array?arr:new Uint8Array(arr);bus.frequency=copy;bus.frequencyFrame=(bus.frequencyFrame||0)+1;bus.emit('frequency',copy);bus.emit('signal-source',{source});};

  const midiFrame=()=>{
    const n=128,out=new Uint8Array(n),notes=[...state.midiNotes.entries()];
    const energy=clamp(state.midiEnergy,0,1);
    for(let i=0;i<n;i++)out[i]=Math.round(5+10*(Math.sin(performance.now()*.002+i*.16)+1));
    for(const [note,vel] of notes){const x=clamp((note-24)/(108-24),0,1),centre=Math.round(x*(n-1)),amp=clamp((vel||0)/127,0,1);for(let k=-5;k<=5;k++){const j=centre+k;if(j<0||j>=n)continue;out[j]=Math.max(out[j],Math.round(255*amp*Math.exp(-(k*k)/8)));}}
    if(!notes.length&&energy>0){for(let i=0;i<n;i++)out[i]=Math.max(out[i],Math.round(energy*120*(.5+.5*Math.sin(i*.24))));}
    if(state.source==='midi')emitFrequency(out,'midi');
    state.midiEnergy*=.94;w.requestAnimationFrame(midiFrame);
  };
  w.requestAnimationFrame(midiFrame);

  const attachMidi=async()=>{
    if(!navigator.requestMIDIAccess)return false;
    try{
      const access=await navigator.requestMIDIAccess({sysex:false});
      const bind=input=>{input.onmidimessage=e=>{const [status=0,a=0,b=0]=e.data||[],type=status&0xf0;if(type===0x90&&b>0){state.midiNotes.set(a,b);state.midiEnergy=Math.max(state.midiEnergy,b/127)}else if(type===0x80||(type===0x90&&b===0)){state.midiNotes.delete(a)}else if(type===0xb0){state.midiEnergy=Math.max(state.midiEnergy,b/127)}else if(type===0xe0){state.midiEnergy=Math.max(state.midiEnergy,.45)};bus.emit('midi-live',{status,a,b,type})}};
      access.inputs.forEach(bind);access.onstatechange=e=>{if(e.port?.type==='input'&&e.port.state==='connected')bind(e.port)};return true;
    }catch(_){return false}
  };
  attachMidi();

  const stopInput=()=>{if(state.inputRaf)w.cancelAnimationFrame(state.inputRaf);state.inputRaf=0;try{state.inputStream?.getTracks()?.forEach(t=>t.stop())}catch(_){};try{state.inputCtx?.close()}catch(_){};state.inputStream=null;state.inputCtx=null;state.inputAnalyser=null;state.inputFreq=null;state.inputReady=false};
  const startInput=async()=>{
    if(state.inputReady)return true;
    if(!navigator.mediaDevices?.getUserMedia)return false;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      const AC=w.AudioContext||w.webkitAudioContext,ctx=new AC(),src=ctx.createMediaStreamSource(stream),an=ctx.createAnalyser();an.fftSize=2048;an.smoothingTimeConstant=.72;src.connect(an);
      state.inputStream=stream;state.inputCtx=ctx;state.inputAnalyser=an;state.inputFreq=new Uint8Array(an.frequencyBinCount);state.inputReady=true;
      const loop=()=>{if(!state.inputReady)return;an.getByteFrequencyData(state.inputFreq);if(state.source==='input')emitFrequency(state.inputFreq,'input');state.inputRaf=w.requestAnimationFrame(loop)};loop();return true;
    }catch(_){return false}
  };

  const setSource=async source=>{
    if(!['main','midi','input'].includes(source))source='main';
    if(source==='input'){
      const b=ui.querySelector('[data-signal-source="input"]');b?.classList.add('pending');const ok=await startInput();b?.classList.remove('pending');if(!ok)return false;
    }
    state.source=source;w.__enochSignalSource=source;d.documentElement.dataset.signalSource=source;render();bus.emit('signal-source',{source});return true;
  };
  buttons.forEach(b=>b.addEventListener('click',()=>setSource(b.dataset.signalSource)));

  // Preserve the native MAIN analyser, but suppress its frequency publication while MIDI/INPUT owns 3D SIGNAL.
  if(typeof w.signal==='function'&&!w.signal.__sourceAuthorityWrapped){
    const original=w.signal;const wrapped=function(frameData){const before=bus.frequencyFrame||0,vals=original.call(this,frameData);if(state.source!=='main'&&frameData?.length&&(bus.frequencyFrame||0)>before){/* external owner will immediately publish its own frame */}return vals};wrapped.__sourceAuthorityWrapped=true;w.signal=wrapped;
  }

  // Automatic playlist continuation: one authoritative NEXT path, loop authority wins when active.
  let autoAdvancing=false;
  const advance=async()=>{
    if(autoAdvancing)return;const loop=w.__enochLoopAuthority;if(loop?.enabled)return;
    autoAdvancing=true;
    try{
      const options=[...track.options];if(!options.length)return;
      const old=track.selectedIndex<0?0:track.selectedIndex,nextIndex=(old+1)%options.length;
      if(nextIndex===old&&options.length===1){audio.currentTime=0;await audio.play().catch(()=>{});return}
      track.selectedIndex=nextIndex;
      track.dispatchEvent(new w.Event('change',{bubbles:true}));
      // Existing track-change logic owns src/name/MIDI pairing. Wait for it, then continue playback.
      await new Promise(resolve=>w.setTimeout(resolve,0));
      const playWhenReady=()=>audio.play().catch(()=>{});
      if(audio.readyState>=2)playWhenReady();else audio.addEventListener('canplay',playWhenReady,{once:true});
      bus.emit('playlist-auto-next',{from:old,to:nextIndex,source:state.source});
    }finally{w.setTimeout(()=>{autoAdvancing=false},120)}
  };
  audio.addEventListener('ended',()=>{if(!w.__enochLoopAuthority?.enabled)advance()},false);

  w.__enochSignalSourceAuthority={version:'v1',get source(){return state.source},set:setSource,get inputReady(){return state.inputReady},stopInput,advance};
  w.addEventListener('pagehide',stopInput,{once:true});
  render();return true;
}
let timer=0;window.installEnochianSignalSourceAutonextV1=frame=>{if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>240){clearInterval(timer);timer=0}},100)}return false};
const boot=()=>{const frame=document.getElementById('terminalLive');if(!frame)return;const run=()=>window.installEnochianSignalSourceAutonextV1(frame);frame.addEventListener('load',run);run()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
})();
