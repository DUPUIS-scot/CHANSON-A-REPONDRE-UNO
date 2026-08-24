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
          .console{align-self:stretch!important;min-height:0!important;height:100%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
          .console-lines{height:auto!important;min-height:72px!important;flex:1 1 auto!important;overflow:auto!important}
          html.terminal-fullscreen .stage{grid-template-rows:minmax(82px,12vh) minmax(0,34vh) minmax(68px,10vh) minmax(118px,18vh) minmax(0,1fr)!important}
          html.terminal-fullscreen .console{height:100%!important;min-height:0!important;align-self:stretch!important}
          html.terminal-fullscreen .console-lines{height:auto!important;min-height:0!important;flex:1 1 auto!important;overflow:auto!important}
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
