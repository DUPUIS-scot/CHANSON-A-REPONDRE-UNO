from pathlib import Path
import subprocess

runtime_path = Path('web/enochian-test/live-copy.html')
s = runtime_path.read_text(encoding='utf-8')
shell_path = Path('web/enochian-terminal/index.html')
shell = shell_path.read_text(encoding='utf-8')

runtime_required = [
    "v=20260824-stem-lazy-v5",
    "m.preload='none'",
    "ensureStemMediaLoaded",
    "STEM FALLBACK · MASTER AUDIO",
    "setTimeout(stemDriftTick,500)",
    "RELIABLE BASE TRANSPORT",
    "MASTER STEM TOGGLE",
    "stemMasterToggle",
    "masterGate",
    "ensureMasterGate",
    "setMasterRoute",
    "diff*.12",
    "Math.abs(diff)>.035",
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
    "live-copy.html?v=20260825-deep-repair-v1",
    "installReliableNavigation",
    "home.href='/#/home'",
    "go('#/home')",
    "go('#/djwho')",
    "installConsoleAuthority",
    "installReliableFullscreen",
    "syncResponsiveLayout",
    "authoritative-runtime.js?v=20260825-deep-repair-v1",
    "outer-analyser-panel.js?v=20260824-v2",
    "analyser-data-bus.js?v=20260824-v2",
    "analyser-composite-signal.js?v=20260824-v9",
    "analyser-signal-glide.js?v=20260824-v5",
    "analyser-signal-3d.js?v=20260824-v6",
    "sculpt-audio-mod.js?v=20260824-v2",
    "ios-touch-tuning.js?v=20260824-v1",
    "installEnochianAuthoritativeRuntime",
    "installEnochianOuterAnalyserPanel",
    "installEnochianAnalyserDataBus",
    "installEnochianAnalyserSignalGlide",
    "installEnochianAnalyserSignal3D",
    "installEnochianSculptAudioMod",
    "installEnochianIOSTouchTuning",
    "target-viewport.js?v=20260825-deep-repair-v1",
    "iphone-landscape-layout-v2.js?v=20260824-deep-v19",
]
for marker in shell_required:
    if marker not in shell:
        raise SystemExit(f'missing terminal shell marker: {marker}')
for stale in [
    "stem-separator-control.js?v=20260824-v7",
    "transport-stem-sync.js?v=20260824-v3",
    "analyser-expand-overlay.js?v=20260824-v8",
    "authoritative-runtime.js?v=20260824-v3",
    "authoritative-runtime.js?v=20260824-v4",
]:
    if stale in shell:
        raise SystemExit(f'legacy competing runtime still loaded: {stale}')

required_files = [
    Path('web/enochian-test/authoritative-runtime.js'),
    Path('web/enochian-test/outer-analyser-panel.js'),
    Path('web/enochian-test/analyser-data-bus.js'),
    Path('web/enochian-test/analyser-composite-signal.js'),
    Path('web/enochian-test/analyser-signal-glide.js'),
    Path('web/enochian-test/analyser-signal-3d.js'),
    Path('web/enochian-test/sculpt-audio-mod.js'),
    Path('web/enochian-test/ios-touch-tuning.js'),
]
for required_file in required_files:
    if not required_file.is_file() or required_file.stat().st_size == 0:
        raise SystemExit(f'missing Enochian runtime layer: {required_file}')

for js_file in [
    Path('web/enochian-test/authoritative-runtime.js'),
    Path('web/enochian-test/outer-analyser-panel.js'),
    Path('web/enochian-test/analyser-data-bus.js'),
    Path('web/enochian-test/analyser-signal-3d.js'),
    Path('web/enochian-test/ios-touch-tuning.js'),
]:
    subprocess.run(['node', '--check', str(js_file)], check=True)

