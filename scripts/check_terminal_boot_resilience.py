from pathlib import Path

root = Path(__file__).resolve().parents[1]
index = (root / 'web/enochian-terminal/index.html').read_text(encoding='utf-8')
guard = (root / 'web/enochian-test/terminal-installer-singleton-v1.js').read_text(encoding='utf-8')

checks = {
    'ready-state recovery': "contentDocument?.readyState==='complete'" in index and 'queueMicrotask(startTerminalBoot)' in index,
    'singleton outer boot timer': 'let terminalBootTimer=null' in index and 'if(terminalBootTimer!==null&&doc===terminalBootDocument)return' in index,
    '250 ms retry cadence': '},250);' in index,
    'approximately two minute recovery': 'tries>=480' in index,
    'installer singleton guard loaded': 'terminal-installer-singleton-v1.js?v=20260827-v1' in index,
    'four stem singleton': "wrap('installEnochianStemFourChannelV1'" in guard,
    'double jester singleton': "wrap('installEnochianDoubleDeckerSpecialV2'" in guard,
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ': ' + name)
if failed:
    raise SystemExit('terminal boot resilience contract failed: ' + ', '.join(failed))
