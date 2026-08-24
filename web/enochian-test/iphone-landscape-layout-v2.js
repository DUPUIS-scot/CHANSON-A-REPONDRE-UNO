(()=>{
  const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
    html.enoch-ios-landscape .stage{
      min-height:0!important;height:100%!important;overflow:hidden!important;
      grid-template-rows:48px minmax(0,1.08fr) 28px minmax(0,.92fr)!important;
      gap:2px!important;
    }
    html.enoch-ios-landscape .deckarea{
      position:relative!important;display:grid!important;
      grid-template-columns:70px minmax(112px,1fr) 70px!important;
      align-items:center!important;justify-items:center!important;
      min-height:0!important;height:100%!important;overflow:hidden!important;
      padding:0 0 16px!important;gap:3px!important;
    }
    html.enoch-ios-landscape .deckarea>.wheelbox.eq{grid-column:1!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.fx{grid-column:3!important;justify-self:center!important;align-self:center!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel{
      width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;
    }
    html.enoch-ios-landscape .deckarea>.platter-wrap{
      position:absolute!important;left:50%!important;top:48%!important;right:auto!important;bottom:auto!important;
      transform:translate(-50%,-50%)!important;
      width:min(27vh,112px)!important;height:min(27vh,112px)!important;max-width:112px!important;max-height:112px!important;
      margin:0!important;z-index:6!important;align-self:auto!important;justify-self:auto!important;
    }
    html.enoch-ios-landscape .deckarea>.seek{
      position:absolute!important;left:18%!important;right:18%!important;bottom:0!important;z-index:9!important;
    }
    html.enoch-ios-landscape .target-mod{
      min-height:0!important;height:28px!important;display:grid!important;
      grid-template-columns:minmax(0,1fr) 58px!important;align-items:center!important;
      padding:1px 3px!important;gap:2px!important;overflow:hidden!important;
    }
    html.enoch-ios-landscape .target-mod textarea{height:21px!important;min-height:21px!important;padding:2px 4px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout{
      display:grid!important;height:100%!important;min-height:0!important;overflow:hidden!important;
      grid-template-columns:minmax(0,1.45fr) 34px minmax(80px,1fr) 56px!important;
      grid-template-rows:30px minmax(0,1fr)!important;gap:2px!important;padding:2px!important;
    }
    html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-mode{gap:1px!important}
    html.enoch-ios-landscape .pad-mode .btn{min-height:14px!important;padding:1px!important;font-size:3.9px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;min-height:0!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;min-height:0!important;padding:1px!important;gap:1px!important}
    html.enoch-ios-landscape .mixer-level-range{min-height:34px!important;width:20px!important}
    html.enoch-ios-landscape .mixer-level-value{min-width:27px!important;min-height:15px!important;padding:1px!important;font-size:6px!important}
    html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;min-height:0!important;overflow:hidden!important;padding:1px!important;gap:1px!important}
    html.enoch-ios-landscape .instant-fx-title{font-size:4.5px!important;line-height:1!important}
    html.enoch-ios-landscape .instant-fx-grid{display:grid!important;grid-template-rows:repeat(3,minmax(0,1fr))!important;height:100%!important;min-height:0!important;gap:1px!important}
    html.enoch-ios-landscape .instant-fx-btn{min-height:0!important;height:100%!important;padding:1px!important}
    html.enoch-ios-landscape .instant-fx-btn span{font-size:6px!important}
    html.enoch-ios-landscape .instant-fx-btn small{font-size:4px!important;margin-top:0!important}
    html.enoch-ios-landscape .mod-depth-box{grid-column:4!important;grid-row:1/3!important;min-height:0!important;overflow:hidden!important;padding:1px!important}
    html.enoch-ios-landscape .mod-depth-box .wheel{width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important}
    html.enoch-ios-landscape .grid>aside:last-child{
      min-height:0!important;height:100%!important;overflow:hidden!important;
      grid-template-rows:auto repeat(5,minmax(0,1fr)) 24px minmax(44px,1.15fr)!important;
      gap:1px!important;
    }
    html.enoch-ios-landscape .grid>aside:last-child .fxbox{min-height:0!important;overflow:hidden!important;padding:2px!important;gap:1px!important}
    html.enoch-ios-landscape .grid>aside:last-child .range{height:11px!important}
    html.enoch-ios-landscape #killfx{min-height:22px!important;height:22px!important;padding:1px!important;font-size:5.5px!important}
    html.enoch-ios-landscape .console{min-height:0!important;height:100%!important;overflow:hidden!important;padding:2px!important;gap:1px!important}
    html.enoch-ios-landscape .console-lines{height:100%!important;max-height:none!important;overflow:auto!important;font-size:4px!important;line-height:1.15!important}
  }}`;
  function install(frame){
    try{
      const live=frame.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      if(!d||!d.head||!d.documentElement.classList.contains('enoch-ios-landscape')) return false;
      const old=d.getElementById('iphoneLandscapeLayoutV2');if(old)old.remove();
      if(d.getElementById('iphoneLandscapeLayoutV3')) return true;
      const s=d.createElement('style');s.id='iphoneLandscapeLayoutV3';s.textContent=CSS;d.head.appendChild(s);
      try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){ }
      return true;
    }catch(_){return false}
  }
  window.installEnochianIphoneLandscapeV2=frame=>{let n=0;const t=setInterval(()=>{if(install(frame)||++n>200)clearInterval(t)},50)};
})();