authority = Path('web/enochian-test/authoritative-runtime.js').read_text(encoding='utf-8')
outer_panel = Path('web/enochian-test/outer-analyser-panel.js').read_text(encoding='utf-8')
bus = Path('web/enochian-test/analyser-data-bus.js').read_text(encoding='utf-8')
composite = Path('web/enochian-test/analyser-composite-signal.js').read_text(encoding='utf-8')
three_d = Path('web/enochian-test/analyser-signal-3d.js').read_text(encoding='utf-8')
glide = Path('web/enochian-test/analyser-signal-glide.js').read_text(encoding='utf-8')
sculpt_audio = Path('web/enochian-test/sculpt-audio-mod.js').read_text(encoding='utf-8')
touch = Path('web/enochian-test/ios-touch-tuning.js').read_text(encoding='utf-8')

required_authority = [
    "authoritativeRuntime==='v5'",
    "__enochStemAuthority={version:'v5'",
    "__enochLoopAuthority={version:'v5'",
    "__enochNativeStemEngine={version:'v2'",
    "masterConnected",
    "routed:",
    "stemGains",
    "stemState",
    "setTargetAtTime",
    "setEnabled(on)",
    "setRow(key,on)",
    "setLevel(key,value)",
    "STEMS FALLBACK",
    "LOOP CYCLE",
    "remainingMs",
    "master.addEventListener('ended'",
    "wrap(true)",
    "sync(force=false)",
    "engine.sync(true)",
]
for marker in required_authority:
    if marker not in authority:
        raise SystemExit(f'native Web Audio stem/loop authority marker missing: {marker}')
if 'requestAnimationFrame' in authority:
    raise SystemExit('authoritative loop unexpectedly depends on requestAnimationFrame')
if 'master.muted=true' in authority or 'm.volume=' in authority or 'createMediaElementSource' in authority:
    raise SystemExit('secondary stem mixer/audio graph unexpectedly present')
if "VERSION='v2'" not in touch or 'installStemMasterPanel' not in touch or 'stem-master-slot' not in touch or 'stem-master-in-panel' not in touch or "getElementById('stemMasterToggle')" not in touch:
    raise SystemExit('persistent stem master ON/OFF panel contract missing')
if "outerAnalyserPanel==='v2'" not in outer_panel or 'DRAG ANALYSER WINDOW' not in outer_panel or 'outer-float-launch' not in outer_panel or 'outerAnalyserLaunchStyle' not in outer_panel or 'localStorage' not in outer_panel:
    raise SystemExit('outer terminal analyser panel contract missing')
if "__enochAnalyserBus" not in bus or "__enochAnalyserBus" not in composite or "__enochAnalyserBus" not in three_d:
    raise SystemExit('unified analyser bus contract missing')
if "version:'v2'" not in bus or "frequency:null" not in bus or "bus.emit('frequency'" not in bus:
    raise SystemExit('FFT analyser bus v2 contract missing')
if '__compositeCapture' in composite or '__enoch3dCapture' in three_d:
    raise SystemExit('legacy independent analyser wrappers unexpectedly present')
if "analyserSignalGlide='v5'" not in glide or "analyserSignal3d='v6'" not in three_d or "latestSource='none'" not in three_d or "writeIndex" not in three_d or "rowAt" not in three_d:
    raise SystemExit('current FFT sculptable 3D analyser contract missing')
if "sculptAudioMod='v2'" not in sculpt_audio or "version:'v2'" not in sculpt_audio or '__enochSculptAudio' not in sculpt_audio or 'restoreBase' not in sculpt_audio or 'SCULPT AUDIO' not in sculpt_audio:
    raise SystemExit('sculpt-to-audio modulation v2 contract missing')

print('Enochian runtime verified: persistent stem master ON/OFF inside isolator, native Web Audio stem bridge with exclusive master/stem routing and smoothed GainNode mix, authoritative transport-clock loop with forced end wrap, outer floating analyser, unified FFT analyser bus, ring-buffered 3D signal history, reversible sculpt-to-audio, navigation and outer fullscreen.')
