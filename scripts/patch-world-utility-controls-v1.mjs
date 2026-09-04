import fs from 'node:fs';

const lubiakIndexPath='web/lubiak/index.html';
const lubiakJsPath='web/lubiak/lubiak.js';
const megapoleIndexPath='web/megapole/index.html';

let li=fs.readFileSync(lubiakIndexPath,'utf8');
let lj=fs.readFileSync(lubiakJsPath,'utf8');
let mi=fs.readFileSync(megapoleIndexPath,'utf8');

if(!li.includes('LUBIAK_MAIN_UTILITY_CONTROLS_V1')){
  const oldHome="#home{pointer-events:auto;position:absolute;right:18px;top:18px;color:#f0d7ad;text-decoration:none;border:1px solid #c47b3d88;background:#080504dd;padding:9px 12px}";
  if(!li.includes(oldHome)) throw new Error('LUBIAK home style anchor missing');
  const utilityCss="/* LUBIAK_MAIN_UTILITY_CONTROLS_V1 */#lubiak-utility-dock{pointer-events:auto;position:absolute;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));z-index:140;display:flex;align-items:center;gap:8px}.lubiak-utility-control{box-sizing:border-box;width:48px;height:48px;min-width:48px;min-height:48px;display:grid;place-items:center;padding:0!important;border:1.2px solid #c18a27!important;border-radius:50%!important;background:#080604ee!important;color:#ffc928!important;text-decoration:none!important;cursor:pointer;touch-action:manipulation;box-shadow:0 8px 24px #0008;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease,background .15s ease}.lubiak-utility-control:hover,.lubiak-utility-control:focus-visible{outline:none;border-color:#ffc928!important;background:#33210fdd!important;box-shadow:0 0 0 2px #ffc92833,0 8px 26px #000a,0 0 14px #ffc92855;transform:translateY(-1px)}.lubiak-utility-control:active{transform:scale(.94)}.lubiak-utility-control svg{width:23px;height:23px;display:block;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}#home{position:static}#megapole-return{position:absolute;z-index:2;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top))}@media(max-width:430px){#lubiak-utility-dock{gap:6px}.lubiak-utility-control{width:44px;height:44px;min-width:44px;min-height:44px}.lubiak-utility-control svg{width:21px;height:21px}}";
  li=li.replace(oldHome,utilityCss);
  const oldReturn="#megapole-return{position:absolute;z-index:2;right:18px;top:18px;border:1px solid #f0d7ad88;background:#080504dd;color:#f0d7ad;padding:9px 12px;font:700 10px/1 ui-monospace;letter-spacing:.12em;cursor:pointer}";
  if(!li.includes(oldReturn)) throw new Error('LUBIAK Megapole return style anchor missing');
  li=li.replace(oldReturn,'');
  const oldHud='<div id="hud"><a id="home" href="../#/home">HOME</a>';
  if(!li.includes(oldHud)) throw new Error('LUBIAK HUD home anchor missing');
  const homeSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3.8l8.5 6.7v9.2h-5.2v-6H8.7v6H3.5z"/></svg>';
  const fullSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
  li=li.replace(oldHud,`<div id="hud"><div id="lubiak-utility-dock" aria-label="LUBIAK utilities"><a id="home" class="lubiak-utility-control" href="../#/home" aria-label="Home" title="Home">${homeSvg}</a><button id="lubiak-fullscreen" class="lubiak-utility-control" type="button" aria-label="Full screen" title="Full screen">${fullSvg}</button></div>`);
  const oldPortal='<div id="megapole-portal" aria-hidden="true"><button id="megapole-return" type="button">LUBIAK</button>';
  if(!li.includes(oldPortal)) throw new Error('Megapole portal button anchor missing');
  const backSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>';
  li=li.replace(oldPortal,`<div id="megapole-portal" aria-hidden="true"><button id="megapole-return" class="lubiak-utility-control" type="button" aria-label="Return to LUBIAK" title="Return to LUBIAK">${backSvg}</button>`);
}

