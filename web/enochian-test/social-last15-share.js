(function(){
  'use strict';
  function install(terminalFrame){
    if(!terminalFrame)return false;
    let tries=0;
    const timer=setInterval(()=>{
      try{
        const liveDoc=terminalFrame.contentDocument;
        const deck=liveDoc&&liveDoc.getElementById('deck');
        const d=deck&&deck.contentDocument;
        if(!d){if(++tries>300)clearInterval(timer);return;}
        if(d.getElementById('enochianSocialLast15Bootstrap')){clearInterval(timer);return;}
        const s=d.createElement('script');
        s.id='enochianSocialLast15Bootstrap';
        s.src='/enochian-test/social-last15-share-inner.js?v=20260824-v2';
        d.body.appendChild(s);
        clearInterval(timer);
      }catch(_){if(++tries>300)clearInterval(timer);}
    },50);
    return true;
  }
  window.installEnochianSocialLast15Share=install;
})();
