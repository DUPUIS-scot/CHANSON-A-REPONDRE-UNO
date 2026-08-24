(()=>{
  const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
    html.enoch-ios-landscape,html.enoch-ios-landscape body{width:100%!important;height:auto!important;min-height:200dvh!important;overflow-x:hidden!important;overflow-y:auto!important;background:#000!important;scroll-behavior:smooth!important;-webkit-overflow-scrolling:touch!important}
    html.enoch-ios-landscape body{position:static!important}
    html.enoch-ios-landscape .app{box-sizing:border-box!important;width:100%!important;max-width:none!important;height:200dvh!important;min-height:200dvh!important;margin:0!important;padding:3px max(5px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left))!important;gap:3px!important;overflow:visible!important;grid-template-rows:32px minmax(0,calc(200dvh - 70px)) 32px!important}
    html.enoch-ios-landscape .grid{display:grid!important;height:100%!important;min-height:0!important;overflow:visible!important;grid-template-columns:minmax(175px,22%) minmax(0,1fr) minmax(190px,22%)!important;gap:3px!important;align-items:stretch!important}
    html.enoch-ios-landscape .side{box-sizing:border-box!important;height:100%!important;min-height:0!important;overflow:hidden!important;align-content:start!important}

    /* SCREEN 1 — analyser, EQ wheel, centred platter, FX wheel. */
    html.enoch-ios-landscape .stage{box-sizing:border-box!important;min-height:0!important;height:100%!important;overflow:hidden!important;grid-template-rows:60px calc(100dvh - 100px) 44px minmax(300px,1fr)!important;gap:3px!important}
    html.enoch-ios-landscape .wave{min-height:0!important;overflow:hidden!important}
    html.enoch-ios-landscape .deckarea{position:relative!important;display:grid!important;grid-template-columns:minmax(72px,1fr) minmax(176px,1.7fr) minmax(72px,1fr)!important;grid-template-rows:minmax(0,1fr)!important;align-items:center!important;justify-items:center!important;min-height:0!important;height:100%!important;overflow:hidden!important;padding:0 2px 25px!important;gap:4px!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.eq{grid-column:1!important;grid-row:1!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.fx{grid-column:3!important;grid-row:1!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel{width:70px!important;height:70px!important;min-width:70px!important;min-height:70px!important}
    html.enoch-ios-landscape .deckarea>.platter-wrap{position:relative!important;grid-column:2!important;grid-row:1!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;transform:translateY(-8px)!important;width:min(43vh,180px)!important;height:min(43vh,180px)!important;max-width:180px!important;max-height:180px!important;margin:0!important;z-index:6!important;align-self:center!important;justify-self:center!important}
    html.enoch-ios-landscape .deckarea>.platter-wrap .platter{width:100%!important;height:100%!important}
    html.enoch-ios-landscape .deckarea>.seek{position:absolute!important;left:17%!important;right:17%!important;bottom:2px!important;z-index:9!important}

    /* SCREEN 2 — FX pad and Instant FX have equal visual weight, mix in between. */
    html.enoch-ios-landscape .target-mod{min-height:0!important;height:44px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 74px!important;align-items:center!important;padding:3px 4px!important;gap:4px!important;overflow:hidden!important}
    html.enoch-ios-landscape .target-mod textarea{height:29px!important;min-height:29px!important;padding:4px 6px!important;font-size:7px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout{box-sizing:border-box!important;display:grid!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;grid-template-columns:minmax(0,1fr) 42px minmax(0,1fr) 64px!important;grid-template-rows:44px minmax(0,1fr)!important;gap:4px!important;padding:4px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>*{box-sizing:border-box!important;min-width:0!important;max-width:100%!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-mode{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:3px!important}
    html.enoch-ios-landscape .pad-mode .btn{min-width:0!important;min-height:19px!important;padding:2px 1px!important;font-size:4.7px!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;width:100%!important;min-width:0!important;min-height:180px!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;padding:3px 1px!important;gap:3px!important;overflow:hidden!important}
    html.enoch-ios-landscape .mixer-level-range{min-height:120px!important;width:24px!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level-value{min-width:32px!important;min-height:20px!important;padding:2px!important;font-size:7px!important}
    html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;padding:2px!important;gap:4px!important}
    html.enoch-ios-landscape .instant-fx-title{font-size:6px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important}
    html.enoch-ios-landscape .instant-fx-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:repeat(3,minmax(64px,1fr))!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;gap:4px!important}
    html.enoch-ios-landscape .instant-fx-btn{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:64px!important;height:100%!important;padding:4px 2px!important;overflow:hidden!important}
    html.enoch-ios-landscape .instant-fx-btn span{font-size:8px!important}
    html.enoch-ios-landscape .instant-fx-btn small{font-size:5px!important;margin-top:2px!important}
    html.enoch-ios-landscape .mod-depth-box{grid-column:4!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;padding:2px!important}
    html.enoch-ios-landscape .mod-depth-box .wheel{width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important}

    html.enoch-ios-landscape .grid>aside:last-child{min-height:0!important;height:100%!important;overflow:hidden!important;grid-template-rows:auto repeat(5,62px) 38px minmax(220px,1fr)!important;gap:3px!important;align-content:start!important}
    html.enoch-ios-landscape .grid>aside:last-child .fxbox{min-height:0!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .grid>aside:last-child .range{height:15px!important}
    html.enoch-ios-landscape #killfx{min-height:34px!important;height:34px!important;padding:3px!important;font-size:6.5px!important}
    html.enoch-ios-landscape .console{min-height:220px!important;height:auto!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .console-lines{height:100%!important;max-height:none!important;overflow:auto!important;font-size:5px!important;line-height:1.25!important}
    html.enoch-ios-landscape .target-footer{height:32px!important;min-height:32px!important}

    /* Fullscreen/exit control remains visible while either viewport is scrolled. */
    html.enoch-ios-landscape .terminal-actions{position:relative!important;z-index:50!important}
    html.enoch-ios-landscape .ios-fullscreen{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;width:30px!important;min-width:30px!important;height:25px!important;padding:0!important;font-size:13px!important;line-height:1!important}
  }}`;
  function install(frame){try{const live=frame.contentDocument;const deck=live&&live.getElementById('deck');const d=deck&&deck.contentDocument;if(!d||!d.head||!d.documentElement.classList.contains('enoch-ios-landscape'))return false;['iphoneLandscapeLayoutV2','iphoneLandscapeLayoutV3','iphoneLandscapeLayoutV4','iphoneLandscapeLayoutV5','iphoneLandscapeLayoutV6'].forEach(id=>d.getElementById(id)?.remove());const s=d.createElement('style');s.id='iphoneLandscapeLayoutV7';s.textContent=CSS;d.head.appendChild(s);d.documentElement.style.scrollSnapType='y proximity';try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){}return true}catch(_){return false}}
  window.installEnochianIphoneLandscapeV2=frame=>{let n=0;const t=setInterval(()=>{if(install(frame)||++n>200)clearInterval(t)},50)};
})();