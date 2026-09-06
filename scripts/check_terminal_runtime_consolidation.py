from pathlib import Path
import re


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
signal_source = (terminal / "signal-source-unified-v2.js").read_text(encoding="utf-8")
portal_spinner = (terminal / "double-jester-portal-spinner-v1.js").read_text(encoding="utf-8")
launcher_hit = (terminal / "two-mix-launcher-hit-repair-v1.js").read_text(encoding="utf-8")
four_channel = (terminal / "stem-four-channel-ui-v1.js").read_text(encoding="utf-8")

# The terminal shell may use either an absolute or relative same-origin iframe URL.
# Validate the actual cache-busted live-copy entry instead of requiring a leading slash.
live_copy_cache_busted = re.search(
    r'src=["\'](?:/)?enochian-test/live-copy\.html\?v=[^"\']+["\']',
    shell,
) is not None

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
    "signal source waits for the embedded document root": "root=d?.documentElement;if(!d||!w||!root)return false" in signal_source,
    "livestream signal attaches without a microphone prompt": "startInput(false)" in signal_source and "shared?.active" in signal_source,
    "livestream signal follows replacement streams": "shared!==state.inputStream" in signal_source and "syncLivestream" in signal_source,
    "mobile 2J stays clear of the terminal header": "right:12px!important;top:auto!important;bottom:12px!important" in portal_spinner,
    "3MIX keeps a consistent accessible name": "Disable 2MIX" not in launcher_hit and "Enable 3MIX" in launcher_hit,
    "legacy fullscreen controls are removed after late insertion": "removeDuplicateFullscreen();syncUi()" in four_channel,
    "the primary fullscreen control is preserved": "btn===master||btn.id==='iosFullscreen'" in four_channel,
    "fullscreen cleanup covers every terminal action group": "querySelectorAll('.terminal-actions').forEach" in four_channel,
    "consolidated installer is cache-busted": "terminal-installer-singleton-v1.js?v=20260906-v32" in shell,
    "consolidated runtime entry is cache-busted": live_copy_cache_busted,
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

