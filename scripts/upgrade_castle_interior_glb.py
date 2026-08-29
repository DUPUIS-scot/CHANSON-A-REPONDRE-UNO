#!/usr/bin/env python3
import argparse, io, json, os, struct
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


def read_glb(path):
    with open(path, 'rb') as f:
        magic, version, _ = struct.unpack('<4sII', f.read(12))
        if magic != b'glTF' or version != 2:
            raise ValueError('Expected glTF 2.0 GLB')
        jlen, jtype = struct.unpack('<II', f.read(8))
        if jtype != 0x4E4F534A:
            raise ValueError('Missing JSON chunk')
        doc = json.loads(f.read(jlen).decode('utf-8').rstrip(' \t\r\n\x00'))
        blen, btype = struct.unpack('<II', f.read(8))
        if btype != 0x004E4942:
            raise ValueError('Missing BIN chunk')
        binary = bytearray(f.read(blen))
    return doc, binary


def embedded_rgb(doc, binary, image_index):
    image = doc['images'][image_index]
    if 'bufferView' not in image:
        raise ValueError('Interior castle texture must be embedded in GLB')
    bv = doc['bufferViews'][image['bufferView']]
    start = bv.get('byteOffset', 0)
    raw = bytes(binary[start:start + bv['byteLength']])
    return Image.open(io.BytesIO(raw)).convert('RGB')


def jpeg(im, quality=88):
    out = io.BytesIO()
    im.save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
    return out.getvalue()


def grade_interior(base):
    # Approved reference: dark warm gothic hall, aged stone/wood, amber candle light,
    # cool window light, deep red upholstery/banners and strong architectural relief.
    base = base.resize((2048, 2048), Image.Resampling.LANCZOS)
    gray = ImageEnhance.Contrast(ImageOps.grayscale(base)).enhance(1.30)

    warm_stone = ImageOps.colorize(gray, black=(8, 6, 5), white=(118, 86, 60))
    warm_stone = ImageEnhance.Contrast(warm_stone).enhance(1.15)
    source = ImageEnhance.Brightness(base).enhance(0.52)
    source = ImageEnhance.Color(source).enhance(0.92)
    graded = Image.blend(warm_stone, source, 0.24)

    r, g, b = base.split()
    bright = gray.point(lambda x: 0 if x < 145 else min(255, int((x - 145) * 2.9)))
    amber_seed = ImageChops.subtract(r, b, scale=1.0, offset=0)
    amber_mask = ImageChops.multiply(ImageOps.autocontrast(amber_seed), bright).filter(ImageFilter.GaussianBlur(0.7))
    amber = ImageOps.colorize(gray, black=(48, 12, 1), white=(255, 176, 74))
    graded = Image.composite(amber, graded, amber_mask)

    cool_seed = ImageChops.subtract(b, r, scale=1.0, offset=0)
    cool_mask = ImageChops.multiply(ImageOps.autocontrast(cool_seed), bright).filter(ImageFilter.GaussianBlur(0.7))
    cool = ImageOps.colorize(gray, black=(2, 10, 16), white=(110, 205, 255))
    graded = Image.composite(cool, graded, cool_mask)

    # Preserve richer reds for banners/carpets/upholstery.
    red_seed = ImageChops.subtract(r, ImageChops.darker(g, b), scale=1.0, offset=0)
    red_mask = ImageOps.autocontrast(red_seed).point(lambda x: 0 if x < 58 else min(255, int((x - 58) * 2.1)))
    red_layer = ImageOps.colorize(gray, black=(30, 2, 2), white=(145, 24, 18))
    graded = Image.composite(red_layer, graded, red_mask)

    shadows = gray.point(lambda x: max(0, min(255, 212 - x * 2)))
    graded = Image.composite(ImageEnhance.Brightness(graded).enhance(0.54), graded, shadows)
    graded = ImageEnhance.Sharpness(graded).enhance(1.12)
    return graded, gray, amber_mask, cool_mask


