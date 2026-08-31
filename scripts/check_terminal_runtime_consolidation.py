from pathlib import Path


root = Path(__file__).resolve().parents[1]
terminal = root / "web" / "enochian-test"
shell = (root / "web" / "enochian-terminal" / "index.html").read_text(encoding="utf-8")
transport = (terminal / "double-jester-independent-transport-v1.js").read_text(encoding="utf-8")
double_decker = (terminal / "double-decker-special-v2.js").read_text(encoding="utf-8")
midi = (terminal / "midi-signal-live-v1.js").read_text(encoding="utf-8")
expressive = (terminal / "midi-expressive-signal-v1.js").read_text(encoding="utf-8")
ios = (terminal / "ios-touch-tuning.js").read_text(encoding="utf-8")
viewport = (terminal / "target-viewport.js").read_text(encoding="utf-8")
shield = (terminal / "double-jecker-turntable-shield-v1.js").read_text(encoding="utf-8")
installer = (terminal / "terminal-installer-singleton-v1.js").read_text(encoding="utf-8")

checks = {
    "master PLAY is not capture-intercepted": "stopImmediatePropagation();pauseStems();state.mainHeld=false" not in transport,
    "master PLAY retains native audio activation": "Main PLAY always belongs to the master deck" in transport,
    "master PLAY restores audible output": "ensureMainOutputAudible" in (terminal / "live-copy.html").read_text(encoding="utf-8"),
    "2JESTER does not capture-intercept master PLAY": "e.preventDefault();e.stopImmediatePropagation();void toggleJeckerTransport()" not in double_decker,
    "USB MIDI waits for CONNECT": "btn.onclick=connect;status.textContent='USB MIDI READY · PRESS CONNECT'" in midi,
    "expressive MIDI waits for CONNECT": "},500);connect();hookBus()" not in expressive,
    "iOS loader reuses existing authorities": "typeof window[name]==='function'" in ios,
    "one fullscreen control is reused": "actions.querySelector('[data-terminal-fullscreen]')" in viewport,
    "floating 2J is the sole launcher": "launcher.hidden=true;launcher.style.display='none'" in shield,
    "floating 2J defaults away from PLAYBACK": "top:auto;bottom:18px" in shield,
    "consolidated installer is cache-busted": "terminal-installer-singleton-v1.js?v=20260829-v30" in shell,
    "consolidated runtime entry is cache-busted": "/enochian-test/live-copy.html?v=" in shell,
    "late authorities use repaired revisions": all(
        marker in installer
        for marker in (
            "double-jester-independent-transport-v1.js?v=20260829-v3",
            "midi-signal-live-v1.js?v=20260829-v7",
            "midi-expressive-signal-v1.js?v=20260829-v3",
        )
    ),
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + name)
if failed:
    raise SystemExit("terminal runtime consolidation failed: " + ", ".join(failed))
