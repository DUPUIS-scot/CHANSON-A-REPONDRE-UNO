import fs from 'node:fs';
const jsPath='web/lubiak/lubiak.js';
const htmlPath='web/lubiak/index.html';
let js=fs.readFileSync(jsPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
if(js.includes('LUBIAK_MOBILE_CONTROLS_LAYOUT_V1')) process.exit(0);

function rep(src,a,b,label){if(!src.includes(a)) throw new Error(`missing ${label}`); return src.replace(a,b);}

js=rep(js,
"joystick.style.cssText='position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));width:112px;height:132px;z-index:80;display:grid;place-items:center;touch-action:none;user-select:none;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.16em';",
"// LUBIAK_MOBILE_CONTROLS_LAYOUT_V1\njoystick.style.cssText='position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));width:112px;height:132px;z-index:80;display:grid;place-items:center;touch-action:none;user-select:none;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.16em';",
'joystick layout');

js=rep(js,
"const verticalDock=document.createElement('div');verticalDock.id='lubiak-vertical-dock';verticalDock.style.cssText='position:fixed;right:max(132px,calc(env(safe-area-inset-right) + 132px));bottom:max(28px,calc(env(safe-area-inset-bottom) + 28px));z-index:81;display:flex;flex-direction:column;gap:7px';",
"const verticalDock=document.createElement('div');verticalDock.id='lubiak-vertical-dock';verticalDock.style.cssText='position:fixed;right:max(140px,calc(env(safe-area-inset-right) + 140px));bottom:max(22px,calc(env(safe-area-inset-bottom) + 22px));z-index:81;display:flex;flex-direction:column;gap:8px';",
'vertical layout');

js=rep(js,
"const modeDock=document.createElement('div');modeDock.id='lubiak-mode-dock';modeDock.style.cssText='position:fixed;right:max(18px,env(safe-area-inset-right));bottom:158px;z-index:82;display:flex;gap:5px;padding:5px;border:1px solid #f6c28b55;border-radius:999px;background:#100806dd';",
"const modeDock=document.createElement('div');modeDock.id='lubiak-mode-dock';modeDock.style.cssText='position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(178px,calc(env(safe-area-inset-bottom) + 178px));z-index:82;display:flex;gap:6px;padding:5px;border:1px solid #f6c28b55;border-radius:999px;background:#100806dd;white-space:nowrap';",
'mode layout');

const styleAnchor="document.head.appendChild(js);";
if(!js.includes(styleAnchor)) throw new Error('style anchor missing');
js=js.replace(styleAnchor,styleAnchor+"\nconst mobileControlStyle=document.createElement('style');mobileControlStyle.textContent='@media(max-width:720px){#lubiak-mode-dock{right:max(12px,env(safe-area-inset-right))!important;bottom:max(174px,calc(env(safe-area-inset-bottom) + 174px))!important}#lubiak-vertical-dock{right:max(136px,calc(env(safe-area-inset-right) + 136px))!important;bottom:max(24px,calc(env(safe-area-inset-bottom) + 24px))!important}#lubiak-sphere-control{right:max(12px,env(safe-area-inset-right))!important;bottom:max(14px,env(safe-area-inset-bottom))!important}}';document.head.appendChild(mobileControlStyle);");

html=rep(html,
"@media(max-width:720px){#bandcamp{left:12px;bottom:12px;width:min(76vw,420px);height:42px}#bandcamp iframe{height:42px}#help{right:14px;bottom:66px;font-size:10px}}",
"@media(max-width:720px){#bandcamp{left:12px;bottom:12px;width:min(76vw,420px);height:42px}#bandcamp iframe{height:42px}#help{display:none}}",
'help mobile css');

fs.writeFileSync(jsPath,js);
fs.writeFileSync(htmlPath,html);
console.log('Applied iPhone-safe LUBIAK control layout.');
