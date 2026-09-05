from pathlib import Path
import subprocess

base = Path('web/enochian-test')
shell = Path('web/enochian-terminal/index.html').read_text(encoding='utf-8')
runtime = (base / 'live-copy.html').read_text(encoding='utf-8')
authority = (base / 'authoritative-runtime.js').read_text(encoding='utf-8')
stem_link = (base / 'double-decker-main-stem-link-v1.js').read_text(encoding='utf-8')
radial = (base / 'double-jecker-radial-layout-v1.js').read_text(encoding='utf-8')
repair = (base / 'double-jecker-runtime-repair-v1.js').read_text(encoding='utf-8')
performance = (base / 'double-jecker-performance-v2.js').read_text(encoding='utf-8')
portal = (base / 'double-jester-portal-spinner-v1.js').read_text(encoding='utf-8')
four_stem = (base / 'stem-four-channel-ui-v1.js').read_text(encoding='utf-8')
contained = (base / 'analyser-controls-contained-v1.js').read_text(encoding='utf-8')
playback_owner = (base / 'playback-transport-authority-v1.js').read_text(encoding='utf-8')
two_mix_owner = (base / 'two-mix-master-anchor-v1.js').read_text(encoding='utf-8')
layout = (base / 'terminal-viewport-layout-contract-v1.js').read_text(encoding='utf-8')
source_unified = (base / 'signal-source-unified-v2.js').read_text(encoding='utf-8')
renderer_unified = (base / 'analyser-signal-unified-v1.js').read_text(encoding='utf-8')
legacy_renderer = (base / 'analyser-signal-3d-v7.js').read_text(encoding='utf-8')
midi_signal = (base / 'midi-signal-live-v1.js').read_text(encoding='utf-8')
composite = (base / 'analyser-composite-signal.js').read_text(encoding='utf-8')
live_health = (base / 'analyser-live-authority-v1.js').read_text(encoding='utf-8')

for marker in ['window.__enochStemRuntimeApi=', 'stemMasterToggle', 'masterGate', 'RESET LOOP']:
    if marker not in runtime:
        raise SystemExit(f'missing runtime marker: {marker}')

for marker in ['stem-four-channel-ui-v1.js?v=20260827-v4', 'analyser-data-bus.js?v=20260824-v2', 'installEnochianTwoMixMasterAnchorV1']:
    if marker not in shell:
        raise SystemExit(f'missing terminal shell marker: {marker}')

for marker, source, label in [
    ("const VERSION='v11'", stem_link, 'STEM JESTER'),
    ("VERSION='v13'", radial, 'radial authority'),
    ("const VERSION='v11'", repair, '2JESTER runtime authority'),
    ("const VERSION='v6'", performance, '2J performance'),
    ("stemFourChannel==='v4'", four_stem, 'four stem UI'),
    ("analyserControlsContained='v6'", contained, 'analyser ownership'),
]:
    if marker not in source:
        raise SystemExit(f'missing {label}: {marker}')

for marker in ["['mix','stem','jog']", 'setMode', 'applyStem', 'applyJog', 'continuousSpin:true', 'dragOuterRig:true']:
    if marker not in performance:
        raise SystemExit(f'2J MIX/STEM/JOG v6 contract missing: {marker}')

for marker in [
    "['v4','v5','v6'].includes(performance?.version)",
    "phase=open?'2jester-active':'2j-spinning'",
    "get phase(){return phase}",
    "new CustomEvent('enoch:2j-state'",
    'const timer=w.setInterval(maintain,1500);',
]:
    if marker not in repair:
        raise SystemExit(f'2JESTER authority repair missing: {marker}')
if 'w.setInterval(maintain,500)' in repair:
    raise SystemExit('legacy 500ms 2JESTER maintenance loop remains')

for marker in [
    "w.addEventListener('enoch:2j-state',onJ2State)",
    'reconcile();',
    "runtime-repair-v11','/enochian-test/double-jecker-runtime-repair-v1.js?v=20260829-jester-authority-v12",
]:
    if marker not in stem_link:
        raise SystemExit(f'STEM JESTER authority repair missing: {marker}')
if 'setInterval(reconcile,500)' in stem_link:
    raise SystemExit('competing STEM JESTER polling authority remains')

