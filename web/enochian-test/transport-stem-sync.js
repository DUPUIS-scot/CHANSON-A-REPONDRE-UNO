(()=>{
  const active=e=>!!e&&(e.classList.contains('active')||e.getAttribute('aria-pressed')==='true');
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const master=d&&d.getElementById('audio'),loop=d&&d.getElementById('loopToggle'),isolator=d&&d.querySelector('.stem-isolator');
      if(!d||!w||!master||!loop||!isolator)return false;
      if(d.documentElement.dataset.transportStemSync==='v2')return true;
      d.documentElement.dataset.transportStemSync='v2';
      const buttons=()=>[...isolator.querySelectorAll('.stem-toggle')];
      const keyOf=b=>b?.dataset?.stemToggle||b?.getAttribute('data-stem-toggle')||'';
      const allStemMedia=()=>[...d.querySelectorAll('audio')].filter(a=>a!==master);
      const mediaFor=(button,index)=>{const key=keyOf(button),all=allStemMedia();if(key){const exact=all.find(m=>m.dataset?.stem===key||m.dataset?.stemKey===key||m.id===`stem-${key}`||m.id===`stem_${key}`||String(m.src||'').toLowerCase().includes(key.toLowerCase()));if(exact)return exact}return all[index]||null};
      const safeTime=(m,t)=>Number.isFinite(m.duration)&&m.duration>0?Math.max(0,Math.min(t,Math.max(0,m.duration-.015))):Math.max(0,t);
      const alignOne=(m,on,force=false)=>{if(!m)return;try{m.playbackRate=master.playbackRate||1;const mt=master.currentTime||0,drift=Math.abs((m.currentTime||0)-mt);if(force||drift>.075)m.currentTime=safeTime(m,mt);if(master.paused||!on){if(!m.paused)m.pause()}else if(m.paused){const p=m.play();if(p&&typeof p.catch==='function')p.catch(()=>{})}}catch(_){}};
      const sync=(force=false)=>buttons().forEach((b,i)=>alignOne(mediaFor(b,i),active(b),force));
      const hardLoopSync=()=>{const mt=master.currentTime||0;buttons().forEach((b,i)=>{const m=mediaFor(b,i);if(!m)return;try{m.pause();m.currentTime=safeTime(m,mt);m.playbackRate=master.playbackRate||1;if(active(b)&&!master.paused){const p=m.play();if(p&&typeof p.catch==='function')p.catch(()=>{})}}catch(_){}})};
      let lastTime=master.currentTime||0,lastWall=performance.now(),timer=0;
      const schedule=()=>{if(timer)w.clearTimeout(timer);timer=w.setTimeout(tick,master.paused?1000:160)};
      const tick=()=>{const now=performance.now(),mt=master.currentTime||0,wrapped=active(loop)&&lastTime-mt>.35;if(wrapped)hardLoopSync();else sync(false);lastTime=mt;lastWall=now;schedule()};
      const eventForce=()=>{sync(true);lastTime=master.currentTime||0;schedule()};
      master.addEventListener('play',eventForce);
      master.addEventListener('pause',()=>{sync(false);schedule()});
      master.addEventListener('seeking',eventForce);
      master.addEventListener('seeked',eventForce);
      master.addEventListener('ratechange',()=>sync(false));
      master.addEventListener('timeupdate',()=>{const now=master.currentTime||0;if(active(loop)&&lastTime-now>.35)hardLoopSync();lastTime=now});
      master.addEventListener('ended',()=>{if(!active(loop))return;try{master.currentTime=0;hardLoopSync();const p=master.play();if(p&&typeof p.catch==='function')p.catch(()=>{})}catch(_){}});
      buttons().forEach((b,i)=>{if(b.dataset.transportSyncV2)return;b.dataset.transportSyncV2='1';b.addEventListener('click',()=>setTimeout(()=>alignOne(mediaFor(b,i),active(b),true),0))});
      w.addEventListener('pagehide',()=>{if(timer)w.clearTimeout(timer)},{once:true});
      sync(true);schedule();return true;
    }catch(_){return false}
  }
  window.installEnochianTransportStemSync=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();