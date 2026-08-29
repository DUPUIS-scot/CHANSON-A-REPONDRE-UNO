(()=>{
'use strict';
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=deckDoc(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.lineInLiveWaveform==='v1')return true;
 const panel=d.querySelector('.enoch-linein'),canvas=panel?.querySelector('[data-wave]'),meter=panel?.querySelector('[data-level]'),state=panel?.querySelector('[data-state]');
 if(!panel||!canvas||!meter)return false;
 d.documentElement.dataset.lineInLiveWaveform='v1';
 const ctx=canvas.getContext('2d');let analyser=null,source=null,stream=null,raf=0,data=null;
 const stop=()=>{if(raf)w.cancelAnimationFrame(raf);raf=0;try{source?.disconnect()}catch(_){}source=null;stream=null;meter.style.height='0%'};
 const draw=()=>{if(!analyser||!stream)return;data||(data=new Uint8Array(analyser.fftSize));analyser.getByteTimeDomainData(data);const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.strokeStyle='rgba(82,226,207,.95)';ctx.lineWidth=1.5;ctx.beginPath();let peak=0;for(let i=0;i<data.length;i++){const v=(data[i]-128)/128;peak=Math.max(peak,Math.abs(v));const x=i/(data.length-1)*W,y=(.5-v*.46)*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();meter.style.height=Math.min(100,Math.round(peak*100))+'%';raf=w.requestAnimationFrame(draw)};
 const attach=async s=>{if(!s?.active)return false;stop();stream=s;const C=w.AudioContext||w.webkitAudioContext;const ac=w.__enochAudioGraph?.context||w.__enochAudioGraph?.ctx||new C({latencyHint:'interactive'});if(ac.state==='suspended')try{await ac.resume()}catch(_){}source=ac.createMediaStreamSource(stream);analyser=ac.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.12;source.connect(analyser);data=new Uint8Array(analyser.fftSize);state&&(state.textContent='LIVE');draw();return true};
 const detect=()=>{const s=w.__enochLineIn?.getStream?.();if(s?.active)attach(s)};
 const observer=new w.MutationObserver(()=>{if(!panel.hidden)w.setTimeout(detect,80);else stop()});observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 const timer=w.setInterval(()=>{if(panel.hidden)return;const s=w.__enochLineIn?.getStream?.();if(s?.active&&s!==stream)attach(s)},300);
 w.addEventListener('pagehide',()=>{w.clearInterval(timer);stop()},{once:true});
 w.__enochLineInLiveWaveform={version:'v1',attach,stop};
 detect();return true;
}
window.installEnochianLineInLiveWaveformAuthorityV1=install;
})();
