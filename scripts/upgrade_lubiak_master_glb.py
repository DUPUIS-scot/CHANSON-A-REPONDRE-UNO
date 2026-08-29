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

def prepare_maps(albedo_path, normal_path, dark_path, clay_path):
    albedo=Image.open(albedo_path).convert('RGB').resize((2048,2048), Image.Resampling.LANCZOS)
    albedo=ImageEnhance.Contrast(albedo).enhance(1.08)
    albedo=ImageEnhance.Color(albedo).enhance(0.95)
    normal=Image.open(normal_path).convert('RGB').resize((1024,1024), Image.Resampling.LANCZOS)
    dark=Image.open(dark_path).convert('L').resize((1024,1024), Image.Resampling.LANCZOS)
    clay=Image.open(clay_path).convert('L').resize((1024,1024), Image.Resampling.LANCZOS)
    ao=ImageEnhance.Contrast(clay).enhance(1.25)
    rough=Image.eval(dark, lambda p: max(80, min(235, 255-int(p*0.42))))
    metal=Image.new('L',(1024,1024),26)
    orm=Image.merge('RGB',(ao,rough,metal))
    small=albedo.resize((1024,1024), Image.Resampling.LANCZOS)
    pix=small.load(); em=Image.new('RGB', small.size); ep=em.load()
    for y in range(small.height):
        for x in range(small.width):
            r,g,b=pix[x,y]; mx=max(r,g,b)
            cyan=(b>105 and g>105 and b>r*1.08 and g>r*1.02)
            warm=(r>130 and r>g*1.12 and g>b*1.18 and mx>150)
            if cyan: ep[x,y]=(int(r*0.12), min(255,int(g*1.15)), min(255,int(b*1.28)))
            elif warm: ep[x,y]=(min(255,int(r*1.18)), min(255,int(g*0.78)), int(b*0.22))
            else: ep[x,y]=(0,0,0)
    em=em.filter(ImageFilter.GaussianBlur(0.45))
    return {'albedo':encode_jpeg(albedo,88),'normal':encode_jpeg(normal,90),'orm':encode_jpeg(orm,88),'emissive':encode_jpeg(em,88)}

def append_image(data, binbuf, payload, name):
    off=len(binbuf); binbuf.extend(payload)
    while len(binbuf)%4: binbuf.append(0)
    bvs=data.setdefault('bufferViews',[]); bv_idx=len(bvs); bvs.append({'buffer':0,'byteOffset':off,'byteLength':len(payload)})
    imgs=data.setdefault('images',[]); img_idx=len(imgs); imgs.append({'name':name,'mimeType':'image/jpeg','bufferView':bv_idx})
    tex=data.setdefault('textures',[]); tex_idx=len(tex); tex.append({'source':img_idx})
    return tex_idx

def upgrade(data, binbuf, refs):
    maps=prepare_maps(*refs)
    tx={k:append_image(data,binbuf,v,f'LUBIAK_PBR_{k.upper()}') for k,v in maps.items()}
    for m in data.setdefault('materials',[]):
        name=(m.get('name') or '').lower(); pbr=m.setdefault('pbrMetallicRoughness',{})
        if 'baseColorTexture' not in pbr and not any(s in name for s in ('haze','glass','transparent')):
            pbr['baseColorTexture']={'index':tx['albedo']}; pbr['baseColorFactor']=[1,1,1,1]
        if not any(s in name for s in ('haze','sky','volume')):
            m['normalTexture']={'index':tx['normal'],'scale':0.55}
            m['occlusionTexture']={'index':tx['orm'],'strength':0.75}
            pbr['metallicRoughnessTexture']={'index':tx['orm']}
            pbr['metallicFactor']=0.18 if any(s in name for s in ('metal','bronze','rail','frame')) else 0.05
            pbr['roughnessFactor']=0.62
        if any(s in name for s in ('glow','light','lamp','neon','sign','cyan','blue','incandescent')):
            m['emissiveTexture']={'index':tx['emissive']}; m['emissiveFactor']=[1.0,0.78,0.42]
            m.setdefault('extensions',{})['KHR_materials_emissive_strength']={'emissiveStrength':2.2}
    used=set(data.get('extensionsUsed',[])); used.add('KHR_materials_emissive_strength'); data['extensionsUsed']=sorted(used)
    data.setdefault('asset',{})['generator']='CHANSON A REPONDRE UNO · LUBIAK Palace PBR upgrade'
    if data.get('buffers'): data['buffers'][0]['byteLength']=len(binbuf)
    else: data['buffers']=[{'byteLength':len(binbuf)}]
    return data, binbuf

def write_glb(path,data,binbuf):
    js=pad4(json.dumps(data,separators=(',',':'),ensure_ascii=False).encode('utf-8'),b' ')
    bb=pad4(bytes(binbuf),b'\x00'); total=12+8+len(js)+8+len(bb)
    with open(path,'wb') as f:
        f.write(struct.pack('<4sII',MAGIC,2,total)); f.write(struct.pack('<I4s',len(js),JSON_CHUNK)); f.write(js); f.write(struct.pack('<I4s',len(bb),BIN_CHUNK)); f.write(bb)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--input',required=True); ap.add_argument('--output',required=True); ap.add_argument('--albedo',required=True); ap.add_argument('--normal',required=True); ap.add_argument('--dark',required=True); ap.add_argument('--clay',required=True); a=ap.parse_args()
    data,binbuf=read_glb(a.input); data,binbuf=upgrade(data,binbuf,(a.albedo,a.normal,a.dark,a.clay)); write_glb(a.output,data,binbuf)
    print('upgraded',a.output,'materials',len(data.get('materials',[])),'images',len(data.get('images',[])),'bytes',os.path.getsize(a.output))
if __name__=='__main__': main()
