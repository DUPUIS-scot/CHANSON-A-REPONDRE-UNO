from pathlib import Path

p = Path('web/enochian-terminal/index.html')
s = p.read_text(encoding='utf-8')

# The stem repair has already landed on main. Keep this deploy-time repair
# idempotent so subsequent live deployments do not depend on obsolete anchors.
required = [
    "v=20260824-stem-lazy-v5",
    "m.preload='none'",
    "ensureStemMediaLoaded",
    "STEM FALLBACK · MASTER AUDIO",
    "setTimeout(stemDriftTick,1000)",
]
for marker in required:
    if marker not in s:
        raise SystemExit(f'missing current stem-runtime marker: {marker}')
if 'requestAnimationFrame(stemDriftTick)' in s:
    raise SystemExit('RAF stem drift loop unexpectedly present')

# Restore the reliable master PLAY transport that was prepared in the late
# canonical-play workflow but never landed in the terminal wrapper.
marker = 'RELIABLE BASE TRANSPORT'
if marker not in s:
    anchor = "  if(originalEnsureAudio)ensureAudio=async function(){return await originalEnsureAudio()};\n"
    if anchor not in s:
        raise SystemExit('reliable PLAY insertion anchor missing')
    play_patch = r'''  // RELIABLE BASE TRANSPORT: master playback must never depend on optional stems.
  const reliablePlay=q('play');
  if(reliablePlay){
   reliablePlay.onclick=async()=>{
    try{
     if(typeof a==='undefined'||!a)return;
     if(a.paused){
      try{if(originalEnsureAudio)await originalEnsureAudio();else if(typeof ensureAudio==='function')await ensureAudio()}catch(_){}
      try{if(typeof disablePitchPreservation==='function')disablePitchPreservation()}catch(_){}
      try{if(typeof applyPlaybackRate==='function')applyPlaybackRate()}catch(_){}
      await a.play();
      try{Promise.resolve(setStemMode()).catch(()=>{})}catch(_){}
     }else{
      a.pause();
     }
    }catch(error){
     try{log('PLAY ERROR · '+(error&&error.message?error.message:'UNKNOWN'))}catch(_){}
     try{if(a.paused)await a.play()}catch(_){}
    }
   };
  }
'''
    s = s.replace(anchor, anchor + play_patch, 1)

if marker not in s:
    raise SystemExit('reliable PLAY transport was not installed')

# Guard the other late-commit features while touching the wrapper.
for marker in [
    "window.__enochToggleFullscreen",
    "home.href='/'",
    "function platterTick",
    "RESET LOOP",
    "STEM ISOLATOR · AI COMPTROLLER",
]:
    if marker not in s:
        raise SystemExit(f'late Enochian feature missing: {marker}')

p.write_text(s, encoding='utf-8')
print('Enochian runtime verified; reliable master PLAY transport installed.')
