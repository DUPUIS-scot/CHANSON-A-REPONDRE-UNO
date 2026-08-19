#!/usr/bin/env python3
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps

CATALOG = Path('assets/json/cards.json')
BUILD = Path('build/web')
TARGET_DIR = BUILD / 'assets/share-previews'
MAX_BYTES = 350_000
MAX_WORKERS = 4

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


def generate_preview(index: int, card: dict) -> str:
    image_path = card.get('image') or card.get('path')
    if not image_path:
        raise RuntimeError(f'Missing image path for UNO-{index:03d}')

    source_candidates = [
        Path(image_path),
        BUILD / 'assets' / image_path,
        BUILD / image_path,
    ]
    source = next((candidate for candidate in source_candidates if candidate.is_file()), None)
    target = TARGET_DIR / f'UNO-{index:03d}.jpg'
    if source is None:
        checked = ', '.join(str(candidate) for candidate in source_candidates)
        raise RuntimeError(f'Missing UNO source for {target.name}; checked: {checked}')

    def convert(quality: int) -> None:
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image).convert('RGB')
            fitted = ImageOps.fit(
                image,
                (600, 900),
                method=Image.Resampling.LANCZOS,
            )
            fitted.save(
                target,
                'JPEG',
                quality=quality,
                optimize=True,
                progressive=True,
                subsampling=2,
            )

    convert(62)
    if target.stat().st_size > MAX_BYTES:
        convert(50)
    if target.stat().st_size > MAX_BYTES:
        convert(42)
    size = target.stat().st_size
    if size > MAX_BYTES:
        raise RuntimeError(
            f'{target.name} is {size} bytes; expected <= {MAX_BYTES}'
        )
    return f'Generated {target.name} ({size} bytes)'


with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = {
        executor.submit(generate_preview, index, card): index
        for index, card in enumerate(cards, start=1)
    }
    try:
        for future in as_completed(futures):
            print(future.result(), flush=True)
    except Exception:
        for pending in futures:
            pending.cancel()
        raise

print(
    f'Generated {len(cards)} lightweight UNO texture previews in {TARGET_DIR} '
    f'using {MAX_WORKERS} workers'
)
