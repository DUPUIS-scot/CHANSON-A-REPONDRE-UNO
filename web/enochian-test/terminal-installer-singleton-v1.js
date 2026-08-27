(()=>{
  'use strict';
  const wrap=(name,ready)=>{
    const original=window[name];
    if(typeof original!=='function'||original.__enochSingletonWrapped)return;
    let documentToken=null;
    let armed=false;
    const wrapped=frame=>{
      let token=null;
      try{token=frame?.contentDocument||null}catch(_){}
      if(token!==documentToken){documentToken=token;armed=false}
      if(ready(frame))return true;
      if(armed)return false;
      armed=true;
      try{return !!original(frame)}catch(_){return false}
    };
    wrapped.__enochSingletonWrapped=true;
    wrapped.__enochOriginal=original;
    window[name]=wrapped;
  };
  const innerDocument=frame=>{
    try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}
  };
  wrap('installEnochianStemFourChannelV1',frame=>innerDocument(frame)?.documentElement?.dataset?.stemFourChannel==='v3');
  wrap('installEnochianDoubleDeckerSpecialV2',frame=>document.getElementById('doubleDeckerSpecial')?.dataset?.ddsControls==='v11');
})();
