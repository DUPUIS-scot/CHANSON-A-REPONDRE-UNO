from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STEMS_ROOT = ROOT / "assets" / "audio" / "stems"
LIVE_COPY = ROOT / "web" / "enochian-test" / "live-copy.html"
PUBSPEC = ROOT / "pubspec.yaml"
STEMS = ("vocals", "drums", "bass", "other")


def run(*args: str) -> str:
    return subprocess.check_output(args, text=True).strip()


def ffprobe(path: Path, entry: str, section: str = "stream") -> str:
    return run(
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        f"{section}={entry}",
        "-of",
        "default=nw=1:nk=1",
        str(path),
    )


def needs_terminal_encode(path: Path) -> bool:
    try:
        bit_rate = int(ffprobe(path, "bit_rate") or "0")
        sample_rate = int(ffprobe(path, "sample_rate") or "0")
        channels = int(ffprobe(path, "channels") or "0")
    except Exception:
        return True
    return bit_rate <= 0 or bit_rate > 140_000 or sample_rate != 44_100 or channels != 2


def transcode(src: Path, dst: Path) -> None:
    if not src.is_file() or src.stat().st_size == 0:
        raise SystemExit(f"Missing source stem: {src.relative_to(ROOT)}")
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".terminal.tmp.mp3")
    subprocess.check_call(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(src),
            "-map",
            "0:a:0",
            "-map_metadata",
            "-1",
            "-vn",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "128k",
            "-ar",
            "44100",
            "-ac",
            "2",
            str(tmp),
        ]
    )
    if not tmp.is_file() or tmp.stat().st_size == 0:
        raise SystemExit(f"Transcode failed: {src.relative_to(ROOT)}")
    tmp.replace(dst)
    if src != dst and src.exists():
        src.unlink()


def normalize_in_place(track: str) -> None:
    for stem in STEMS:
        path = STEMS_ROOT / track / f"{track}_{stem}.mp3"
        if not path.is_file():
            raise SystemExit(f"Missing canonical stem: {path.relative_to(ROOT)}")
        if needs_terminal_encode(path):
            transcode(path, path)


def normalize_legacy(track: str, legacy_prefix: str) -> None:
    for stem in STEMS:
        dst = STEMS_ROOT / track / f"{track}_{stem}.mp3"
        legacy = STEMS_ROOT / track / f"{legacy_prefix}_{stem}.mp3"
        if legacy.is_file():
            transcode(legacy, dst)
        elif dst.is_file():
            if needs_terminal_encode(dst):
                transcode(dst, dst)
        else:
            raise SystemExit(f"Missing {track} stem: {stem}")


def duration(path: Path) -> float:
    return float(
        run(
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        )
    )


def verify_sets() -> None:
    for track in ("ai_comptroller", "caesar_spitter", "the_kraken", "heliogabal_design", "vivid_void"):
        files = [STEMS_ROOT / track / f"{track}_{stem}.mp3" for stem in STEMS]
        for path in files:
            if not path.is_file() or path.stat().st_size == 0:
                raise SystemExit(f"Missing normalized stem: {path.relative_to(ROOT)}")
        durations = [duration(path) for path in files]
        spread = max(durations) - min(durations)
        if spread > 0.08:
            raise SystemExit(f"{track} stem duration mismatch: {durations}")
        print(
            track,
            "duration",
            round(sum(durations) / len(durations), 3),
            "spread",
            round(spread, 4),
            "sizes",
            [path.stat().st_size for path in files],
        )


def patch_pubspec() -> None:
    text = PUBSPEC.read_text(encoding="utf-8")
    anchor = "    - assets/audio/stems/ai_comptroller/\n"
    if anchor not in text:
        raise SystemExit("AI Comptroller asset anchor missing in pubspec.yaml")
    tracks = ("caesar_spitter", "the_kraken", "heliogabal_design", "vivid_void")
    for track in tracks:
        text = text.replace(f"    - assets/audio/stems/{track}/\n", "")
    extra = "".join(f"    - assets/audio/stems/{track}/\n" for track in tracks)
    text = text.replace(anchor, anchor + extra, 1)
    PUBSPEC.write_text(text, encoding="utf-8")


