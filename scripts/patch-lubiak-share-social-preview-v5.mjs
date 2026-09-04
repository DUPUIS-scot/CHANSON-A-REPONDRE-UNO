import fs from 'node:fs';
const jsPath='web/lubiak/lubiak.js';
let s=fs.readFileSync(jsPath,'utf8');
if(!s.includes('LUBIAK_SHARE_MOMENT_LINK_V4')) throw new Error('moment link v4 missing');
if(!s.includes('LUBIAK_SHARE_SOCIAL_PREVIEW_V5')){
  const oldFn=`function buildLubiakMomentUrl(state=currentLubiakMomentState()){
  const url=new URL(location.href);
  url.hash='';
  url.searchParams.set('moment',encodeLubiakMoment(state));
  return url.toString();
}`;
  if(!s.includes(oldFn)) throw new Error('buildLubiakMomentUrl v4 anchor missing');
  const newFn=`// LUBIAK_SHARE_SOCIAL_PREVIEW_V5
// Share a crawler-friendly preview page. Humans are redirected from that page to the exact saved moment.
function buildLubiakMomentUrl(state=currentLubiakMomentState()){
  const url=new URL('/lubiak/share/',location.origin);
  url.searchParams.set('moment',encodeLubiakMoment(state));
  return url.toString();
}`;
  s=s.replace(oldFn,newFn);
  fs.writeFileSync(jsPath,s);
}

const shareDir='web/lubiak/share';
fs.mkdirSync(shareDir,{recursive:true});
const shareHtml=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>LUBIAK — Shared Moment</title>
<meta name="description" content="Open this exact LUBIAK moment in Chanson à Répondre UNO."/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="LUBIAK — Shared Moment"/>
<meta property="og:description" content="Open this exact LUBIAK moment in Chanson à Répondre UNO."/>
<meta property="og:url" content="https://www.chanson-a-repondre-uno.scot/lubiak/share/"/>
<meta property="og:image" content="https://www.chanson-a-repondre-uno.scot/lubiak/assets/ChatGPT%20Image%20Aug%2030%2C%202026%2C%2001_48_08%20AM.png"/>
<meta property="og:image:secure_url" content="https://www.chanson-a-repondre-uno.scot/lubiak/assets/ChatGPT%20Image%20Aug%2030%2C%202026%2C%2001_48_08%20AM.png"/>
<meta property="og:image:type" content="image/png"/>
<meta property="og:image:alt" content="LUBIAK — Chanson à Répondre UNO"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="LUBIAK — Shared Moment"/>
<meta name="twitter:description" content="Open this exact LUBIAK moment in Chanson à Répondre UNO."/>
<meta name="twitter:image" content="https://www.chanson-a-repondre-uno.scot/lubiak/assets/ChatGPT%20Image%20Aug%2030%2C%202026%2C%2001_48_08%20AM.png"/>
<meta name="robots" content="noindex,follow"/>
<link rel="canonical" href="https://www.chanson-a-repondre-uno.scot/lubiak/share/"/>
<meta name="theme-color" content="#050303"/>
<style>html,body{margin:0;width:100%;height:100%;background:#050303;color:#f0d7ad;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}body{display:grid;place-items:center;background:#050303 url('../assets/ChatGPT%20Image%20Aug%2030%2C%202026%2C%2001_48_08%20AM.png') center/cover no-repeat}.card{max-width:34rem;margin:1.5rem;padding:1rem 1.2rem;background:#080504dd;border:1px solid #c47b3d88;text-align:center}.title{font-weight:800;letter-spacing:.12em}.sub{margin-top:.6rem;opacity:.78;font-size:.82rem}</style>
</head>
<body><div class="card"><div class="title">LUBIAK</div><div class="sub">OPENING SHARED MOMENT…</div></div>
<script>
(() => {
  const p=new URLSearchParams(location.search);
  const moment=p.get('moment');
  const target=new URL('../',location.href);
  target.search='';target.hash='';
  if(moment) target.searchParams.set('moment',moment);
  window.location.replace(target.toString());
})();
</script>
</body></html>`;
fs.writeFileSync(shareDir+'/index.html',shareHtml);
console.log('Installed LUBIAK exact-moment social preview link v5.');
