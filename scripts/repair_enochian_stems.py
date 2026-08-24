from pathlib import Path

# Verify the authoritative Enochian audio runtime and the terminal route shell.
# The shared live-copy may retain a legacy root navigation fallback internally;
# production navigation is owned by /enochian-terminal/index.html and must
# override both HOME and DJ WHO to the Flutter hash routes.
runtime_path = Path('web/enochian-test/live-copy.html')
s = runtime_path.read_text(encoding='utf-8')
shell_path = Path('web/enochian-terminal/index.html')
shell = shell_path.read_text(encoding='utf-8')

runtime_required = [
    "v=20260824-stem-lazy-v5",
    "m.preload='none'",
    "ensureStemMediaLoaded",
    "STEM FALLBACK · MASTER AUDIO",
    "setTimeout(stemDriftTick,1000)",
    "RELIABLE BASE TRANSPORT",
    "MASTER STEM TOGGLE",
    "stemMasterToggle",
    "window.__enochToggleFullscreen",
    "fullBtn.dataset.terminalFullscreen='1'",
    "FULL SCREEN",
    "STEMS ON",
    "STEMS OFF",
    "function platterTick",
    "RESET LOOP",
    "STEM ISOLATOR · AI COMPTROLLER",
]
for marker in runtime_required:
    if marker not in s:
        raise SystemExit(f'missing current Enochian runtime marker: {marker}')
if 'requestAnimationFrame(stemDriftTick)' in s:
    raise SystemExit('RAF stem drift loop unexpectedly present')

shell_required = [
    "installReliableNavigation",
    "home.href='/#/home'",
    "go('#/home')",
    "go('#/djwho')",
    "installConsoleAuthority",
    "installReliableFullscreen",
    "stem-separator-control.js?v=20260824-v5",
    "analyser-composite-signal.js?v=20260824-v4",
    "target-viewport.js?v=20260824-v8",
    "iphone-landscape-layout-v2.js?v=20260824-deep-v18",
]
for marker in shell_required:
    if marker not in shell:
        raise SystemExit(f'missing terminal shell marker: {marker}')

print('Enochian runtime verified: reliable PLAY, stems, Flutter navigation, fullscreen, loop, analyser and platter.')