if(!lj.includes('LUBIAK_MAIN_UTILITY_RUNTIME_V1')){
  const oldShare="shareCaptureButton.textContent='SHARE';\nshareCaptureButton.setAttribute('aria-label','Capture and share LUBIAK screen');\nshareCaptureButton.style.cssText='position:fixed;right:max(86px,calc(env(safe-area-inset-right) + 86px));top:max(18px,env(safe-area-inset-top));z-index:120;border:1px solid #c47b3d88;background:#080504dd;color:#f0d7ad;padding:9px 12px;font:700 10px/1 ui-monospace;letter-spacing:.10em;cursor:pointer;touch-action:manipulation';\ndocument.body.appendChild(shareCaptureButton);";
  if(!lj.includes(oldShare)) throw new Error('LUBIAK share button anchor missing');
  const shareReplacement=`// LUBIAK_MAIN_UTILITY_RUNTIME_V1\nshareCaptureButton.className='lubiak-utility-control';\nshareCaptureButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0-11-4 4m4-4 4 4M5 12v7h14v-7"/></svg>';\nshareCaptureButton.setAttribute('aria-label','Share LUBIAK moment');\nshareCaptureButton.title='Share';\nconst lubiakUtilityDock=document.querySelector('#lubiak-utility-dock');\nconst lubiakFullscreenButton=document.querySelector('#lubiak-fullscreen');\nif(lubiakUtilityDock){\n  if(lubiakFullscreenButton) lubiakUtilityDock.insertBefore(shareCaptureButton,lubiakFullscreenButton);\n  else lubiakUtilityDock.appendChild(shareCaptureButton);\n}else document.body.appendChild(shareCaptureButton);\nfunction lubiakFullscreenActive(){return !!(document.fullscreenElement||document.webkitFullscreenElement);}\nfunction syncLubiakFullscreenButton(){\n  if(!lubiakFullscreenButton)return;\n  const active=lubiakFullscreenActive();\n  lubiakFullscreenButton.setAttribute('aria-label',active?'Exit full screen':'Full screen');\n  lubiakFullscreenButton.title=active?'Exit full screen':'Full screen';\n}\nasync function toggleLubiakFullscreen(){\n  try{\n    if(lubiakFullscreenActive()){\n      if(document.exitFullscreen)await document.exitFullscreen();\n      else if(document.webkitExitFullscreen)document.webkitExitFullscreen();\n    }else{\n      const el=document.documentElement;\n      if(el.requestFullscreen)await el.requestFullscreen();\n      else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();\n      else { showStatus('FULL SCREEN NOT AVAILABLE',900); return; }\n    }\n  }catch(error){console.warn('LUBIAK fullscreen failed',error);showStatus('FULL SCREEN NOT AVAILABLE',900);}\n  syncLubiakFullscreenButton();\n}\nlubiakFullscreenButton?.addEventListener('click',toggleLubiakFullscreen);\ndocument.addEventListener('fullscreenchange',syncLubiakFullscreenButton);\ndocument.addEventListener('webkitfullscreenchange',syncLubiakFullscreenButton);\nsyncLubiakFullscreenButton();`;
  lj=lj.replace(oldShare,shareReplacement);

  const oldCircus="circusExitButton.textContent='EXIT CIRCUS';\ncircusExitButton.style.cssText='position:fixed;right:max(18px,env(safe-area-inset-right));top:max(66px,calc(env(safe-area-inset-top) + 66px));z-index:120;display:none;border:1px solid #f0d7ad99;background:#080504e8;color:#f0d7ad;padding:11px 14px;border-radius:3px;font:700 10px/1 ui-monospace;letter-spacing:.12em;cursor:pointer;touch-action:manipulation';\ndocument.body.appendChild(circusExitButton);";
  if(lj.includes(oldCircus)){
    const circusNew="circusExitButton.className='lubiak-utility-control';\ncircusExitButton.innerHTML='<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M19 12H6m5-5-5 5 5 5M19 5v14\"/></svg>';\ncircusExitButton.setAttribute('aria-label','Exit circus');\ncircusExitButton.title='Exit circus';\ncircusExitButton.style.display='none';\n(lubiakUtilityDock||document.body).appendChild(circusExitButton);";
    lj=lj.replace(oldCircus,circusNew);
  }
}

