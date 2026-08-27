from pathlib import Path
import subprocess
base=Path('web/enochian-test')
runtime=(base/'live-copy.html').read_text(encoding='utf-8');shell=Path('web/enochian-terminal/index.html').read_text(encoding='utf-8');authority=(base/'authoritative-runtime.js').read_text(encoding='utf-8');stem_link=(base/'double-decker-main-stem-link-v1.js').read_text(encoding='utf-8');radial=(base/'double-jecker-radial-layout-v1.js').read_text(encoding='utf-8');repair=(base/'double-jecker-runtime-repair-v1.js').read_text(encoding='utf-8');performance=(base/'double-jecker-performance-v2.js').read_text(encoding='utf-8');ui_repairs=(base/'enochian-ui-repairs-v1.js').read_text(encoding='utf-8');four_stem=(base/'stem-four-channel-ui-v1.js').read_text(encoding='utf-8');contained=(base/'analyser-controls-contained-v1.js').read_text(encoding='utf-8');playback_owner=(base/'playback-transport-authority-v1.js').read_text(encoding='utf-8');two_mix_owner=(base/'two-mix-master-anchor-v1.js').read_text(encoding='utf-8');post_playback=(base/'post-playback-ui-repair-v2.js').read_text(encoding='utf-8')
for marker in ['window.__enochStemRuntimeApi=','stemMasterToggle','masterGate','RESET LOOP']:
 if marker not in runtime: raise SystemExit(f'missing runtime marker: {marker}')
for marker in ['stem-four-channel-ui-v1.js?v=20260827-v4','two-mix-master-anchor-v1.js?v=20260827-v1','installEnochianTwoMixMasterAnchorV1']:
 if marker not in shell: raise SystemExit(f'missing terminal shell marker: {marker}')
for marker,source,label in [("const VERSION='v11'",stem_link,'STEM JESTER'),("VERSION='v12'",radial,'radial authority'),("const VERSION='v11'",repair,'runtime authority'),("const VERSION='v4'",performance,'spinner'),("const VERSION='v8'",ui_repairs,'UI repairs'),("stemFourChannel==='v4'",four_stem,'four stem UI'),("analyserControlsContained='v6'",contained,'analyser ownership')]:
 if marker not in source: raise SystemExit(f'missing {label}: {marker}')
for marker in ["twoMixMasterLayout==='v6'",'twoMixHelpToggle','2MIX · LIVE CONTROL','SHIFT+DRAG','ALT+DRAG','LOCK A/B','ADJUST MIX','UNO OPENS 2MIX',"helpButton.addEventListener('click',toggleGuide)","__enochTwoMixMasterAnchor={version:'v6'"]:
 if marker not in two_mix_owner: raise SystemExit(f'independent 2MIX launcher/help v6 missing: {marker}')
for forbidden in ["toggle.addEventListener('click',toggleGuide", "toggle.addEventListener('pointerup'", "toggleGuide=e=>{if(e){e.preventDefault();e.stopPropagation()}"]:
 if forbidden in two_mix_owner: raise SystemExit(f'2MIX launcher is still intercepted by help authority: {forbidden}')
if 'if(help.parentElement!==toggle)toggle.appendChild(help)' in two_mix_owner: raise SystemExit('2MIX help remains clipped inside UNO launcher')
for marker in ['stem-primary-header','stem-master-primary',"master.textContent='STEMS'"]:
 if marker not in four_stem: raise SystemExit(f'primary STEM master missing: {marker}')
for marker in ['repairPlaybackFlow','repairSignalRoot','repairFloatResolution','hiresFloat']:
 if marker not in ui_repairs: raise SystemExit(f'UI repair contract missing: {marker}')
if "playbackTransportAuthority='v1'" not in playback_owner or 'repeat(9,minmax(0,1fr))' not in playback_owner: raise SystemExit('PLAYBACK authority missing')
if "postPlaybackUiRepair==='v3'" not in post_playback: raise SystemExit('owner coordinator missing')
if "authoritativeRuntime='v6'" not in authority: raise SystemExit('audio authority missing')
required_files=['authoritative-runtime.js','outer-analyser-panel.js','analyser-signal-3d-v7.js','enochian-ui-repairs-v1.js','stem-four-channel-ui-v1.js','analyser-controls-contained-v1.js','double-decker-main-stem-link-v1.js','double-jecker-radial-layout-v1.js','double-jecker-runtime-repair-v1.js','double-jecker-performance-v2.js','playback-reference-panel.js','post-playback-ui-repair-v2.js','playback-transport-authority-v1.js','two-mix-master-anchor-v1.js']
for name in required_files:
 path=base/name
 if not path.is_file() or path.stat().st_size==0: raise SystemExit(f'missing runtime layer: {path}')
 if path.suffix=='.js': subprocess.run(['node','--check',str(path)],check=True)
print('Enochian runtime verified: UNO remains the 2MIX launcher, dedicated ? help toggles compact guide v6, primary STEMS MIX master, fullscreen SIGNAL/FLOAT and PLAYBACK ownership.')
