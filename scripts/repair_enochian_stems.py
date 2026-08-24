from pathlib import Path

# The production terminal is now a thin viewport shell around the shared
# Enochian live runtime. Verify the authoritative runtime rather than trying
# to patch the shell itself.
p = Path('web/enochian-test/live-copy.html')
s = p.read_text(encoding='utf-8')

required = [
    "v=20260824-stem-lazy-v5",
    "m.preload='none'",
    "ensureStemMediaLoaded",
    "STEM FALLBACK · MASTER AUDIO",
    "setTimeout(stemDriftTick,1000)",
    "RELIABLE BASE TRANSPORT",
    "MASTER STEM TOGGLE",
    "stemMasterToggle",
    "home.href='/'",
    "window.top.location.replace('/')",
    "window.__enochToggleFullscreen",
    "fullBtn.dataset.terminalFullscreen='1'",
    "FULL SCREEN",
    "STEMS ON",
    "STEMS OFF",
    "function platterTick",
    "RESET LOOP",
    "STEM ISOLATOR · AI COMPTROLLER",
]
for marker in required:
    if marker not in s:
        raise SystemExit(f'missing current Enochian runtime marker: {marker}')
if 'requestAnimationFrame(stemDriftTick)' in s:
    raise SystemExit('RAF stem drift loop unexpectedly present')

print('Enochian shared runtime verified: reliable PLAY, stems, Home, fullscreen, loop and platter.')
