#!/usr/bin/env python3
import argparse, json, struct, io, os
from PIL import Image, ImageEnhance, ImageFilter
MAGIC=b'glTF'; JSON_CHUNK=b'JSON'; BIN_CHUNK=b'BIN\x00'

def read_glb(path):
    with open(path,'rb') as f:
        magic,ver,total=struct.unpack('<4sII',f.read(12))
        if magic!=MAGIC or ver!=2: raise ValueError('Not GLB v2')
        chunks=[]
        while f.tell()<total:
            l,t=struct.unpack('<I4s',f.read(8)); chunks.append((t,f.read(l)))
    data=json.loads(next(c for t,c in chunks if t==JSON_CHUNK).rstrip(b' \x00').decode('utf-8'))
    binbuf=bytearray(next((c for t,c in chunks if t==BIN_CHUNK),b''))
    return data,binbuf

def pad4(b,pad=b'\x00'): return b+pad*((4-len(b)%4)%4)
def jpeg(img,q=88):
    o=io.BytesIO(); img.convert('RGB').save(o,'JPEG',quality=q,optimize=True,progressive=True); return o.getvalue()

def prepare_maps(albedo_path,normal_path,rough_path,height_path,prefix):
    albedo=Image.open(albedo_path).convert('RGB').resize((1536,1536),Image.Resampling.LANCZOS)
    albedo=ImageEnhance.Contrast(albedo).enhance(1.05)
    normal=Image.open(normal_path).convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS)
    rough=Image.open(rough_path).convert('L').resize((1024,1024),Image.Resampling.LANCZOS)
    height=Image.open(height_path).convert('L').resize((1024,1024),Image.Resampling.LANCZOS)
    ao=ImageEnhance.Contrast(height).enhance(1.16)
    metal=Image.new('L',(1024,1024),18)
    orm=Image.merge('RGB',(ao,rough,metal))
    small=albedo.resize((1024,1024),Image.Resampling.LANCZOS)
    em=Image.new('RGB',small.size); px=small.load(); ep=em.load()
    for y in range(small.height):
        for x in range(small.width):
            r,g,b=px[x,y]
            warm=(r>135 and r>g*1.08 and g>b*1.08)
            cyan=(b>115 and g>110 and b>r*1.05)
            if warm: ep[x,y]=(min(255,int(r*1.10)),min(255,int(g*.82)),int(b*.25))
            elif cyan: ep[x,y]=(int(r*.08),min(255,int(g*1.08)),min(255,int(b*1.20)))
            else: ep[x,y]=(0,0,0)
    em=em.filter(ImageFilter.GaussianBlur(.55))
    return {'albedo':jpeg(albedo,88),'normal':jpeg(normal,90),'orm':jpeg(orm,88),'emissive':jpeg(em,88)},prefix

def append_image(data,binbuf,payload,name):
    off=len(binbuf); binbuf.extend(payload)
    while len(binbuf)%4: binbuf.append(0)
    bvs=data.setdefault('bufferViews',[]); bvi=len(bvs); bvs.append({'buffer':0,'byteOffset':off,'byteLength':len(payload)})
    imgs=data.setdefault('images',[]); ii=len(imgs); imgs.append({'name':name,'mimeType':'image/jpeg','bufferView':bvi})
    tex=data.setdefault('textures',[]); ti=len(tex); tex.append({'source':ii})
    return ti

def contexts(data):
    out={i:set() for i,_ in enumerate(data.get('materials',[]))}
    meshes=data.get('meshes',[])
    for ni,node in enumerate(data.get('nodes',[])):
        mi=node.get('mesh')
        if mi is None or mi>=len(meshes): continue
        mesh=meshes[mi]
        ctx=' '.join((node.get('name',''),mesh.get('name',''))).lower()
        for prim in mesh.get('primitives',[]):
            mat=prim.get('material')
            if mat is not None and mat in out: out[mat].add(ctx)
    return out

def classify(text):
    n=text.lower()
    if any(t in n for t in ('circus interior','tent interior','inside circus','interior tent','inner tent','ring wall','circus roof','circus floor','arena')): return 'circus_interior'
    if any(t in n for t in ('circus','tent','big top','bigtop','marquee','canvas','foetus','fetus','flag','curtain','lubiak')): return 'circus_exterior'
    if any(t in n for t in ('palace','place','temple','tower','guardian','lion','statue','monument','citadel','fountain','bridge','column')): return 'palace'
    if any(t in n for t in ('freak','street','kathmandu','brick','timber','festival','shop','sign','roof','wood','haze')): return 'freak'
    return None

