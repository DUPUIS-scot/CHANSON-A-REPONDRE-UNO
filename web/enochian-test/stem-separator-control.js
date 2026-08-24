(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      if(!d||!d.body)return false;
      if(d.documentElement.dataset.stemSeparatorControl==='v1')return true;
      const stem=d.getElementById('stemMasterToggle');
      const kill=d.getElementById('killfx');
      if(!stem||!kill)return false;

      d.documentElement.dataset.stemSeparatorControl='v1';
      const style=d.createElement('style');
      style.textContent=`
        #stemMasterToggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important}
        html.enoch-ios-landscape #stemMasterToggle{display:inline-flex!important;min-height:22px!important;padding:2px 5px!important;font-size:5.5px!important}
      `;
      d.head.appendChild(style);

      const isOn=()=>stem.classList.contains('active')||stem.getAttribute('aria-pressed')==='true'||/STEMS\s+ON/i.test(stem.textContent||'');
      const sync=()=>{
        const on=isOn();
        stem.textContent=on?'STEMS ON':'STEMS OFF';
        stem.setAttribute('aria-pressed',String(on));
        stem.title=on?'Stem separator on':'Stem separator off';
      };
      stem.addEventListener('click',()=>setTimeout(sync,0));
      kill.addEventListener('click',()=>{
        setTimeout(()=>{
          if(isOn()) stem.click();
          setTimeout(sync,0);
        },0);
      });
      sync();
      return true;
    }catch(_){return false}
  }

  window.installEnochianStemSeparatorControl=frame=>{
    let n=0;
    const t=setInterval(()=>{if(install(frame)||++n>200)clearInterval(t)},50);
  };
})();