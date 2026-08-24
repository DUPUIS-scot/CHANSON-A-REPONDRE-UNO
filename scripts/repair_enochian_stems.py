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
    "stem-separator-control.js?v=20260824-v7",
    "transport-stem-sync.js?v=20260824-v3",
    "analyser-data-bus.js?v=20260824-v1",
    "analyser-composite-signal.js?v=20260824-v9",
    "analyser-signal-glide.js?v=20260824-v5",
    "analyser-signal-3d.js?v=20260824-v5",
    "analyser-expand-overlay.js?v=20260824-v8",
    "installEnochianTransportStemSync",
    "installEnochianAnalyserDataBus",
    "installEnochianAnalyserSignalGlide",
    "installEnochianAnalyserSignal3D",
    "installEnochianAnalyserExpandOverlay",
    "target-viewport.js?v=20260824-v9",
    "iphone-landscape-layout-v2.js?v=20260824-deep-v19",
]
for marker in shell_required:
    if marker not in shell:
        raise SystemExit(f'missing terminal shell marker: {marker}')

for required_file in [
    Path('web/enochian-test/stem-separator-control.js'),
    Path('web/enochian-test/transport-stem-sync.js'),
    Path('web/enochian-test/analyser-data-bus.js'),
    Path('web/enochian-test/analyser-composite-signal.js'),
    Path('web/enochian-test/analyser-signal-glide.js'),
    Path('web/enochian-test/analyser-signal-3d.js'),
    Path('web/enochian-test/analyser-expand-overlay.js'),
]:
    if not required_file.is_file() or required_file.stat().st_size == 0:
        raise SystemExit(f'missing Enochian repair layer: {required_file}')

stem_control = Path('web/enochian-test/stem-separator-control.js').read_text(encoding='utf-8')
bus = Path('web/enochian-test/analyser-data-bus.js').read_text(encoding='utf-8')
composite = Path('web/enochian-test/analyser-composite-signal.js').read_text(encoding='utf-8')
three_d = Path('web/enochian-test/analyser-signal-3d.js').read_text(encoding='utf-8')
glide = Path('web/enochian-test/analyser-signal-glide.js').read_text(encoding='utf-8')
overlay = Path('web/enochian-test/analyser-expand-overlay.js').read_text(encoding='utf-8')
transport = Path('web/enochian-test/transport-stem-sync.js').read_text(encoding='utf-8')
if "__enochAnalyserBus" not in bus or "__enochAnalyserBus" not in composite or "__enochAnalyserBus" not in three_d:
    raise SystemExit('unified analyser bus contract missing')
if "stemSeparatorControl='v7'" not in stem_control or 'startMedia' not in stem_control:
    raise SystemExit('live stem operator contract missing')
if "transportStemSync='v3'" not in transport or 'hardLoopSync' not in transport or 'loop-timing' not in transport:
    raise SystemExit('hard loop synchronization / live timer contract missing')
if '__compositeCapture' in composite or '__enoch3dCapture' in three_d:
    raise SystemExit('legacy independent analyser wrappers unexpectedly present')
if "analyserSignalGlide='v5'" not in glide or "analyserSignal3d='v5'" not in three_d:
    raise SystemExit('current sculptable 3D analyser contract missing')
if "analyserExpandOverlay='v8'" not in overlay or 'DRAG ANALYSER WINDOW' not in overlay or "addEventListener('pointermove',move,true)" not in overlay:
    raise SystemExit('full-viewport floating analyser drag contract missing')

print('Enochian runtime verified: master transport, live stem operator, hard loop sync with timer, unified analyser bus, sculptable 3D analyser, full-viewport floating analyser, navigation and fullscreen.')
