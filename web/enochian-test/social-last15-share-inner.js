(function(){
  'use strict';
  const SHARE_BASE='https://www.chanson-a-repondre-uno.scot/share/enochian/';
  const runtime=window.__UNO_RUNTIME_CONFIG__||{};
  const productionHost=location.hostname==='www.chanson-a-repondre-uno.scot'||location.hostname==='chanson-a-repondre-uno.scot';
  const SUPABASE_URL=runtime.supabaseUrl||(productionHost?'https://dedwajzurhqrnyzrxouo.supabase.co':'');
  const SUPABASE_KEY=runtime.supabasePublishableKey||(productionHost?'sb_publishable_GY7s6hyG5qDHmQL1zHy1xA_y-67jVKZ':'');
  const WINDOW_MS=15000,SAMPLE_MS=250;
  const history=[];
  function ready(){return typeof a!=='undefined'&&a&&typeof idx!=='undefined'&&typeof tracks!=='undefined';}
  function n(id,fallback=0){const el=document.getElementById(id);const v=el?Number(el.value):NaN;return Number.isFinite(v)?v:fallback;}
  function fmt(t){t=Math.max(0,Number(t)||0);const m=Math.floor(t/60),s=(t-m*60).toFixed(1).padStart(4,'0');return String(m).padStart(2,'0')+':'+s;}
  function snap(){
    if(!ready()||a.paused)return;
    const now=performance.now();
    history.push([Math.round(now),Number(a.currentTime)||0,
      Math.round(n('low')*10)/10,Math.round(n('mid')*10)/10,Math.round(n('high')*10)/10,
      Math.round(n('filter')||1000),Math.round(n('drive')),Math.round(n('delay')*1000)/1000,
      Math.round(n('fb')*1000)/1000,Math.round(n('wet')*1000)/1000,Math.round((Number(a.playbackRate)||1)*1000)/1000]);
    while(history.length&&now-history[0][0]>WINDOW_MS+1000)history.shift();
  }
  function encodeFx(rows){
    try{
      if(!rows.length)return '';
      const t0=rows[0][0],packed=rows.map(r=>[Math.max(0,Math.round(r[0]-t0)),...r.slice(2)]);
      const bytes=new TextEncoder().encode(JSON.stringify({v:1,s:SAMPLE_MS,r:packed}));
      let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));
      return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    }catch(_){return ''}
  }
  async function incrementShareCount(){
    if(!SUPABASE_URL||!SUPABASE_KEY)return;
    try{await fetch(SUPABASE_URL+'/rest/v1/rpc/record_social_preview_share',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_share_kind:'enochian_15s_fx'})});}catch(_){}
  }
  function makeUrl(){
    const end=Math.max(0,Number(a.currentTime)||0),start=Math.max(0,end-15),now=performance.now();
    const rows=history.filter(r=>now-r[0]<=WINDOW_MS+SAMPLE_MS);
    const u=new URL(SHARE_BASE);
    u.searchParams.set('track',String(Math.max(0,Math.min(tracks.length-1,Number(idx)||0))));
    u.searchParams.set('start',start.toFixed(3));u.searchParams.set('end',end.toFixed(3));
    const fx=encodeFx(rows);if(fx)u.searchParams.set('fx',fx);
    return {url:u.toString(),start,end,name:(tracks[idx]&&tracks[idx][0])||'DJ WHO',fxFrames:rows.length};
  }
  async function shareLast15(btn){
    if(!ready())return;
    const clip=makeUrl(),title='Chanson à Répondre UNO! · ENOCHIAN TERMINAL';
    const text='DJ WHO · '+clip.name+' · last 15 sec with FX ('+fmt(clip.start)+'–'+fmt(clip.end)+')';
    let shared=false;
    try{if(navigator.share){await navigator.share({title,text,url:clip.url});shared=true;}}catch(e){if(e&&e.name==='AbortError')return;}
    if(!shared){try{await navigator.clipboard.writeText(clip.url);shared=true;}catch(_){try{const ta=document.createElement('textarea');ta.value=clip.url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();shared=true;}catch(__){}}}
    if(shared)await incrementShareCount();
    const old=btn.textContent;btn.textContent=shared?'COPIED · FX 15 SEC':'SHARE LINK';btn.classList.add('active');
    setTimeout(()=>{btn.textContent=old;btn.classList.remove('active');},1600);
    try{if(typeof log==='function')log('SHARE LAST 15 SEC · FX RECORDED · '+clip.fxFrames+' FRAMES · '+clip.name+' · '+fmt(clip.start)+' → '+fmt(clip.end));}catch(_){}
  }
  function install(){
    if(!ready())return false;
    if(!window.__enochFxShareRecorder){window.__enochFxShareRecorder={version:'v1',history};setInterval(snap,SAMPLE_MS);}
    if(document.getElementById('shareLast15'))return true;
    let actions=document.querySelector('.terminal-actions');if(!actions){const top=document.querySelector('.top');if(!top)return false;actions=document.createElement('div');actions.className='terminal-actions';top.appendChild(actions);}
    const btn=document.createElement('button');btn.type='button';btn.id='shareLast15';btn.className='btn terminal-action';btn.textContent='SHARE 15 SEC';btn.title='Share the last 15 seconds with recorded FX';btn.setAttribute('aria-label','Share last 15 seconds with recorded FX');btn.addEventListener('click',()=>shareLast15(btn));
    const full=actions.querySelector('[data-terminal-fullscreen]');if(full)actions.insertBefore(btn,full);else actions.appendChild(btn);return true;
  }
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>300)clearInterval(timer);},50);
})();
