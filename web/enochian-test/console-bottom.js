(function(){
  'use strict';
  window.installEnochianConsoleBottom=function(host){
    function apply(){
      try{
        const live=host&&host.contentDocument;
        const deck=live&&live.getElementById('deck');
        const d=deck&&deck.contentDocument;
        if(!d)return false;
        if(d.getElementById('enoch-console-bottom-style'))return true;
        const s=d.createElement('style');
        s.id='enoch-console-bottom-style';
        s.textContent=`
          .side:last-child{min-height:0!important;display:flex!important;flex-direction:column!important;align-items:stretch!important}
          .side:last-child .console{flex:1 1 auto!important;align-self:stretch!important;min-height:220px!important;height:auto!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;margin-bottom:0!important}
          .side:last-child .console-lines{height:auto!important;min-height:160px!important;max-height:none!important;flex:1 1 auto!important;overflow:auto!important}
          @media (min-width:1001px){.grid{align-items:stretch!important}.side:last-child{height:100%!important}}
          html.terminal-fullscreen .side:last-child{height:100%!important;min-height:0!important}
          html.terminal-fullscreen .side:last-child .console{flex:1 1 auto!important;height:auto!important;min-height:0!important}
          html.terminal-fullscreen .side:last-child .console-lines{height:auto!important;min-height:0!important;max-height:none!important;flex:1 1 auto!important;overflow:auto!important}
        `;
        d.head.appendChild(s);
        return true;
      }catch(_){return false}
    }
    let n=0;
    const t=setInterval(()=>{if(apply()||++n>160)clearInterval(t)},50);
    apply();
  };
})();
