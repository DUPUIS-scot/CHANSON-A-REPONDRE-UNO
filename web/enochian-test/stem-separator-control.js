(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      if(!d||!d.body)return false;
      if(d.documentElement.dataset.stemSeparatorControl==='v2')return true;

      const stem=d.getElementById('stemMasterToggle');
      const kill=d.getElementById('killfx');
      const isolator=d.querySelector('.stem-isolator');
      if(!stem||!kill||!isolator)return false;

      d.documentElement.dataset.stemSeparatorControl='v2';

      const oldStyle=d.getElementById('stemSeparatorControlStyle');
      if(oldStyle)oldStyle.remove();
      const style=d.createElement('style');
      style.id='stemSeparatorControlStyle';
      style.textContent=`
        #stemMasterToggle{
          display:flex!important;
          visibility:visible!important;
          opacity:1!important;
          position:relative!important;
          inset:auto!important;
          width:100%!important;
          max-width:none!important;
          min-width:0!important;
          min-height:28px!important;
          margin:2px 0 4px!important;
          padding:5px 7px!important;
          align-items:center!important;
          justify-content:center!important;
          white-space:nowrap!important;
          z-index:2!important;
        }
        #stemMasterToggle.active,
        #stemMasterToggle[aria-pressed="true"]{
          background:#083128!important;
          color:#63f5cf!important;
          border-color:#68d8bd!important;
          box-shadow:0 0 10px #40e6b433!important;
        }
        html.enoch-ios-landscape #stemMasterToggle{
          display:flex!important;
          width:100%!important;
          min-height:22px!important;
          margin:1px 0 2px!important;
          padding:2px 4px!important;
          font-size:5.5px!important;
          line-height:1!important;
        }
      `;
      d.head.appendChild(style);

      const title=isolator.querySelector('.stem-title');
      if(stem.parentElement!==isolator){
        if(title&&title.nextSibling) isolator.insertBefore(stem,title.nextSibling);
        else isolator.prepend(stem);
      }else if(title&&stem.previousElementSibling!==title){
        title.insertAdjacentElement('afterend',stem);
      }

      const isOn=()=>stem.classList.contains('active')||stem.getAttribute('aria-pressed')==='true'||/STEMS\s+ON/i.test(stem.textContent||'');
      const sync=()=>{
        const on=isOn();
        stem.textContent=on?'STEMS ON':'STEMS OFF';
        stem.setAttribute('aria-pressed',String(on));
        stem.title=on?'Stem separator on':'Stem separator off';
      };

      if(!stem.dataset.separatorSyncBound){
        stem.dataset.separatorSyncBound='1';
        stem.addEventListener('click',()=>setTimeout(sync,0));
      }
      if(!kill.dataset.stemKillBound){
        kill.dataset.stemKillBound='1';
        kill.addEventListener('click',()=>{
          setTimeout(()=>{
            if(isOn()) stem.click();
            setTimeout(sync,0);
          },0);
        });
      }

      sync();
      return true;
    }catch(_){return false}
  }

  window.installEnochianStemSeparatorControl=frame=>{
    let n=0;
    const t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);
  };
})();