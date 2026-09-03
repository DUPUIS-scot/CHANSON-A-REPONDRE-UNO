import fs from 'node:fs';
const jsPath='web/lubiak/lubiak.js';
const htmlPath='web/lubiak/index.html';
let js=fs.readFileSync(jsPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
if(!js.includes('LUBIAK_CIRCUS_TRANSITION_RESTORE_V2')){
 const anchor="function updateCircusTransition() {\n  if (circusTransitioning || performance.now() < transitionLockUntil) return;";
 if(!js.includes(anchor)) throw new Error('circus transition anchor missing');
 js=js.replace(anchor,"// LUBIAK_CIRCUS_TRANSITION_RESTORE_V2\n// Exterior circus gate remains reachable by djinn position or free camera navigation.\n"+anchor);
 const media="function setCircusMediaVisible(visible) {\n  if (circusYoutube) circusYoutube.classList.toggle('is-visible', visible);";
 if(js.includes(media)) js=js.replace(media,"function setCircusMediaVisible(visible) {\n  if (circusYoutube) {\n    circusYoutube.classList.toggle('is-visible', visible);\n    circusYoutube.setAttribute('aria-hidden', visible ? 'false' : 'true');\n    const iframe=circusYoutube.querySelector('iframe');\n    if(visible && iframe && !iframe.src && iframe.dataset.src) iframe.src=iframe.dataset.src;\n  }");
}
if(!html.includes('LUBIAK_CIRCUS_YT_9X16_V2')){
 html=html.replace('#circus-youtube{position:absolute;left:8vw;top:12vh;width:min(34vw,360px);aspect-ratio:9/16;opacity:0;visibility:hidden;pointer-events:none}', '#circus-youtube{/* LUBIAK_CIRCUS_YT_9X16_V2 */position:absolute;left:max(18px,env(safe-area-inset-left));top:50%;transform:translateY(-50%);width:min(28vw,360px);height:min(72vh,640px);aspect-ratio:9/16;opacity:0;visibility:hidden;pointer-events:none;z-index:70;border:1px solid #c47b3d88;background:#000;box-shadow:0 12px 42px #000b}');
 html=html.replace('#circus-youtube iframe{display:block;width:100%;height:100%;border:0}', '#circus-youtube iframe{display:block;width:100%;height:100%;border:0;background:#000}@media(max-width:720px){#circus-youtube{left:12px;top:50%;width:min(42vw,260px);height:min(68vh,462px)}}');
 html=html.replace('<iframe src="https://www.youtube-nocookie.com/embed/24rx276VBk0?rel=0&playsinline=1" title="LUBIAK circus screen" allowfullscreen></iframe>', '<iframe data-src="https://www.youtube-nocookie.com/embed/24rx276VBk0?rel=0&playsinline=1" title="LUBIAK circus 9:16 screen" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
}
fs.writeFileSync(jsPath,js);fs.writeFileSync(htmlPath,html);console.log('Restored circus transition + 9:16 YT viewer.');