def apply_region(m,tx,region):
    pbr=m.setdefault('pbrMetallicRoughness',{})
    pbr['baseColorTexture']={'index':tx['albedo']}; pbr['baseColorFactor']=[1,1,1,1]
    scales={'palace':.50,'freak':.58,'circus_exterior':.64,'circus_interior':.68}
    rough={'palace':.58,'freak':.68,'circus_exterior':.73,'circus_interior':.70}
    metal={'palace':.08,'freak':.04,'circus_exterior':.03,'circus_interior':.025}
    strength={'palace':1.25,'freak':1.45,'circus_exterior':1.70,'circus_interior':1.85}
    emissive={'palace':[.75,.82,1.0],'freak':[1.0,.65,.30],'circus_exterior':[1.0,.72,.34],'circus_interior':[1.0,.68,.28]}
    m['normalTexture']={'index':tx['normal'],'scale':scales[region]}
    m['occlusionTexture']={'index':tx['orm'],'strength':.80}
    pbr['metallicRoughnessTexture']={'index':tx['orm']}
    pbr['metallicFactor']=metal[region]; pbr['roughnessFactor']=rough[region]
    m['emissiveTexture']={'index':tx['emissive']}; m['emissiveFactor']=emissive[region]
    m.setdefault('extensions',{})['KHR_materials_emissive_strength']={'emissiveStrength':strength[region]}

def refs_tuple(a,prefix):
    vals=[getattr(a,f'{prefix}_albedo'),getattr(a,f'{prefix}_normal'),getattr(a,f'{prefix}_rough'),getattr(a,f'{prefix}_height')]
    return tuple(vals) if all(vals) else None

def upgrade(data,binbuf,sets):
    regions={}
    for region,refs in sets.items():
        if not refs: continue
        maps,prefix=prepare_maps(*refs,region.upper())
        regions[region]={k:append_image(data,binbuf,v,f'LUBIAK_{prefix}_{k.upper()}') for k,v in maps.items()}
    ctx=contexts(data); counts={k:0 for k in regions}
    for i,m in enumerate(data.setdefault('materials',[])):
        text=' '.join([m.get('name',''),*ctx.get(i,set())])
        region=classify(text)
        if region in regions:
            apply_region(m,regions[region],region); counts[region]+=1
    used=set(data.get('extensionsUsed',[])); used.add('KHR_materials_emissive_strength'); data['extensionsUsed']=sorted(used)
    data.setdefault('asset',{})['generator']='CHANSON A REPONDRE UNO · LUBIAK multi-region PBR v4'
    if data.get('buffers'): data['buffers'][0]['byteLength']=len(binbuf)
    else: data['buffers']=[{'byteLength':len(binbuf)}]
    print('region material matches',json.dumps(counts,sort_keys=True))
    return data,binbuf

def write_glb(path,data,binbuf):
    js=pad4(json.dumps(data,separators=(',',':'),ensure_ascii=False).encode(),b' '); bb=pad4(bytes(binbuf),b'\x00')
    total=12+8+len(js)+8+len(bb)
    with open(path,'wb') as f:
        f.write(struct.pack('<4sII',MAGIC,2,total)); f.write(struct.pack('<I4s',len(js),JSON_CHUNK)); f.write(js); f.write(struct.pack('<I4s',len(bb),BIN_CHUNK)); f.write(bb)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--input',required=True); ap.add_argument('--output',required=True)
    for p in ('palace','freak','circus_exterior','circus_interior'):
        for k in ('albedo','normal','rough','height'): ap.add_argument(f'--{p.replace("_","-")}-{k}',dest=f'{p}_{k}')
    a=ap.parse_args(); sets={p:refs_tuple(a,p) for p in ('palace','freak','circus_exterior','circus_interior')}
    data,binbuf=read_glb(a.input); data,binbuf=upgrade(data,binbuf,sets); write_glb(a.output,data,binbuf)
    print('upgraded',a.output,'materials',len(data.get('materials',[])),'images',len(data.get('images',[])),'bytes',os.path.getsize(a.output))
if __name__=='__main__': main()
