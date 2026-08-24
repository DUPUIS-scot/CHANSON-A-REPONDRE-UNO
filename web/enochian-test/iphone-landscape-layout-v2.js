(()=>{
  const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
    html.enoch-ios-landscape,html.enoch-ios-landscape body{
      width:100%!important;height:auto!important;min-height:200dvh!important;
      overflow-x:hidden!important;overflow-y:auto!important;background:#000!important;
      scroll-behavior:smooth!important;-webkit-overflow-scrolling:touch!important;
    }
    html.enoch-ios-landscape body{position:static!important}
    html.enoch-ios-landscape .app{
      box-sizing:border-box!important;width:100%!important;max-width:none!important;
      height:200dvh!important;min-height:200dvh!important;margin:0!important;
      padding:3px max(5px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left))!important;
      gap:3px!important;overflow:visible!important;
      grid-template-rows:32px minmax(0,calc(200dvh - 70px)) 32px!important;
    }
    html.enoch-ios-landscape .grid{
      display:grid!important;height:100%!important;min-height:0!important;overflow:visible!important;
      grid-template-columns:minmax(175px,22%) minmax(0,1fr) minmax(190px,22%)!important;
      gap:3px!important;align-items:stretch!important;
    }
    html.enoch-ios-landscape .side{
      box-sizing:border-box!important;height:100%!important;min-height:0!important;overflow:hidden!important;
      align-content:start!important;
    }

    /* SCREEN 1: analyser + EQ / platter / FX. Lower controls begin at the fold. */
    html.enoch-ios-landscape .stage{
      box-sizing:border-box!important;min-height:0!important;height:100%!important;overflow:hidden!important;
      grid-template-rows:64px calc(100dvh - 104px) 44px minmax(300px,1fr)!important;
      gap:3px!important;
    }
    html.enoch-ios-landscape .wave{min-height:0!important;overflow:hidden!important}
    html.enoch-ios-landscape .deckarea{
      position:relative!important;display:grid!important;
      grid-template-columns:82px minmax(155px,1fr) 82px!important;
      align-items:center!important;justify-items:center!important;
      min-height:0!important;height:100%!important;overflow:hidden!important;
      padding:0 0 24px!important;gap:6px!important;
    }
    html.enoch-ios-landscape .deckarea>.wheelbox.eq{grid-column:1!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.fx{grid-column:3!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel{
      width:68px!important;height:68px!important;min-width:68px!important;min-height:68px!important;
    }
    html.enoch-ios-landscape .deckarea>.platter-wrap{
      position:absolute!important;left:50%!important;top:44%!important;right:auto!important;bottom:auto!important;
      transform:translate(-50%,-50%)!important;
      width:min(40vh,172px)!important;height:min(40vh,172px)!important;max-width:172px!important;max-height:172px!important;
      margin:0!important;z-index:6!important;align-self:auto!important;justify-self:auto!important;
    }
    html.enoch-ios-landscape .deckarea>.seek{
      position:absolute!important;left:18%!important;right:18%!important;bottom:2px!important;z-index:9!important;
    }

    /* SCREEN 2: text modulator + pad FX + mix + instant FX + mod depth. */
    html.enoch-ios-landscape .target-mod{
      min-height:0!important;height:44px!important;display:grid!important;
      grid-template-columns:minmax(0,1fr) 74px!important;align-items:center!important;
      padding:3px 4px!important;gap:4px!important;overflow:hidden!important;
    }
    html.enoch-ios-landscape .target-mod textarea{
      height:29px!important;min-height:29px!important;padding:4px 6px!important;font-size:7px!important;
    }
    html.enoch-ios-landscape .pad-panel.instant-layout{
      display:grid!important;height:100%!important;min-height:0!important;overflow:hidden!important;
      grid-template-columns:minmax(0,1.5fr) 46px minmax(105px,1fr) 74px!important;
      grid-template-rows:44px minmax(0,1fr)!important;gap:4px!important;padding:4px!important;
    }
    html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-mode{gap:3px!important}
    html.enoch-ios-landscape .pad-mode .btn{min-height:19px!important;padding:2px!important;font-size:5px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;min-height:180px!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;min-height:0!important;padding:3px 1px!important;gap:3px!important}
    html.enoch-ios-landscape .mixer-level-range{min-height:120px!important;width:26px!important}
    html.enoch-ios-landscape .mixer-level-value{min-width:34px!important;min-height:20px!important;padding:2px!important;font-size:7px!important}
    html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;min-height:0!important;overflow:hidden!important;padding:2px!important;gap:4px!important}
    html.enoch-ios-landscape .instant-fx-title{font-size:6px!important;line-height:1!important}
    html.enoch-ios-landscape .instant-fx-grid{display:grid!important;grid-template-rows:repeat(3,minmax(64px,1fr))!important;height:100%!important;min-height:0!important;gap:4px!important}
    html.enoch-ios-landscape .instant-fx-btn{min-height:64px!important;height:100%!important;padding:4px!important}
    html.enoch-ios-landscape .instant-fx-btn span{font-size:8px!important}
    html.enoch-ios-landscape .instant-fx-btn small{font-size:5px!important;margin-top:2px!important}
    html.enoch-ios-landscape .mod-depth-box{grid-column:4!important;grid-row:1/3!important;min-height:0!important;overflow:hidden!important;padding:3px!important}
    html.enoch-ios-landscape .mod-depth-box .wheel{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important}

    /* Keep the right rack readable on screen 1, with KILL FX + LOG CONSOLE continuing into screen 2. */
    html.enoch-ios-landscape .grid>aside:last-child{
      min-height:0!important;height:100%!important;overflow:hidden!important;
      grid-template-rows:auto repeat(5,62px) 38px minmax(220px,1fr)!important;
      gap:3px!important;align-content:start!important;
    }
    html.enoch-ios-landscape .grid>aside:last-child .fxbox{min-height:0!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .grid>aside:last-child .range{height:15px!important}
    html.enoch-ios-landscape #killfx{min-height:34px!important;height:34px!important;padding:3px!important;font-size:6.5px!important}
    html.enoch-ios-landscape .console{min-height:220px!important;height:auto!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .console-lines{height:100%!important;max-height:none!important;overflow:auto!important;font-size:5px!important;line-height:1.25!important}

    /* Footer sits at the bottom of screen 2. */
    html.enoch-ios-landscape .target-footer{height:32px!important;min-height:32px!important}
  }}`;
  function install(frame){
    try{
      const live=frame.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      if(!d||!d.head||!d.documentElement.classList.contains('enoch-ios-landscape')) return false;
      ['iphoneLandscapeLayoutV2','iphoneLandscapeLayoutV3','iphoneLandscapeLayoutV4'].forEach(id=>d.getElementById(id)?.remove());
      const s=d.createElement('style');s.id='iphoneLandscapeLayoutV5';s.textContent=CSS;d.head.appendChild(s);
      d.documentElement.style.scrollSnapType='y proximity';
      try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){ }
      return true;
    }catch(_){return false}
  }
  window.installEnochianIphoneLandscapeV2=frame=>{let n=0;const t=setInterval(()=>{if(install(frame)||++n>200)clearInterval(t)},50)};
})();