for marker in [
    'const authority=inner.defaultView.__enochDoubleJesterAuthority||window.__enochDoubleJesterAuthority;',
    "const phase=authority?.phase||(panel.classList.contains('open')?'2jester-active':'2j-spinning');",
    "stateAuthority:'2JESTER runtime authority v11'",
    "MODEL_URL='/assets/assets/models/textured-glb-comparison/laboratory_portal_mirror.glb?v=20260828-v1'",
]:
    if marker not in portal:
        raise SystemExit(f'2J mirror authority repair missing: {marker}')

if "playbackTransportAuthority='v1'" not in playback_owner:
    raise SystemExit('PLAYBACK authority missing')
if "authoritativeRuntime='v6'" not in authority:
    raise SystemExit('audio authority missing')
if 'data-terminal-floatable' not in layout or '#doubleDeckerSpecial' not in layout:
    raise SystemExit('terminal viewport layout contract missing')
if "twoMixMasterLayout==='v10'" not in two_mix_owner:
    raise SystemExit('2MIX authority missing')

# Unified 3D SIGNAL authority contract.
for marker in [
    "signalSourceUnified==='v3'",
    "bus.emit('authoritative-frequency'",
    "bus.emit('authoritative-signal'",
    "__enochLineInLiveWaveform?.getStream?.()",
    "w.__enochSignalSourceAuthority={version:'v3'",
]:
    if marker not in source_unified:
        raise SystemExit(f'unified signal source contract missing: {marker}')
for marker in [
    "analyserSignalUnified==='v5'",
    "const chamber=d.querySelector('.stage .wave')||d.querySelector('.wave')",
    "chamber.appendChild(canvas)",
    "canvas.__enochProjected=pts",
    "type==='authoritative-frequency'",
    "w.__enochAnalyser3D=api",
    "filter=controlNorm('filter',.5)",
    "feedback=controlNorm('fb',0)",
    "wet=controlNorm('wet',0)",
    "AUDIO_ROWS=16,AUDIO_BINS=16,VISUAL_ROWS=28,VISUAL_BINS=40",
    "bilinearSample(i,r)",
    "lineHot:'#A8F1FF'",
    "if(amp<=.58)continue",
]:
    if marker not in renderer_unified:
        raise SystemExit(f'unified 3D renderer contract missing: {marker}')
if "analyserSignal3d='retired-v9'" not in legacy_renderer:
    raise SystemExit('legacy 3D renderer is not retired')
if "bus.emit('frequency'" in midi_signal or "b.emit('frequency'" in midi_signal:
    raise SystemExit('legacy MIDI still writes frequency frames directly')
for marker in [
    "new CustomEvent('enoch:midi-input'",
    "new CustomEvent('enoch:midi-spectrum'",
    "signalModOn()",
    "version:'v7'",
]:
    if marker not in midi_signal:
        raise SystemExit(f'MIDI source/mod separation missing: {marker}')
for marker in ["stemLevel('bass')", "stemLevel('other')", "authoritative-signal", "source.toUpperCase()"]:
    if marker not in composite:
        raise SystemExit(f'composite source/stem contract missing: {marker}')
for marker in ["20260903-unified-v7", "selected==='midi'||selected==='input'", "analyser-3d-unified"]:
    if marker not in live_health:
        raise SystemExit(f'unified health reporting missing: {marker}')

required_files = [
    'authoritative-runtime.js', 'outer-analyser-panel.js', 'analyser-signal-3d-v7.js',
    'analyser-signal-unified-v1.js', 'signal-source-unified-v2.js', 'analyser-composite-signal.js',
    'analyser-live-authority-v1.js', 'midi-signal-live-v1.js',
    'analyser-data-bus.js', 'stem-four-channel-ui-v1.js', 'analyser-controls-contained-v1.js',
    'double-decker-main-stem-link-v1.js', 'double-jecker-radial-layout-v1.js',
    'double-jecker-runtime-repair-v1.js', 'double-jecker-performance-v2.js',
    'double-jester-portal-spinner-v1.js', 'playback-reference-panel.js',
    'playback-transport-authority-v1.js', 'two-mix-master-anchor-v1.js',
    'terminal-viewport-layout-contract-v1.js', 'terminal-installer-singleton-v1.js',
]
for name in required_files:
    path = base / name
    if not path.is_file() or path.stat().st_size == 0:
        raise SystemExit(f'missing runtime layer: {path}')
    if path.suffix == '.js':
        subprocess.run(['node', '--check', str(path)], check=True)

print('Enochian runtime verified: one source authority, one 3D renderer, MAIN/MIDI/INPUT arbitration, four stems, full EQ/FX shaping, SIGNAL MOD gated MIDI feedback, and existing 2J/2JESTER/PLAYBACK/2MIX contracts.')
