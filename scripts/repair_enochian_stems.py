from pathlib import Path
import subprocess

runtime = Path('web/enochian-test/live-copy.html').read_text(encoding='utf-8')
shell = Path('web/enochian-terminal/index.html').read_text(encoding='utf-8')
authority_path = Path('web/enochian-test/analyser-live-authority-v1.js')
authority_loader = authority_path.read_text(encoding='utf-8')
stem_link = Path('web/enochian-test/double-decker-main-stem-link-v1.js').read_text(encoding='utf-8')
runtime_repair = Path('web/enochian-test/double-jecker-runtime-repair-v1.js').read_text(encoding='utf-8')

runtime_required = [
    "v=20260824-stem-lazy-v5", "m.preload='none'", "ensureStemMediaLoaded",
    "STEM FALLBACK · MASTER AUDIO", "setTimeout(stemDriftTick,500)",
    "RELIABLE BASE TRANSPORT", "MASTER STEM TOGGLE", "window.__enochStemRuntimeApi=",
    "stemMasterToggle", "masterGate", "ensureMasterGate", "setMasterRoute",
    "diff*.12", "Math.abs(diff)>.035", "window.__enochToggleFullscreen",
    "fullBtn.dataset.terminalFullscreen='1'", "FULL SCREEN", "STEMS ON", "STEMS OFF",
    "function platterTick", "RESET LOOP", "STEM ISOLATOR · AI COMPTROLLER",
]
for marker in runtime_required:
    if marker not in runtime:
        raise SystemExit(f'missing current Enochian runtime marker: {marker}')
if 'requestAnimationFrame(stemDriftTick)' in runtime:
    raise SystemExit('RAF stem drift loop unexpectedly present')

shell_required = [
    "live-copy.html?v=20260827-cache-repair-v4", "installReliableNavigation",
    "home.href='/#/home'", "go('#/home')", "go('#/djwho')", "installConsoleAuthority",
    "installReliableFullscreen", "syncResponsiveLayout",
    "authoritative-runtime.js?v=20260825-runtime-api-v2",
    "outer-analyser-panel.js?v=20260826-floating-controls-v3",
    "analyser-data-bus.js?v=20260824-v2", "analyser-composite-signal.js?v=20260824-v9",
    "analyser-signal-glide.js?v=20260826-wheel-sculpt-v7",
    "analyser-signal-3d-v7.js?v=20260827-mesh-track-wave-v8",
    "sculpt-audio-mod.js?v=20260825-v3", "pending-ui-fixes.js?v=20260825-v2",
    "pad-fx-authority-v2.js?v=20260826-v2", "ios-touch-tuning.js?v=20260824-v1",
    "enochian-ui-repairs-v1.js?v=20260827-ui-repairs-v3",
    "analyser-live-authority-v1.js?v=20260827-v1",
    "stem-four-channel-ui-v1.js?v=20260827-v4",
    "analyser-controls-contained-v1.js?v=20260827-v3",
    "installEnochianAuthoritativeRuntime", "installEnochianOuterAnalyserPanel",
    "installEnochianAnalyserDataBus", "installEnochianAnalyserSignalGlide",
    "installEnochianAnalyserSignal3D", "installEnochianSculptAudioMod",
    "installEnochianPendingUiFixes", "installEnochianPadFxAuthorityV2",
    "installEnochianIOSTouchTuning", "installEnochianUiRepairsV1",
    "installEnochianAnalyserLiveAuthorityV1", "installEnochianStemFourChannelV1",
    "installEnochianAnalyserControlsContainedV1",
]
for marker in shell_required:
    if marker not in shell:
        raise SystemExit(f'missing terminal shell marker: {marker}')

for marker, source in [
    ("double-decker-main-stem-link-v1.js?v=20260827-stem-jecker-v10", shell),
    ("double-jecker-runtime-repair-v1.js?v=20260827-v2", stem_link),
    ("stem-four-channel-ui-v1.js?v=20260827-v4", runtime_repair),
    ("analyser-controls-contained-v1.js?v=20260827-v3", runtime_repair),
]:
    if marker not in source:
        raise SystemExit(f'stale Enochian cache-buster marker: {marker}')

for marker in [
    "VERSION='20260827-live-authority-v2'",
    "function loadSculpt(host)",
    "analyser-multipoint-sculpt-v1.js?v=20260827-v1",
    "installEnochianMultipointSculptV1",
    "loadSculpt(host)",
]:
    if marker not in authority_loader:
        raise SystemExit(f'missing multipoint sculpt loader contract: {marker}')

required_files = [
    'authoritative-runtime.js', 'outer-analyser-panel.js', 'analyser-data-bus.js',
    'analyser-composite-signal.js', 'analyser-signal-glide.js', 'analyser-signal-3d-v7.js',
    'sculpt-audio-mod.js', 'analyser-multipoint-sculpt-v1.js', 'analyser-live-authority-v1.js',
    'pending-ui-fixes.js', 'pad-fx-authority-v2.js', 'ios-touch-tuning.js',
    'enochian-ui-repairs-v1.js', 'stem-four-channel-ui-v1.js', 'analyser-controls-contained-v1.js',
]
base = Path('web/enochian-test')
for name in required_files:
    p = base / name
    if not p.is_file() or p.stat().st_size == 0:
        raise SystemExit(f'missing Enochian runtime layer: {p}')
    if p.suffix == '.js':
        subprocess.run(['node', '--check', str(p)], check=True)

