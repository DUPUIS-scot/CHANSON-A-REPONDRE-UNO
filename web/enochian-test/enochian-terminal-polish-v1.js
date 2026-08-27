(()=>{
'use strict';
const VERSION='20260827-polish-v1';
let timer=0,lastHost=null,lastDoc=null,outerObserver=null;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function inner(host){try{const live=host?.contentDocument,deck=live?.getElementById('deck');return {live,deck,d:deck?.contentDocument,w:deck?.contentWindow}}catch(_){return {}}}
function ensureLogo(d){
 const brand=d.querySelector('.top .brand');if(!brand)return;
 let logo=d.getElementById('enochBrandLogo');
 if(!logo){logo=d.createElement('img');logo.id='enochBrandLogo';logo.src='/assets/assets/images/app_logo.png';logo.alt='Chanson à Répondre UNO';logo.decoding='async';brand.insertBefore(logo,brand.firstChild)}
 const title=d.querySelector('.top .title');if(title){title.textContent='ENOCHIAN TERMINAL';title.dataset.subtitle='';title.removeAttribute('data-subtitle')}
}
function ensureSignalStrip(d,w){
 const wave=d.querySelector('.wave');if(!wave)return null;
 let strip=d.getElementById('enochTranscriptStrip');
 if(!strip){strip=d.createElement('div');strip.id='enochTranscriptStrip';strip.innerHTML='<b>TRANSCRIPT / ENOCHIAN SIGNAL</b><span class="enoch-transcript-source"></span><i>→</i><span class="enoch-transcript-glyphs"></span>';wave.appendChild(strip)}
 const sync=()=>{const ta=d.querySelector('.mod textarea'),src=strip.querySelector('.enoch-transcript-source'),glyphs=strip.querySelector('.enoch-transcript-glyphs'),real=d.querySelector('.mod-glyphs');if(src)src.textContent=(ta?.value||ta?.placeholder||'').trim()||'—';if(glyphs&&real)glyphs.innerHTML=real.innerHTML};
 const ta=d.querySelector('.mod textarea');if(ta&&!ta.dataset.enochTranscriptSync){ta.dataset.enochTranscriptSync='v1';ta.addEventListener('input',sync);ta.addEventListener('change',sync)}
 sync();return {strip,sync};
}
function ensureSignalTools(d,w){
 const wave=d.querySelector('.wave');if(!wave)return;
 let tools=d.getElementById('enochSignalTools');
 if(!tools){
  tools=d.createElement('div');tools.id='enochSignalTools';tools.innerHTML='<div class="enoch-signal-tool-row"><button data-act="reset" title="Reset view">↺</button><button data-act="zoomIn" title="Zoom in">+</button><button data-act="zoomOut" title="Zoom out">−</button><button data-act="view">VIEW</button><button data-act="sculpt">SCULPT</button></div><div class="enoch-signal-wheel-row"><button data-wheel="zoom">ZOOM</button><button data-wheel="height">HEIGHT</button><button data-wheel="depth">DEPTH</button><button data-wheel="twist">TWIST</button></div><div class="enoch-signal-mod-level"><span>MOD LEVEL</span><em><i></i></em><b>0%</b></div><small>DRAG = ROTATE · WHEEL = ACTIVE MODE · SIGNAL MOD = SCULPT</small>';
  wave.appendChild(tools);
  tools.addEventListener('pointerdown',e=>e.stopPropagation());tools.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();e.stopPropagation();const state=w.__enochAnalyserGesture,act=b.dataset.act,mode=b.dataset.wheel;if(mode){w.__enochAnalyserWheelMode=mode;tools.querySelectorAll('[data-wheel]').forEach(x=>x.classList.toggle('active',x===b));return}if(act==='sculpt'){if(w.__enochSignalModulation!==true)d.getElementById('signalModToggle')?.click()}else if(act==='view'){if(w.__enochSignalModulation===true)d.getElementById('signalModToggle')?.click()}else if(state&&act==='reset'){Object.assign(state.view||{}, {yaw:0,pitch:0,zoom:1,yawV:0,pitchV:0});Object.assign(state.deform||{}, {pullY:0,pullZ:0,twist:0,vY:0,vZ:0,grabBin:null,grabRow:null});w.__enochAnalyser3D?.invalidate?.()}else if(state&&act==='zoomIn'){state.view.zoom=clamp((state.view.zoom||1)*1.18,.55,2.6);w.__enochAnalyser3D?.invalidate?.()}else if(state&&act==='zoomOut'){state.view.zoom=clamp((state.view.zoom||1)*.85,.55,2.6);w.__enochAnalyser3D?.invalidate?.()}});
 }
 const mode=w.__enochAnalyserWheelMode||'zoom';tools.querySelectorAll('[data-wheel]').forEach(b=>b.classList.toggle('active',b.dataset.wheel===mode));
 const sculpt=w.__enochSignalModulation===true;tools.querySelector('[data-act="sculpt"]')?.classList.toggle('active',sculpt);tools.querySelector('[data-act="view"]')?.classList.toggle('active',!sculpt);
 const strength=clamp(Number(w.__enochSculptAudio?.strength||w.__enochSculptAudio?.engagement||0),0,1),pct=Math.round(strength*100);const fill=tools.querySelector('.enoch-signal-mod-level i'),val=tools.querySelector('.enoch-signal-mod-level b');if(fill)fill.style.width=pct+'%';if(val)val.textContent=pct+'%';
}
function repairTwoMix(d){
 const button=d.getElementById('twoMixToggle');if(button){button.style.setProperty('position','fixed','important');button.style.setProperty('right','8px','important');button.style.setProperty('bottom','8px','important');button.style.setProperty('left','auto','important');button.style.setProperty('top','auto','important');button.style.setProperty('width','auto','important');button.style.setProperty('max-width','190px','important');}
}
function syncOuterFloat(d){
 const panel=document.getElementById('outerAnalyserPanel');if(!panel)return;
 let strip=panel.querySelector('.outer-transcript-strip');if(!strip){strip=document.createElement('div');strip.className='outer-transcript-strip';strip.innerHTML='<b>TRANSCRIPT / ENOCHIAN SIGNAL</b><span></span><i></i>';panel.querySelector('.outer-analyser-body')?.appendChild(strip)}
 const src=strip?.querySelector('span'),glyphs=strip?.querySelector('i'),ta=d.querySelector('.mod textarea'),real=d.querySelector('.mod-glyphs');if(src)src.textContent=(ta?.value||'').trim()||'—';if(glyphs&&real)glyphs.innerHTML=real.innerHTML;
}
function fitJecker(d){
 const panel=document.getElementById('doubleDeckerSpecial'),wave=d.querySelector('.wave');if(!panel||!wave||!panel.classList.contains('open'))return;
 const r=wave.getBoundingClientRect(),size=Math.max(320,Math.min(620,r.width*.82,r.height*.90));panel.style.setProperty('width',size+'px','important');panel.style.setProperty('height',size+'px','important');const pr=panel.getBoundingClientRect();let left=pr.left,top=pr.top;if(pr.right>r.right||pr.left<r.left||pr.bottom>r.bottom||pr.top<r.top){left=r.left+(r.width-size)/2;top=r.top+(r.height-size)/2}left=clamp(left,r.left,Math.max(r.left,r.right-size));top=clamp(top,r.top,Math.max(r.top,r.bottom-size));panel.style.setProperty('left',left+'px','important');panel.style.setProperty('top',top+'px','important');panel.style.setProperty('transform','none','important');
}
function addInnerStyle(d){
 if(d.getElementById('enochTerminalPolishV1Style'))return;const s=d.createElement('style');s.id='enochTerminalPolishV1Style';s.textContent=`
 html.enoch-shell-desktop .top .title:after{display:none!important;content:none!important}html.enoch-shell-desktop .top{grid-template-columns:minmax(120px,220px) 1fr auto!important}html.enoch-shell-desktop #enochBrandLogo{display:block!important;width:58px!important;height:46px!important;object-fit:contain!important;border:0!important;filter:drop-shadow(0 0 7px rgba(241,167,45,.22))}html.enoch-shell-desktop .top .avatar{display:none!important}html.enoch-shell-desktop .top .brand{gap:7px!important}html.enoch-shell-desktop .top .title{font-size:19px!important;line-height:1!important;margin:0!important}
 html.enoch-shell-desktop #twoMixToggle{position:fixed!important;right:8px!important;bottom:8px!important;left:auto!important;top:auto!important;width:auto!important;max-width:190px!important;min-height:25px!important;font-size:7px!important;z-index:2147483000!important}
 html.enoch-shell-desktop .enoch-shell-analyser canvas{bottom:112px!important}#enochTranscriptStrip{position:absolute;left:116px;right:116px;bottom:10px;z-index:44;min-height:38px;display:grid;grid-template-columns:auto minmax(80px,.85fr) auto minmax(120px,1.4fr);gap:7px;align-items:center;padding:5px 7px;border:1px solid rgba(155,107,46,.75);background:rgba(2,9,14,.90);pointer-events:none;overflow:hidden}#enochTranscriptStrip>b{color:#f1a72d;font-size:6px;letter-spacing:.14em;white-space:nowrap}#enochTranscriptStrip>.enoch-transcript-source{color:#a9c8cc;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#enochTranscriptStrip>i{color:#f1a72d;font-style:normal}#enochTranscriptStrip>.enoch-transcript-glyphs{display:flex;gap:3px;align-items:center;min-width:0;overflow:hidden}#enochTranscriptStrip>.enoch-transcript-glyphs img{width:22px!important;height:22px!important;flex:0 0 22px!important;object-fit:contain!important;filter:invert(77%) sepia(88%) saturate(1712%) hue-rotate(156deg) brightness(104%) contrast(105%)!important}
 #enochSignalTools{position:absolute;right:10px;top:82px;z-index:46;width:168px;padding:5px;border:1px solid rgba(53,225,244,.42);background:rgba(2,10,15,.88);display:grid;gap:4px;pointer-events:auto}#enochSignalTools button{min-height:22px;padding:3px 5px;border:1px solid #315b56;background:#06110f;color:#a9eee7;font:800 6px/1 ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}#enochSignalTools button.active{border-color:#f1a72d;color:#ffd68a;background:#1b1207}.enoch-signal-tool-row{display:grid;grid-template-columns:repeat(5,1fr);gap:3px}.enoch-signal-wheel-row{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}.enoch-signal-mod-level{display:grid;grid-template-columns:auto 1fr auto;gap:4px;align-items:center;color:#79a8ad;font-size:6px}.enoch-signal-mod-level em{height:5px;border:1px solid #315b56;background:#07110f;overflow:hidden}.enoch-signal-mod-level em i{display:block;height:100%;width:0;background:linear-gradient(90deg,#35e1f4,#f1a72d)}#enochSignalTools small{text-align:center;color:#79a8ad;font-size:5.5px;line-height:1.2}
 html.enoch-shell-desktop #enochBayPad .pad-top{display:grid!important;grid-column:1/3!important;grid-row:1!important;grid-template-columns:1fr auto!important;gap:4px!important}html.enoch-shell-desktop #enochBayPad .pad-mode{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:3px!important}html.enoch-shell-desktop #enochBayPad .pad-mode .btn{display:block!important;min-width:0!important;padding:3px 2px!important;font-size:5.5px!important;min-height:20px!important}html.enoch-shell-desktop #enochBayPad .enoch-shell-pad{grid-template-columns:minmax(0,1fr) 42px!important;grid-template-rows:auto minmax(0,1fr)!important}html.enoch-shell-desktop #enochBayPad .xy-pad{grid-column:1!important;grid-row:2!important}html.enoch-shell-desktop #enochBayPad .mixer-level{grid-column:2!important;grid-row:2!important}
 html.enoch-shell-desktop #loopIn,html.enoch-shell-desktop #loopOut{transform-origin:center;transition:transform 120ms ease,box-shadow 120ms ease} @media(hover:hover) and (pointer:fine){html.enoch-shell-desktop #loopIn:hover,html.enoch-shell-desktop #loopOut:hover{transform:scale(1.16);z-index:12;box-shadow:0 0 14px rgba(241,167,45,.36)!important}}
 html.enoch-shell-desktop .enoch-shell-log{max-height:112px!important;min-height:84px!important}html.enoch-shell-desktop .enoch-shell-log .console-lines{height:72px!important}
 @media(max-width:1000px){#enochBrandLogo{display:none!important}#enochTranscriptStrip,#enochSignalTools{display:none!important}}
 `;d.head.appendChild(s)
}
function addOuterStyle(){
 if(document.getElementById('enochTerminalOuterPolishV1Style'))return;const s=document.createElement('style');s.id='enochTerminalOuterPolishV1Style';s.textContent=`
 .outer-transcript-strip{position:absolute;left:8px;right:8px;bottom:7px;z-index:7;min-height:31px;display:grid;grid-template-columns:auto minmax(80px,1fr) minmax(100px,1.3fr);gap:6px;align-items:center;padding:4px 6px;border:1px solid #315b56;background:#020706e8;pointer-events:none}.outer-transcript-strip>b{color:#d5aa63;font-size:6px;letter-spacing:.1em}.outer-transcript-strip>span{font-size:6px;color:#a9eee7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.outer-transcript-strip>i{display:flex;gap:2px;overflow:hidden}.outer-transcript-strip img{width:18px;height:18px;object-fit:contain;filter:invert(89%) sepia(20%) saturate(859%) hue-rotate(113deg) brightness(99%) contrast(91%)}
 #doubleDeckerSpecial.jecker-radial{max-width:620px!important;max-height:620px!important}#doubleDeckerSpecial.jecker-radial .dds-slot{width:16.4%!important;height:16.4%!important;padding:4px!important}#doubleDeckerSpecial.jecker-radial .dds-slot select{width:88%!important;font-size:6px!important}#doubleDeckerSpecial.jecker-radial .dds-deck>.dds-deck-shuffle{width:10%!important;height:10%!important;padding:4px!important;font-size:6px!important}#doubleDeckerSpecial.jecker-radial .dds-center{width:29%!important;height:29%!important;padding:4.8% 3%!important}
 `;document.head.appendChild(s)
}
function install(host){
 try{const {d,w}=inner(host);if(!d||!w)return false;addOuterStyle();addInnerStyle(d);ensureLogo(d);ensureSignalStrip(d,w);ensureSignalTools(d,w);repairTwoMix(d);syncOuterFloat(d);fitJecker(d);d.documentElement.dataset.enochTerminalPolish=VERSION;
  if(!d.documentElement.dataset.enochPolishTick){d.documentElement.dataset.enochPolishTick='v1';w.setInterval(()=>{try{ensureSignalStrip(d,w)?.sync();ensureSignalTools(d,w);repairTwoMix(d);syncOuterFloat(d);fitJecker(d)}catch(_){}},180)}
  const panel=document.getElementById('doubleDeckerSpecial');if(panel&&!panel.dataset.enochContainment){panel.dataset.enochContainment='v1';new MutationObserver(()=>fitJecker(d)).observe(panel,{attributes:true,attributeFilter:['class']});panel.addEventListener('pointerup',()=>setTimeout(()=>fitJecker(d),0),true)}
  return true
 }catch(_){return false}
}
window.installEnochianTerminalPolishV1=host=>{lastHost=host;if(install(host)){if(timer){clearInterval(timer);timer=0}return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(lastHost)||++n>240){clearInterval(timer);timer=0}},50)}return false};
})();