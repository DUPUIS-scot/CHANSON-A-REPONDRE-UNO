(()=>{
'use strict';
const innerDocument=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
const load=(attr,src,fn,frame)=>{if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.src=src;s.setAttribute(attr,'1');s.onload=()=>window[fn]?.(frame);document.head.appendChild(s)};
const install=()=>{const frame=document.getElementById('terminalLive');load('data-enoch-midi-signal-live','/enochian-test/midi-signal-live-v1.js?v=20260829-v4','installEnochianMidiModLiveV1',frame);load('data-enoch-midi-expressive-signal','/enochian-test/midi-expressive-signal-v1.js?v=20260829-v1','installEnochianMidiExpressiveSignalV1',frame);load('data-enoch-midi-second-viewport','/enochian-test/midi-second-viewport-v1.js?v=20260829-v2','installEnochianMidiSecondViewportV1',frame);setTimeout(()=>window.installEnochianMidiModLiveV1?.(frame),400)};
window.__enochInstallerBroker={...(window.__enochInstallerBroker||{}),version:'v12',lateAuthorities:[...new Set([...(window.__enochInstallerBroker?.lateAuthorities||[]),'midi-signal-live','midi-expressive-signal','midi-floating-controller','mod-midi-live'])]};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();