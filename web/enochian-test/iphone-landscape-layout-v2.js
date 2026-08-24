(()=>{
  const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
    html.enoch-ios-landscape .stage{
      min-height:0!important;height:100%!important;overflow:hidden!important;
      grid-template-rows:56px minmax(126px,42%) 32px minmax(128px,1fr)!important;
      gap:3px!important;
    }
    html.enoch-ios-landscape .deckarea{
      position:relative!important;display:grid!important;
      grid-template-columns:74px minmax(128px,1fr) 74px!important;
      align-items:center!important;justify-items:center!important;
      min-height:0!important;height:100%!important;overflow:hidden!important;
      padding:0 0 18px!important;gap:4px!important;
    }
    html.enoch-ios-landscape .deckarea>.wheelbox.eq{grid-column:1!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.fx{grid-column:3!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.platter-wrap{
      position:absolute!important;left:50%!important;top:46%!important;right:auto!important;bottom:auto!important;
      transform:translate(-50%,-50%)!important;
      width:min(31vh,142px)!important;height:min(31vh,142px)!important;max-width:142px!important;max-height:142px!important;
      margin:0!important;z-index:5!important;align-self:auto!important;justify-self:auto!important;
    }
    html.enoch-ios-landscape .deckarea>.seek{
      position:absolute!important;left:20%!important;right:20%!important;bottom:1px!important;z-index:8!important;
    }
    html.enoch-ios-landscape .target-mod{
      min-height:0!important;height:32px!important;display:grid!important;
      grid-template-columns:minmax(0,1fr) 62px!important;align-items:center!important;
      padding:2px 3px!important;gap:3px!important;overflow:hidden!important;
    }
    html.enoch-ios-landscape .target-mod textarea{height:24px!important;min-height:24px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout{
      display:grid!important;height:100%!important;min-height:0!important;overflow:hidden!important;
      grid-template-columns:minmax(0,1.5fr) 38px minmax(86px,1fr) 60px!important;
      grid-template-rows:34px minmax(0,1fr)!important;gap:3px!important;padding:3px!important;
    }
    html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;min-height:0!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;min-height:0!important}
    html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;min-height:0!important;overflow:hidden!important}
    html.enoch-ios-landscape .instant-fx-grid{display:grid!important;grid-template-rows:repeat(3,minmax(0,1fr))!important;height:100%!important;min-height:0!important}
    html.enoch-ios-landscape .instant-fx-btn{min-height:0!important;height:100%!important;padding:1px!important}
    html.enoch-ios-landscape .mod-depth-box{grid-column:4!important;grid-row:1/3!important;min-height:0!important;overflow:hidden!important}
    html.enoch-ios-landscape .grid>aside:last-child{
      min-height:0!important;height:100%!important;overflow:hidden!important;
      grid-template-rows:auto repeat(5,minmax(30px,1fr)) 28px minmax(58px,1.25fr)!important;
      gap:2px!important;
    }
    html.enoch-ios-landscape #killfx{min-height:24px!important;padding:2px!important}
    html.enoch-ios-landscape .console{min-height:0!important;height:100%!important;overflow:hidden!important}
    html.enoch-ios-landscape .console-lines{height:100%!important;max-height:none!important;overflow:auto!important}
  }}`;
  function install(frame){
    try{
      const live=frame.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      if(!d||!d.head||!d.documentElement.classList.contains('enoch-ios-landscape')) return false;
      if(d.getElementById('iphoneLandscapeLayoutV2')) return true;
      const s=d.createElement('style');s.id='iphoneLandscapeLayoutV2';s.textContent=CSS;d.head.appendChild(s);
      try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){ }
      return true;
    }catch(_){return false}
  }
  window.installEnochianIphoneLandscapeV2=frame=>{let n=0;const t=setInterval(()=>{if(install(frame)||++n>200)clearInterval(t)},50)};
})();