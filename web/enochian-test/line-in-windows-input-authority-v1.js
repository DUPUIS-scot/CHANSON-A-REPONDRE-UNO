(()=>{
'use strict';
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
 const d=deckDoc(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.lineInWindowsInput==='v2')return true;
 const panel=d.querySelector('.enoch-linein'),device=panel?.querySelector('[data-device]');
 if(!panel||!device||!w.navigator?.mediaDevices)return false;
 d.documentElement.dataset.lineInWindowsInput='v2';
 let lastSelected=device.value||'';
 const rebuild=async(preferred)=>{try{const list=await w.navigator.mediaDevices.enumerateDevices(),inputs=list.filter(x=>x.kind==='audioinput'),current=preferred??device.value??lastSelected??'';device.innerHTML='';const def=d.createElement('option');def.value='';def.textContent='WINDOWS DEFAULT INPUT';device.appendChild(def);inputs.forEach((x,i)=>{const o=d.createElement('option');o.value=x.deviceId;o.textContent=x.label||`WINDOWS AUDIO INPUT ${i+1}`;device.appendChild(o)});device.value=[...device.options].some(o=>o.value===current)?current:'';lastSelected=device.value;device.title=inputs.length?`${inputs.length} Windows/browser audio input${inputs.length===1?'':'s'} available`:'No permitted audio inputs'}catch(err){device.title=String(err?.message||err)}};
 device.addEventListener('change',()=>{lastSelected=device.value;w.setTimeout(()=>rebuild(lastSelected),500)},false);
 w.navigator.mediaDevices.addEventListener?.('devicechange',()=>rebuild(lastSelected));
 const observer=new w.MutationObserver(()=>{if(!panel.hidden)w.setTimeout(()=>rebuild(lastSelected),250)});observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 rebuild(lastSelected);
 w.__enochWindowsLineIn={version:'v2',refresh:()=>rebuild(lastSelected)};
 return true;
}
window.installEnochianLineInWindowsInputAuthorityV1=install;
})();
