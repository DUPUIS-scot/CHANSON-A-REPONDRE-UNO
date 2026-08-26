(()=>{
  const STYLE_ID='enochModRowPositionV1';
  const CSS=`
    .mod{transform:translateY(-12px)!important;transform-origin:center top!important}
    html.enoch-ios-landscape .ios-second-center>.mod{transform:translateY(-12px)!important;transform-origin:center top!important}
  `;
  function innerDocument(frame){
    try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}
  }
  function apply(frame){
    try{
      const d=innerDocument(frame);
      if(!d?.head)return false;
      let style=d.getElementById(STYLE_ID);
      if(!style){style=d.createElement('style');style.id=STYLE_ID;d.head.appendChild(style)}
      if(style.textContent!==CSS)style.textContent=CSS;
      d.documentElement.dataset.modRowPosition='v1';
      return true;
    }catch(_){return false}
  }
  window.installEnochianModRowPositionV1=frame=>{let n=0,t=setInterval(()=>{if(apply(frame)||++n>240)clearInterval(t)},50)};
  window.syncEnochianModRowPositionV1=frame=>apply(frame);
})();
