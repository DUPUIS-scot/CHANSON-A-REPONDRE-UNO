#!/usr/bin/env python3
"""Fail the deployment when a bundled card lacks a share image or share page."""

import json
import re
from pathlib import Path

from PIL import Image


ROOT = Path('build/web')
PREVIEWS = ROOT / 'assets/share-previews'
SHARES = ROOT / 'share'
PUBLIC_BASE = 'https://www.chanson-a-repondre-uno.scot'
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}


def read_json(path: Path) -> dict:
    with path.open(encoding='utf-8-sig') as handle:
        return json.load(handle)


def asset_path(value: str) -> str:
    return value if value.startswith('assets/') else f'assets/{value}'


def card_slugs() -> set[str]:
    uno_catalog = read_json(Path('assets/json/cards.json'))
    uno_deck = next(
        deck for deck in uno_catalog['decks'] if deck['id'] == 'sale-poete-final-84'
    )
    uno_cards = uno_deck['cards']
    known_uno_paths = {
        asset_path(str(card.get('image') or card.get('path') or ''))
        for card in uno_cards
    }
    uno_extras = [
        path
        for path in sorted(Path('assets/cards/final_import').iterdir())
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and path.name != 'deck_cover.png'
        and str(path) not in known_uno_paths
    ]

    brio_cards = read_json(
        Path('assets/decks/chanson_a_repondre_brio/deck.json')
    )['cards']
    known_brio_paths = {
        asset_path(str(card.get('image') or card.get('path') or ''))
        for card in brio_cards
    }
    brio_extras = [
        path
        for path in sorted(Path('assets/decks/chanson_a_repondre_brio/cards').iterdir())
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and str(path) not in known_brio_paths
    ]

    hp_cards = [
        path
        for path in sorted(Path('assets/hp').iterdir())
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and path.name not in {'verso.png', 'work_in_progress_ribbon.webp'}
    ]

    return {
        *(f'UNO-{index:03d}' for index in range(1, len(uno_cards) + len(uno_extras) + 1)),
        *(f'BRIO-{index:03d}' for index in range(1, len(brio_cards) + len(brio_extras) + 1)),
        *(f'HP-{index:03d}' for index in range(1, len(hp_cards) + 1)),
    }


def verify_preview(slug: str) -> None:
    path = PREVIEWS / f'{slug}.jpg'
    if not path.is_file() or path.stat().st_size == 0:
        raise SystemExit(f'Missing preview image: {path}')
    if path.stat().st_size > 350_000:
        raise SystemExit(f'Oversized preview image: {path}')
    with Image.open(path) as image:
        if image.format != 'JPEG' or image.size != (600, 900):
            raise SystemExit(f'Invalid preview image: {path} ({image.format} {image.size})')


def verify_page(slug: str) -> None:
    path = SHARES / slug / 'index.html'
    if not path.is_file():
        raise SystemExit(f'Missing share page: {path}')
    html = path.read_text(encoding='utf-8')
    expected_image = f'{PUBLIC_BASE}/assets/share-previews/{slug}.jpg'
    expected_page = f'{PUBLIC_BASE}/share/{slug}/'
    required = (
        f'property="og:image" content="{expected_image}"',
        f'property="og:image:url" content="{expected_image}"',
        f'property="og:image:secure_url" content="{expected_image}"',
        'property="og:image:type" content="image/jpeg"',
        'property="og:image:width" content="600"',
        'property="og:image:height" content="900"',
        f'property="og:url" content="{expected_page}"',
        f'name="twitter:image" content="{expected_image}"',
        f'<link rel="canonical" href="{expected_page}">',
    )
    missing = [marker for marker in required if marker not in html]
    if missing:
        raise SystemExit(f'Incomplete social metadata for {slug}: {missing[0]}')
    if not re.search(r'window\.location\.replace\(', html):
        raise SystemExit(f'Missing app redirect for {slug}')


def main() -> None:
    expected = card_slugs()
    actual = {path.stem for path in PREVIEWS.glob('*.jpg')}
    if actual != expected:
        missing = sorted(expected - actual)
        unexpected = sorted(actual - expected)
        raise SystemExit(
            f'Share preview set mismatch; missing={missing[:3]}, unexpected={unexpected[:3]}'
        )
    for slug in sorted(expected):
        verify_preview(slug)
        verify_page(slug)
    print(f'Validated {len(expected)} social preview images and share pages.')


if __name__ == '__main__':
    main()
