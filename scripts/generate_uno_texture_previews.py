#!/usr/bin/env python3
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps

CATALOG = Path('assets/json/cards.json')
BRIO_CATALOG = Path('assets/decks/chanson_a_repondre_brio/deck.json')
HP_DIR = Path('assets/hp')
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
uno_cards = production.get('cards', [])
if len(uno_cards) != 84:
    raise SystemExit(f'Expected 84 UNO cards, found {len(uno_cards)}')

with BRIO_CATALOG.open('r', encoding='utf-8-sig') as handle:
    brio_payload = json.load(handle)
brio_cards = brio_payload.get('cards', [])
if len(brio_cards) != 16:
    raise SystemExit(f'Expected 16 BRIO cards, found {len(brio_cards)}')

hp_cards = sorted(
    path for path in HP_DIR.iterdir()
    if path.is_file()
    and path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'}
    and path.name not in {'verso.png', 'work_in_progress_ribbon.webp'}
)
if not hp_cards:
    raise SystemExit('Expected at least one HP card')

def asset_path(value: str) -> Path:
    return Path(value) if value.startswith('assets/') else Path('assets') / value

known_uno_sources = {
    asset_path(card.get('image') or card.get('path') or '').as_posix()
    for card in uno_cards
}
uno_extras = [
    path for path in sorted(Path('assets/cards/final_import').iterdir())
    if path.is_file()
    and path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'}
    and path.name != 'deck_cover.png'
    and path.as_posix() not in known_uno_sources
]

cards = [
    (f'UNO-{index:03d}', card.get('image') or card.get('path'))
    for index, card in enumerate(uno_cards, start=1)
] + [
    (f'UNO-{len(uno_cards) + index:03d}', str(path))
    for index, path in enumerate(uno_extras, start=1)
] + [
    (f'BRIO-{index:03d}', card.get('image') or card.get('path'))
    for index, card in enumerate(brio_cards, start=1)
] + [
    (f'HP-{index:03d}', str(path))
    for index, path in enumerate(hp_cards, start=1)
]

TARGET_DIR.mkdir(parents=True, exist_ok=True)


def generate_preview(slug: str, image_path: str | None) -> str:
    if not image_path:
        raise RuntimeError(f'Missing image path for {slug}')

    source_candidates = [
        Path(image_path),
        BUILD / 'assets' / image_path,
        BUILD / image_path,
    ]
    source = next((candidate for candidate in source_candidates if candidate.is_file()), None)
    target = TARGET_DIR / f'{slug}.jpg'
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
        executor.submit(generate_preview, slug, image_path): slug
        for slug, image_path in cards
    }
    try:
        for future in as_completed(futures):
            print(future.result(), flush=True)
    except Exception:
        for pending in futures:
            pending.cancel()
        raise

print(
    f'Generated {len(cards)} lightweight UNO, BRIO and HP share previews in {TARGET_DIR} '
    f'using {MAX_WORKERS} workers'
)
