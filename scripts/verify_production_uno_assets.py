#!/usr/bin/env python3
import json
import sys
from pathlib import Path

CATALOG_PATH = Path('assets/json/cards.json')
PRODUCTION_DECK_ID = 'sale-poete-final-84'
PRODUCTION_ASSET_PREFIX = 'assets/cards/final_import/'
BUILT_ASSET_ROOT = Path('build/web/assets')
BUILT_PRODUCTION_DIR = BUILT_ASSET_ROOT / 'assets/cards/final_import'
EXPECTED_CARDS = 84


def fail(message: str) -> None:
    print(f'::error::{message}', file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding='utf-8-sig'))
    deck = next(
        (
            item
            for item in catalog.get('decks', [])
            if item.get('id') == PRODUCTION_DECK_ID
        ),
        None,
    )
    if deck is None:
        fail(f'Production UNO deck {PRODUCTION_DECK_ID} was not found in the card catalog.')

    cards = deck.get('cards', [])
    if len(cards) != EXPECTED_CARDS:
        fail(f'Expected {EXPECTED_CARDS} UNO catalog cards, found {len(cards)}.')

    ids = [card.get('id') for card in cards]
    if len(set(ids)) != EXPECTED_CARDS or any(not card_id for card_id in ids):
        fail('Production UNO card IDs must contain exactly 84 unique non-empty values.')

    missing_sources: list[str] = []
    invalid_paths: list[str] = []
    for card in cards:
        card_id = card.get('id', '<unknown>')
        image_path = card.get('path') or card.get('image')
        if not image_path:
            missing_sources.append(f'{card_id}: no image path')
            continue
        if not image_path.startswith(PRODUCTION_ASSET_PREFIX):
            invalid_paths.append(f'{card_id}: {image_path}')
            continue
        if not Path(image_path).is_file():
            missing_sources.append(f'{card_id}: {image_path}')

    if invalid_paths:
        fail(
            'Production UNO cards reference assets outside '
            f'{PRODUCTION_ASSET_PREFIX}: ' + '; '.join(invalid_paths)
        )
    if missing_sources:
        fail('Missing source UNO card assets: ' + '; '.join(missing_sources))

    if not BUILT_PRODUCTION_DIR.is_dir():
        fail(f'Flutter did not bundle {BUILT_PRODUCTION_DIR}.')

    bundled_pngs = list(BUILT_PRODUCTION_DIR.glob('*.png'))
    if len(bundled_pngs) < EXPECTED_CARDS:
        fail(
            f'Flutter bundled only {len(bundled_pngs)} PNG files in '
            f'{BUILT_PRODUCTION_DIR}; expected at least {EXPECTED_CARDS}.'
        )

    # Check a catalog-referenced asset through Flutter's actual web asset path
    # in addition to the directory count. Extra valid PNGs in final_import are
    # intentionally allowed and must not block deployment.
    first_image = cards[0].get('path') or cards[0].get('image')
    if first_image and not (BUILT_ASSET_ROOT / first_image).is_file():
        fail(f'Catalog asset was not bundled by Flutter: {first_image}')

    print(
        f'Verified {EXPECTED_CARDS} production UNO catalog entries, all source '
        f'assets, and {len(bundled_pngs)} bundled final_import PNG files.'
    )


if __name__ == '__main__':
    main()