files = {name: (base / name).read_text(encoding='utf-8') for name in required_files}
authority = files['authoritative-runtime.js']
outer_panel = files['outer-analyser-panel.js']
bus = files['analyser-data-bus.js']
composite = files['analyser-composite-signal.js']
three_d = files['analyser-signal-3d-v7.js']
glide = files['analyser-signal-glide.js']
sculpt_audio = files['sculpt-audio-mod.js']
multipoint = files['analyser-multipoint-sculpt-v1.js']
pending_ui = files['pending-ui-fixes.js']
touch = files['ios-touch-tuning.js']
repairs = files['enochian-ui-repairs-v1.js']
four_stem = files['stem-four-channel-ui-v1.js']
contained_controls = files['analyser-controls-contained-v1.js']

for marker in ["authoritativeRuntime==='v6'", "__enochStemAuthority={version:'v6'", "__enochLoopAuthority={version:'v6'", "__enochNativeStemEngine={version:'v2'", "setTargetAtTime", "setEnabled(on)", "setRow(key,on)", "setLevel(key,value)", "LOOP CYCLE", "engine.sync(true)"]:
    if marker not in authority:
        raise SystemExit(f'native Web Audio stem/loop authority marker missing: {marker}')
if 'requestAnimationFrame' in authority:
    raise SystemExit('authoritative loop unexpectedly depends on requestAnimationFrame')
if 'master.muted=true' in authority or 'm.volume=' in authority or 'createMediaElementSource' in authority:
    raise SystemExit('secondary stem mixer/audio graph unexpectedly present')

if "VERSION='v2'" not in touch or 'installStemMasterPanel' not in touch or 'stem-master-slot' not in touch or "getElementById('stemMasterToggle')" not in touch:
    raise SystemExit('persistent stem master ON/OFF panel contract missing')
if "outerAnalyserPanel==='v2'" not in outer_panel or 'DRAG ANALYSER WINDOW' not in outer_panel or 'outer-float-launch' not in outer_panel or 'data-outer-wheel="twist"' not in outer_panel:
    raise SystemExit('outer terminal analyser panel contract missing')
if '__enochAnalyserBus' not in bus or '__enochAnalyserBus' not in composite or '__enochAnalyserBus' not in three_d:
    raise SystemExit('unified analyser bus contract missing')
if "version:'v2'" not in bus or 'frequency:null' not in bus or "bus.emit('frequency'" not in bus:
    raise SystemExit('FFT analyser bus v2 contract missing')
if "analyserSignalGlide='v6'" not in glide or '__enochAnalyserWheelMode' not in glide or "wheelMode==='height'" not in glide or "wheelMode==='depth'" not in glide or "wheelMode==='twist'" not in glide:
    raise SystemExit('3D analyser gesture contract missing')
if "analyserSignal3d==='v7'" not in three_d or 'analyser-control-widget' not in three_d or "input:'internal-master-mix'" not in three_d or 'const ROWS=16,BINS=16' not in three_d or 'const pick=' not in three_d:
    raise SystemExit('internal-master sculptable 3D analyser contract missing')
if "sculptAudioMod==='v4'" not in sculpt_audio or "version:'v4'" not in sculpt_audio or '__enochSculptAudio' not in sculpt_audio or 'anchors=Array.isArray(def.anchors)' not in sculpt_audio or "POINTS '+grabs+'/5" not in sculpt_audio:
    raise SystemExit('five-point sculpt-to-audio modulation v4 contract missing')
if 'analyserMultipointSculpt===VERSION' not in multipoint or '__enochMultipointSculpt' not in multipoint or 'def.anchors' not in multipoint or 'selectedAnchor' not in multipoint or "ORANGE='#ff9d34'" not in multipoint or 'analyser-sculpt-overlay' not in multipoint:
    raise SystemExit('five-point orange analyser sculpt mesh contract missing')
if "pendingUiFixes==='v3'" not in pending_ui or 'loop-control-row' not in pending_ui or 'eq-kill-btn' not in pending_ui:
    raise SystemExit('pending terminal UI fixes v3 contract missing')
if 'enochian-ui-repairs-v2-style' not in repairs or 'enoch-context-hint' not in repairs or 'masterDeckAnchor' not in repairs:
    raise SystemExit('Enochian specialist UI repair layer contract missing')
if "stemFourChannel==='v3'" not in four_stem or "['vocals','drums','bass','other']" not in four_stem or 'data-stem-jecker-split' not in four_stem:
    raise SystemExit('four equal native stem rows contract missing')
if "analyserControlsContained==='v2'" not in contained_controls or 'palette-dragging' not in contained_controls or 'outer-float-launch' not in contained_controls or 'maxL' not in contained_controls or 'maxT' not in contained_controls:
    raise SystemExit('contained movable analyser controls contract missing')

print('Enochian runtime verified: four native STEMS MIX rows, fixed 3D SIGNAL with contained movable control palette, visible FLOAT, live FFT authority, native stem/loop authority, EQ kills, navigation and fullscreen.')
