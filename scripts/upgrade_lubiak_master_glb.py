#!/usr/bin/env python3
import argparse, json, struct, io, os
from PIL import Image, ImageEnhance, ImageFilter
MAGIC=b'glTF'; JSON_CHUNK=b'JSON'; BIN_CHUNK=b'BIN\x00'

def read_glb(path):
    with open(path,'rb') as f:
        magic,ver,total=struct.unpack('<4sII', f.read(12))
        if magic!=MAGIC or ver!=2: raise ValueError('Not GLB v2')
        chunks=[]
        while f.tell()<total:
            l,t=struct.unpack('<I4s', f.read(8)); chunks.append((t,f.read(l)))
    js=next(c for t,c in chunks if t==JSON_CHUNK)
    data=json.loads(js.rstrip(b' \x00').decode('utf-8'))
    binbuf=next((c for t,c in chunks if t==BIN_CHUNK), b'')
    return data, bytearray(binbuf)

def pad4(b, pad=b'\x00'):
    return b + pad*((4-len(b)%4)%4)

def encode_jpeg(img, quality=88):
    out=io.BytesIO(); img.convert('RGB').save(out,'JPEG',quality=quality,optimize=True,progressive=True); return out.getvalue()

def prepare_maps(albedo_path, normal_path, rough_path, height_path, prefix):
    albedo=Image.open(albedo_path).convert('RGB').resize((2048,2048), Image.Resampling.LANCZOS)
    albedo=ImageEnhance.Contrast(albedo).enhance(1.06)
    normal=Image.open(normal_path).convert('RGB').resize((1024,1024), Image.Resampling.LANCZOS)
    rough=Image.open(rough_path).convert('L').resize((1024,1024), Image.Resampling.LANCZOS)
    height=Image.open(height_path).convert('L').resize((1024,1024), Image.Resampling.LANCZOS)
    ao=ImageEnhance.Contrast(height).enhance(1.18)
    metal=Image.new('L',(1024,1024),20)
    orm=Image.merge('RGB',(ao,rough,metal))
    small=albedo.resize((1024,1024), Image.Resampling.LANCZOS)
    em=Image.new('RGB',small.size); pix=small.load(); ep=em.load()
    for y in range(small.height):
        for x in range(small.width):
            r,g,b=pix[x,y]
            warm=(r>145 and r>g*1.08 and g>b*1.10)
            cyan=(b>120 and g>115 and b>r*1.05)
            if warm: ep[x,y]=(min(255,int(r*1.12)),min(255,int(g*0.82)),int(b*0.28))
            elif cyan: ep[x,y]=(int(r*0.1),min(255,int(g*1.05)),min(255,int(b*1.18)))
            else: ep[x,y]=(0,0,0)
    em=em.filter(ImageFilter.GaussianBlur(0.5))
    return {'albedo':encode_jpeg(albedo,88),'normal':encode_jpeg(normal,90),'orm':encode_jpeg(orm,88),'emissive':encode_jpeg(em,88)},prefix

def append_image(data,binbuf,payload,name):
    off=len(binbuf); binbuf.extend(payload)
    while len(binbuf)%4: binbuf.append(0)
    bvs=data.setdefault('bufferViews',[]); bvi=len(bvs); bvs.append({'buffer':0,'byteOffset':off,'byteLength':len(payload)})
    imgs=data.setdefault('images',[]); ii=len(imgs); imgs.append({'name':name,'mimeType':'image/jpeg','bufferView':bvi})
    tex=data.setdefault('textures',[]); ti=len(tex); tex.append({'source':ii})
    return ti

def classify(name):
    n=name.lower()
    if any(t in n for t in ('circus interior','interior circus','inside circus','inner tent','inner canvas','ring wall','circus roof','circus floor','circus stage','circus lamp','interior tent')): return 'circus_interior'
    if any(t in n for t in ('circus','tent','big top','bigtop','marquee','canvas','foetus','fetus','flag','curtain','lubiak')): return 'circus_exterior'
    if any(t in n for t in ('palace','place','temple','tower','guardian','lion','statue','monument','citadel','fountain','bridge','column')): return 'palace'
    return None

