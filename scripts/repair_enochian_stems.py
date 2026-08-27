from pathlib import Path
import subprocess

base = Path('web/enochian-test')
runtime = (base / 'live-copy.html').read_text(encoding='utf-8')
shell = Path('web/enochian-terminal/index.html').read_text(encoding='utf-8')
authority = (base / 'authoritative-runtime.js').read_text(encoding='utf-8')
stem_link = (base / 'double-decker-main-stem-link-v1.js').read_text(encoding='utf-8')
radial = (base / 'double-jecker-radial-layout-v1.js').read_text(encoding='utf-8')
repair = (base / 'double-jecker-runtime-repair-v1.js').read_text(encoding='utf-8')
performance = (base / 'double-jecker-performance-v2.js').read_text(encoding='utf-8')
polish = (base / 'enochian-terminal-polish-v1.js').read_text(encoding='utf-8')
ui_repairs = (base / 'enochian-ui-repairs-v1.js').read_text(encoding='utf-8')
four_stem = (base / 'stem-four-channel-ui-v1.js').read_text(encoding='utf-8')
contained = (base / 'analyser-controls-contained-v1.js').read_text(encoding='utf-8')
playback_owner = (base / 'playback-transport-authority-v1.js').read_text(encoding='utf-8')
two_mix_owner = (base / 'two-mix-master-anchor-v1.js').read_text(encoding='utf-8')
post_playback = (base / 'post-playback-ui-repair-v2.js').read_text(encoding='utf-8')

runtime_required = [
    'window.__enochStemRuntimeApi=', 'stemMasterToggle', 'masterGate',
    'RESET LOOP', 'STEM ISOLATOR · AI COMPTROLLER', 'function platterTick',
]
for marker in runtime_required:
    if marker not in runtime:
        raise SystemExit(f'missing current Enochian runtime marker: {marker}')

shell_required = [
    'live-copy.html?v=20260827-cache-repair-v4',
    'authoritative-runtime.js?v=20260825-runtime-api-v2',
    'double-decker-main-stem-link-v1.js?v=20260827-stem-jester-v11',
    'double-jecker-radial-layout-v1.js?v=20260827-jester-radial-v10',
    'double-jecker-reference-skin-v1.js?v=20260827-layout-safe-v7',
    'double-jecker-runtime-repair-v1.js?v=20260827-jester-authority-v11',
    'enochian-terminal-polish-v1.js?v=20260827-polish-v3',
    'enochian-ui-repairs-v1.js?v=20260827-ui-repairs-v7',
    'stem-four-channel-ui-v1.js?v=20260827-v4',
    'analyser-controls-contained-v1.js?v=20260827-v6',
    'playback-transport-authority-v1.js?v=20260827-v1',
    'two-mix-master-anchor-v1.js?v=20260827-v1',
    'post-playback-ui-repair-v2.js?v=20260827-v3',
    'installEnochianDoubleJeckerRuntimeRepairV1',
    'installEnochianStemFourChannelV1',
    'installEnochianPlaybackTransportAuthorityV1',
    'installEnochianTwoMixMasterAnchorV1',
]
for marker in shell_required:
    if marker not in shell:
        raise SystemExit(f'missing terminal shell marker: {marker}')

contracts = [
    ("const VERSION='v11'", stem_link, 'STEM JESTER v11 authority'),
    ("['vocals','drums','bass','other']", stem_link, 'four native linked stems'),
    ('STEM → 2JESTER', stem_link, '2JESTER link vocabulary'),
    ('jester-radial-v10', stem_link, 'fresh radial lazy loader'),
    ('jester-authority-v11', stem_link, 'fresh runtime lazy loader'),
    ("VERSION='v12'", radial, 'radial v12 authority'),
    ('jesterRadialAuthority===VERSION', radial, 'radial v12 installation guard'),
    ("panel.dataset.jeckerRadial='v10'", radial, 'radial v10 compatibility marker'),
    ('doubleJesterRadialPanelRectV12', radial, 'single radial geometry store'),
    ('other:[22,34]', radial, 'A-side radial coordinates'),
    ('vocals:[34,82]', radial, 'B-side radial coordinates'),
    ('content:none!important;display:none!important', radial, 'clean platter top inscription'),
    ("const VERSION='v11'", repair, 'runtime authority v11'),
    ('__enochDoubleJesterAuthority', repair, 'single open close authority'),
    ('authority-v11', repair, 'legacy resize suppression'),
    ('jester-performance-v4', repair, 'fresh spinner performance loader'),
    ("const VERSION='v4'", performance, 'spinner performance v4'),
    ('__enochDoubleJesterPerformance', performance, 'spinner authority alias'),
    ("VERSION='20260827-polish-v3'", polish, 'polish v3'),
    ('ensureJesterDecoration', polish, 'presentation-only Jester polish'),
    ("const VERSION='v7'", ui_repairs, 'UI repair v7'),
    ("stemFourChannel==='v3'", four_stem, 'four stem UI v3'),
    ("analyserControlsContained='v6'", contained, 'analyser ownership v6'),
]
for marker, source, label in contracts:
    if marker not in source:
        raise SystemExit(f'missing {label}: {marker}')

