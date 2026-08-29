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


def get_image_bytes(doc, binary, image_index):
    image = doc['images'][image_index]
    if 'bufferView' not in image:
        raise ValueError('Exterior castle uses a non-embedded image; deploy upgrader expects embedded textures')
    bv = doc['bufferViews'][image['bufferView']]
    start = bv.get('byteOffset', 0)
    return bytes(binary[start:start + bv['byteLength']])


def open_rgb(doc, binary, image_index):
    return Image.open(io.BytesIO(get_image_bytes(doc, binary, image_index))).convert('RGB')


def jpeg(im, quality=88):
    out = io.BytesIO()
    im.save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
    return out.getvalue()


def castle_grade(base):
    # Reference look: moonlit blue-black Scottish masonry, damp contrast, warm practical lights.
    base = base.resize((2048, 2048), Image.Resampling.LANCZOS)
    gray = ImageOps.grayscale(base)
    gray = ImageEnhance.Contrast(gray).enhance(1.28)
    cool = ImageOps.colorize(gray, black=(5, 9, 14), white=(96, 113, 126))
    cool = ImageEnhance.Contrast(cool).enhance(1.18)

    # Preserve some source chroma for banners/crests while keeping the overall cold night palette.
    source = ImageEnhance.Brightness(base).enhance(0.50)
    source = ImageEnhance.Color(source).enhance(0.82)
    graded = Image.blend(cool, source, 0.22)

    # Bright warm areas become lantern/window candidates, not flat white.
    r, g, b = base.split()
    warm_seed = ImageChops.subtract(r, b, scale=1.0, offset=0)
    bright = gray.point(lambda x: 0 if x < 145 else min(255, int((x - 145) * 2.8)))
    amber_mask = ImageChops.multiply(ImageOps.autocontrast(warm_seed), bright)
    amber_mask = amber_mask.filter(ImageFilter.GaussianBlur(0.8))
    amber_layer = ImageOps.colorize(gray, black=(45, 13, 2), white=(255, 172, 74))
    graded = Image.composite(amber_layer, graded, amber_mask)

    # Damp stone: deepen recesses while leaving edges readable under moonlight.
    shadows = gray.point(lambda x: max(0, min(255, 205 - x * 2)))
    darker = ImageEnhance.Brightness(graded).enhance(0.58)
    graded = Image.composite(darker, graded, shadows)
    graded = ImageEnhance.Sharpness(graded).enhance(1.10)
    return graded, gray, amber_mask


def normal_from_gray(gray):
    g = gray.resize((1024, 1024), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.55))
    l = ImageChops.offset(g, -1, 0); r = ImageChops.offset(g, 1, 0)
    u = ImageChops.offset(g, 0, -1); d = ImageChops.offset(g, 0, 1)
    dx = ImageChops.subtract(l, r, scale=1.0, offset=128)
    dy = ImageChops.subtract(u, d, scale=1.0, offset=128)
    return Image.merge('RGB', (dx, dy, Image.new('L', g.size, 245)))


