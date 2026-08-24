(function(){
  'use strict';
  const SHARE_BASE='https://www.chanson-a-repondre-uno.scot/share/enochian/';
  const SUPABASE_URL='https://dedwajzurhqrnyzrxouo.supabase.co';
  const SUPABASE_KEY='sb_publishable_GY7s6hyG5qDHmQL1zHy1xA_y-67jVKZ';
  function ready(){return typeof a!=='undefined'&&a&&typeof idx!=='undefined'&&typeof tracks!=='undefined';}
  function fmt(t){t=Math.max(0,Number(t)||0);const m=Math.floor(t/60),s=(t-m*60).toFixed(1).padStart(4,'0');return String(m).padStart(2,'0')+':'+s;}
  async function incrementShareCount(){
    try{
      await fetch(SUPABASE_URL+'/rest/v1/rpc/record_social_preview_share',{
        method:'POST',
        headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({p_share_kind:'enochian_15s'})
      });
    }catch(_){}
  }
  function makeUrl(){
    const end=Math.max(0,Number(a.currentTime)||0);
    const start=Math.max(0,end-15);
    const u=new URL(SHARE_BASE);
    u.searchParams.set('track',String(Math.max(0,Math.min(tracks.length-1,Number(idx)||0))));
    u.searchParams.set('start',start.toFixed(3));
    u.searchParams.set('end',end.toFixed(3));
    return {url:u.toString(),start,end,name:(tracks[idx]&&tracks[idx][0])||'DJ WHO'};
  }
  async function shareLast15(btn){
    if(!ready())return;
    const clip=makeUrl();
    const title='Chanson à Répondre UNO! · ENOCHIAN TERMINAL';
    const text='DJ WHO · '+clip.name+' · last 15 sec ('+fmt(clip.start)+'–'+fmt(clip.end)+')';
    let shared=false;
    try{
      if(navigator.share){await navigator.share({title,text,url:clip.url});shared=true;}
    }catch(e){if(e&&e.name==='AbortError')return;}
    if(!shared){
      try{await navigator.clipboard.writeText(clip.url);shared=true;}catch(_){
        try{const ta=document.createElement('textarea');ta.value=clip.url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();shared=true;}catch(__){}
      }
    }
    if(shared)await incrementShareCount();
    const old=btn.textContent;
    btn.textContent=shared?'COPIED · 15 SEC':'SHARE LINK';
    btn.classList.add('active');
    setTimeout(()=>{btn.textContent=old;btn.classList.remove('active');},1600);
    try{if(typeof log==='function')log('SHARE LAST 15 SEC · '+clip.name+' · '+fmt(clip.start)+' → '+fmt(clip.end));}catch(_){}
  }
  function install(){
    if(!ready())return false;
    if(document.getElementById('shareLast15'))return true;
    let actions=document.querySelector('.terminal-actions');
    if(!actions){
      const top=document.querySelector('.top');
      if(!top)return false;
      actions=document.createElement('div');actions.className='terminal-actions';top.appendChild(actions);
    }
    const btn=document.createElement('button');
    btn.type='button';btn.id='shareLast15';btn.className='btn terminal-action';
    btn.textContent='SHARE 15 SEC';btn.title='Share the last 15 seconds played';btn.setAttribute('aria-label','Share last 15 seconds played');
    btn.addEventListener('click',()=>shareLast15(btn));
    const full=actions.querySelector('[data-terminal-fullscreen]');
    if(full)actions.insertBefore(btn,full);else actions.appendChild(btn);
    return true;
  }
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>300)clearInterval(timer);},50);
})();
