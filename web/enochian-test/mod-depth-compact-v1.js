(()=>{
  function install(frame){
    try{
      const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument;
      if(!d)return false;
      if(d.documentElement.dataset.modDepthCompact==='v2')return true;
      const mod=d.querySelector('.mod'),wheelbox=mod?.querySelector('.wheelbox'),wheel=d.getElementById('modWheel');
      if(!mod||!wheelbox||!wheel)return false;
      d.documentElement.dataset.modDepthCompact='v2';
      const style=d.createElement('style');
      style.dataset.modDepthCompact='v2';
      style.textContent=`
        .mod{grid-template-columns:minmax(0,1fr) 76px!important;align-items:start!important;transform:translateY(-12px)!important;transform-origin:center top!important}
        .mod>.wheelbox{align-self:start!important;justify-self:center!important;width:76px!important;margin:0!important;padding:0 2px 2px!important;gap:1px!important}
        .mod>.wheelbox .wheel{width:58px!important;height:58px!important}
        .mod>.wheelbox .wheel:before{top:5px!important;height:15px!important;transform-origin:2px 24px!important}
        .mod>.wheelbox .wheel-label{font-size:8px!important;line-height:1!important;margin:0!important}
        .mod>.wheelbox .wheel-value{font-size:9px!important;line-height:1!important;min-height:9px!important;margin:-1px 0 0!important}
        .mod>.wheelbox .wheel-hint{font-size:5.5px!important;line-height:1!important;margin:0!important;padding:0!important}
        html.enoch-ios-landscape .ios-second-center>.mod{transform:translateY(-12px)!important;transform-origin:center top!important}
        @media(max-width:1000px){
          .mod>.wheelbox{width:76px!important;margin:0!important}
          .mod>.wheelbox .wheel{width:58px!important;height:58px!important}
          .mod>.wheelbox .wheel:before{top:5px!important;height:15px!important;transform-origin:2px 24px!important}
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
