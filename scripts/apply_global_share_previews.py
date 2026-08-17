#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

BUILD = Path(sys.argv[1] if len(sys.argv) > 1 else 'build/web')
PUBLIC_BASE = (sys.argv[2] if len(sys.argv) > 2 else 'https://www.chanson-a-repondre-uno.scot/').rstrip('/') + '/'
SHARE_ROOT = BUILD / 'share'
PREVIEW_ROOT = BUILD / 'assets' / 'share-previews'
MAX_BYTES = 350_000

OG_IMAGE_RE = re.compile(r'<meta property="og:image" content="([^"]+)">')
OG_URL_RE = re.compile(r'<meta property="og:url" content="([^"]+)">')


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


def convert(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    for quality in (62, 50, 42):
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
        if target.stat().st_size <= MAX_BYTES:
            return
    raise SystemExit(f'{target} exceeds {MAX_BYTES} bytes')


def replace_social_image(html: str, old_url: str, new_url: str) -> str:
    html = html.replace(f'<meta property="og:image" content="{old_url}">', f'<meta property="og:image" content="{new_url}">')
    html = html.replace(f'<meta property="og:image:url" content="{old_url}">', f'<meta property="og:image:url" content="{new_url}">')
    html = html.replace(f'<meta property="og:image:secure_url" content="{old_url}">', f'<meta property="og:image:secure_url" content="{new_url}">')
    html = re.sub(r'<meta property="og:image:type" content="[^"]+">', '<meta property="og:image:type" content="image/jpeg">', html)
    html = html.replace(f'<meta name="twitter:image" content="{old_url}">', f'<meta name="twitter:image" content="{new_url}">')
    return html


PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
pages = sorted(SHARE_ROOT.glob('*/index.html'))
if not pages:
    raise SystemExit(f'No share pages found under {SHARE_ROOT}')

updated = 0
generated = 0
skipped = 0
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

    preview_url = f'{PUBLIC_BASE}assets/share-previews/{slug}.jpg'
    rewritten = replace_social_image(html, old_url, preview_url)
    if rewritten != html:
        page.write_text(rewritten, encoding='utf-8')
        updated += 1

print(f'Global share previews: {updated} pages updated, {generated} previews generated, {skipped} skipped.')
