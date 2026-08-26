(()=>{
  function install(frame){
    try{
      const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument;
      if(!d)return false;
      if(d.documentElement.dataset.modDepthCompact==='v3')return true;
      const mod=d.querySelector('.mod'),wheelbox=mod?.querySelector('.wheelbox'),wheel=d.getElementById('modWheel');
      if(!mod||!wheelbox||!wheel)return false;
      d.documentElement.dataset.modDepthCompact='v3';
      const style=d.createElement('style');
      style.dataset.modDepthCompact='v3';
      style.textContent=`
        .mod{grid-template-columns:minmax(0,1fr) 76px!important;align-items:start!important;transform:translateY(-12px)!important;transform-origin:center top!important;position:relative!important;z-index:1!important}
        .mod>.wheelbox{align-self:start!important;justify-self:center!important;width:76px!important;margin:0!important;padding:0 2px 2px!important;gap:1px!important}
        .mod>.wheelbox .wheel{width:58px!important;height:58px!important}
        .mod>.wheelbox .wheel:before{top:5px!important;height:15px!important;transform-origin:2px 24px!important}
        .mod>.wheelbox .wheel-label{font-size:8px!important;line-height:1!important;margin:0!important}
        .mod>.wheelbox .wheel-value{font-size:9px!important;line-height:1!important;min-height:9px!important;margin:-1px 0 0!important}
        .mod>.wheelbox .wheel-hint{font-size:5.5px!important;line-height:1!important;margin:0!important;padding:0!important}
        .mod + .pad-panel{position:relative!important;z-index:2!important;margin-top:0!important;transform:none!important;pointer-events:auto!important}
        .pad-panel,.pad-panel *{pointer-events:auto}
        html.enoch-ios-landscape .ios-second-center{display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;align-content:start!important;overflow:visible!important}
        html.enoch-ios-landscape .ios-second-center>.mod{transform:translateY(-12px)!important;transform-origin:center top!important;position:relative!important;z-index:1!important;margin-bottom:-12px!important}
        html.enoch-ios-landscape .ios-second-center>.pad-panel{position:relative!important;z-index:2!important;transform:none!important;margin-top:0!important;pointer-events:auto!important}
        @media(max-width:1000px){
          .mod>.wheelbox{width:76px!important;margin:0!important}
          .mod>.wheelbox .wheel{width:58px!important;height:58px!important}
          .mod>.wheelbox .wheel:before{top:5px!important;height:15px!important;transform-origin:2px 24px!important}
          .mod + .pad-panel{clear:both!important;position:relative!important;z-index:2!important}
        }
      `;
      d.head.appendChild(style);
      return true;
    }catch(_){return false}
  }
  let timer=0,lastFrame=null;
  window.installEnochianModDepthCompactV1=frame=>{
    lastFrame=frame;
    if(install(frame)){if(timer){clearInterval(timer);timer=0}return true}
    if(!timer){let n=0;timer=setInterval(()=>{if(install(lastFrame)||++n>240){clearInterval(timer);timer=0}},50)}
    return false;
  };
})();
