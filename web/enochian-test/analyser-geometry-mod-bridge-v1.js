(()=>{
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const getDeck=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=getDeck(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.analyserGeometryModBridge==='v1')return true;
 const wave=d.querySelector('.wave'),bus=w.__enochAnalyserBus;if(!wave)return false;
 let lastPointer={x:0,y:0,valid:false},lastMidiBin=7.5,lastMidiRow=0,lastMidiStamp=0;
 const pointerToAnchor=(x,y)=>{const r=wave.getBoundingClientRect();if(!r.width||!r.height)return null;return{bin:clamp((x-r.left)/r.width*15,0,15),row:clamp((y-r.top)/r.height*15,0,15)}};
 wave.addEventListener('pointerdown',e=>{if(e.target.closest('button,input,textarea,select'))return;lastPointer={x:e.clientX,y:e.clientY,valid:true}},true);
 wave.addEventListener('pointermove',e=>{if(!lastPointer.valid)return;lastPointer.x=e.clientX;lastPointer.y=e.clientY},true);
 const release=()=>{lastPointer.valid=false};wave.addEventListener('pointerup',release,true);wave.addEventListener('pointercancel',release,true);
 const off=bus?.subscribe?.((type,payload)=>{if(type==='midi-note'&&payload){const n=clamp(+payload.note||60,21,108);lastMidiBin=clamp((n-21)/(108-21)*15,0,15);lastMidiRow=0;lastMidiStamp=performance.now()}});
 let raf=0;
 const tick=()=>{
   const g=w.__enochAnalyserGesture,def=g?.deform,modOn=w.__enochSignalModulation===true||d.getElementById('signalModToggle')?.getAttribute('aria-pressed')==='true',geo=w.__enochGeometryModOutput;
   if(def&&modOn){
     if(!Number.isFinite(def.grabBin)&&lastPointer.valid){const a=pointerToAnchor(lastPointer.x,lastPointer.y);if(a){def.grabBin=a.bin;def.grabRow=a.row}}
     if(Number.isFinite(def.grabBin)&&(!Array.isArray(def.anchors)||!def.anchors.length)){
       def.anchors=[{bin:def.grabBin,row:Number.isFinite(def.grabRow)?def.grabRow:0,pullY:def.pullY||0,pullZ:def.pullZ||0,twist:def.twist||0,vY:def.vY||0,vZ:def.vZ||0,radius:def.radius||.24,strength:1,source:'cursor'}];
     }
     if(Array.isArray(def.anchors)&&def.anchors.length){const a=def.anchors[0];if(Number.isFinite(def.grabBin)){a.bin=def.grabBin;a.row=Number.isFinite(def.grabRow)?def.grabRow:a.row}a.pullY=def.pullY||a.pullY||0;a.pullZ=def.pullZ||a.pullZ||0;a.twist=def.twist||a.twist||0;a.vY=def.vY||0;a.vZ=def.vZ||0;a.radius=clamp(a.radius||.24,.12,.42);a.strength=1}
     if(geo?.active){
       let a=Array.isArray(def.anchors)&&def.anchors[0];if(!a){const midiLive=performance.now()-lastMidiStamp<700;a={bin:midiLive?lastMidiBin:7.5,row:midiLive?lastMidiRow:0,pullY:0,pullZ:0,twist:0,vY:0,vZ:0,radius:.28,strength:1,source:geo.source||'mod'};def.anchors=[a]}
       const s=clamp(Number(geo.strength)||0,0,1),boost=.45+.95*s;
       a.pullY=clamp((a.source==='cursor'?(def.pullY||0):0)+(Number(geo.pullY)||0)*boost,-1.5,1.5);
       a.pullZ=clamp((a.source==='cursor'?(def.pullZ||0):0)+(Number(geo.pullZ)||0)*boost,-1.5,1.5);
       a.twist=clamp((a.source==='cursor'?(def.twist||0):0)+(Number(geo.twist)||0)*boost,-1.6,1.6);
       a.strength=clamp(.55+s*.9,.55,1.45);a.radius=clamp(.18+(Number(geo.engagement)||0)*.18,.16,.42);
       if((geo.source||'')==='midi'&&performance.now()-lastMidiStamp<700){a.bin=lastMidiBin;a.row=lastMidiRow;a.source='midi'}
       def.pullY=a.pullY;def.pullZ=a.pullZ;def.twist=a.twist;
     }
     w.__enochAnalyser3D?.invalidate?.();
   }
   raf=w.requestAnimationFrame(tick);
 };
 raf=w.requestAnimationFrame(tick);
 w.addEventListener('pagehide',()=>{off?.();if(raf)w.cancelAnimationFrame(raf)},{once:true});
 d.documentElement.dataset.analyserGeometryModBridge='v1';
 w.__enochGeometryModBridge={version:'v1'};
 return true;
}
let timer=0;window.installEnochianAnalyserGeometryModBridgeV1=frame=>{if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>180){clearInterval(timer);timer=0}},100)}return false};
})();