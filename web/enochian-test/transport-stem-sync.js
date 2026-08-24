(()=>{
  const active=e=>!!e&&(e.classList.contains('active')||e.getAttribute('aria-pressed')==='true');
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const master=d&&d.getElementById('audio'),loop=d&&d.getElementById('loopToggle'),isolator=d&&d.querySelector('.stem-isolator');
      if(!d||!w||!master||!loop||!isolator)return false;
      if(d.documentElement.dataset.transportStemSync==='v1')return true;
      d.documentElement.dataset.transportStemSync='v1';
      const buttons=()=>[...isolator.querySelectorAll('.stem-toggle')];
      const media=()=>[...d.querySelectorAll('audio')].filter(a=>a!==master).slice(0,buttons().length);
      const sync=(force=false)=>{const stems=media(),rows=buttons();stems.forEach((m,i)=>{try{const on=active(rows[i]);m.playbackRate=master.playbackRate||1;if(Number.isFinite(master.currentTime)&&Number.isFinite(m.duration||0)){const drift=Math.abs((m.currentTime||0)-master.currentTime);if(force||drift>.12)m.currentTime=Math.max(0,Math.min(master.currentTime,Number.isFinite(m.duration)?Math.max(0,m.duration-.01):master.currentTime))}if(master.paused||!on){if(!m.paused)m.pause()}else if(m.paused){const p=m.play();if(p&&typeof p.catch==='function')p.catch(()=>{})}}catch(_){}})};
      let lastTime=master.currentTime||0;
      master.addEventListener('play',()=>setTimeout(()=>sync(true),0));
      master.addEventListener('pause',()=>sync(false));
      master.addEventListener('seeking',()=>sync(true));
      master.addEventListener('seeked',()=>sync(true));
      master.addEventListener('ratechange',()=>sync(false));
      master.addEventListener('timeupdate',()=>{const now=master.currentTime||0;if(active(loop)&&lastTime-now>.5)sync(true);lastTime=now});
      master.addEventListener('ended',()=>{if(!active(loop))return;setTimeout(()=>{try{master.currentTime=0;sync(true);const p=master.play();if(p&&typeof p.catch==='function')p.catch(()=>{})}catch(_){}},0)});
      buttons().forEach((b,i)=>{if(b.dataset.transportSyncV1)return;b.dataset.transportSyncV1='1';b.addEventListener('click',()=>setTimeout(()=>{const m=media()[i];if(!m)return;try{m.currentTime=master.currentTime||0;m.playbackRate=master.playbackRate||1;if(active(b)&&!master.paused){const p=m.play();if(p&&typeof p.catch==='function')p.catch(()=>{})}else m.pause()}catch(_){}},0))});
      const tick=()=>{sync(false);w.setTimeout(tick,500)};w.setTimeout(tick,500);sync(true);return true;
    }catch(_){return false}
  }
  window.installEnochianTransportStemSync=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();