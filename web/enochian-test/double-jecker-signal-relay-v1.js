(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const api=w&&w.__enochDoubleDeckerSpecial;
      if(!d||!w||!api)return false;
      if(w.__enochDoubleJeckerSignalRelay?.version==='v2')return true;

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

      // Keep one MediaElementAudioSourceNode per media element. The previous singleton
      // could silently reuse a source belonging to an unrelated external media element.
      const bridge=d.createElement('script');
      bridge.textContent=`window.__enochAttachExternalSignal=async function(media){await ensureAudio();window.__enochExternalSignalSources=window.__enochExternalSignalSources||new WeakMap();let source=window.__enochExternalSignalSources.get(media);if(!source){const legacy=window.__enochExternalSignalSource;if(legacy&&legacy.mediaElement===media)source=legacy;else source=ctx.createMediaElementSource(media);window.__enochExternalSignalSources.set(media,source);source.connect(low)}return{context:ctx,source:source,input:low,master:master,analyser:an}};`;
      d.head.appendChild(bridge);

      const state={version:'v2',destination:null,attached:false,relayConnected:false,directDetached:false};
      const detachDirect=()=>{
        const ctx=api.state?.ctx,masterGain=api.state?.masterGain;
        if(!ctx||!masterGain||state.directDetached)return false;
        try{masterGain.disconnect(ctx.destination);state.directDetached=true}catch(_){}
        return state.directDetached;
      };
      const connectRelay=()=>{
        const masterGain=api.state?.masterGain;
        if(!masterGain||!state.destination||state.relayConnected)return false;
        try{masterGain.connect(state.destination);state.relayConnected=true}catch(_){}
        return state.relayConnected;
      };
      const restoreDirect=()=>{
        const ctx=api.state?.ctx,masterGain=api.state?.masterGain;
        if(!ctx||!masterGain)return false;
        if(state.relayConnected&&state.destination){try{masterGain.disconnect(state.destination)}catch(_){}state.relayConnected=false}
        if(state.directDetached){try{masterGain.connect(ctx.destination);state.directDetached=false}catch(_){}}
        return !state.directDetached;
      };
      const attach=async()=>{
        const ctx=api.state?.ctx,masterGain=api.state?.masterGain;
        if(!ctx||!masterGain||typeof ctx.createMediaStreamDestination!=='function')return false;
        if(!state.destination)state.destination=ctx.createMediaStreamDestination();
        detachDirect();
        connectRelay();
        if(relayMedia.srcObject!==state.destination.stream)relayMedia.srcObject=state.destination.stream;
        try{await relayMedia.play()}catch(_){}
        const inlet=await w.__enochAttachExternalSignal?.(relayMedia);
        state.attached=!!(inlet&&inlet.source?.mediaElement===relayMedia);
        d.documentElement.dataset.doubleJeckerSignalRelay=state.attached?'v2':'pending';
        return state.attached;
      };
      const detach=()=>{
        try{relayMedia.pause()}catch(_){}
        restoreDirect();
        state.attached=false;
        d.documentElement.dataset.doubleJeckerSignalRelay='idle';
        return true;
      };

      const oldEnable=api.enable;
      if(oldEnable&&!api.__doubleJeckerSignalRelayWrappedV2){
        api.__doubleJeckerSignalRelayWrappedV2=true;
        api.enable=async(...args)=>{
          const result=await oldEnable.apply(api,args);
          await attach();
          return result;
        };
      }

      const oldDisable=api.disable;
      if(oldDisable&&!api.__doubleJeckerSignalRelayDisableWrappedV2){
        api.__doubleJeckerSignalRelayDisableWrappedV2=true;
        api.disable=(...args)=>{
          const result=oldDisable.apply(api,args);
          detach();
          return result;
        };
      }

      w.addEventListener('pagehide',detach,{once:true});
      w.__enochDoubleJeckerSignalRelay={version:'v2',state,attach,detach,get media(){return relayMedia}};
      if(api.state?.ctx&&api.state?.enabled)void attach();
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerSignalRelayV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
