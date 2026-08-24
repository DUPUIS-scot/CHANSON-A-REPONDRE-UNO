(function(){
  function install(outerFrame){
    function apply(){
      try{
        const liveDoc=outerFrame.contentDocument;
        const deck=liveDoc&&liveDoc.getElementById('deck');
        const d=deck&&deck.contentDocument;
        if(!d)return false;
        if(d.getElementById('enoch-console-fill-bottom'))return true;
        const style=d.createElement('style');
        style.id='enoch-console-fill-bottom';
        style.textContent=`
          .side:last-child{min-height:0!important;display:flex!important;flex-direction:column!important;align-items:stretch!important}
          .side:last-child .console{flex:1 1 auto!important;min-height:220px!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
          .side:last-child .console-lines{flex:1 1 auto!important;height:auto!important;min-height:160px!important;max-height:none!important;overflow:auto!important}
          @media (min-width:1001px){
            .grid{align-items:stretch!important}
            .side:last-child{height:100%!important}
            .side:last-child .console{margin-bottom:0!important}
          }
          html.terminal-fullscreen .side:last-child .console{flex:1 1 auto!important;min-height:0!important}
          html.terminal-fullscreen .side:last-child .console-lines{height:auto!important;min-height:0!important;flex:1 1 auto!important}
        `;
        d.head.appendChild(style);
        return true;
      }catch(_){return false;}
    }
    let n=0;const t=setInterval(()=>{if(apply()||++n>160)clearInterval(t)},50);
  }
  window.installEnochianConsoleFillBottom=install;
})();