def metal_rough_from_gray(gray):
    g = gray.resize((1024, 1024), Image.Resampling.LANCZOS)
    # G=roughness, B=metallic in glTF ORM convention. Stone is rough but slightly damp.
    rough = ImageOps.invert(g).point(lambda x: max(80, min(220, 112 + x // 2)))
    metallic = Image.new('L', g.size, 10)
    return Image.merge('RGB', (Image.new('L', g.size, 255), rough, metallic))


def emissive_from_mask(gray, amber_mask):
    size = (1024, 1024)
    g = gray.resize(size, Image.Resampling.LANCZOS)
    mask = amber_mask.resize(size, Image.Resampling.LANCZOS)
    amber = ImageOps.colorize(g, black=(0, 0, 0), white=(255, 150, 52))
    return Image.composite(amber, Image.new('RGB', size, (0, 0, 0)), mask)


def append_texture(doc, binary, name, data, mime='image/jpeg'):
    while len(binary) % 4: binary.append(0)
    offset = len(binary)
    binary.extend(data)
    while len(binary) % 4: binary.append(0)
    bv_i = len(doc.setdefault('bufferViews', []))
    doc['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(data)})
    im_i = len(doc.setdefault('images', []))
    doc['images'].append({'name': name, 'mimeType': mime, 'bufferView': bv_i})
    tex_i = len(doc.setdefault('textures', []))
    tex = {'source': im_i}
    if doc.get('samplers'): tex['sampler'] = 0
    doc['textures'].append(tex)
    return tex_i


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
        raise ValueError('Exterior castle GLB has no embedded textured materials')

    cache = {}
    upgraded = 0
    for i, mat in enumerate(materials):
        pbr = mat.setdefault('pbrMetallicRoughness', {})
        base_tex = pbr.get('baseColorTexture', {}).get('index')
        if base_tex is None or base_tex >= len(textures):
            # Conservative cold stone fallback for untextured materials.
            pbr['baseColorFactor'] = [0.18, 0.22, 0.25, pbr.get('baseColorFactor', [1,1,1,1])[3]]
            pbr['metallicFactor'] = 0.06
            pbr['roughnessFactor'] = 0.78
            continue
        source_image = textures[base_tex].get('source')
        if source_image is None:
            continue
        if source_image not in cache:
            base = open_rgb(doc, binary, source_image)
            albedo, gray, amber_mask = castle_grade(base)
            normal = normal_from_gray(gray)
            mr = metal_rough_from_gray(gray)
            emissive = emissive_from_mask(gray, amber_mask)
            cache[source_image] = {
                'albedo': append_texture(doc, binary, f'CASTLE_NIGHT_ALBEDO_{source_image}_2048', jpeg(albedo, 90)),
                'normal': append_texture(doc, binary, f'CASTLE_STONE_NORMAL_{source_image}_1024', jpeg(normal, 88)),
                'mr': append_texture(doc, binary, f'CASTLE_DAMP_METALROUGH_{source_image}_1024', jpeg(mr, 87)),
                'emissive': append_texture(doc, binary, f'CASTLE_AMBER_EMISSIVE_{source_image}_1024', jpeg(emissive, 90)),
            }
        t = cache[source_image]
        pbr['baseColorFactor'] = [1, 1, 1, 1]
        pbr['baseColorTexture'] = {'index': t['albedo']}
        pbr['metallicFactor'] = 1.0
        pbr['roughnessFactor'] = 1.0
        pbr['metallicRoughnessTexture'] = {'index': t['mr']}
        mat['normalTexture'] = {'index': t['normal'], 'scale': 0.50}
        mat['emissiveTexture'] = {'index': t['emissive']}
        mat['emissiveFactor'] = [0.88, 0.58, 0.24]
        name = (mat.get('name') or '').lower()
        if any(k in name for k in ('iron', 'gate', 'metal', 'lamp')):
            pbr['metallicFactor'] = 0.76
            pbr['roughnessFactor'] = 0.52
        mat['name'] = f"{mat.get('name') or 'CASTLE_MATERIAL'}__NIGHT_PBR"
        upgraded += 1

    doc.setdefault('asset', {})['generator'] = 'CHANSON A REPONDRE UNO Castle exterior PBR upgrader v1'
    doc['asset']['extras'] = {
        'look': 'moonlit blue-black wet Scottish masonry; warm amber lanterns and windows; dark iron gate; readable stone relief',
        'reference': 'approved castle exterior night texture direction 2026-08-30'
    }
    temp = path + '.castle-pbr.tmp'
    write_glb(temp, doc, binary)
    os.replace(temp, path)
    print(f'CASTLE exterior PBR upgraded: {path} materials={upgraded} source_textures={len(cache)} bytes={os.path.getsize(path)}')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('glb')
    args = p.parse_args()
    upgrade(args.glb)

if __name__ == '__main__':
    main()
