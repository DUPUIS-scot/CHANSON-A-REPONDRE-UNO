(()=>{
'use strict';
const HASH='525948a1cd41be14b2be4f553e09f5104f2506891eb42901653f597bbdc49679';
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
const digest=async s=>{const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')};
function install(frame){
 const d=deckDoc(frame),w=d?.defaultView;if(!d||!w)return false;
 if(d.documentElement.dataset.privateIoAccess==='v1')return true;
 const midiLaunch=d.querySelector('[data-midi-piano]'),lineLaunch=d.querySelector('[data-line-in]');
 const midiView=d.querySelector('.enoch-midi-v2'),lineView=d.querySelector('.enoch-linein');
 if(!midiLaunch||!lineLaunch||!midiView||!lineView)return false;
 d.documentElement.dataset.privateIoAccess='v1';
 midiLaunch.textContent='PRIVATE I/O';midiLaunch.dataset.privateIo='';midiLaunch.title='Private MIDI + LINE IN';
 lineLaunch.hidden=true;lineLaunch.setAttribute('aria-hidden','true');lineLaunch.tabIndex=-1;
 const oldMidiGate=d.querySelector('.enoch-midi-v2-gate');if(oldMidiGate)oldMidiGate.hidden=true;
 const oldLineGate=d.querySelector('.enoch-linein-gate');if(oldLineGate)oldLineGate.hidden=true;
 const gate=d.createElement('form');gate.className='enoch-private-io-gate';gate.hidden=true;gate.innerHTML='<div><b>PRIVATE I/O ACCESS</b><small>MIDI + LINE IN</small><input type="password" autocomplete="current-password" placeholder="PASSWORD"><p></p><section><button type="button" data-cancel>CANCEL</button><button type="submit">UNLOCK</button></section></div>';d.body.appendChild(gate);
 const chooser=d.createElement('section');chooser.className='enoch-private-io-chooser';chooser.hidden=true;chooser.innerHTML='<header><b>PRIVATE I/O</b><span>UNLOCKED</span><button data-close aria-label="Close private I/O">×</button></header><main><button data-open-midi>MIDI</button><button data-open-line>LINE IN</button></main>';d.body.appendChild(chooser);
 const css=d.createElement('style');css.textContent=`.enoch-private-io-gate[hidden],.enoch-private-io-chooser[hidden]{display:none!important}.enoch-private-io-gate{position:fixed;inset:0;z-index:2147483645;background:#000d;display:grid;place-items:center;font-family:ui-monospace,monospace}.enoch-private-io-gate>div{width:min(360px,88vw);display:grid;gap:9px;padding:16px;background:#010706;border:1px solid #57d9c6;box-shadow:0 18px 60px #000}.enoch-private-io-gate b{color:#d8a85e;letter-spacing:.16em}.enoch-private-io-gate small{color:#63d8c8;letter-spacing:.14em}.enoch-private-io-gate input{height:38px;padding:7px;background:#020b09;color:#fff;border:1px solid #72552e}.enoch-private-io-gate p{min-height:12px;margin:0;color:#ff9c83;font-size:8px}.enoch-private-io-gate section{display:grid;grid-template-columns:1fr 1fr;gap:6px}.enoch-private-io-gate button,.enoch-private-io-chooser button{background:#03100e;color:#7ce9da;border:1px solid #2d786f;padding:7px;font:700 8px ui-monospace,monospace}.enoch-private-io-chooser{position:fixed;left:50%;top:68%;transform:translate(-50%,-50%);width:min(300px,calc(100vw - 24px));z-index:2147483400;background:rgba(1,7,6,.72);backdrop-filter:blur(5px);border:1px solid rgba(147,107,49,.78);box-shadow:0 16px 50px #000b;color:#8fe8db;font-family:ui-monospace,monospace}.enoch-private-io-chooser header{height:34px;display:flex;align-items:center;gap:7px;padding:0 8px;border-bottom:1px solid rgba(147,107,49,.6)}.enoch-private-io-chooser header b{flex:1;color:#d8a85e;font-size:9px;letter-spacing:.14em}.enoch-private-io-chooser header span{font-size:6px;color:#63d8c8}.enoch-private-io-chooser main{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:8px}.enoch-private-io-chooser main button{min-height:44px;letter-spacing:.12em}.enoch-private-io-chooser main button:hover{border-color:#d8a85e;color:#ffe4a4}[data-private-io].active{color:#65ebdc!important;border-color:#48cdbb!important;background:#06211d!important}`;d.head.appendChild(css);
 let unlocked=false,programmaticLine=false;
 const isUnlocked=()=>{try{return unlocked||w.sessionStorage?.getItem('enoch-private-io')==='1'}catch(_){return unlocked}};
 const markUnlocked=()=>{unlocked=true;try{w.sessionStorage?.setItem('enoch-private-io','1')}catch(_){}midiLaunch.classList.add('active')};
 const showChooser=()=>{chooser.hidden=false;midiLaunch.setAttribute('aria-expanded','true')};
 const requestAccess=()=>{if(isUnlocked()){markUnlocked();showChooser();return}gate.hidden=false;const input=gate.querySelector('input');input.value='';gate.querySelector('p').textContent='';w.setTimeout(()=>input.focus(),0)};
 const openMidi=()=>{if(!isUnlocked())return requestAccess();oldMidiGate&&(oldMidiGate.hidden=true);midiView.hidden=false;midiView.classList.remove('min');chooser.hidden=true;midiLaunch.setAttribute('aria-expanded','true')};
 const openLine=()=>{if(!isUnlocked())return requestAccess();chooser.hidden=true;programmaticLine=true;try{lineLaunch.hidden=false;lineLaunch.removeAttribute('aria-hidden');lineLaunch.click()}finally{lineLaunch.hidden=true;lineLaunch.setAttribute('aria-hidden','true');programmaticLine=false}midiLaunch.setAttribute('aria-expanded','true')};
 midiLaunch.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();requestAccess()},{capture:true});
 lineLaunch.addEventListener('click',e=>{if(programmaticLine)return;e.preventDefault();e.stopImmediatePropagation();requestAccess()},{capture:true});
 gate.querySelector('[data-cancel]').addEventListener('click',()=>gate.hidden=true);
 gate.addEventListener('submit',async e=>{e.preventDefault();const input=gate.querySelector('input');if(await digest(input.value)!==HASH){gate.querySelector('p').textContent='ACCESS DENIED';input.select();return}markUnlocked();gate.hidden=true;showChooser()});
 chooser.querySelector('[data-close]').addEventListener('click',()=>{chooser.hidden=true;midiLaunch.setAttribute('aria-expanded',String(!midiView.hidden||!lineView.hidden))});
 chooser.querySelector('[data-open-midi]').addEventListener('click',openMidi);
 chooser.querySelector('[data-open-line]').addEventListener('click',openLine);
 // Keep duplicate launchers/gates suppressed if late installers rewrite them.
 const guard=w.setInterval(()=>{lineLaunch.hidden=true;lineLaunch.setAttribute('aria-hidden','true');if(oldMidiGate)oldMidiGate.hidden=true;if(oldLineGate)oldLineGate.hidden=true;if(isUnlocked())midiLaunch.classList.add('active')},500);
 w.__enochPrivateIoAccess={version:'v1',open:requestAccess,openMidi,openLine,isUnlocked,destroy(){w.clearInterval(guard)}};
 return true;
}
let timer=0;window.installEnochianPrivateIoAccessV1=frame=>{if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>240){clearInterval(timer);timer=0}},100)}return false};
})();