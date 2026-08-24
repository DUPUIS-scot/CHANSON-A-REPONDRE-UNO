(()=>{
const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
/* Give the left control rail enough room for a usable MOD editor. */
html.enoch-ios-landscape .grid{grid-template-columns:minmax(235px,29%) minmax(0,1fr) minmax(190px,22%)!important}

/* MOD: one coherent panel; text editor gets the space, depth wheel stays in its own rail. */
html.enoch-ios-landscape .ios-mod-cluster{display:grid!important;grid-template-columns:minmax(0,1fr) 76px!important;grid-template-rows:minmax(0,1fr)!important;width:100%!important;height:184px!important;min-height:184px!important;padding:5px!important;gap:5px!important;overflow:hidden!important}
html.enoch-ios-landscape .ios-mod-cluster .target-mod{display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;width:100%!important;height:172px!important;min-height:172px!important;padding:3px!important;overflow:hidden!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-main{display:grid!important;grid-template-rows:42px minmax(86px,1fr)!important;width:100%!important;height:100%!important;min-height:0!important;gap:4px!important;overflow:hidden!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-head{display:grid!important;grid-template-columns:minmax(0,1fr) 58px!important;align-items:center!important;height:42px!important;min-height:42px!important;gap:5px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-head .label{font-size:6.4px!important;line-height:1.15!important;white-space:normal!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster textarea{box-sizing:border-box!important;display:block!important;width:100%!important;height:112px!important;min-height:112px!important;max-height:112px!important;margin:0!important;padding:7px!important;font-size:7px!important;line-height:1.25!important;resize:none!important;overflow:auto!important}
html.enoch-ios-landscape .ios-mod-cluster .btn{min-height:30px!important;min-width:44px!important;padding:4px!important;font-size:5.8px!important;touch-action:manipulation!important}
html.enoch-ios-landscape .ios-mod-cluster .mod-glyphs,html.enoch-ios-landscape .ios-mod-cluster .mod-state{display:flex!important;min-height:30px!important;gap:3px!important;overflow:visible!important}
html.enoch-ios-landscape .ios-mod-cluster>.mod-depth-box{display:grid!important;width:76px!important;min-width:76px!important;height:172px!important;min-height:172px!important;padding:4px!important;align-content:center!important;justify-items:center!important;gap:4px!important;overflow:visible!important;background:#020706!important}
html.enoch-ios-landscape .ios-mod-cluster>.mod-depth-box .wheel{width:66px!important;height:66px!important;min-width:66px!important;min-height:66px!important}
html.enoch-ios-landscape .ios-mod-cluster>.mod-depth-box .wheel-label{font-size:5.2px!important}
html.enoch-ios-landscape .ios-mod-cluster>.mod-depth-box .wheel-value,html.enoch-ios-landscape .ios-mod-cluster>.mod-depth-box .wheel-hint{font-size:4.8px!important;line-height:1.1!important;text-align:center!important}

/* Lower FX: dedicate roughly two thirds of usable width to the pad, then MIX, then compact Instant FX. */
html.enoch-ios-landscape .pad-panel.instant-layout{display:grid!important;grid-template-columns:minmax(0,2fr) 42px minmax(82px,1fr)!important;grid-template-rows:44px minmax(0,1fr)!important;gap:4px!important;padding:4px!important;overflow:hidden!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;width:100%!important;overflow:visible!important}
html.enoch-ios-landscape .pad-mode{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:3px!important}
html.enoch-ios-landscape .pad-mode .btn{min-height:20px!important;font-size:4.8px!important;padding:2px!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;justify-self:center!important;align-self:start!important;width:min(100%,260px)!important;height:auto!important;min-height:0!important;aspect-ratio:1/1!important;max-height:260px!important;touch-action:none!important}
html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;width:42px!important;min-width:42px!important;height:100%!important}
html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;width:100%!important;height:100%!important;min-width:0!important}
html.enoch-ios-landscape .instant-fx-grid{display:grid!important;grid-template-rows:repeat(3,minmax(46px,1fr))!important;height:100%!important;gap:4px!important}
html.enoch-ios-landscape .instant-fx-btn{min-height:46px!important;padding:3px!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.mod-depth-box{display:none!important}
}}`;
function install(frame){try{const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument;if(!d||!d.head)return false;if(d.getElementById('iphoneLandscapeModFxRepair'))return true;const s=d.createElement('style');s.id='iphoneLandscapeModFxRepair';s.textContent=CSS;d.head.appendChild(s);try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){}return true}catch(_){return false}}
window.installEnochianModFxRepair=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();