#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

from PIL import Image, ImageDraw, ImageOps

BUILD = Path(sys.argv[1] if len(sys.argv) > 1 else 'build/web')
PUBLIC_BASE = (sys.argv[2] if len(sys.argv) > 2 else 'https://www.chanson-a-repondre-uno.scot/').rstrip('/') + '/'
SHARE_ROOT = BUILD / 'share'
PREVIEW_ROOT = BUILD / 'assets' / 'share-previews'
MAX_BYTES = 350_000
UNIFORM_SHARE_SCRIPT = '<script src="/social-share-uniform-v1.js?v=20260904-v1"></script>'
DEFAULT_PREVIEW = PUBLIC_BASE + 'social/chanson-a-repondre-uno-share.png'

OG_IMAGE_RE = re.compile(r'<meta property="og:image" content="([^"]+)">')
OG_URL_RE = re.compile(r'<meta property="og:url" content="([^"]+)">')
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I | re.S)
DESCRIPTION_RE = re.compile(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\'][^>]*>', re.I)

PUBLIC_PAGES = {
    'index.html': '/',
    '404.html': '/',
    'lubiak/index.html': '/lubiak/',
    'megapole/index.html': '/megapole/',
    'enochian-terminal/index.html': '/enochian-terminal/',
    'enochian-terminal-live/index.html': '/enochian-terminal/',
}


def local_asset_from_url(url: str) -> Path | None:
    parsed = urlparse(url)
    path = unquote(parsed.path)
    marker = '/assets/'
    index = path.find(marker)
    if index < 0:
        return None
    relative = path[index + 1:]
    candidate = BUILD / relative
    return candidate if candidate.is_file() else None


def canonical_slug(html: str, page_dir: Path) -> str:
    match = OG_URL_RE.search(html)
    if match:
        parts = [part for part in urlparse(match.group(1)).path.split('/') if part]
        if len(parts) >= 2 and parts[-2] == 'share':
            return parts[-1]
        if 'share' in parts:
            index = parts.index('share')
            if index + 1 < len(parts):
                return parts[index + 1]
    return page_dir.name


