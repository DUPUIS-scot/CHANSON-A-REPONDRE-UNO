(()=>{
  function install(frame){
    try{
      const live=frame.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w)return false;
      if(d.documentElement.dataset.pendingUiFixes==='v1')return true;
      const play=d.getElementById('play'),loop=d.getElementById('loopToggle'),loopIn=d.getElementById('loopIn'),loopOut=d.getElementById('loopOut'),loopReset=d.getElementById('loopReset');
      const mod=d.querySelector('.mod'),modWheel=d.getElementById('modWheel');
      const eqIds=['low','mid','high'];
      if(!play||!loop||!loopIn||!loopOut||!loopReset||!mod||!modWheel||eqIds.some(id=>!d.getElementById(id)))return false;
      d.documentElement.dataset.pendingUiFixes='v1';

      const style=d.createElement('style');
      style.textContent=`
        .loop-control-row{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;width:100%!important;margin-top:0!important}
        .loop-control-row .btn{min-width:0!important;padding:7px 4px!important;font-size:8px!important;white-space:nowrap!important}
        .mod{grid-template-columns:minmax(0,1fr) 110px!important;align-items:start!important}
        .mod>.wheelbox{align-self:start!important;margin-top:34px!important;justify-self:center!important;width:110px!important}
        .eq-kill-btn{min-width:52px!important;padding:4px 6px!important;font-size:7px!important;letter-spacing:.08em!important}
        .eq-kill-btn.active{background:#4a0909!important;color:#ffd5cf!important;border-color:#b74d45!important;box-shadow:0 0 10px #d14a3f44!important}
        .eq-kill-row{grid-template-columns:1fr auto auto!important}
        @media(max-width:1000px){.mod{grid-template-columns:1fr!important}.mod>.wheelbox{margin:0 auto!important;width:auto!important}}
      `;
      d.head.appendChild(style);

      let loopRow=d.getElementById('loopControlRow');
      if(!loopRow){
        loopRow=d.createElement('div');loopRow.id='loopControlRow';loopRow.className='loop-control-row';
        const transport=play.closest('.transport');
        if(transport?.parentNode)transport.insertAdjacentElement('afterend',loopRow);else play.parentNode?.insertAdjacentElement('afterend',loopRow);
      }
      [loop,loopIn,loopOut,loopReset].forEach(el=>loopRow.appendChild(el));

      eqIds.forEach(id=>{
        const range=d.getElementById(id),box=range.closest('.fxbox');if(!box)return;
        const row=box.querySelector('.row');if(!row||row.querySelector(`[data-eq-kill="${id}"]`))return;
        row.classList.add('eq-kill-row');
        const button=d.createElement('button');button.type='button';button.className='btn eq-kill-btn';button.dataset.eqKill=id;button.textContent='KILL';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',id.toUpperCase()+' EQ kill');
        let saved=Number(range.value)||0,killed=false;
        const setValue=value=>{range.value=String(value);range.dispatchEvent(new w.Event('input',{bubbles:true}))};
        button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!killed){saved=Number(range.value)||0;setValue(Number(range.min)||-18);killed=true}else{setValue(saved);killed=false}button.classList.toggle('active',killed);button.setAttribute('aria-pressed',String(killed));button.textContent=killed?'KILLED':'KILL'});
        range.addEventListener('input',()=>{if(killed&&Number(range.value)!==(Number(range.min)||-18)){killed=false;button.classList.remove('active');button.setAttribute('aria-pressed','false');button.textContent='KILL'}});
        row.appendChild(button);
      });
      return true;
    }catch(_){return false}
  }
  window.installEnochianPendingUiFixes=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50)};
})();
