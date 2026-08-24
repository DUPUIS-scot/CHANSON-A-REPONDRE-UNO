from pathlib import Path

# Verify the authoritative shared Enochian runtime. Navigation is now owned by
# the terminal route and the shared live runtime must agree with the Flutter
# hash routes instead of restoring the old site-root handlers.
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
    "#/home",
    "#/djwho",
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
if "home.href='/'" in s or "window.top.location.replace('/')" in s:
    raise SystemExit('obsolete Enochian root navigation unexpectedly present')
if 'requestAnimationFrame(stemDriftTick)' in s:
    raise SystemExit('RAF stem drift loop unexpectedly present')

print('Enochian shared runtime verified: reliable PLAY, stems, Flutter navigation, fullscreen, loop and platter.')
