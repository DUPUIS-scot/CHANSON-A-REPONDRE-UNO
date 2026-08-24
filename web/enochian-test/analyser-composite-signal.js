(()=>{
  const GLYPHS=['Un','Pa','Veh','Gal','Graph','Or','Na','Gon','Ur','Tal','Gisa','Fam','Ged','Don','Med','Mals','Ger','Drux','Pal','Ceph','Van'];
  const glyphUrl=i=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/Enochian%20-%20'+encodeURIComponent(GLYPHS[i])+'.svg';
  const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
  const pct=v=>Math.max(0,Math.min(1,(parseFloat(v)||0)/100));
  const range=d=>id=>{const e=d.getElementById(id);return e?parseFloat(e.value)||0:0};
  const active=e=>!!e&&(e.classList.contains('active')||e.getAttribute('aria-pressed')==='true');
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument;
      if(!d||!d.body)return false;
      if(d.documentElement.dataset.compositeAnalyser==='v1')return true;
      if(!d.getElementById('b0')||!d.getElementById('log'))return false;
      d.documentElement.dataset.compositeAnalyser='v1';
      const get=range(d);
      let lastLog=0;
      const readBinary=i=>{const t=(d.getElementById('b'+i)?.textContent||'0').trim();return parseInt(t,2)||0};
      const stemLevel=key=>{
        const r=d.querySelector('[data-stem-range="'+key+'"]');
        const b=d.querySelector('[data-stem-toggle="'+key+'"]');
        return active(b)?pct(r?.value??100):0;
      };
      const tick=()=>{
        const raw=[0,1,2,3].map(readBinary);
        const vocals=stemLevel('vocals');
        const drums=stemLevel('drums');
        const instruments=stemLevel('instruments');
        const master=Math.max(0,Math.min(1,get('vol')));
        const low=(get('low')+18)/36,mid=(get('mid')+18)/36,high=(get('high')+18)/36;
        const eqMacro=(parseFloat((d.getElementById('eqWheelV')?.textContent||'').match(/-?\d+/)?.[0])||0)/100;
        const fxMacro=pct((d.getElementById('fxWheelV')?.textContent||'0').replace('%',''));
        const padText=d.getElementById('padReadout')?.textContent||'';
        const xy=[...padText.matchAll(/(?:X|Y)\s*(\d+)/g)].map(m=>(+m[1]||0)/100);
        const padX=xy[0]??.5,padY=xy[1]??.5;
        const mix=pct(d.getElementById('fxMixV')?.textContent||50);
        const instant=[...d.querySelectorAll('.instant-fx-btn')].some(active)?1:0;
        const mod=d.getElementById('modActivate');
        const modOn=active(mod)?1:0;
        const modDepth=Math.max(0,Math.min(1,get('modDepth')));
        const pitch=Math.min(1,Math.abs(get('pitch'))/12);
        const loop=d.getElementById('loopToggle');
        const loopOn=active(loop)?1:0;

        const bass=clamp(raw[0]*.62 + 68*drums + 50*instruments + 46*low + 20*master + 18*Math.max(0,-eqMacro) + 18*fxMacro);
        const middle=clamp(raw[1]*.58 + 74*vocals + 42*instruments + 44*mid + 18*master + 18*modOn*modDepth + 12*padX);
        const treble=clamp(raw[2]*.58 + 48*vocals + 62*instruments + 46*high + 18*master + 28*fxMacro + 20*mix*padY + 18*instant);
        const beat=clamp(raw[3]*.64 + 92*drums + 28*loopOn + 20*pitch + 18*instant + 14*modOn*modDepth);
        const vals=[bass,middle,treble,beat];
        vals.forEach((n,i)=>{const b=d.getElementById('b'+i),g=d.getElementById('g'+i);if(b)b.textContent=n.toString(2).padStart(8,'0');if(g)g.src=glyphUrl(n%21)});

        const now=performance.now();
        if(now-lastLog>650 && !d.getElementById('audio')?.paused){
          lastLog=now;
          const line=document.createElement('div');
          line.textContent='ENOCHIAN SIGNAL · '+vals.map(v=>v.toString(2).padStart(8,'0')).join(' ')+' · V'+Math.round(vocals*100)+' D'+Math.round(drums*100)+' I'+Math.round(instruments*100)+' M'+Math.round(master*100)+' EQ '+Math.round(low*100)+'/'+Math.round(mid*100)+'/'+Math.round(high*100)+' FX '+Math.round(fxMacro*100)+' PAD '+Math.round(padX*100)+'/'+Math.round(padY*100)+' MOD '+Math.round(modOn*modDepth*100);
          const log=d.getElementById('log');
          if(log){log.prepend(line);while(log.children.length>18)log.lastChild.remove()}
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return true;
    }catch(_){return false}
  }
  window.installEnochianCompositeAnalyser=frame=>{let n=0;const t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();