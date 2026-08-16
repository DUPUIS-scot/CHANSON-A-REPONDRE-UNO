#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path

CATALOG = Path('assets/json/cards.json')
BUILD = Path('build/web')
TARGET_DIR = BUILD / 'assets/share-previews'
MAX_BYTES = 350_000

with CATALOG.open('r', encoding='utf-8-sig') as handle:
    payload = json.load(handle)

production = next(
    deck for deck in payload.get('decks', [])
    if deck.get('id') == 'sale-poete-final-84'
)
cards = production.get('cards', [])
if len(cards) != 84:
    raise SystemExit(f'Expected 84 UNO cards, found {len(cards)}')

TARGET_DIR.mkdir(parents=True, exist_ok=True)

for index, card in enumerate(cards, start=1):
    image_path = card.get('image') or card.get('path')
    if not image_path:
        raise SystemExit(f'Missing image path for UNO-{index:03d}')

    source = BUILD / 'assets' / image_path
    target = TARGET_DIR / f'UNO-{index:03d}.jpg'
    if not source.is_file():
        raise SystemExit(f'Missing built UNO source: {source}')

    def convert(quality: int) -> None:
        subprocess.run([
            'convert', str(source),
            '-auto-orient',
            '-resize', '600x900^',
            '-gravity', 'center',
            '-extent', '600x900',
            '-strip',
            '-sampling-factor', '4:2:0',
            '-interlace', 'Plane',
            '-quality', str(quality),
            str(target),
        ], check=True)

    convert(62)
    if target.stat().st_size > MAX_BYTES:
        convert(50)
    if target.stat().st_size > MAX_BYTES:
        convert(42)
    if target.stat().st_size > MAX_BYTES:
        raise SystemExit(
            f'{target.name} is {target.stat().st_size} bytes; expected <= {MAX_BYTES}'
        )

print(f'Generated {len(cards)} lightweight UNO texture previews in {TARGET_DIR}')
