(()=>{
'use strict';
const getDeck=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=getDeck(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.sharedInputRouter==='v2'&&w.__enochSharedInputRouter?.version==='v2')return true;
 const NativeAudioContext=w.AudioContext||w.webkitAudioContext;if(!NativeAudioContext)return false;
 const proto=NativeAudioContext.prototype;
 const state={context:null,source:null,low:null,mid:null,high:null,filter:null,drive:null,delay:null,fb:null,wet:null,dry:null,master:null,analyser:null,filterIndex:0,gainIndex:0,midiAccess:null,routes:[],lastDeck:'—'};
 const original={media:proto.createMediaElementSource,biquad:proto.createBiquadFilter,wave:proto.createWaveShaper,delay:proto.createDelay,gain:proto.createGain,analyser:proto.createAnalyser};
 const own=ctx=>ctx===state.context;
 const expose=()=>{if(state.context&&state.low){w.__enochMasterInput=state.low;w.__enochLineInDestination=state.low}w.__enochAudioGraph={version:'v2',context:state.context,input:state.low,low:state.low,mid:state.mid,high:state.high,filter:state.filter,drive:state.drive,delay:state.delay,feedback:state.fb,wet:state.wet,dry:state.dry,master:state.master,analyser:state.analyser}};
 if(!proto.__enochSharedInputPatched){
   proto.createMediaElementSource=function(...args){const node=original.media.apply(this,args);if(!state.context){state.context=this;state.filterIndex=0;state.gainIndex=0}if(own(this)){state.source=node;expose()}return node};
   proto.createBiquadFilter=function(...args){const node=original.biquad.apply(this,args);if(own(this)){const key=['low','mid','high','filter'][state.filterIndex++]||null;if(key)state[key]=node;expose()}return node};
   proto.createWaveShaper=function(...args){const node=original.wave.apply(this,args);if(own(this)){state.drive=node;expose()}return node};
   proto.createDelay=function(...args){const node=original.delay.apply(this,args);if(own(this)){state.delay=node;expose()}return node};
   proto.createGain=function(...args){const node=original.gain.apply(this,args);if(own(this)){const key=['fb','wet','dry','master'][state.gainIndex++]||null;if(key)state[key]=node;expose()}return node};
   proto.createAnalyser=function(...args){const node=original.analyser.apply(this,args);if(own(this)){state.analyser=node;expose()}return node};
   Object.defineProperty(proto,'__enochSharedInputPatched',{value:true,configurable:true});
 }
 const SharedAudioContext=new Proxy(NativeAudioContext,{construct(Target,args){if(state.context)return state.context;const ctx=Reflect.construct(Target,args);state.context=ctx;expose();return ctx}});
 try{w.AudioContext=SharedAudioContext;if(w.webkitAudioContext)w.webkitAudioContext=SharedAudioContext}catch(_){}
 // Main PLAY owns output context creation and resumption.{}
 const routePanel=()=>d.querySelector('.enoch-midi-v2');
 const readRoutes=()=>{const view=routePanel(),rows=[...(view?.querySelectorAll('.midi-deck')||[])];const next=rows.map(row=>({deck:row.dataset.deck||'?',input:row.querySelector('[data-route-input]')?.value||'*',channel:+(row.querySelector('[data-route-channel]')?.value||1)}));state.routes=next.length?next:[{deck:'A',input:'*',channel:1},{deck:'B',input:'*',channel:2}];rows.forEach(row=>{const r=state.routes.find(x=>x.deck===(row.dataset.deck||'?')),out=row.querySelector('[data-route-state]');if(out&&r)out.textContent=`ROUTED · ${r.input==='*'?'ANY INPUT':r.input} · CH ${r.channel} → SIGNAL / EQ / FX / MASTER`});return state.routes};
 const matchRoutes=(input,channel)=>readRoutes().filter(r=>r.channel===channel&&(r.input==='*'||r.input===input.id||r.input===input.name||r.input===input.manufacturer));
 const emitControl=(input,e,matches)=>{const data=e.data||[],st=data[0]||0,cmd=st&240,a=data[1]||0,v=data[2]||0,channel=(st&15)+1;const detail={source:'usb-midi',inputId:input.id,inputName:input.name||'',channel,decks:matches.map(x=>x.deck),status:st,a,value:v,kind:cmd===176?'cc':cmd===224?'bend':'message'};try{w.dispatchEvent(new CustomEvent('enoch:midi-input',{detail}))}catch(_){};try{w.__enochAnalyserBus?.emit?.('midi-control',detail)}catch(_){}};
 const handleMidi=(input,e)=>{const data=e.data||[],st=data[0]||0,cmd=st&240,n=data[1]||0,v=data[2]||0,channel=(st&15)+1,matches=matchRoutes(input,channel);if(!matches.length)return;state.lastDeck=matches.map(x=>x.deck).join('+');const api=w.__enochMidiSignalLive;if(!api)return;if(cmd===144&&v>0)api.noteOn?.(n,v);else if(cmd===128||(cmd===144&&v===0))api.noteOff?.(n);else emitControl(input,e,matches);const status=d.querySelector('.midi-signal-live [data-midi-status]');if(status)status.textContent=`ROUTED · ${input.name||'USB MIDI'} · CH ${channel} → DECK ${state.lastDeck} → 3D SIGNAL`};
 const bindMidi=async()=>{if(!navigator.requestMIDIAccess)return false;try{if(!state.midiAccess)state.midiAccess=await navigator.requestMIDIAccess();const inputs=[...state.midiAccess.inputs.values()];inputs.forEach(input=>{if(input.onmidimessage?.__enochSharedRoute==='v2')return;const handler=e=>handleMidi(input,e);handler.__enochSharedRoute='v2';input.onmidimessage=handler});state.midiAccess.onstatechange=()=>bindMidi();const view=routePanel();if(view){const opts=inputs.map(x=>`<option value="${x.id}">${x.name||x.manufacturer||'USB MIDI'}</option>`).join('');view.querySelectorAll('[data-route-input]').forEach(sel=>{const keep=sel.value;sel.innerHTML='<option value="*">ANY USB MIDI</option>'+opts;if([...sel.options].some(o=>o.value===keep))sel.value=keep});readRoutes()}return true}catch(_){return false}};
 const syncLineInUi=()=>{const p=d.querySelector('.enoch-linein');if(!p)return false;let badge=p.querySelector('[data-shared-route]');if(!badge){badge=d.createElement('div');badge.dataset.sharedRoute='';badge.textContent='ROUTE · LINE IN → EQ → FX → 3D SIGNAL → MASTER';badge.style.cssText='position:absolute;left:8px;right:8px;bottom:3px;text-align:center;font:700 6px ui-monospace,monospace;color:#d8a85e;letter-spacing:.06em;pointer-events:none';p.appendChild(badge)}return true};
 const routeLineIn=()=>{if(state.low){w.__enochMasterInput=state.low;w.__enochLineInDestination=state.low;syncLineInUi();return true}return false};
 const observe=()=>{bindMidi();readRoutes();routeLineIn();const view=routePanel();if(view&&!view.dataset.routeAuthority){view.dataset.routeAuthority='v2';view.addEventListener('change',()=>{readRoutes();bindMidi()});view.querySelector('[data-route-toggle]')?.setAttribute('title','Route USB MIDI device + channel to Deck A/B and terminal signal chain')}const line=d.querySelector('[data-line-in]');if(line&&!line.dataset.sharedRouteHook){line.dataset.sharedRouteHook='1';line.addEventListener('pointerdown',routeLineIn,{capture:true})}};
 const timer=w.setInterval(observe,350);observe();d.documentElement.dataset.sharedInputRouter='v2';w.__enochSharedInputRouter={version:'v2',state,readRoutes,matchRoutes,matches:matchRoutes,bindMidi,routeLineIn,get audioGraph(){return w.__enochAudioGraph},destroy(){w.clearInterval(timer)}};return true;
}
let timer=0;window.installEnochianSharedInputRouterV1=frame=>{if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>240){clearInterval(timer);timer=0}},100)}return false};
})();
