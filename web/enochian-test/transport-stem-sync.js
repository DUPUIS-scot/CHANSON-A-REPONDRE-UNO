(()=>{
  const active=e=>!!e&&(e.classList.contains('active')||e.getAttribute('aria-pressed')==='true');
  const timeLabel=v=>{v=Math.max(0,Number(v)||0);const m=Math.floor(v/60),s=(v-m*60).toFixed(1).padStart(4,'0');return String(m).padStart(2,'0')+':'+s};
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const master=d&&d.getElementById('audio'),loop=d&&d.getElementById('loopToggle'),isolator=d&&d.querySelector('.stem-isolator');
      if(!d||!w||!master||!loop||!isolator)return false;
      if(d.documentElement.dataset.transportStemSync==='v3')return true;
      d.documentElement.dataset.transportStemSync='v3';
      const style=d.createElement('style');style.textContent=`#loopToggle.loop-timing{color:#f0c97e!important;border-color:#7b6339!important;background:#171308!important;box-shadow:0 0 10px #d5aa6333!important;font-weight:900!important}`;d.head.appendChild(style);
      const buttons=()=>[...isolator.querySelectorAll('.stem-toggle')],keyOf=b=>b?.dataset?.stemToggle||'',allStemMedia=()=>[...d.querySelectorAll('audio')].filter(a=>a!==master);
      const mediaFor=(button,index)=>{const key=keyOf(button),all=allStemMedia();if(key){const keys=key==='instruments'?['bass','other']:[key];const exact=all.find(m=>keys.some(k=>String(m.dataset?.src||m.src||'').toLowerCase().includes(k)));if(exact)return exact}return all[index]||null};
      const safeTime=(m,t)=>Number.isFinite(m.duration)&&m.duration>0?Math.max(0,Math.min(t,Math.max(0,m.duration-.015))):Math.max(0,t);
      const alignOne=(m,on,force=false)=>{if(!m)return;try{m.playbackRate=master.playbackRate||1;const mt=master.currentTime||0,drift=Math.abs((m.currentTime||0)-mt);if(force||master.paused||drift>.02)m.currentTime=safeTime(m,mt);if(master.paused||!on){if(!m.paused)m.pause()}else if(m.paused){const p=m.play();if(p&&p.catch)p.catch(()=>{})}}catch(_){}};
      const sync=(force=false)=>buttons().forEach((b,i)=>alignOne(mediaFor(b,i),active(b),force));
      const hardLoopSync=()=>{const mt=master.currentTime||0;allStemMedia().forEach(m=>{try{m.pause();m.currentTime=safeTime(m,mt);m.playbackRate=master.playbackRate||1}catch(_){}});sync(true)};
      const refreshLoop=()=>{const on=active(loop);loop.classList.toggle('loop-timing',on);loop.textContent=on?'LOOP ON':'LOOP OFF'};
      let lastTime=master.currentTime||0,timer=0;
      const schedule=()=>{if(timer)w.clearTimeout(timer);timer=w.setTimeout(tick,master.paused?500:100)};
      const tick=()=>{const mt=master.currentTime||0,wrapped=active(loop)&&lastTime-mt>.35;if(wrapped)hardLoopSync();else sync(false);lastTime=mt;refreshLoop();schedule()};
      const eventForce=()=>{sync(true);lastTime=master.currentTime||0;refreshLoop();schedule()};
      master.addEventListener('play',eventForce);master.addEventListener('pause',()=>{sync(false);refreshLoop();schedule()});master.addEventListener('seeking',eventForce);master.addEventListener('seeked',eventForce);master.addEventListener('ratechange',()=>sync(false));master.addEventListener('timeupdate',()=>{const now=master.currentTime||0;if(active(loop)&&lastTime-now>.35)hardLoopSync();lastTime=now;refreshLoop()});master.addEventListener('ended',()=>{if(!active(loop))return;try{master.currentTime=0;hardLoopSync();const p=master.play();if(p&&p.catch)p.catch(()=>{})}catch(_){}});
      loop.addEventListener('click',()=>setTimeout(refreshLoop,0));
      buttons().forEach((b,i)=>{if(b.dataset.transportSyncV3)return;b.dataset.transportSyncV3='1';b.addEventListener('click',()=>setTimeout(()=>alignOne(mediaFor(b,i),active(b),true),0))});
      w.addEventListener('pagehide',()=>{if(timer)w.clearTimeout(timer)},{once:true});sync(true);refreshLoop();schedule();return true;
    }catch(_){return false}
  }
  window.installEnochianTransportStemSync=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
