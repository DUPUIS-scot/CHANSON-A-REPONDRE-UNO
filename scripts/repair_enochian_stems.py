from pathlib import Path
import re

p = Path('web/enochian-terminal/index.html')
s = p.read_text(encoding='utf-8')

s = s.replace('v=20260824-runtime-fixes-v3', 'v=20260824-stem-lazy-v5')
s = s.replace('v=20260824-canonical-play-v4', 'v=20260824-stem-lazy-v5')

old_create = "Object.entries(stemFiles).forEach(([key,url])=>{const m=document.createElement('audio');m.preload='auto';m.src=url;m.setAttribute('aria-hidden','true');m.style.display='none';document.body.appendChild(m);stemMedia[key]=m});"
new_create = "Object.entries(stemFiles).forEach(([key,url])=>{const m=document.createElement('audio');m.preload='none';m.dataset.src=url;m.setAttribute('aria-hidden','true');m.style.display='none';document.body.appendChild(m);stemMedia[key]=m});"
if old_create not in s:
    raise SystemExit('stem media creation anchor missing')
s = s.replace(old_create, new_create, 1)

old_graph = "  async function ensureStemGraph(){if(stemsReady)return;if(typeof ctx==='undefined'||!ctx||typeof low==='undefined'||!low)return;Object.keys(stemMedia).forEach(key=>{const node=ctx.createMediaElementSource(stemMedia[key]);const gain=ctx.createGain();gain.gain.value=stemGainValue(key);node.connect(gain).connect(low);stemSources[key]=node;stemGains[key]=gain});stemsReady=true;applyStemGains();try{log('STEMS READY · VOCALS / DRUMS / BASS / OTHER')}catch(_){}}"
new_graph = "  async function ensureStemMediaLoaded(){const waits=Object.values(stemMedia).map(m=>new Promise((resolve,reject)=>{if(m.readyState>=2)return resolve();const ok=()=>{cleanup();resolve()},bad=()=>{cleanup();reject(new Error('STEM LOAD FAILED'))},cleanup=()=>{m.removeEventListener('loadeddata',ok);m.removeEventListener('error',bad)};m.addEventListener('loadeddata',ok,{once:true});m.addEventListener('error',bad,{once:true});if(!m.src){m.src=m.dataset.src||'';m.load()}}));await Promise.all(waits)}\n" + old_graph
if old_graph not in s:
    raise SystemExit('stem graph anchor missing')
s = s.replace(old_graph, new_graph, 1)

new_mode = "  async function setStemMode(){const ai=isAiComptroller();if(!ai){stemMode=false;Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});try{if(!originalDeckConnected&&src&&low){src.connect(low);originalDeckConnected=true}}catch(_){};updateStemUi();return}if(stemMode){updateStemUi();return}try{if(originalEnsureAudio)await originalEnsureAudio();else if(typeof ensureAudio==='function')await ensureAudio()}catch(_){};try{await ensureStemMediaLoaded();await ensureStemGraph();syncStemTimes(true);setStemRate();applyStemGains();if(!a.paused){await Promise.all(Object.values(stemMedia).map(m=>m.play()));try{if(originalDeckConnected&&src){src.disconnect();originalDeckConnected=false}}catch(_){}}stemMode=true;try{log('STEM MODE · AI COMPTROLLER')}catch(_){}}catch(error){stemMode=false;Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});try{if(!originalDeckConnected&&src&&low){src.connect(low);originalDeckConnected=true}}catch(_){};try{log('STEM FALLBACK · MASTER AUDIO')}catch(_){}}updateStemUi()}\n"
pattern_mode = re.compile(r"  async function setStemMode\(\)\{.*?\n  const originalEnsureAudio=", re.S)
s, n = pattern_mode.subn(new_mode + "  const originalEnsureAudio=", s, count=1)
if n != 1:
    raise SystemExit('stem mode anchor missing')

pattern_wrap = re.compile(r"  if\(originalEnsureAudio\)ensureAudio=async function\(\)\{.*?\};")
s, n = pattern_wrap.subn("  if(originalEnsureAudio)ensureAudio=async function(){return await originalEnsureAudio()};", s, count=1)
if n != 1:
    raise SystemExit('ensureAudio wrapper anchor missing')

pattern_events = re.compile(r"  try\{a\.addEventListener\('play'.*?\n  function stemDriftTick\(now\).*?updateStemUi\(\);", re.S)
new_events = "  try{a.addEventListener('play',()=>{if(isAiComptroller()&&!stemMode){Promise.resolve(setStemMode()).catch(()=>{});return}if(stemMode){syncStemTimes(true);setStemRate();Object.values(stemMedia).forEach(m=>Promise.resolve(m.play()).catch(()=>{}))}});a.addEventListener('pause',()=>{if(stemMode)Object.values(stemMedia).forEach(m=>m.pause())});a.addEventListener('seeking',()=>syncStemTimes(true));a.addEventListener('seeked',()=>syncStemTimes(true));a.addEventListener('ratechange',setStemRate);q('track')?.addEventListener('change',()=>setTimeout(()=>{updateStemUi();if(!a.paused&&isAiComptroller())Promise.resolve(setStemMode()).catch(()=>{});else if(!isAiComptroller())Promise.resolve(setStemMode()).catch(()=>{})},0));q('prev')?.addEventListener('click',()=>setTimeout(()=>q('track')?.dispatchEvent(new Event('change')),0));q('next')?.addEventListener('click',()=>setTimeout(()=>q('track')?.dispatchEvent(new Event('change')),0))}catch(_){}\n  function stemDriftTick(){if(stemMode&&!a.paused){syncStemTimes(false);setStemRate()}setTimeout(stemDriftTick,1000)}setTimeout(stemDriftTick,1000);updateStemUi();"
s, n = pattern_events.subn(new_events, s, count=1)
if n != 1:
    raise SystemExit('stem event/drift anchor missing')

if "m.preload='auto'" in s:
    raise SystemExit('eager stem preload remains')
if 'requestAnimationFrame(stemDriftTick)' in s:
    raise SystemExit('RAF stem drift loop remains')
if 'STEM FALLBACK · MASTER AUDIO' not in s:
    raise SystemExit('master fallback missing')

p.write_text(s, encoding='utf-8')
print('Enochian stem runtime patched: lazy loading, master fallback, 1s drift correction.')
