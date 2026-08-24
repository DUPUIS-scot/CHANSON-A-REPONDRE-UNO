(()=>{
  const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
    html.enoch-ios-landscape,html.enoch-ios-landscape body{width:100%!important;height:auto!important;min-height:200dvh!important;overflow-x:hidden!important;overflow-y:auto!important;background:#000!important;scroll-behavior:smooth!important;-webkit-overflow-scrolling:touch!important}
    html.enoch-ios-landscape body{position:static!important}
    html.enoch-ios-landscape .app{box-sizing:border-box!important;width:100%!important;max-width:none!important;height:200dvh!important;min-height:200dvh!important;margin:0!important;padding:3px max(5px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left))!important;gap:3px!important;overflow:visible!important;grid-template-rows:32px minmax(0,calc(200dvh - 70px)) 32px!important}
    html.enoch-ios-landscape .grid{display:grid!important;height:100%!important;min-height:0!important;overflow:visible!important;grid-template-columns:minmax(175px,22%) minmax(0,1fr) minmax(190px,22%)!important;gap:3px!important;align-items:stretch!important}
    html.enoch-ios-landscape .side{box-sizing:border-box!important;height:100%!important;min-height:0!important;overflow:hidden!important;align-content:start!important}
    html.enoch-ios-landscape .stage{box-sizing:border-box!important;min-height:0!important;height:100%!important;overflow:hidden!important;grid-template-rows:82px calc(100dvh - 138px) 52px minmax(244px,1fr)!important;gap:3px!important}

    /* Restore the complete analyser/signal window on iPhone landscape. */
    html.enoch-ios-landscape .wave{position:relative!important;min-height:0!important;height:82px!important;overflow:hidden!important;padding:0!important}
    html.enoch-ios-landscape .wave h2{position:relative!important;z-index:4!important;margin:3px 2px 0!important;font-size:6px!important;line-height:1!important;letter-spacing:.2em!important;white-space:nowrap!important}
    html.enoch-ios-landscape .wave canvas{position:absolute!important;left:4px!important;right:4px!important;top:19px!important;width:calc(100% - 8px)!important;height:29px!important;bottom:auto!important;z-index:1!important;opacity:.72!important}
    html.enoch-ios-landscape .wave .signals{position:absolute!important;left:4px!important;right:4px!important;bottom:4px!important;height:50px!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:2px!important;z-index:3!important;pointer-events:none!important}
    html.enoch-ios-landscape .wave .sig{box-sizing:border-box!important;display:grid!important;grid-template-rows:auto auto 1fr!important;align-items:center!important;justify-items:center!important;min-width:0!important;height:50px!important;padding:2px 1px!important;overflow:hidden!important;background:#020807c8!important;border:1px solid #1a3c35!important}
    html.enoch-ios-landscape .wave .sig span{font-size:4.8px!important;line-height:1!important}
    html.enoch-ios-landscape .wave .sig b{font-size:6.2px!important;line-height:1!important;white-space:nowrap!important}
    html.enoch-ios-landscape .wave .sig img{width:24px!important;height:24px!important;max-width:24px!important;max-height:24px!important;object-fit:contain!important}

    html.enoch-ios-landscape .deckarea{position:relative!important;display:grid!important;grid-template-columns:58px minmax(0,1fr) 58px!important;grid-template-rows:minmax(0,1fr)!important;align-items:center!important;justify-items:center!important;min-height:0!important;height:100%!important;overflow:hidden!important;padding:0 8px 30px!important;column-gap:6px!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.eq{grid-column:1!important;grid-row:1!important;justify-self:start!important;align-self:end!important;transform:translate(2px,-8px)!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.fx{grid-column:3!important;grid-row:1!important;justify-self:end!important;align-self:end!important;transform:translate(-2px,-8px)!important}
    html.enoch-ios-landscape .deckarea>.wheelbox{width:58px!important;max-width:58px!important;overflow:visible!important;padding:1px!important;gap:1px!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel{width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel-label{font-size:4.5px!important;line-height:1!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel-value{font-size:5px!important;line-height:1!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel-hint{display:none!important}
    html.enoch-ios-landscape .deckarea>.platter-wrap{position:relative!important;grid-column:2!important;grid-row:1!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;transform:translateY(-4px)!important;width:min(40vh,168px)!important;height:min(40vh,168px)!important;max-width:168px!important;max-height:168px!important;margin:0!important;z-index:6!important;align-self:center!important;justify-self:center!important}
    html.enoch-ios-landscape .deckarea>.platter-wrap .platter{width:100%!important;height:100%!important}
    html.enoch-ios-landscape .deckarea>.seek{position:absolute!important;left:18%!important;right:18%!important;bottom:2px!important;z-index:9!important;gap:3px!important}

    html.enoch-ios-landscape .target-mod{box-sizing:border-box!important;min-height:0!important;height:52px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 66px!important;align-items:center!important;padding:3px 4px!important;gap:4px!important;overflow:hidden!important}
    html.enoch-ios-landscape .target-mod .mod-main{display:grid!important;grid-template-columns:92px minmax(0,1fr)!important;grid-template-rows:1fr!important;align-items:center!important;gap:4px!important;min-width:0!important;height:100%!important}
    html.enoch-ios-landscape .target-mod .mod-head{grid-column:1!important;grid-row:1!important;display:flex!important;align-items:center!important;min-width:0!important;height:100%!important;overflow:hidden!important}
    html.enoch-ios-landscape .target-mod .mod-head>*:not(.label){display:none!important}
    html.enoch-ios-landscape .target-mod .mod-head .label{display:block!important;font-size:5.5px!important;line-height:1.05!important;letter-spacing:.12em!important;white-space:normal!important}
    html.enoch-ios-landscape .target-mod textarea{display:block!important;visibility:visible!important;opacity:1!important;grid-column:2!important;grid-row:1!important;box-sizing:border-box!important;width:100%!important;height:38px!important;min-height:38px!important;max-height:38px!important;margin:0!important;padding:4px 6px!important;font-size:6.2px!important;line-height:1.15!important;resize:none!important;overflow:auto!important;background:#010403!important;color:#d7fff8!important;border:1px solid #315b56!important}
    html.enoch-ios-landscape .target-mod>.wheelbox{display:none!important}

    html.enoch-ios-landscape .pad-panel.instant-layout{box-sizing:border-box!important;display:grid!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;grid-template-columns:minmax(0,1.15fr) 42px minmax(0,1.15fr) 56px!important;grid-template-rows:34px minmax(0,1fr)!important;gap:3px!important;padding:3px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>*{box-sizing:border-box!important;min-width:0!important;max-width:100%!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-mode{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:2px!important}
    html.enoch-ios-landscape .pad-mode .btn{min-width:0!important;min-height:15px!important;padding:1px!important;font-size:3.9px!important;line-height:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;width:100%!important;min-width:0!important;min-height:132px!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;padding:2px 1px!important;gap:2px!important;overflow:hidden!important}
    html.enoch-ios-landscape .mixer-level-title{font-size:4.4px!important}
    html.enoch-ios-landscape .mixer-level-range{min-height:80px!important;width:22px!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level-value{min-width:28px!important;min-height:17px!important;padding:1px!important;font-size:6px!important}
    html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;padding:1px!important;gap:2px!important}
    html.enoch-ios-landscape .instant-fx-title{font-size:5px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important}
    html.enoch-ios-landscape .instant-fx-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:repeat(3,minmax(40px,1fr))!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;gap:2px!important}
    html.enoch-ios-landscape .instant-fx-btn{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:40px!important;height:100%!important;padding:2px!important;overflow:hidden!important}
    html.enoch-ios-landscape .instant-fx-btn span{font-size:6.8px!important}
    html.enoch-ios-landscape .instant-fx-btn small{font-size:4px!important;margin-top:1px!important}
    html.enoch-ios-landscape .mod-depth-box{grid-column:4!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;padding:2px!important;gap:1px!important}
    html.enoch-ios-landscape .mod-depth-box .wheel{width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important}
    html.enoch-ios-landscape .mod-depth-box .wheel-value,html.enoch-ios-landscape .mod-depth-box .wheel-hint{font-size:4px!important;line-height:1!important}

    html.enoch-ios-landscape .grid>aside:last-child{min-height:0!important;height:100%!important;overflow:hidden!important;grid-template-rows:auto repeat(5,58px) 36px minmax(190px,1fr)!important;gap:3px!important;align-content:start!important}
    html.enoch-ios-landscape .grid>aside:last-child .fxbox{min-height:0!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .grid>aside:last-child .range{height:14px!important}
    html.enoch-ios-landscape #killfx{min-height:32px!important;height:32px!important;padding:3px!important;font-size:6px!important}
    html.enoch-ios-landscape .console{min-height:190px!important;height:auto!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .console-lines{height:100%!important;max-height:none!important;overflow:auto!important;font-size:4.8px!important;line-height:1.18!important;white-space:pre-wrap!important;word-break:break-word!important}
    html.enoch-ios-landscape .console-lines div{white-space:pre-wrap!important;overflow:visible!important;text-overflow:clip!important}
    html.enoch-ios-landscape .target-footer{height:32px!important;min-height:32px!important}

    html.enoch-ios-landscape .terminal-actions{position:relative!important;z-index:50!important}
    html.enoch-ios-landscape .ios-fullscreen{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;width:30px!important;min-width:30px!important;height:25px!important;padding:0!important;font-size:13px!important;line-height:1!important}
  }}`;
  function install(frame){try{const live=frame.contentDocument;const deck=live&&live.getElementById('deck');const d=deck&&deck.contentDocument;if(!d||!d.head||!d.documentElement.classList.contains('enoch-ios-landscape'))return false;['iphoneLandscapeLayoutV2','iphoneLandscapeLayoutV3','iphoneLandscapeLayoutV4','iphoneLandscapeLayoutV5','iphoneLandscapeLayoutV6','iphoneLandscapeLayoutV7','iphoneLandscapeLayoutV8','iphoneLandscapeLayoutV9','iphoneLandscapeLayoutV10'].forEach(id=>d.getElementById(id)?.remove());const s=d.createElement('style');s.id='iphoneLandscapeLayoutV11';s.textContent=CSS;d.head.appendChild(s);d.documentElement.style.scrollSnapType='y proximity';try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){}return true}catch(_){return false}}
  window.installEnochianIphoneLandscapeV2=frame=>{let n=0;const t=setInterval(()=>{if(install(frame)||++n>200)clearInterval(t)},50)};
})();