def apply_region(m,tx,region):
    pbr=m.setdefault('pbrMetallicRoughness',{})
    pbr['baseColorTexture']={'index':tx['albedo']}; pbr['baseColorFactor']=[1,1,1,1]
    if region=='circus_interior':
        normal_scale=0.72; metallic=0.02; roughness=0.66; emissive=[1.0,0.58,0.20]; strength=1.9
    elif region=='circus_exterior':
        normal_scale=0.62; metallic=0.03; roughness=0.72; emissive=[1.0,0.72,0.35]; strength=1.6
    else:
        normal_scale=0.50; metallic=0.08; roughness=0.58; emissive=[0.72,0.82,1.0]; strength=1.25
    m['normalTexture']={'index':tx['normal'],'scale':normal_scale}
    m['occlusionTexture']={'index':tx['orm'],'strength':0.78}
    pbr['metallicRoughnessTexture']={'index':tx['orm']}
    pbr['metallicFactor']=metallic
    pbr['roughnessFactor']=roughness
    m['emissiveTexture']={'index':tx['emissive']}
    m['emissiveFactor']=emissive
    m.setdefault('extensions',{})['KHR_materials_emissive_strength']={'emissiveStrength':strength}

def upgrade(data,binbuf,palace_refs=None,circus_exterior_refs=None,circus_interior_refs=None):
    regions={}
    if palace_refs:
        maps,prefix=prepare_maps(*palace_refs,'PALACE'); regions['palace']={k:append_image(data,binbuf,v,f'LUBIAK_{prefix}_{k.upper()}') for k,v in maps.items()}
    if circus_exterior_refs:
        maps,prefix=prepare_maps(*circus_exterior_refs,'CIRCUS_EXTERIOR'); regions['circus_exterior']={k:append_image(data,binbuf,v,f'LUBIAK_{prefix}_{k.upper()}') for k,v in maps.items()}
    if circus_interior_refs:
        maps,prefix=prepare_maps(*circus_interior_refs,'CIRCUS_INTERIOR'); regions['circus_interior']={k:append_image(data,binbuf,v,f'LUBIAK_{prefix}_{k.upper()}') for k,v in maps.items()}
    counts={'palace':0,'circus_exterior':0,'circus_interior':0}
    for m in data.setdefault('materials',[]):
        region=classify(m.get('name') or '')
        if region in regions:
            apply_region(m,regions[region],region); counts[region]+=1
    used=set(data.get('extensionsUsed',[])); used.add('KHR_materials_emissive_strength'); data['extensionsUsed']=sorted(used)
    data.setdefault('asset',{})['generator']='CHANSON A REPONDRE UNO · LUBIAK region PBR upgrade'
    if data.get('buffers'): data['buffers'][0]['byteLength']=len(binbuf)
    else: data['buffers']=[{'byteLength':len(binbuf)}]
    print('region material matches',counts)
    return data,binbuf

def write_glb(path,data,binbuf):
    js=pad4(json.dumps(data,separators=(',',':'),ensure_ascii=False).encode('utf-8'),b' ')
    bb=pad4(bytes(binbuf),b'\x00'); total=12+8+len(js)+8+len(bb)
    with open(path,'wb') as f:
        f.write(struct.pack('<4sII',MAGIC,2,total)); f.write(struct.pack('<I4s',len(js),JSON_CHUNK)); f.write(js); f.write(struct.pack('<I4s',len(bb),BIN_CHUNK)); f.write(bb)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--input',required=True); ap.add_argument('--output',required=True)
    for p in ('palace','circus-exterior','circus-interior'):
        ap.add_argument(f'--{p}-albedo'); ap.add_argument(f'--{p}-normal'); ap.add_argument(f'--{p}-rough'); ap.add_argument(f'--{p}-height')
    a=ap.parse_args()
    palace=(a.palace_albedo,a.palace_normal,a.palace_rough,a.palace_height) if all((a.palace_albedo,a.palace_normal,a.palace_rough,a.palace_height)) else None
    circus_exterior=(a.circus_exterior_albedo,a.circus_exterior_normal,a.circus_exterior_rough,a.circus_exterior_height) if all((a.circus_exterior_albedo,a.circus_exterior_normal,a.circus_exterior_rough,a.circus_exterior_height)) else None
    circus_interior=(a.circus_interior_albedo,a.circus_interior_normal,a.circus_interior_rough,a.circus_interior_height) if all((a.circus_interior_albedo,a.circus_interior_normal,a.circus_interior_rough,a.circus_interior_height)) else None
    data,binbuf=read_glb(a.input); data,binbuf=upgrade(data,binbuf,palace,circus_exterior,circus_interior); write_glb(a.output,data,binbuf)
    print('upgraded',a.output,'materials',len(data.get('materials',[])),'images',len(data.get('images',[])),'bytes',os.path.getsize(a.output))
if __name__=='__main__': main()