def patch_runtime() -> None:
    text = LIVE_COPY.read_text(encoding="utf-8")
    marker = "MULTI TRACK STEM CATALOG v1"
    if marker in text:
        print("Multi-track stem runtime already installed")
        return

    old_files = """  const stemFiles={
   vocals:'/assets/assets/audio/stems/ai_comptroller/ai_comptroller_vocals.mp3',
   drums:'/assets/assets/audio/stems/ai_comptroller/ai_comptroller_drums.mp3',
   bass:'/assets/assets/audio/stems/ai_comptroller/ai_comptroller_bass.mp3',
   other:'/assets/assets/audio/stems/ai_comptroller/ai_comptroller_other.mp3'
  };
"""
    new_files = """  // MULTI TRACK STEM CATALOG v1
  const stemCatalog={
   0:{key:'ai_comptroller',label:'AI COMPTROLLER'},
   1:{key:'caesar_spitter',label:'CAESAR-SPITTER'},
   2:{key:'the_kraken',label:'THE KRAKEN'},
   3:{key:'heliogabal_design',label:'HELIOGABAL//DESIGN'},
   4:{key:'vivid_void',label:'VIVID VOID'}
  };
  const stemPath=(track,stem)=>'/assets/assets/audio/stems/'+track+'/'+track+'_'+stem+'.mp3';
  const stemFiles={vocals:'',drums:'',bass:'',other:''};
  let activeStemKey=null;
  function stemTrackInfo(){try{if(typeof idx!=='undefined'&&stemCatalog[idx])return stemCatalog[idx]}catch(_){}const name=(q('name')?.textContent||'').trim().toUpperCase();return Object.values(stemCatalog).find(x=>x.label===name)||null}
  function selectStemSources(force=false){const info=stemTrackInfo();if(!info)return false;if(!force&&activeStemKey===info.key)return true;Object.keys(stemFiles).forEach(key=>{const url=stemPath(info.key,key);stemFiles[key]=url;const m=stemMedia&&stemMedia[key];if(m){try{m.pause()}catch(_){};try{m.removeAttribute('src');m.load()}catch(_){};m.dataset.src=url}});activeStemKey=info.key;stemMode=false;try{setMasterRoute(true)}catch(_){};return true}
"""
    if old_files not in text:
        raise SystemExit("stemFiles anchor missing in live-copy.html")
    text = text.replace(old_files, new_files, 1)

    old_create = "Object.entries(stemFiles).forEach(([key,url])=>{const m=document.createElement('audio');m.preload='none';m.dataset.src=url;m.setAttribute('aria-hidden','true');m.style.display='none';document.body.appendChild(m);stemMedia[key]=m});"
    new_create = old_create + "selectStemSources(true);"
    if old_create not in text:
        raise SystemExit("stem media creation anchor missing")
    text = text.replace(old_create, new_create, 1)

    old_check = "function isAiComptroller(){try{return typeof idx!=='undefined'&&idx===0}catch(_){return (q('name')?.textContent||'').trim()==='AI Comptroller'}}"
    if old_check not in text:
        raise SystemExit("stem availability anchor missing")
    text = text.replace(old_check, "function isAiComptroller(){return !!stemTrackInfo()}", 1)

    old_ui = "function updateStemUi(){const box=q('stemIsolator');if(!box)return;const ai=isAiComptroller();box.classList.toggle('disabled',!ai);box.querySelectorAll('button,input').forEach(el=>el.disabled=!ai);const note=q('stemNote');if(note)note.textContent=ai?'BASS + OTHERS = INSTRUMENTS · ALL STEMS LOCKED TO MASTER TRANSPORT':'STEM ISOLATOR AVAILABLE ON AI COMPTROLLER'}"
    new_ui = "function updateStemUi(){const box=q('stemIsolator');if(!box)return;const info=stemTrackInfo(),available=!!info;box.classList.toggle('disabled',!available);box.querySelectorAll('button,input').forEach(el=>el.disabled=!available);const title=box.querySelector('.stem-title');if(title)title.textContent=available?'STEM ISOLATOR · '+info.label:'STEM ISOLATOR · NO STEMS';const note=q('stemNote');if(note)note.textContent=available?'BASS + OTHERS = INSTRUMENTS · ALL STEMS LOCKED TO MASTER TRANSPORT':'NO STEM SET FOR THIS TRACK'}"
    if old_ui not in text:
        raise SystemExit("stem UI anchor missing")
    text = text.replace(old_ui, new_ui, 1)

    old_mode = "async function setStemMode(){const ai=isAiComptroller();if(!ai){stemMode=false;Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});setMasterRoute(true);updateStemUi();return}if(stemMode){updateStemUi();return}try{if(originalEnsureAudio)await originalEnsureAudio();else if(typeof ensureAudio==='function')await ensureAudio()}catch(_){};ensureMasterGate();try{await ensureStemMediaLoaded();await ensureStemGraph();syncStemTimes(true);setStemRate();applyStemGains();if(a.paused){stemMode=false;setMasterRoute(true);try{log('STEMS ARMED · WAITING FOR PLAY')}catch(_){}}else{await Promise.all(Object.values(stemMedia).map(m=>m.play()));setMasterRoute(false);stemMode=true;try{log('STEM MODE · AI COMPTROLLER')}catch(_){}}}catch(error){stemMode=false;Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});setMasterRoute(true);try{log('STEM FALLBACK · MASTER AUDIO · '+(error&&error.message?error.message:'UNKNOWN'))}catch(_){}}updateStemUi()}"
    new_mode = "async function setStemMode(){const info=stemTrackInfo();if(!info){stemMode=false;Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});setMasterRoute(true);updateStemUi();return}if(activeStemKey!==info.key){Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});stemMode=false;setMasterRoute(true);selectStemSources(true)}if(stemMode){updateStemUi();return}try{if(originalEnsureAudio)await originalEnsureAudio();else if(typeof ensureAudio==='function')await ensureAudio()}catch(_){};ensureMasterGate();try{await ensureStemMediaLoaded();await ensureStemGraph();syncStemTimes(true);setStemRate();applyStemGains();if(a.paused){stemMode=false;setMasterRoute(true);try{log('STEMS ARMED · '+info.label+' · WAITING FOR PLAY')}catch(_){}}else{await Promise.all(Object.values(stemMedia).map(m=>m.play()));setMasterRoute(false);stemMode=true;try{log('STEM MODE · '+info.label)}catch(_){}}}catch(error){stemMode=false;Object.values(stemMedia).forEach(m=>{try{m.pause()}catch(_){}});setMasterRoute(true);try{log('STEM FALLBACK · MASTER AUDIO · '+(error&&error.message?error.message:'UNKNOWN'))}catch(_){}}updateStemUi()}"
    if old_mode not in text:
        raise SystemExit("stem mode anchor missing")
    text = text.replace(old_mode, new_mode, 1)

    LIVE_COPY.write_text(text, encoding="utf-8")


