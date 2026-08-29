(()=>{
'use strict';
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=deckDoc(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.lineInLiveWaveform==='v2')return true;
 const panel=d.querySelector('.enoch-linein'),scope=panel?.querySelector('.scope'),base=panel?.querySelector('[data-wave]'),meter=panel?.querySelector('[data-level]'),state=panel?.querySelector('[data-state]');
 if(!panel||!scope||!base||!meter||!w.navigator?.mediaDevices)return false;
 d.documentElement.dataset.lineInLiveWaveform='v2';
 let live=d.createElement('canvas');live.width=base.width;live.height=base.height;live.dataset.liveWave='';live.setAttribute('aria-hidden','true');live.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:2';scope.appendChild(live);
 const ctx=live.getContext('2d');let ac=null,analyser=null,source=null,stream=null,raf=0,data=null,lastPeak=0;
 const drawIdle=()=>{ctx.clearRect(0,0,live.width,live.height);ctx.strokeStyle='rgba(82,226,207,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,live.height/2);ctx.lineTo(live.width,live.height/2);ctx.stroke()};
 const detach=()=>{if(raf)w.cancelAnimationFrame(raf);raf=0;try{source?.disconnect()}catch(_){}source=null;analyser=null;stream=null;data=null;lastPeak=0;meter.style.height='0%';drawIdle()};
 const render=()=>{if(!analyser||!stream?.active){detach();return}analyser.getByteTimeDomainData(data);const W=live.width,H=live.height;ctx.clearRect(0,0,W,H);ctx.strokeStyle='rgba(82,226,207,.96)';ctx.lineWidth=1.6;ctx.beginPath();let peak=0;for(let i=0;i<data.length;i++){const v=(data[i]-128)/128;peak=Math.max(peak,Math.abs(v));const x=i/(data.length-1)*W,y=(.5-v*.46)*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();lastPeak=Math.max(peak,lastPeak*.82);meter.style.height=Math.min(100,Math.round(lastPeak*100))+'%';raf=w.requestAnimationFrame(render)};
 const attach=async s=>{if(!s?.active||s===stream)return false;detach();stream=s;const C=w.AudioContext||w.webkitAudioContext;ac=w.__enochAudioGraph?.context||w.__enochAudioGraph?.ctx||ac||new C({latencyHint:'interactive'});if(ac.state==='suspended')try{await ac.resume()}catch(_){}source=ac.createMediaStreamSource(stream);analyser=ac.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.08;source.connect(analyser);data=new Uint8Array(analyser.fftSize);state&&(state.textContent='LIVE STREAM');render();return true};
 const md=w.navigator.mediaDevices,original=md.getUserMedia.bind(md);
 if(!md.getUserMedia.__enochLiveWaveWrapped){const wrapped=async constraints=>{const s=await original(constraints);try{if(constraints?.audio&&panel&&!panel.hidden)await attach(s)}catch(_){}return s};wrapped.__enochLiveWaveWrapped=true;wrapped.__enochOriginal=original;try{md.getUserMedia=wrapped}catch(_){}}
 const detect=()=>{const s=w.__enochLineIn?.getStream?.();if(s?.active)attach(s)};
 const observer=new w.MutationObserver(()=>{if(panel.hidden)detach();else{drawIdle();w.setTimeout(detect,50)}});observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 panel.addEventListener('click',()=>w.setTimeout(detect,0),true);
 const timer=w.setInterval(()=>{if(!panel.hidden)detect()},250);
 w.addEventListener('pagehide',()=>{w.clearInterval(timer);detach()},{once:true});
 drawIdle();
 w.__enochLineInLiveWaveform={version:'v2',attach,stop:detach,getStream:()=>stream};
 return true;
}
window.installEnochianLineInLiveWaveformAuthorityV1=install;
})();
