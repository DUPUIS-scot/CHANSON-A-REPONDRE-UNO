#!/usr/bin/env python3
"""Preserve the authoritative textured castle interior GLB unchanged.

The canonical assets/models/castle_interior.glb is the exact same blob as
assets/models/textured-glb-comparison/castle_interior_textured.glb.  The web
deploy pipeline still imports upgrade() from this module, so upgrade() now
acts as an integrity validator instead of rebaking or recolouring the already
approved textured asset.
"""

import argparse
import json
import os
import struct


def validate_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    if len(data) < 20:
        raise ValueError('Interior castle GLB is truncated')
    magic, version, declared = struct.unpack('<4sII', data[:12])
    if magic != b'glTF' or version != 2:
        raise ValueError('Expected glTF 2.0 GLB')
    if declared != len(data):
        raise ValueError(f'Interior castle GLB length mismatch: declared={declared} actual={len(data)}')
    jlen, jtype = struct.unpack('<II', data[12:20])
    if jtype != 0x4E4F534A or 20 + jlen > len(data):
        raise ValueError('Interior castle GLB JSON chunk is invalid')
    doc = json.loads(data[20:20 + jlen].decode('utf-8').rstrip(' \t\r\n\x00'))
    if not doc.get('meshes'):
        raise ValueError('Interior castle GLB has no meshes')
    if not doc.get('materials'):
        raise ValueError('Interior castle GLB has no materials')
    if not doc.get('images'):
        raise ValueError('Interior castle GLB has no embedded textures')
    return doc


def upgrade(path):
    doc = validate_glb(path)
    print(
        'CASTLE interior preserved unchanged: '
        f'{path} meshes={len(doc.get("meshes", []))} '
        f'materials={len(doc.get("materials", []))} '
        f'images={len(doc.get("images", []))} bytes={os.path.getsize(path)}'
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('glb')
    args = parser.parse_args()
    upgrade(args.glb)


if __name__ == '__main__':
    main()
