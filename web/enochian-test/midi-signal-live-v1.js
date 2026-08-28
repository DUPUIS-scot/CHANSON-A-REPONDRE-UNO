(()=>{
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const getDeck=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=getDeck(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.midiSignalLive==='v1')return true;
 const master=[...d.querySelectorAll('.box')].find(x=>/\bMASTER\b/i.test(x.textContent||''));
 if(!master)return false;
 const panel=d.createElement('div');panel.className='box midi-signal-live';panel.innerHTML='<span class="label">MIDI CONTROLLER</span><button class="btn" type="button" data-midi-connect>CONNECT USB MIDI</button><div data-midi-status style="font-size:8px;color:#789f99">USB keyboard ready</div><div data-midi-note style="font-size:10px;color:#d5aa63;font-weight:800">NOTE — · VEL 0</div>';
 master.insertAdjacentElement('afterend',panel);
 const style=d.createElement('style');style.textContent='.midi-signal-live{gap:6px!important}.midi-signal-live.active{border-color:#68d8bd!important;box-shadow:0 0 14px #40e6b422!important}.midi-signal-live [data-midi-connect].active{background:#083128!important;color:#63f5cf!important;border-color:#68d8bd!important}';d.head.appendChild(style);
 const btn=panel.querySelector('[data-midi-connect]'),status=panel.querySelector('[data-midi-status]'),noteOut=panel.querySelector('[data-midi-note]');
 let access=null,raf=0,energy=0,lastNote=60,lastVel=0;
 const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
 const noteName=n=>names[n%12]+(Math.floor(n/12)-1);
 const bus=()=>w.__enochAnalyserBus;
 const pulse=()=>{if(raf)return;const tick=()=>{raf=0;energy*=.90;if(energy<.01)return;const b=bus();if(b){const vel=clamp(lastVel/127,0,1),pitch=clamp(lastNote/127,0,1);const freq=new Uint8Array(128),wave=new Uint8Array(128);for(let i=0;i<128;i++){const peak=Math.exp(-Math.pow((i-(lastNote%64)*2)/13,2));freq[i]=clamp(18+220*energy*peak,0,255);wave[i]=clamp(128+Math.sin((i/128)*Math.PI*2*(2+pitch*10))*95*energy,0,255)}b.frequency=freq;b.waveform=wave;b.rawSignal=[clamp(40+180*energy,0,255),clamp(30+150*vel,0,255),clamp(25+170*pitch*energy,0,255),clamp(35+210*energy,0,255)];b.frequencyFrame++;b.waveFrame++;b.signalFrame++;b.emit('frequency',freq);b.emit('waveform',wave);b.emit('signal',b.rawSignal)}raf=w.requestAnimationFrame(tick)};raf=w.requestAnimationFrame(tick)};
 const onMidi=e=>{const [st,n,v=0]=e.data||[];const cmd=st&0xf0;if(cmd===0x90&&v>0){lastNote=n;lastVel=v;energy=Math.max(energy,.25+.75*(v/127));noteOut.textContent=`NOTE ${noteName(n)} · VEL ${v}`;panel.classList.add('active');pulse()}else if(cmd===0x80||(cmd===0x90&&v===0)){lastVel=0;noteOut.textContent=`NOTE ${noteName(n)} · VEL 0`;setTimeout(()=>panel.classList.remove('active'),90)}};
 const bind=()=>{let count=0;for(const input of access?.inputs?.values?.()||[]){input.onmidimessage=onMidi;count++}status.textContent=count?`${count} MIDI input${count===1?'':'s'} active · live SIGNAL`:'No MIDI input detected';btn.textContent=count?'USB MIDI ACTIVE':'CONNECT USB MIDI';btn.classList.toggle('active',!!count)};
 const connect=async()=>{if(!navigator.requestMIDIAccess){status.textContent='Web MIDI unavailable in this browser';return}try{status.textContent='Requesting MIDI access…';access=await navigator.requestMIDIAccess();access.onstatechange=bind;bind()}catch(e){status.textContent='MIDI permission denied or unavailable'}};
 btn.addEventListener('click',connect);connect();
 d.documentElement.dataset.midiSignalLive='v1';w.__enochMidiSignalLive={version:'v1',connect};return true;
}
let timer=0;window.installEnochianMidiSignalLiveV1=frame=>{if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>120){clearInterval(timer);timer=0}},100)}return false};
})();
