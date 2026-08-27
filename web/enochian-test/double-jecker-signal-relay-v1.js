(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const api=w&&w.__enochDoubleDeckerSpecial;
      if(!d||!w||!api)return false;
      if(w.__enochDoubleJeckerSignalRelay?.version==='v3')return true;

      let relayMedia=d.getElementById('doubleJeckerSignalRelayMedia');
      if(!relayMedia){relayMedia=d.createElement('audio');relayMedia.id='doubleJeckerSignalRelayMedia';relayMedia.autoplay=true;relayMedia.playsInline=true;relayMedia.setAttribute('playsinline','');relayMedia.setAttribute('aria-hidden','true');relayMedia.style.display='none';d.body.appendChild(relayMedia)}

      const bridge=d.createElement('script');
      bridge.textContent=`window.__enochAttachExternalSignal=async function(media){await ensureAudio();window.__enochExternalSignalSources=window.__enochExternalSignalSources||new WeakMap();let source=window.__enochExternalSignalSources.get(media);if(!source){const legacy=window.__enochExternalSignalSource;if(legacy&&legacy.mediaElement===media)source=legacy;else source=ctx.createMediaElementSource(media);window.__enochExternalSignalSources.set(media,source);source.connect(low)}return{context:ctx,source:source,input:low,master:master,analyser:an}};`;
      d.head.appendChild(bridge);

      const state={version:'v3',destination:null,attached:false,relayConnected:false,directDetached:false,routeNode:null};
      const getRouteNode=()=>api.ensureOutputGain?.()&&api.state?.outputNode?api.state.outputNode:(api.state?.outputNode||api.state?.masterGain||null);
      const detachDirect=()=>{
        const ctx=api.state?.ctx,node=getRouteNode();
        if(!ctx||!node||state.directDetached)return false;
        state.routeNode=node;
        try{node.disconnect(ctx.destination);state.directDetached=true}catch(_){}
        return state.directDetached;
      };
      const connectRelay=()=>{
        const node=state.routeNode||getRouteNode();
        if(!node||!state.destination||state.relayConnected)return false;
        try{node.connect(state.destination);state.relayConnected=true}catch(_){}
        return state.relayConnected;
      };
      const restoreDirect=()=>{
        const ctx=api.state?.ctx,node=state.routeNode||getRouteNode();
        if(!ctx||!node)return false;
        if(state.relayConnected&&state.destination){try{node.disconnect(state.destination)}catch(_){}state.relayConnected=false}
        if(state.directDetached){try{node.connect(ctx.destination);state.directDetached=false}catch(_){}}
        state.routeNode=null;
        return !state.directDetached;
      };
      const attach=async()=>{
        const ctx=api.state?.ctx,node=getRouteNode();
        if(!ctx||!node||typeof ctx.createMediaStreamDestination!=='function')return false;
        if(!state.destination)state.destination=ctx.createMediaStreamDestination();
        detachDirect();connectRelay();
        if(relayMedia.srcObject!==state.destination.stream)relayMedia.srcObject=state.destination.stream;
        try{await relayMedia.play()}catch(_){}
        const inlet=await w.__enochAttachExternalSignal?.(relayMedia);
        state.attached=!!(inlet&&inlet.source?.mediaElement===relayMedia);
        d.documentElement.dataset.doubleJeckerSignalRelay=state.attached?'v3':'pending';
        return state.attached;
      };
      const detach=()=>{try{relayMedia.pause()}catch(_){}restoreDirect();state.attached=false;d.documentElement.dataset.doubleJeckerSignalRelay='idle';return true};

      const oldEnable=api.enable;
      if(oldEnable&&!api.__doubleJeckerSignalRelayWrappedV3){api.__doubleJeckerSignalRelayWrappedV3=true;api.enable=async(...args)=>{const result=await oldEnable.apply(api,args);await attach();return result}}
      const oldDisable=api.disable;
      if(oldDisable&&!api.__doubleJeckerSignalRelayDisableWrappedV3){api.__doubleJeckerSignalRelayDisableWrappedV3=true;api.disable=(...args)=>{const result=oldDisable.apply(api,args);detach();return result}}

      w.addEventListener('pagehide',detach,{once:true});
      w.__enochDoubleJeckerSignalRelay={version:'v3',state,attach,detach,get media(){return relayMedia}};
      if(api.state?.ctx&&api.state?.enabled)void attach();
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerSignalRelayV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
