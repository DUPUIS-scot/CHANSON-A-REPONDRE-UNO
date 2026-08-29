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
        raise ValueError('Laboratory texture must be embedded in GLB')
    bv = doc['bufferViews'][image['bufferView']]
    start = bv.get('byteOffset', 0)
    raw = bytes(binary[start:start + bv['byteLength']])
    return Image.open(io.BytesIO(raw)).convert('RGB')


def jpeg(im, quality=88):
    out = io.BytesIO(); im.save(out, 'JPEG', quality=quality, optimize=True, progressive=True); return out.getvalue()


def grade_lab(base):
    # Approved laboratory reference: black-brown gothic stone/wood, bronze machinery,
    # dense amber candle light, cold stained-glass/window accents and blue arcane screens.
    base = base.resize((2048, 2048), Image.Resampling.LANCZOS)
    gray = ImageEnhance.Contrast(ImageOps.grayscale(base)).enhance(1.34)
    dark = ImageOps.colorize(gray, black=(5, 4, 3), white=(101, 72, 47))
    source = ImageEnhance.Color(ImageEnhance.Brightness(base).enhance(0.48)).enhance(0.92)
    graded = Image.blend(dark, source, 0.20)
    r, g, b = base.split()
    bright = gray.point(lambda x: 0 if x < 135 else min(255, int((x - 135) * 3.0)))
    amber_seed = ImageChops.subtract(r, b, scale=1.0, offset=0)
    amber_mask = ImageChops.multiply(ImageOps.autocontrast(amber_seed), bright).filter(ImageFilter.GaussianBlur(0.65))
    amber = ImageOps.colorize(gray, black=(42, 9, 0), white=(255, 171, 60))
    graded = Image.composite(amber, graded, amber_mask)
    blue_seed = ImageChops.subtract(b, r, scale=1.0, offset=0)
    blue_mask = ImageChops.multiply(ImageOps.autocontrast(blue_seed), bright).filter(ImageFilter.GaussianBlur(0.6))
    blue = ImageOps.colorize(gray, black=(1, 7, 14), white=(88, 184, 255))
    graded = Image.composite(blue, graded, blue_mask)
    shadows = gray.point(lambda x: max(0, min(255, 220 - x * 2)))
    graded = Image.composite(ImageEnhance.Brightness(graded).enhance(0.48), graded, shadows)
    return ImageEnhance.Sharpness(graded).enhance(1.14), gray, amber_mask, blue_mask


def normal_from_gray(gray):
    g = gray.resize((1024,1024), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.45))
    dx = ImageChops.subtract(ImageChops.offset(g,-1,0), ImageChops.offset(g,1,0), scale=1.0, offset=128)
    dy = ImageChops.subtract(ImageChops.offset(g,0,-1), ImageChops.offset(g,0,1), scale=1.0, offset=128)
    return Image.merge('RGB',(dx,dy,Image.new('L',g.size,245)))


