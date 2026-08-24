from pathlib import Path

p = Path('web/enochian-terminal/index.html')
s = p.read_text(encoding='utf-8')

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

# Reliable master PLAY transport.
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

# Master STEMS ON/OFF gate. Individual VOCALS / DRUMS / INSTRUMENTS controls remain unchanged.
if 'MASTER STEM TOGGLE' not in s:
    anchor = "  const leftSide=q('track')&&q('track').closest('.side');\n"
    if anchor not in s:
        raise SystemExit('master stem toggle insertion anchor missing')
    stem_toggle_patch = r'''  // MASTER STEM TOGGLE: enable/disable the complete stem engine without affecting master playback.
  let stemsEnabled=true;
  const setStemModeCore=setStemMode;
  setStemMode=async function(){
   if(!stemsEnabled){
    stemMode=false;
    Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});
    try{if(!originalDeckConnected&&src&&low){src.connect(low);originalDeckConnected=true}}catch(_){}
    updateStemUi();
    return;
   }
   return await setStemModeCore();
  };
'''
    s = s.replace(anchor, stem_toggle_patch + anchor, 1)

# Add the master stem toggle beside the existing FULL SCREEN action.
if "stemMasterToggle" not in s:
    anchor = "   const badgeEl=q('badge');const actions=document.createElement('div');actions.className='terminal-actions';\n"
    if anchor not in s:
        raise SystemExit('terminal action insertion anchor missing')
    action_patch = r'''   let stemBtn=document.createElement('button');stemBtn.type='button';stemBtn.className='btn terminal-action active';stemBtn.id='stemMasterToggle';stemBtn.textContent='STEMS ON';stemBtn.setAttribute('aria-pressed','true');
   stemBtn.onclick=async()=>{stemsEnabled=!stemsEnabled;stemBtn.classList.toggle('active',stemsEnabled);stemBtn.textContent=stemsEnabled?'STEMS ON':'STEMS OFF';stemBtn.setAttribute('aria-pressed',String(stemsEnabled));try{await setStemMode()}catch(_){};try{log('STEMS '+(stemsEnabled?'ON':'OFF'))}catch(_){}};
'''
    s = s.replace(anchor, anchor + action_patch, 1)
    s = s.replace("   actions.appendChild(fullBtn);if(badgeEl)actions.appendChild(badgeEl);top.appendChild(actions);", "   actions.appendChild(stemBtn);actions.appendChild(fullBtn);if(badgeEl)actions.appendChild(badgeEl);top.appendChild(actions);", 1)

# Guard Home -> app main screen and fullscreen action.
for marker in [
    "home.href='/'",
    "window.top.location.replace('/')",
    "window.__enochToggleFullscreen",
    "fullBtn.dataset.terminalFullscreen='1'",
    "FULL SCREEN",
    "stemMasterToggle",
    "STEMS ON",
    "STEMS OFF",
    "function platterTick",
    "RESET LOOP",
    "STEM ISOLATOR · AI COMPTROLLER",
]:
    if marker not in s:
        raise SystemExit(f'late Enochian feature missing: {marker}')

p.write_text(s, encoding='utf-8')
print('Enochian runtime verified: reliable PLAY, STEMS ON/OFF, Home main screen, fullscreen.')
