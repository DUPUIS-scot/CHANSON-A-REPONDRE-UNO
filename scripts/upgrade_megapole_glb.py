#!/usr/bin/env python3
import argparse, io, json, os, struct
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


def read_glb(path):
    with open(path, 'rb') as f:
        magic, version, total = struct.unpack('<4sII', f.read(12))
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


def embedded_image(doc, binary, index=0):
    image = doc['images'][index]
    bv = doc['bufferViews'][image['bufferView']]
    start = bv.get('byteOffset', 0)
    data = bytes(binary[start:start + bv['byteLength']])
    return Image.open(io.BytesIO(data)).convert('RGB')


def jpeg(im, quality=90):
    out = io.BytesIO()
    im.save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
    return out.getvalue()


def colorize_atlas(base):
    base = base.resize((2048, 2048), Image.Resampling.LANCZOS)
    gray = ImageOps.grayscale(base)
    warm = ImageOps.colorize(gray, black=(13, 3, 3), white=(207, 104, 55))
    graded = Image.blend(base, warm, 0.58)
    graded = ImageEnhance.Contrast(graded).enhance(1.18)
    graded = ImageEnhance.Color(graded).enhance(1.12)
    r, g, b = base.split()
    cyan_seed = ImageChops.subtract(ImageChops.darker(g, b), r, scale=1.0, offset=0)
    cyan_seed = ImageOps.autocontrast(cyan_seed).filter(ImageFilter.GaussianBlur(0.8))
    cyan_mask = cyan_seed.point(lambda x: 0 if x < 72 else min(255, int((x - 72) * 2.7)))
    cyan_layer = ImageOps.colorize(gray, black=(0, 35, 38), white=(85, 255, 250))
    graded = Image.composite(cyan_layer, graded, cyan_mask)
    amber_seed = ImageChops.subtract(r, b, scale=1.0, offset=0)
    bright = gray.point(lambda x: 0 if x < 105 else min(255, int((x - 105) * 2.2)))
    amber_mask = ImageChops.multiply(ImageOps.autocontrast(amber_seed), bright).filter(ImageFilter.GaussianBlur(0.55))
    amber_layer = ImageOps.colorize(gray, black=(55, 8, 1), white=(255, 184, 70))
    graded = Image.composite(amber_layer, graded, amber_mask)
    shadow = gray.point(lambda x: max(0, 255 - x * 3))
    dark = ImageEnhance.Brightness(graded).enhance(0.62)
    graded = Image.composite(dark, graded, shadow)
    return graded, cyan_mask, amber_mask, gray


def normal_from_gray(gray):
    g = gray.resize((1024, 1024), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.45))
    left = ImageChops.offset(g, -1, 0)
    right = ImageChops.offset(g, 1, 0)
    up = ImageChops.offset(g, 0, -1)
    down = ImageChops.offset(g, 0, 1)
    dx = ImageChops.subtract(left, right, scale=1.2, offset=128)
    dy = ImageChops.subtract(up, down, scale=1.2, offset=128)
    blue = Image.new('L', g.size, 246)
    return Image.merge('RGB', (dx, dy, blue))


def build_emissive(gray, cyan_mask, amber_mask):
    size = (1024, 1024)
    g = gray.resize(size, Image.Resampling.LANCZOS)
    cm = cyan_mask.resize(size, Image.Resampling.LANCZOS)
    am = amber_mask.resize(size, Image.Resampling.LANCZOS)
    cyan = ImageOps.colorize(g, black=(0, 0, 0), white=(25, 255, 245))
    amber = ImageOps.colorize(g, black=(0, 0, 0), white=(255, 132, 18))
    black = Image.new('RGB', size, (0, 0, 0))
    out = Image.composite(cyan, black, cm)
    out = Image.composite(amber, out, am)
    return ImageEnhance.Contrast(out).enhance(1.18)