def metal_rough(gray):
    g = gray.resize((1024,1024), Image.Resampling.LANCZOS)
    rough = ImageOps.invert(g).point(lambda x:max(78,min(220,108+x//2)))
    return Image.merge('RGB',(Image.new('L',g.size,255),rough,Image.new('L',g.size,18)))


def emissive(gray, amber_mask, blue_mask):
    size=(1024,1024); g=gray.resize(size,Image.Resampling.LANCZOS)
    am=amber_mask.resize(size,Image.Resampling.LANCZOS); bm=blue_mask.resize(size,Image.Resampling.LANCZOS)
    out=Image.composite(ImageOps.colorize(g,black=(0,0,0),white=(255,147,38)),Image.new('RGB',size,(0,0,0)),am)
    return Image.composite(ImageOps.colorize(g,black=(0,0,0),white=(70,165,255)),out,bm)


def append_texture(doc,binary,name,data):
    while len(binary)%4: binary.append(0)
    off=len(binary); binary.extend(data)
    while len(binary)%4: binary.append(0)
    bv=len(doc.setdefault('bufferViews',[])); doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(data)})
    im=len(doc.setdefault('images',[])); doc['images'].append({'name':name,'mimeType':'image/jpeg','bufferView':bv})
    tx=len(doc.setdefault('textures',[])); tex={'source':im}
    if doc.get('samplers'): tex['sampler']=0
    doc['textures'].append(tex); return tx


def write_glb(path,doc,binary):
    doc['buffers'][0]['byteLength']=len(binary)
    raw=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode('utf-8')
    while len(raw)%4: raw+=b' '
    while len(binary)%4: binary.append(0)
    total=12+8+len(raw)+8+len(binary)
    with open(path,'wb') as f:
        f.write(struct.pack('<4sII',b'glTF',2,total)); f.write(struct.pack('<II',len(raw),0x4E4F534A)); f.write(raw); f.write(struct.pack('<II',len(binary),0x004E4942)); f.write(binary)


def upgrade(path):
    doc,binary=read_glb(path); mats=doc.get('materials') or []; textures=doc.get('textures') or []
    if not mats or not textures or not doc.get('images'): raise ValueError('Laboratory GLB has no embedded textured materials')
    cache={}; upgraded=0
    for mat in mats:
        pbr=mat.setdefault('pbrMetallicRoughness',{}); name=(mat.get('name') or '').lower(); bt=pbr.get('baseColorTexture',{}).get('index')
        if bt is None or bt>=len(textures):
            pbr['baseColorFactor']=[0.15,0.11,0.08,pbr.get('baseColorFactor',[1,1,1,1])[3]]; pbr['metallicFactor']=0.08; pbr['roughnessFactor']=0.76; continue
        si=textures[bt].get('source')
        if si is None: continue
        if si not in cache:
            base=embedded_rgb(doc,binary,si); albedo,gray,am,bm=grade_lab(base)
            cache[si]={'albedo':append_texture(doc,binary,f'LAB_ALBEDO_{si}_2048',jpeg(albedo,90)),'normal':append_texture(doc,binary,f'LAB_NORMAL_{si}_1024',jpeg(normal_from_gray(gray),88)),'mr':append_texture(doc,binary,f'LAB_METALROUGH_{si}_1024',jpeg(metal_rough(gray),87)),'emissive':append_texture(doc,binary,f'LAB_EMISSIVE_{si}_1024',jpeg(emissive(gray,am,bm),90))}
        t=cache[si]; pbr['baseColorFactor']=[1,1,1,1]; pbr['baseColorTexture']={'index':t['albedo']}; pbr['metallicFactor']=1.0; pbr['roughnessFactor']=1.0; pbr['metallicRoughnessTexture']={'index':t['mr']}
        mat['normalTexture']={'index':t['normal'],'scale':0.50}; mat['emissiveTexture']={'index':t['emissive']}; mat['emissiveFactor']=[0.96,0.72,0.54]
        if any(k in name for k in ('metal','brass','bronze','gold','armillary','chandelier','candle','instrument')): pbr['metallicFactor']=0.82; pbr['roughnessFactor']=0.42
        if any(k in name for k in ('glass','screen','window','crystal')): pbr['metallicFactor']=0.05; pbr['roughnessFactor']=0.20
        if any(k in name for k in ('wood','desk','table','shelf','book')): pbr['metallicFactor']=0.0; pbr['roughnessFactor']=0.72
        mat['name']=f"{mat.get('name') or 'LAB_MATERIAL'}__ARCANE_GOTHIC_PBR"; upgraded+=1
    doc.setdefault('asset',{})['generator']='CHANSON A REPONDRE UNO Laboratory interior PBR upgrader v1'
    doc['asset']['extras']={'look':'dark arcane gothic laboratory; black-brown stone and wood; bronze instruments; amber candles; cold stained glass; blue scrying/data screens','reference':'approved laboratory texture direction 2026-08-30'}
    tmp=path+'.lab-pbr.tmp'; write_glb(tmp,doc,binary); os.replace(tmp,path)
    print(f'LABORATORY interior PBR upgraded: {path} materials={upgraded} source_textures={len(cache)} bytes={os.path.getsize(path)}')


def main():
    p=argparse.ArgumentParser(); p.add_argument('glb'); args=p.parse_args(); upgrade(args.glb)

if __name__=='__main__': main()