def save_jpeg(image: Image.Image, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    for quality in (62, 50, 42, 35):
        image.save(
            target,
            'JPEG',
            quality=quality,
            optimize=True,
            progressive=True,
            subsampling=2,
        )
        if target.stat().st_size <= MAX_BYTES:
            return
    raise SystemExit(f'{target} exceeds {MAX_BYTES} bytes')


def convert(source: Path, target: Path) -> None:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert('RGB')
        fitted = ImageOps.fit(
            image,
            (600, 900),
            method=Image.Resampling.LANCZOS,
        )
        save_jpeg(fitted, target)


def find_logo() -> Path:
    candidates = [
        Path('assets/images/app_logo.png'),
        BUILD / 'assets' / 'assets' / 'images' / 'app_logo.png',
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise SystemExit('Missing Chanson à Répondre UNO logo: assets/images/app_logo.png')


def brand_preview(target: Path, logo_path: Path) -> None:
    with Image.open(target) as source:
        card = ImageOps.exif_transpose(source).convert('RGBA')
    with Image.open(logo_path) as source_logo:
        logo = ImageOps.exif_transpose(source_logo).convert('RGBA')

    logo.thumbnail((460, 118), Image.Resampling.LANCZOS)
    if logo.width < 1 or logo.height < 1:
        raise SystemExit(f'Invalid logo dimensions in {logo_path}')

    x = (card.width - logo.width) // 2
    y = 18
    padding_x = 16
    padding_y = 10
    overlay = Image.new('RGBA', card.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle(
        (
            max(0, x - padding_x),
            max(0, y - padding_y),
            min(card.width, x + logo.width + padding_x),
            min(card.height, y + logo.height + padding_y),
        ),
        radius=18,
        fill=(3, 7, 12, 205),
    )
    card = Image.alpha_composite(card, overlay)
    card.alpha_composite(logo, (x, y))
    save_jpeg(card.convert('RGB'), target)


def replace_social_image(html: str, old_url: str, new_url: str) -> str:
    html = html.replace(f'<meta property="og:image" content="{old_url}">', f'<meta property="og:image" content="{new_url}">')
    html = html.replace(f'<meta property="og:image:url" content="{old_url}">', f'<meta property="og:image:url" content="{new_url}">')
    html = html.replace(f'<meta property="og:image:secure_url" content="{old_url}">', f'<meta property="og:image:secure_url" content="{new_url}">')
    html = re.sub(r'<meta property="og:image:type" content="[^"]+">', '<meta property="og:image:type" content="image/jpeg">', html)
    html = html.replace(f'<meta name="twitter:image" content="{old_url}">', f'<meta name="twitter:image" content="{new_url}">')
    return html


def inject_uniform_share_script(html: str) -> str:
    if 'social-share-uniform-v1.js' in html or '</head>' not in html:
        return html
    return html.replace('</head>', UNIFORM_SHARE_SCRIPT + '</head>', 1)


def strip_public_social_tags(html: str) -> str:
    patterns = (
        r'<link\s+rel=["\']canonical["\'][^>]*>',
        r'<meta\s+property=["\']og:[^"\']+["\'][^>]*>',
        r'<meta\s+name=["\']twitter:[^"\']+["\'][^>]*>',
    )
    for pattern in patterns:
        html = re.sub(pattern, '', html, flags=re.I)
    return html


def apply_public_social_metadata(html: str, canonical_path: str) -> str:
    title_match = TITLE_RE.search(html)
    title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else 'Chanson à Répondre UNO!'
    desc_match = DESCRIPTION_RE.search(html)
    description = desc_match.group(1).strip() if desc_match else 'Chanson à Répondre UNO! — official web application.'
    canonical_url = PUBLIC_BASE.rstrip('/') + canonical_path
    html = strip_public_social_tags(html)
    block = (
        f'<link rel="canonical" href="{canonical_url}">'
        f'<meta property="og:type" content="website">'
        f'<meta property="og:site_name" content="Chanson à Répondre UNO!">'
        f'<meta property="og:title" content="{title}">'
        f'<meta property="og:description" content="{description}">'
        f'<meta property="og:url" content="{canonical_url}">'
        f'<meta property="og:image" content="{DEFAULT_PREVIEW}">'
        f'<meta property="og:image:secure_url" content="{DEFAULT_PREVIEW}">'
        f'<meta property="og:image:type" content="image/png">'
        f'<meta property="og:image:width" content="1200">'
        f'<meta property="og:image:height" content="630">'
        f'<meta name="twitter:card" content="summary_large_image">'
        f'<meta name="twitter:title" content="{title}">'
        f'<meta name="twitter:description" content="{description}">'
        f'<meta name="twitter:image" content="{DEFAULT_PREVIEW}">'
    )
    if '</head>' not in html:
        return html
    return html.replace('</head>', block + '</head>', 1)


PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
pages = sorted(SHARE_ROOT.glob('*/index.html'))
if not pages:
    raise SystemExit(f'No share pages found under {SHARE_ROOT}')

updated = 0
generated = 0
skipped = 0
preview_targets: set[Path] = set()
for page in pages:
    html = page.read_text(encoding='utf-8')
    image_match = OG_IMAGE_RE.search(html)
    if not image_match:
        skipped += 1
        continue

    old_url = image_match.group(1)
    slug = canonical_slug(html, page.parent)
    target = PREVIEW_ROOT / f'{slug}.jpg'

    if not target.is_file():
        source = local_asset_from_url(old_url)
        if source is None:
            skipped += 1
            continue
        convert(source, target)
        generated += 1

    preview_targets.add(target)
    preview_url = f'{PUBLIC_BASE}assets/share-previews/{slug}.jpg'
    rewritten = replace_social_image(html, old_url, preview_url)
    if rewritten != html:
        page.write_text(rewritten, encoding='utf-8')
        updated += 1

logo_path = find_logo()
branded = 0
for target in sorted(preview_targets):
    if not target.is_file():
        raise SystemExit(f'Missing social preview before branding: {target}')
    brand_preview(target, logo_path)
    branded += 1

uniform_injected = 0
for html_path in sorted(BUILD.rglob('*.html')):
    rel = html_path.relative_to(BUILD).as_posix()
    if rel.startswith('share/'):
        continue
    html = html_path.read_text(encoding='utf-8')
    rewritten = inject_uniform_share_script(html)
    if rel in PUBLIC_PAGES:
        rewritten = apply_public_social_metadata(rewritten, PUBLIC_PAGES[rel])
    if rewritten != html:
        html_path.write_text(rewritten, encoding='utf-8')
        uniform_injected += 1

print(
    'Global share previews: '
    f'{updated} pages updated, {generated} previews generated, '
    f'{branded} branded with the UNO logo, {skipped} skipped; '
    f'{uniform_injected} interactive pages use the uniform share contract.'
)