def build_metal_rough(gray, cyan_mask):
    size = (1024, 1024)
    g = gray.resize(size, Image.Resampling.LANCZOS)
    cm = cyan_mask.resize(size, Image.Resampling.LANCZOS)
    rough = ImageOps.invert(g).point(lambda x: max(118, min(225, 148 + x // 3)))
    rough = Image.composite(Image.new('L', size, 58), rough, cm)
    metallic = g.point(lambda x: max(12, min(96, x // 3)))
    metallic = Image.composite(Image.new('L', size, 8), metallic, cm)
    return Image.merge('RGB', (Image.new('L', size, 0), rough, metallic))


def build_ao(gray):
    g = gray.resize((1024, 1024), Image.Resampling.LANCZOS)
    blur = g.filter(ImageFilter.GaussianBlur(5.0))
    detail = ImageChops.subtract(g, blur, scale=1.0, offset=128)
    return ImageEnhance.Contrast(detail).enhance(0.55).point(lambda x: max(105, min(255, x + 74))).convert('RGB')


def append_texture(doc, binary, name, data, mime='image/jpeg'):
    while len(binary) % 4:
        binary.append(0)
    offset = len(binary)
    binary.extend(data)
    while len(binary) % 4:
        binary.append(0)
    bv = len(doc.setdefault('bufferViews', []))
    doc['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(data)})
    image = len(doc.setdefault('images', []))
    doc['images'].append({'name': name, 'mimeType': mime, 'bufferView': bv})
    texture = len(doc.setdefault('textures', []))
    sampler = 0 if doc.get('samplers') else None
    tex = {'source': image}
    if sampler is not None:
        tex['sampler'] = sampler
    doc['textures'].append(tex)
    return texture


def write_glb(path, doc, binary):
    doc['buffers'][0]['byteLength'] = len(binary)
    raw = json.dumps(doc, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    while len(raw) % 4:
        raw += b' '
    while len(binary) % 4:
        binary.append(0)
    total = 12 + 8 + len(raw) + 8 + len(binary)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<II', len(raw), 0x4E4F534A)); f.write(raw)
        f.write(struct.pack('<II', len(binary), 0x004E4942)); f.write(binary)


def upgrade(path):
    doc, binary = read_glb(path)
    if not doc.get('materials') or not doc.get('images'):
        raise ValueError('Megapole GLB has no material/texture to upgrade')
    base = embedded_image(doc, binary, 0)
    albedo, cyan_mask, amber_mask, gray = colorize_atlas(base)
    normal = normal_from_gray(gray)
    emissive = build_emissive(gray, cyan_mask, amber_mask)
    metalrough = build_metal_rough(gray, cyan_mask)
    ao = build_ao(gray)
    albedo_i = append_texture(doc, binary, 'MEGAPOLE_PBR_ALBEDO_2048', jpeg(albedo, 90))
    normal_i = append_texture(doc, binary, 'MEGAPOLE_PBR_NORMAL_1024', jpeg(normal, 88))
    emissive_i = append_texture(doc, binary, 'MEGAPOLE_PBR_EMISSIVE_1024', jpeg(emissive, 91))
    mr_i = append_texture(doc, binary, 'MEGAPOLE_PBR_METALROUGH_1024', jpeg(metalrough, 88))
    ao_i = append_texture(doc, binary, 'MEGAPOLE_PBR_AO_1024', jpeg(ao, 88))
    mat = doc['materials'][0]
    mat['name'] = 'SILMARI_LLION_MEGAPOLE_PBR_MATERIAL'
    mat['pbrMetallicRoughness'] = {'baseColorFactor': [1, 1, 1, 1], 'baseColorTexture': {'index': albedo_i}, 'metallicFactor': 1.0, 'roughnessFactor': 1.0, 'metallicRoughnessTexture': {'index': mr_i}}
    mat['normalTexture'] = {'index': normal_i, 'scale': 0.68}
    mat['occlusionTexture'] = {'index': ao_i, 'strength': 0.62}
    mat['emissiveTexture'] = {'index': emissive_i}
    mat['emissiveFactor'] = [1.0, 1.0, 1.0]
    mat.setdefault('extensions', {})['KHR_materials_emissive_strength'] = {'emissiveStrength': 2.25}
    if 'KHR_materials_emissive_strength' not in doc.setdefault('extensionsUsed', []):
        doc['extensionsUsed'].append('KHR_materials_emissive_strength')
    doc.setdefault('asset', {})['generator'] = 'CHANSON A REPONDRE UNO Megapole PBR build upgrader v8'
    doc['asset']['extras'] = {'look': 'dark mineral monumental; burnt bronze; amber glyphs; cyan water; frosted blue-white light'}
    temp = path + '.pbr.tmp'
    write_glb(temp, doc, binary)
    os.replace(temp, path)
    print(f'MEGAPOLE PBR upgraded: {path} ({os.path.getsize(path)} bytes)')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('glb')
    args = p.parse_args()
    upgrade(args.glb)
    model_dir = os.path.dirname(args.glb)

    exterior = os.path.join(model_dir, 'castle_exterior.glb')
    if not os.path.isfile(exterior) or os.path.getsize(exterior) == 0:
        raise FileNotFoundError(f'Expected exterior castle GLB beside Megapole target: {exterior}')
    from upgrade_castle_exterior_glb import upgrade as upgrade_exterior
    upgrade_exterior(exterior)
    print(f'CASTLE exterior deployment texture pass complete: {exterior}')

    interior = os.path.join(model_dir, 'castle_interior.glb')
    if not os.path.isfile(interior) or os.path.getsize(interior) == 0:
        raise FileNotFoundError(f'Expected interior castle GLB beside Megapole target: {interior}')
    from upgrade_castle_interior_glb import upgrade as upgrade_interior
    upgrade_interior(interior)
    print(f'CASTLE interior deployment texture pass complete: {interior}')

    laboratory = os.path.join(model_dir, 'laboratory_interior.glb')
    if not os.path.isfile(laboratory) or os.path.getsize(laboratory) == 0:
        raise FileNotFoundError(f'Expected laboratory interior GLB beside Megapole target: {laboratory}')
    from upgrade_laboratory_interior_glb import upgrade as upgrade_laboratory
    upgrade_laboratory(laboratory)
    print(f'LABORATORY deployment texture pass complete: {laboratory}')


if __name__ == '__main__':
    main()