if(!mi.includes('MEGAPOLE_MAIN_UTILITY_CONTROLS_V1')){
  const oldBack="#back{pointer-events:auto;position:absolute;right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));color:#f2cf82;text-decoration:none;border:1px solid #d1a04e88;background:#140e12dd;padding:9px 12px}";
  if(!mi.includes(oldBack)) throw new Error('Megapole back style anchor missing');
  const mcss="/* MEGAPOLE_MAIN_UTILITY_CONTROLS_V1 */#megapole-utility-dock{pointer-events:auto;position:absolute;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));z-index:140;display:flex;align-items:center;gap:8px}.megapole-utility-control{box-sizing:border-box;width:48px;height:48px;min-width:48px;min-height:48px;display:grid;place-items:center;padding:0;border:1.2px solid #c18a27;border-radius:50%;background:#080604ee;color:#ffc928;text-decoration:none;cursor:pointer;touch-action:manipulation;box-shadow:0 8px 24px #0008;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease,background .15s ease}.megapole-utility-control:hover,.megapole-utility-control:focus-visible{outline:none;border-color:#ffc928;background:#33210fdd;box-shadow:0 0 0 2px #ffc92833,0 8px 26px #000a,0 0 14px #ffc92855;transform:translateY(-1px)}.megapole-utility-control:active{transform:scale(.94)}.megapole-utility-control svg{width:23px;height:23px;display:block;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}#back{position:static}@media(max-width:430px){#megapole-utility-dock{gap:6px}.megapole-utility-control{width:44px;height:44px;min-width:44px;min-height:44px}.megapole-utility-control svg{width:21px;height:21px}}";
  mi=mi.replace(oldBack,mcss);
  const oldHud='<div id="hud"><a id="back" href="../lubiak/">LUBIAK</a>';
  if(!mi.includes(oldHud)) throw new Error('Megapole HUD back anchor missing');
  const backSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>';
  const homeSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3.8l8.5 6.7v9.2h-5.2v-6H8.7v6H3.5z"/></svg>';
  const shareSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0-11-4 4m4-4 4 4M5 12v7h14v-7"/></svg>';
  const fullSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
  mi=mi.replace(oldHud,`<div id="hud"><div id="megapole-utility-dock" aria-label="Megapole utilities"><a id="back" class="megapole-utility-control" href="../lubiak/" aria-label="Return to LUBIAK" title="Return to LUBIAK">${backSvg}</a><a id="megapole-home" class="megapole-utility-control" href="../#/home" aria-label="Home" title="Home">${homeSvg}</a><button id="megapole-share" class="megapole-utility-control" type="button" aria-label="Share Megapole" title="Share">${shareSvg}</button><button id="megapole-fullscreen" class="megapole-utility-control" type="button" aria-label="Full screen" title="Full screen">${fullSvg}</button></div>`);
  const runtimeAnchor='<script>(()=>{const fail=m=>';
  if(!mi.includes(runtimeAnchor)) throw new Error('Megapole runtime script anchor missing');
  const runtime=`<script>(()=>{const share=document.querySelector('#megapole-share'),full=document.querySelector('#megapole-fullscreen');share?.addEventListener('click',async()=>{const data={title:"SILMARI’LLION — MEGAPOLE",text:'Open this Megapole view',url:location.href};if(navigator.share){try{await navigator.share(data);return}catch(e){if(e?.name==='AbortError')return}}try{await navigator.clipboard?.writeText(location.href)}catch{}});const active=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);const sync=()=>{if(full){full.title=active()?'Exit full screen':'Full screen';full.setAttribute('aria-label',full.title)}};full?.addEventListener('click',async()=>{try{if(active()){if(document.exitFullscreen)await document.exitFullscreen();else document.webkitExitFullscreen?.()}else{const el=document.documentElement;if(el.requestFullscreen)await el.requestFullscreen();else el.webkitRequestFullscreen?.()}}catch{}sync()});document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);sync()})();</script>`;
  mi=mi.replace(runtimeAnchor,runtime+runtimeAnchor);
}

fs.writeFileSync(lubiakIndexPath,li);
fs.writeFileSync(lubiakJsPath,lj);
fs.writeFileSync(megapoleIndexPath,mi);
console.log('Unified LUBIAK and Megapole utility controls with main-screen design.');
