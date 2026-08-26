(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const api=w&&w.__enochDoubleDeckerSpecial;
      if(!d||!w||!api)return false;
      if(w.__enochDoubleJeckerSignalRelay?.version==='v1')return true;

      let relayMedia=d.getElementById('doubleJeckerSignalRelayMedia');
      if(!relayMedia){
        relayMedia=d.createElement('audio');
        relayMedia.id='doubleJeckerSignalRelayMedia';
        relayMedia.autoplay=true;
        relayMedia.playsInline=true;
        relayMedia.setAttribute('playsinline','');
        relayMedia.setAttribute('aria-hidden','true');
        relayMedia.style.display='none';
        d.body.appendChild(relayMedia);
      }

      if(!w.__enochAttachExternalSignal){
        const s=d.createElement('script');
        s.textContent=`window.__enochAttachExternalSignal=async function(media){await ensureAudio();if(!window.__enochExternalSignalSource){window.__enochExternalSignalSource=ctx.createMediaElementSource(media);window.__enochExternalSignalSource.connect(low)}return{context:ctx,source:window.__enochExternalSignalSource,input:low,master:master,analyser:an}};`;
        d.head.appendChild(s);
      }

      const state={version:'v1',destination:null,attached:false,directDisconnected:false};
      const attach=async()=>{
        const ctx=api.state?.ctx,masterGain=api.state?.masterGain;
        if(!ctx||!masterGain||typeof ctx.createMediaStreamDestination!=='function')return false;
        if(!state.destination){state.destination=ctx.createMediaStreamDestination()}
        if(!state.directDisconnected){
          try{masterGain.disconnect()}catch(_){}
          masterGain.connect(state.destination);
          state.directDisconnected=true;
        }
        if(relayMedia.srcObject!==state.destination.stream)relayMedia.srcObject=state.destination.stream;
        try{await relayMedia.play()}catch(_){}
        const inlet=await w.__enochAttachExternalSignal?.(relayMedia);
        state.attached=!!inlet;
        d.documentElement.dataset.doubleJeckerSignalRelay=state.attached?'v1':'pending';
        return state.attached;
      };

      const oldEnable=api.enable;
      if(oldEnable&&!api.__doubleJeckerSignalRelayWrapped){
        api.__doubleJeckerSignalRelayWrapped=true;
        api.enable=async(...args)=>{
          const result=await oldEnable.apply(api,args);
          await attach();
          return result;
        };
      }

      const oldDisable=api.disable;
      if(oldDisable&&!api.__doubleJeckerSignalRelayDisableWrapped){
        api.__doubleJeckerSignalRelayDisableWrapped=true;
        api.disable=(...args)=>{
          const result=oldDisable.apply(api,args);
          try{relayMedia.pause()}catch(_){}
          return result;
        };
      }

      w.__enochDoubleJeckerSignalRelay={version:'v1',state,attach,get media(){return relayMedia}};
      if(api.state?.ctx)void attach();
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerSignalRelayV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