def normal_from_gray(gray):
    g = gray.resize((1024, 1024), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
    l = ImageChops.offset(g, -1, 0); r = ImageChops.offset(g, 1, 0)
    u = ImageChops.offset(g, 0, -1); d = ImageChops.offset(g, 0, 1)
    dx = ImageChops.subtract(l, r, scale=1.0, offset=128)
    dy = ImageChops.subtract(u, d, scale=1.0, offset=128)
    return Image.merge('RGB', (dx, dy, Image.new('L', g.size, 245)))


def metal_rough(gray):
    g = gray.resize((1024, 1024), Image.Resampling.LANCZOS)
    rough = ImageOps.invert(g).point(lambda x: max(86, min(225, 118 + x // 2)))
    metallic = Image.new('L', g.size, 12)
    return Image.merge('RGB', (Image.new('L', g.size, 255), rough, metallic))


def emissive(gray, amber_mask, cool_mask):
    size = (1024, 1024)
    g = gray.resize(size, Image.Resampling.LANCZOS)
    am = amber_mask.resize(size, Image.Resampling.LANCZOS)
    cm = cool_mask.resize(size, Image.Resampling.LANCZOS)
    black = Image.new('RGB', size, (0, 0, 0))
    amber = ImageOps.colorize(g, black=(0, 0, 0), white=(255, 150, 48))
    cool = ImageOps.colorize(g, black=(0, 0, 0), white=(90, 180, 255))
    out = Image.composite(amber, black, am)
    out = Image.composite(cool, out, cm)
    return out


def append_texture(doc, binary, name, data, mime='image/jpeg'):
    while len(binary) % 4: binary.append(0)
    offset = len(binary); binary.extend(data)
    while len(binary) % 4: binary.append(0)
    bv_i = len(doc.setdefault('bufferViews', []))
    doc['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(data)})
    im_i = len(doc.setdefault('images', []))
    doc['images'].append({'name': name, 'mimeType': mime, 'bufferView': bv_i})
    tx_i = len(doc.setdefault('textures', []))
    tex = {'source': im_i}
    if doc.get('samplers'): tex['sampler'] = 0
    doc['textures'].append(tex)
    return tx_i


def write_glb(path, doc, binary):
    doc['buffers'][0]['byteLength'] = len(binary)
    raw = json.dumps(doc, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    while len(raw) % 4: raw += b' '
    while len(binary) % 4: binary.append(0)
    total = 12 + 8 + len(raw) + 8 + len(binary)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<II', len(raw), 0x4E4F534A)); f.write(raw)
        f.write(struct.pack('<II', len(binary), 0x004E4942)); f.write(binary)


def upgrade(path):
    doc, binary = read_glb(path)
    materials = doc.get('materials') or []
    textures = doc.get('textures') or []
    if not materials or not textures or not doc.get('images'):
        raise ValueError('Interior castle GLB has no embedded textured materials')

    cache = {}
    upgraded = 0
    for mat in materials:
        pbr = mat.setdefault('pbrMetallicRoughness', {})
        base_tex = pbr.get('baseColorTexture', {}).get('index')
        name = (mat.get('name') or '').lower()
        if base_tex is None or base_tex >= len(textures):
            pbr['baseColorFactor'] = [0.22, 0.16, 0.12, pbr.get('baseColorFactor', [1,1,1,1])[3]]
            pbr['metallicFactor'] = 0.05
            pbr['roughnessFactor'] = 0.78
            continue
        source_image = textures[base_tex].get('source')
        if source_image is None:
            continue
        if source_image not in cache:
            base = embedded_rgb(doc, binary, source_image)
            albedo, gray, amber_mask, cool_mask = grade_interior(base)
            cache[source_image] = {
                'albedo': append_texture(doc, binary, f'CASTLE_INTERIOR_ALBEDO_{source_image}_2048', jpeg(albedo, 90)),
                'normal': append_texture(doc, binary, f'CASTLE_INTERIOR_NORMAL_{source_image}_1024', jpeg(normal_from_gray(gray), 88)),
                'mr': append_texture(doc, binary, f'CASTLE_INTERIOR_METALROUGH_{source_image}_1024', jpeg(metal_rough(gray), 87)),
                'emissive': append_texture(doc, binary, f'CASTLE_INTERIOR_EMISSIVE_{source_image}_1024', jpeg(emissive(gray, amber_mask, cool_mask), 90)),
            }
        t = cache[source_image]
        pbr['baseColorFactor'] = [1,1,1,1]
        pbr['baseColorTexture'] = {'index': t['albedo']}
        pbr['metallicFactor'] = 1.0
        pbr['roughnessFactor'] = 1.0
        pbr['metallicRoughnessTexture'] = {'index': t['mr']}
        mat['normalTexture'] = {'index': t['normal'], 'scale': 0.52}
        mat['emissiveTexture'] = {'index': t['emissive']}
        mat['emissiveFactor'] = [0.95, 0.72, 0.52]
        if any(k in name for k in ('metal','iron','chandelier','candle','sconce','gold','brass')):
            pbr['metallicFactor'] = 0.72
            pbr['roughnessFactor'] = 0.48
        if any(k in name for k in ('cloth','banner','carpet','velvet','fabric','seat','sofa')):
            pbr['metallicFactor'] = 0.0
            pbr['roughnessFactor'] = 0.88
        mat['name'] = f"{mat.get('name') or 'CASTLE_INTERIOR_MATERIAL'}__GOTHIC_PBR"
        upgraded += 1

    doc.setdefault('asset', {})['generator'] = 'CHANSON A REPONDRE UNO Castle interior PBR upgrader v1'
    doc['asset']['extras'] = {
        'look': 'dark warm gothic stone hall; amber candle/chandelier light; cool window light; burgundy banners and upholstery; aged wood and iron',
        'reference': 'approved interior castle texture direction 2026-08-30'
    }
    temp = path + '.interior-pbr.tmp'
    write_glb(temp, doc, binary)
    os.replace(temp, path)
    print(f'CASTLE interior PBR upgraded: {path} materials={upgraded} source_textures={len(cache)} bytes={os.path.getsize(path)}')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('glb')
    args = p.parse_args()
    upgrade(args.glb)

if __name__ == '__main__':
    main()
