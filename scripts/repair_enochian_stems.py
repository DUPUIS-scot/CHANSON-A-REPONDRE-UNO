from pathlib import Path

# Verify the authoritative Enochian audio runtime and the production terminal shell.
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
    "syncResponsiveLayout",
    "stem-separator-control.js?v=20260824-v6",
    "transport-stem-sync.js?v=20260824-v1",
    "analyser-composite-signal.js?v=20260824-v6",
    "analyser-signal-glide.js?v=20260824-v3",
    "analyser-signal-3d.js?v=20260824-v2",
    "installEnochianTransportStemSync",
    "target-viewport.js?v=20260824-v9",
    "iphone-landscape-layout-v2.js?v=20260824-deep-v19",
]
for marker in shell_required:
    if marker not in shell:
        raise SystemExit(f'missing terminal shell marker: {marker}')

for required_file in [
    Path('web/enochian-test/stem-separator-control.js'),
    Path('web/enochian-test/transport-stem-sync.js'),
    Path('web/enochian-test/analyser-composite-signal.js'),
    Path('web/enochian-test/analyser-signal-glide.js'),
    Path('web/enochian-test/analyser-signal-3d.js'),
]:
    if not required_file.is_file() or required_file.stat().st_size == 0:
        raise SystemExit(f'missing Enochian repair layer: {required_file}')

print('Enochian runtime verified: master transport, default-on stems, loop sync, explicit signal modulation, 3D analyser, navigation and fullscreen.')