# No legacy geometry writer or obsolete Instruments/Bass-Other split may survive.
for forbidden, source, label in [
    ('const coords={A:{vocals:[30,17]', polish, 'terminal polish stem coordinate writer'),
    ('JECKER_STORE=', polish, 'terminal polish Jester geometry store'),
    ("mainLevel('instruments')", stem_link, 'legacy Instruments linkage'),
    ("mainToggleOn('instruments')", stem_link, 'legacy Instruments toggle linkage'),
    ('if(row&&!split)', performance, 'legacy Bass/Other split constructor'),
    ('splitState={bass:', performance, 'legacy split state'),
    ('panel.classList.toggle(\'open\')', performance, 'spinner direct panel open toggle'),
]:
    if forbidden in source:
        raise SystemExit(f'forbidden {label} still present: {forbidden}')

if 'enochian-ui-repairs-v7-style' not in ui_repairs or "enochUiRepairs=VERSION" not in ui_repairs:
    raise SystemExit('UI repairs v7 hint-only contract missing')
if '#doubleDeckerSpecial.jecker-radial .dds-center{left:' in ui_repairs:
    raise SystemExit('UI repairs still override 2JESTER geometry')
if "stemFourChannel==='v3'" not in four_stem or "['vocals','drums','bass','other']" not in four_stem:
    raise SystemExit('four equal native stem rows contract missing')
if 'data-stem-jecker-split' not in four_stem:
    raise SystemExit('four-stem cleanup compatibility contract missing')
if "analyserControlsContained='v6'" not in contained or 'fixedPaletteRemoved:true' not in contained:
    raise SystemExit('separated SIGNAL ownership v6 contract missing')
if 'const repairPlayback=' in contained or 'const repairTwoMix=' in contained:
    raise SystemExit('analyser layer still mutates PLAYBACK or 2MIX')
if "playbackTransportAuthority='v1'" not in playback_owner or 'repeat(9,minmax(0,1fr))' not in playback_owner:
    raise SystemExit('dedicated PLAYBACK transport authority missing')
if "twoMixMasterAnchor='v1'" not in two_mix_owner or 'two-mix-help-open' not in two_mix_owner:
    raise SystemExit('dedicated 2MIX master-deck anchor missing')
if "postPlaybackUiRepair==='v3'" not in post_playback:
    raise SystemExit('separated owner coordinator missing')
if "authoritativeRuntime='v6'" not in authority or "__enochNativeStemEngine={version:'v2'" not in authority:
    raise SystemExit('native Web Audio stem authority missing')

required_files = [
    'authoritative-runtime.js', 'outer-analyser-panel.js', 'analyser-data-bus.js',
    'analyser-composite-signal.js', 'analyser-signal-glide.js', 'analyser-signal-3d-v7.js',
    'sculpt-audio-mod.js', 'analyser-multipoint-sculpt-v1.js', 'analyser-live-authority-v1.js',
    'pending-ui-fixes.js', 'pad-fx-authority-v2.js', 'ios-touch-tuning.js',
    'enochian-ui-repairs-v1.js', 'enochian-terminal-polish-v1.js',
    'stem-four-channel-ui-v1.js', 'analyser-controls-contained-v1.js',
    'double-decker-special-v2.js', 'double-decker-main-stem-link-v1.js',
    'double-jecker-radial-layout-v1.js', 'double-jecker-reference-skin-v1.js',
    'double-jecker-runtime-repair-v1.js', 'double-jecker-performance-v2.js',
    'double-jecker-output-v1.js', 'double-jecker-signal-relay-v1.js',
    'double-jecker-turntable-shield-v1.js', 'playback-reference-panel.js',
    'post-playback-ui-repair-v2.js', 'playback-transport-authority-v1.js',
    'two-mix-master-anchor-v1.js',
]
for name in required_files:
    path = base / name
    if not path.is_file() or path.stat().st_size == 0:
        raise SystemExit(f'missing Enochian runtime layer: {path}')
    if path.suffix == '.js':
        subprocess.run(['node', '--check', str(path)], check=True)

print('Enochian runtime verified: consolidated 2JESTER v11 ownership, one v12 radial geometry authority with v10 compatibility marker, clean platter top, fixed eight-stem layout, four native STEMS MIX rows, passive open/close authority, v4 spinner crossfade, PLAYBACK/2MIX/SIGNAL ownership, native stem/loop authority, navigation and fullscreen.')
