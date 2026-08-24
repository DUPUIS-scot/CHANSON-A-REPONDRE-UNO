(()=>{
const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
/* V14 target: expanded analyser, clean symmetric wheels, wider MOD controls, 45/15/40 lower FX layout. */
html.enoch-ios-landscape .grid{grid-template-columns:minmax(190px,24%) minmax(0,1fr) minmax(190px,22%)!important}
html.enoch-ios-landscape .stage{grid-template-rows:160px calc(100dvh - 196px) minmax(300px,1fr)!important}
html.enoch-ios-landscape .wave{height:160px!important;min-height:160px!important;padding:0!important;overflow:hidden!important}
html.enoch-ios-landscape .wave h2{margin:5px 2px 0!important;font-size:6.8px!important}
html.enoch-ios-landscape .wave canvas{left:5px!important;right:5px!important;top:20px!important;width:calc(100% - 10px)!important;height:55px!important;opacity:.82!important}
html.enoch-ios-landscape .wave .signals{left:4px!important;right:4px!important;bottom:4px!important;height:82px!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:2px!important}
html.enoch-ios-landscape .wave .sig{height:82px!important;grid-template-rows:auto auto 1fr auto auto!important;padding:3px 2px!important;overflow:hidden!important;background:#020807d9!important}
html.enoch-ios-landscape .wave .sig span{font-size:5.4px!important}html.enoch-ios-landscape .wave .sig b{font-size:7px!important}html.enoch-ios-landscape .wave .sig img{width:39px!important;height:39px!important;max-width:70%!important;object-fit:contain!important}
html.enoch-ios-landscape .wave .sig::after{content:'8-BIT';display:block;font-size:4.6px;line-height:1;color:#74d9cc;letter-spacing:.12em}
html.enoch-ios-landscape .deckarea>.platter-wrap{top:48%!important;width:min(39vh,164px)!important;height:min(39vh,164px)!important;max-width:164px!important;max-height:164px!important}
html.enoch-ios-landscape .deckarea>.wheelbox{bottom:25px!important;width:52px!important;max-width:52px!important;padding:0!important;gap:1px!important;background:transparent!important;border:0!important;box-shadow:none!important;outline:0!important;overflow:visible!important}
html.enoch-ios-landscape .deckarea>.wheelbox.eq{left:7px!important}html.enoch-ios-landscape .deckarea>.wheelbox.fx{right:7px!important}
html.enoch-ios-landscape .deckarea>.wheelbox .wheel{box-sizing:border-box!important;width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;border-radius:50%!important;overflow:hidden!important;clip-path:circle(50% at 50% 50%)!important}
html.enoch-ios-landscape .deckarea>.wheelbox .wheel::before,html.enoch-ios-landscape .deckarea>.wheelbox .wheel::after{max-width:100%!important;max-height:100%!important}
html.enoch-ios-landscape .deckarea>.wheelbox .wheel-label{font-size:4.4px!important}html.enoch-ios-landscape .deckarea>.wheelbox .wheel-value{font-size:4.8px!important}
html.enoch-ios-landscape .ios-mod-cluster{grid-template-columns:minmax(0,1fr) 52px!important;height:154px!important;min-height:154px!important;padding:3px!important;gap:3px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster .target-mod{height:146px!important;min-height:146px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-main{grid-template-rows:34px 78px 28px!important;height:140px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-head{height:34px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster textarea{height:78px!important;min-height:78px!important;max-height:78px!important;font-size:5.8px!important;touch-action:manipulation!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-glyphs,html.enoch-ios-landscape .ios-mod-cluster .mod-state{display:flex!important;min-height:24px!important;max-height:28px!important;gap:2px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-glyphs .btn,html.enoch-ios-landscape .ios-mod-cluster .mod-state .btn,html.enoch-ios-landscape .ios-mod-cluster button{min-height:24px!important;padding:2px 3px!important;font-size:4.5px!important;touch-action:manipulation!important}
html.enoch-ios-landscape .ios-mod-cluster>.mod-depth-box{width:52px!important;min-width:52px!important;height:146px!important;min-height:146px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster>.mod-depth-box .wheel{width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;border-radius:50%!important;overflow:hidden!important;clip-path:circle(50% at 50% 50%)!important}
html.enoch-ios-landscape .pad-panel.instant-layout{grid-template-columns:minmax(0,45fr) minmax(52px,15fr) minmax(0,40fr)!important;grid-template-rows:38px minmax(0,1fr)!important;gap:4px!important;padding:4px!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;width:min(100%,260px)!important;height:auto!important;min-height:0!important;max-height:100%!important;aspect-ratio:1/1!important;justify-self:center!important;align-self:start!important;touch-action:none!important}
html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;width:100%!important;min-width:52px!important}
html.enoch-ios-landscape .mixer-level-range{width:24px!important;min-height:110px!important}
html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;width:100%!important;padding:1px!important;gap:3px!important}
html.enoch-ios-landscape .instant-fx-grid{grid-template-rows:repeat(3,minmax(44px,1fr))!important;gap:3px!important}
html.enoch-ios-landscape .instant-fx-btn{min-height:44px!important;padding:2px!important}html.enoch-ios-landscape .instant-fx-btn span{font-size:6.7px!important}html.enoch-ios-landscape .instant-fx-btn small{font-size:4px!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.mod-depth-box{display:none!important}
}}`;
function install(frame){try{const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument;if(!d||!d.head||!d.documentElement.classList.contains('enoch-ios-landscape'))return false;if(d.documentElement.dataset.iphoneLandscapeTarget==='v14')return true;d.documentElement.dataset.iphoneLandscapeTarget='v14';d.getElementById('iphoneLandscapeLayoutV14')?.remove();const s=d.createElement('style');s.id='iphoneLandscapeLayoutV14';s.textContent=CSS;d.head.appendChild(s);try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){}return true}catch(_){return false}}
window.installEnochianIphoneLandscapeV14=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();