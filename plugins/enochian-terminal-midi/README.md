# ENOCHIAN TERMINAL MIDI

Native DAW instrument foundation for **ENOCHIAN TERMINAL**, based on the current 2MIX release branch.

## Targets

- VST3 — Windows/macOS DAWs
- AU — Logic Pro/macOS
- Standalone — MIDI-controller performance mode

The web terminal remains independent; this project does not alter its Web Audio engine or live deployment.

## Current MIDI map

| MIDI | Function |
|---|---|
| Note 36 | PLAY / PAUSE |
| Note 37 | CUE |
| Notes 40–47 | 2JESTER stem pads 1–8 |
| CC 1 | MOD DEPTH |
| CC 7 | FX MIX |
| CC 16 | 2MIX balance |
| CC 20 / 21 / 22 | LOW / MID / HIGH EQ |

## Build

Install JUCE as the `JUCE/` subdirectory, then run:

```bash
cmake -B build -S .
cmake --build build --config Release
```

The next native milestone is connecting the licensed local stem/audio assets to the processor's render engine and adding the Enochian visual editor.