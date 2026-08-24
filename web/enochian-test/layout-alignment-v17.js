(()=>{
const CSS=`
/* Cross-platform centre-stage alignment */
.deckarea{position:relative!important}
.deckarea>.wheelbox.eq,.deckarea>.wheelbox.fx{position:absolute!important;top:50%!important;transform:translateY(-50%)!important;z-index:12!important}
.deckarea>.wheelbox.eq{left:10px!important}.deckarea>.wheelbox.fx{right:10px!important}
.deckarea>.platter-wrap{position:absolute!important;left:50%!important;top:48%!important;transform:translate(-50%,-50%)!important}
.deckarea>.seek{position:absolute!important;left:18%!important;right:18%!important;bottom:4px!important;z-index:13!important}
.mod{align-items:center!important}.mod-main{min-width:0!important}.mod-head{display:flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;text-align:center!important}.mod textarea{display:block!important;margin-left:auto!important;margin-right:auto!important}.mod>.wheelbox{align-self:center!important;justify-self:center!important;text-align:center!important}
/* Expanded analyser is a true viewport overlay on Windows/desktop. */
.wave.analyser-expanded{left:6px!important;top:6px!important;width:calc(100vw - 12px)!important;height:calc(100dvh - 12px)!important;max-width:none!important;max-height:none!important;z-index:2147483000!important}
.wave.analyser-expanded .signals{height:clamp(86px,20vh,180px)!important}
@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
html.enoch-ios-landscape .ios-second-center{grid-template-rows:minmax(150px,42%) minmax(0,1fr)!important;overflow:hidden!important}
html.enoch-ios-landscape .ios-second-center>.mod{height:100%!important;min-height:0!important;grid-template-columns:minmax(0,1fr) 78px!important;align-items:center!important;padding:6px!important;overflow:hidden!important}
html.enoch-ios-landscape .ios-second-center .mod-main{height:100%!important;grid-template-rows:34px minmax(54px,1fr) 32px!important;align-content:center!important}
html.enoch-ios-landscape .ios-second-center .mod-head{height:34px!important;display:flex!important;justify-content:center!important;align-items:center!important;gap:8px!important}
html.enoch-ios-landscape .ios-second-center textarea{width:100%!important;height:100%!important;min-height:54px!important;max-height:none!important;margin:auto!important;font-size:6px!important}
html.enoch-ios-landscape .ios-second-center .mod>.wheelbox{display:grid!important;width:74px!important;height:100%!important;min-height:0!important;place-content:center!important;justify-items:center!important;overflow:visible!important}
html.enoch-ios-landscape .ios-second-center .mod>.wheelbox .wheel{display:block!important;width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;visibility:visible!important;opacity:1!important}
html.enoch-ios-landscape .ios-second-center>.pad-panel.instant-layout{grid-template-columns:minmax(0,1.15fr) 52px minmax(0,1fr)!important;grid-template-rows:48px minmax(0,1fr)!important;overflow:hidden!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{display:block!important;overflow:visible!important}.pad-mode{height:100%!important}.pad-mode .btn{min-height:20px!important;font-size:4.5px!important}
html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{display:block!important;min-height:118px!important;overflow:hidden!important}
html.enoch-ios-landscape .mixer-level{display:grid!important;width:52px!important;min-width:52px!important;height:100%!important;grid-template-rows:auto minmax(90px,1fr) auto!important;overflow:visible!important}
html.enoch-ios-landscape .mixer-level-range{display:block!important;visibility:visible!important;opacity:1!important;width:28px!important;height:100%!important;min-height:90px!important}
html.enoch-ios-landscape .mixer-level-value{display:flex!important;visibility:visible!important;opacity:1!important}
html.enoch-ios-landscape .instant-fx{display:grid!important;visibility:visible!important;opacity:1!important;overflow:hidden!important}.instant-fx-grid{grid-template-rows:repeat(3,minmax(52px,1fr))!important}.instant-fx-btn{display:block!important;min-height:52px!important}
html.enoch-ios-landscape .deckarea>.wheelbox.eq{left:12px!important}.deckarea>.wheelbox.fx{right:12px!important}.deckarea>.wheelbox{top:50%!important}.deckarea>.seek{left:20%!important;right:20%!important;bottom:5px!important}
}}
`;
function install(frame){try{const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument;if(!d||!d.head)return false;if(d.documentElement.dataset.layoutAlignmentV17)return true;d.documentElement.dataset.layoutAlignmentV17='1';const s=d.createElement('style');s.id='layoutAlignmentV17';s.textContent=CSS;d.head.appendChild(s);return true}catch(_){return false}}
window.installEnochianLayoutAlignmentV17=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();