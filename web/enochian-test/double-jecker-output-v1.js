(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      const w=d&&d.defaultView;
      const api=w&&w.__enochDoubleDeckerSpecial;
      const panel=document.getElementById('doubleDeckerSpecial');
      if(!d||!w||!api||!panel)return false;
      if(panel.dataset.jeckerOutput==='v2')return true;
      panel.dataset.jeckerOutput='v2';

      let style=document.getElementById('double-jecker-output-style');
      if(style)style.remove();
      style=document.createElement('style');
      style.id='double-jecker-output-style';
      style.textContent=`.jecker-output{display:grid;grid-template-columns:auto minmax(70px,1fr) 38px;gap:5px;align-items:center;border:1px solid #315b56;padding:5px;background:#020706}.jecker-output label{font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#f0c97e;white-space:nowrap}.jecker-output input{width:100%;accent-color:#19c98f}.jecker-output output{font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#63f5cf;text-align:right}`;
      document.head.appendChild(style);

      const center=panel.querySelector('.dds-center');
      if(!center)return false;
      let row=panel.querySelector('[data-jecker-output]');
      if(!row){row=document.createElement('div');row.className='jecker-output';row.dataset.jeckerOutput='';row.innerHTML='<label>MASTER JESTER</label><input data-jecker-output-range type="range" min="0" max="100" step="1" value="92" aria-label="MASTER JESTER output volume"><output data-jecker-output-value>92%</output>';const status=center.querySelector('.dds-status');center.insertBefore(row,status||null)}

      const range=row.querySelector('[data-jecker-output-range]');
      const readout=row.querySelector('[data-jecker-output-value]');
      const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
      if(typeof api.state.outputGain!=='number')api.state.outputGain=.92;

      const ensureOutputNode=()=>{
        const ctx=api.state?.ctx,masterGain=api.state?.masterGain;
        if(!ctx||!masterGain)return null;
        if(api.state.outputNode)return api.state.outputNode;
        const node=ctx.createGain();
        node.gain.value=clamp(api.state.outputGain);
        try{masterGain.disconnect(ctx.destination)}catch(_){}
        try{masterGain.connect(node);node.connect(ctx.destination)}catch(_){return null}
        api.state.outputNode=node;
        api.state.outputNodeDirect=true;
        return node;
      };
      const apply=value=>{
        const normalized=clamp(value);
        api.state.outputGain=normalized;
        const node=ensureOutputNode();
        const gain=node?.gain;
        const ctx=api.state?.ctx;
        if(gain){try{const now=ctx?.currentTime||0;gain.cancelScheduledValues?.(now);gain.setTargetAtTime?gain.setTargetAtTime(normalized,now,.015):gain.value=normalized}catch(_){gain.value=normalized}}
        if(range)range.value=String(Math.round(normalized*100));
        if(readout)readout.textContent=Math.round(normalized*100)+'%';
        return normalized;
      };

      api.ensureOutputGain=()=>{ensureOutputNode();return apply(api.state.outputGain)};
      api.setOutput=apply;
      api.getOutput=()=>typeof api.state.outputGain==='number'?api.state.outputGain:.92;
      range?.addEventListener('input',()=>apply(Number(range.value)/100));
      apply(api.state.outputGain);

      const oldEnable=api.enable;
      if(oldEnable&&!api.__jeckerOutputEnableWrappedV2){
        api.__jeckerOutputEnableWrappedV2=true;
        api.enable=async(...args)=>{const result=await oldEnable.apply(api,args);ensureOutputNode();apply(api.state.outputGain);return result};
      }

      w.__enochDoubleJeckerOutput={version:'v2',set:apply,get:api.getOutput,ensure:ensureOutputNode};
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerOutputV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