def verify_runtime() -> None:
    text = LIVE_COPY.read_text(encoding="utf-8")
    for token in (
        "MULTI TRACK STEM CATALOG v1",
        "key:'caesar_spitter'",
        "key:'the_kraken'",
        "key:'heliogabal_design'",
        "key:'vivid_void'",
        "STEM FALLBACK · MASTER AUDIO",
        "setMasterRoute(false)",
        "m.preload='none'",
    ):
        if token not in text:
            raise SystemExit(f"Runtime verification failed: {token}")
    pubspec = PUBSPEC.read_text(encoding="utf-8")
    for track in ("caesar_spitter", "the_kraken", "heliogabal_design", "vivid_void"):
        if f"assets/audio/stems/{track}/" not in pubspec:
            raise SystemExit(f"pubspec missing stem directory: {track}")
    if list((STEMS_ROOT / "caesar_spitter").glob("* (2)_*.mp3")):
        raise SystemExit("Legacy Caesar filenames still present")
    if list((STEMS_ROOT / "heliogabal_design").glob("heliogabalDesign_*.mp3")):
        raise SystemExit("Legacy HELIOGABAL filenames still present")


def main() -> None:
    normalize_in_place("vivid_void")
    normalize_legacy("heliogabal_design", "heliogabalDesign")
    normalize_legacy("caesar_spitter", "caesar_spitter (2)")
    normalize_in_place("the_kraken")
    verify_sets()
    patch_pubspec()
    patch_runtime()
    verify_runtime()
    print("Terminal stem normalization complete")


if __name__ == "__main__":
    main()
