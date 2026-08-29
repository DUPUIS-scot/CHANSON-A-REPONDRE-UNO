(()=>{
'use strict';
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=deckDoc(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.lineInWindowsInput==='v1')return true;
 const panel=d.querySelector('.enoch-linein'),device=panel?.querySelector('[data-device]'),state=panel?.querySelector('[data-state]');
 if(!panel||!device||!w.navigator?.mediaDevices)return false;
 d.documentElement.dataset.lineInWindowsInput='v1';
 let switching=false,lastSelected='';
 const activeId=()=>{try{return w.__enochLineIn?.getStream?.()?.getAudioTracks?.()[0]?.getSettings?.().deviceId||''}catch(_){return ''}};
 const rebuild=async(preferred)=>{
  try{
   const list=await w.navigator.mediaDevices.enumerateDevices(),inputs=list.filter(x=>x.kind==='audioinput');
   const current=preferred||activeId()||device.value||lastSelected||'';
   device.innerHTML='';
   const def=d.createElement('option');def.value='';def.textContent='WINDOWS DEFAULT INPUT';device.appendChild(def);
   inputs.forEach((x,i)=>{const o=d.createElement('option');o.value=x.deviceId;o.textContent=x.label||`WINDOWS AUDIO INPUT ${i+1}`;device.appendChild(o)});
   const exact=[...device.options].find(o=>o.value===current);device.value=exact?current:'';
   const active=activeId();if(active&&[...device.options].some(o=>o.value===active))device.value=active;
   lastSelected=device.value;
   device.title=inputs.length?`${inputs.length} Windows/browser audio input${inputs.length===1?'':'s'} available`:'No permitted audio inputs';
  }catch(err){device.title=String(err?.message||err)}
 };
 const reconnect=async()=>{
  if(switching)return;switching=true;lastSelected=device.value;
  try{state&&(state.textContent='SWITCHING INPUT');await w.__enochLineIn?.selectInput?.(lastSelected);await rebuild(lastSelected)}catch(err){state&&(state.textContent='INPUT ERROR');state&&(state.title=String(err?.message||err))}finally{switching=false}
 };
 device.addEventListener('change',()=>w.setTimeout(reconnect,0),true);
 w.navigator.mediaDevices.addEventListener?.('devicechange',()=>rebuild(activeId()||lastSelected));
 const observer=new w.MutationObserver(()=>{if(!panel.hidden)rebuild(activeId()||lastSelected)});observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 rebuild();
 w.__enochWindowsLineIn={version:'v1',refresh:rebuild};
 return true;
}
window.installEnochianLineInWindowsInputAuthorityV1=install;
})();
