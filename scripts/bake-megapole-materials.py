#!/usr/bin/env python3
import json, struct, sys
from pathlib import Path

src=Path(sys.argv[1] if len(sys.argv)>1 else 'assets/models/SILMARI_LLION_MEGAPOLE_LUBIAK.glb')
out=Path(sys.argv[2] if len(sys.argv)>2 else src)
raw=src.read_bytes()
magic,ver,total=struct.unpack('<4sII',raw[:12])
if magic!=b'glTF' or ver!=2 or total!=len(raw): raise SystemExit('invalid GLB')
off=12; chunks=[]
while off<len(raw):
    n,t=struct.unpack('<I4s',raw[off:off+8]); off+=8; chunks.append((t,raw[off:off+n])); off+=n
jraw=next(c for t,c in chunks if t==b'JSON')
doc=json.loads(jraw.rstrip(b' \x00'))
ctx={i:set() for i,_ in enumerate(doc.get('materials',[]))}
meshes=doc.get('meshes',[])
for node in doc.get('nodes',[]):
    mi=node.get('mesh')
    if mi is None or mi>=len(meshes): continue
    mesh=meshes[mi]; label=f"{node.get('name','')} {mesh.get('name','')}".lower()
    for prim in mesh.get('primitives',[]):
        mat=prim.get('material')
        if mat is not None and mat in ctx: ctx[mat].add(label)

def style(text):
    t=text.lower()
    if any(k in t for k in ('glyph','rune','cunei','script','text','inscri','eno','symbol','letter')):
        return ([1.0,.58,.20,1],.42,.03,[1.0,.18,.02],2.8)
    if any(k in t for k in ('water','fountain','pool','liquid','aqua')):
        return ([.18,.95,.88,1],.16,.05,[.02,.42,.38],2.0)
    if any(k in t for k in ('glass','crystal','ice','peak','dome','lantern','light')):
        return ([.72,.92,1,1],.18,.18,[.24,.58,.72],1.4)
    if any(k in t for k in ('cave','rock','rib','dragon','belly','ceiling','bone','organic')):
        return ([.14,.035,.018,1],.93,0,[.12,.012,.004],.8)
    if any(k in t for k in ('metal','rail','frame','bridge','beam','column','pillar')):
        return ([.18,.06,.025,1],.48,.36,[0,0,0],1.0)
    return ([.12,.035,.018,1],.76,.08,[.04,.008,.002],.7)

for i,m in enumerate(doc.get('materials',[])):
    text=' '.join([m.get('name',''),*ctx.get(i,set())])
    base,rough,metal,em,strength=style(text)
    pbr=m.setdefault('pbrMetallicRoughness',{})
    pbr['baseColorFactor']=base
    pbr['roughnessFactor']=rough
    pbr['metallicFactor']=metal
    m['emissiveFactor']=em
    m.setdefault('extensions',{})['KHR_materials_emissive_strength']={'emissiveStrength':strength}
used=set(doc.get('extensionsUsed',[])); used.add('KHR_materials_emissive_strength'); doc['extensionsUsed']=sorted(used)
doc.setdefault('asset',{})['generator']='CHANSON A REPONDRE UNO Megapole baked semantic PBR v9'
newj=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode(); newj+=b' '*((-len(newj))%4)
binchunk=next((c for t,c in chunks if t==b'BIN\x00'),b''); binchunk+=b'\x00'*((-len(binchunk))%4)
newtotal=12+8+len(newj)+(8+len(binchunk) if binchunk else 0)
parts=[struct.pack('<4sII',b'glTF',2,newtotal),struct.pack('<I4s',len(newj),b'JSON'),newj]
if binchunk: parts += [struct.pack('<I4s',len(binchunk),b'BIN\x00'),binchunk]
out.write_bytes(b''.join(parts))
print('baked',out,'materials',len(doc.get('materials',[])))
