import json, math, struct, pathlib

SRC = pathlib.Path('assets/models/detective_statue_rigged_web.glb')
OUT = pathlib.Path('build/sherlock_damaged_salute_cone_30s.glb')
FPS = 30
DURATION = 30.0


def read_glb(path):
    data = path.read_bytes()
    magic, version, total = struct.unpack_from('<4sII', data, 0)
    if magic != b'glTF' or version != 2:
        raise RuntimeError('Expected GLB v2')
    off = 12
    js = None
    bin_chunk = b''
    while off < total:
        length, ctype = struct.unpack_from('<II', data, off); off += 8
        chunk = data[off:off+length]; off += length
        if ctype == 0x4E4F534A:
            js = json.loads(chunk.decode('utf-8').rstrip(' \t\r\n\x00'))
        elif ctype == 0x004E4942:
            bin_chunk = chunk
    if js is None:
        raise RuntimeError('Missing JSON chunk')
    return js, bytearray(bin_chunk)


def pad4(buf, fill=0):
    while len(buf) % 4:
        buf.append(fill)


def qmul(a,b):
    ax,ay,az,aw=a; bx,by,bz,bw=b
    return [
        aw*bx + ax*bw + ay*bz - az*by,
        aw*by - ax*bz + ay*bw + az*bx,
        aw*bz + ax*by - ay*bx + az*bw,
        aw*bw - ax*bx - ay*by - az*bz,
    ]


def qnorm(q):
    n = math.sqrt(sum(v*v for v in q)) or 1.0
    return [v/n for v in q]


def q_from_euler_xyz(x,y,z):
    cx,sx=math.cos(x/2),math.sin(x/2)
    cy,sy=math.cos(y/2),math.sin(y/2)
    cz,sz=math.cos(z/2),math.sin(z/2)
    return qnorm([
        sx*cy*cz + cx*sy*sz,
        cx*sy*cz - sx*cy*sz,
        cx*cy*sz + sx*sy*cz,
        cx*cy*cz - sx*sy*sz,
    ])


def smooth01(x):
    x=max(0.0,min(1.0,x)); return x*x*(3-2*x)


def pulse(t,a,b,c,d):
    up=smooth01((t-a)/(b-a)) if b>a else 1
    down=smooth01((t-c)/(d-c)) if d>c else 1
    return up*(1-down)


def base_rotation(node):
    if 'rotation' in node:
        return node['rotation'][:]
    return [0.0,0.0,0.0,1.0]


def pose(t, name):
    # Left arm is burdened, locked overhead for the whole cycle.
    left_raise = 1.0
    left_drop = 0.0
    if t >= 23:
        left_drop = smooth01((t-23)/7)
    jitter = 0.0
    if 6 <= t < 11:
        jitter = math.sin(t*41.0)*0.055 + math.sin(t*67.0)*0.025
    salute = 0.0
    if 11 <= t < 11.45:
        salute = smooth01((t-11)/0.45)
    elif 11.45 <= t < 23:
        salute = 1.0
    elif t >= 23:
        salute = 1.0 - smooth01((t-23)/1.3)
    struggle = 0.0
    tremor = 0.0
    if 15 <= t < 23:
        s=t-15
        struggle = 0.15*(max(0,math.sin(s*math.pi*0.75))**4)
        tremor = math.sin(s*34.0)*0.035 + math.sin(s*53.0)*0.018
    collapse = smooth01((t-23)/5.5) if t >= 23 else 0.0
    heave = math.sin(t*math.pi*1.25)*0.045 if 15 <= t < 23 else 0.0
    step_head = 0.0
    if 6 <= t < 11:
        step_head = min(1.0, math.floor((t-6)*4)/20.0)

    if name == 'Spine02':
        return (0.24 + heave + jitter*0.35 + collapse*0.34, 0.0, 0.06+jitter*0.18)
    if name == 'Head':
        return (0.18 - step_head*0.38 + collapse*0.32 + jitter, jitter*0.25, -jitter*0.15)
    if name == 'L_Upperarm':
        return (-0.30 + jitter*0.15, -0.28, 1.40 - left_drop*0.35)
    if name == 'L_Forearm':
        return (-0.38 + jitter*0.12, 0.02, 0.12)
    if name == 'L_Hand':
        return (0.15 + jitter*0.08, -0.10, 0.05)
    if name == 'R_Upperarm':
        return (-0.08 + tremor*0.25, 0.12, -1.02*salute + struggle*0.22)
    if name == 'R_Forearm':
        return (-1.34*salute + struggle*0.35 + tremor, 0.03, -0.10*salute)
    if name == 'R_Hand':
        return (0.0, 0.0, -0.18*salute + tremor*0.6)
    return (0.0,0.0,0.0)


def add_blob(gltf, binbuf, raw, target=None):
    pad4(binbuf)
    off=len(binbuf); binbuf.extend(raw)
    bv={'buffer':0,'byteOffset':off,'byteLength':len(raw)}
    if target is not None: bv['target']=target
    gltf.setdefault('bufferViews',[]).append(bv)
    return len(gltf['bufferViews'])-1


def add_accessor(gltf, bv, component_type, count, typ, mins=None, maxs=None):
    acc={'bufferView':bv,'componentType':component_type,'count':count,'type':typ}
    if mins is not None: acc['min']=mins
    if maxs is not None: acc['max']=maxs
    gltf.setdefault('accessors',[]).append(acc)
    return len(gltf['accessors'])-1


def add_cone(gltf, binbuf, hand_index):
    seg=24; verts=[]; idx=[]
    # Base plate: bottom y=0, top y=.025, centered at hand pivot.
    s=.17; y0=0.0; y1=.025
    verts += [(-s,y0,-s),(s,y0,-s),(s,y0,s),(-s,y0,s),(-s,y1,-s),(s,y1,-s),(s,y1,s),(-s,y1,s)]
    idx += [0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]
    base=len(verts)
    rb=.115; rt=.038; h=.34
    for i in range(seg):
        a=2*math.pi*i/seg
        verts.append((rb*math.cos(a),y1,rb*math.sin(a)))
        verts.append((rt*math.cos(a),h,rt*math.sin(a)))
    for i in range(seg):
        ni=(i+1)%seg
        b0=base+2*i; t0=b0+1; b1=base+2*ni; t1=b1+1
        idx += [b0,b1,t0, t0,b1,t1]
    top_center=len(verts); verts.append((0,h,0))
    for i in range(seg):
        ni=(i+1)%seg
        idx += [top_center,base+2*i+1,base+2*ni+1]
    raw_pos=b''.join(struct.pack('<3f',*v) for v in verts)
    raw_idx=b''.join(struct.pack('<H',i) for i in idx)
    bv_pos=add_blob(gltf,binbuf,raw_pos,34962)
    bv_idx=add_blob(gltf,binbuf,raw_idx,34963)
    xs=[v[0] for v in verts]; ys=[v[1] for v in verts]; zs=[v[2] for v in verts]
    ac_pos=add_accessor(gltf,bv_pos,5126,len(verts),'VEC3',[min(xs),min(ys),min(zs)],[max(xs),max(ys),max(zs)])
    ac_idx=add_accessor(gltf,bv_idx,5123,len(idx),'SCALAR',[0],[max(idx)])
    mats=gltf.setdefault('materials',[])
    mats.append({'name':'TrafficCone_Orange','pbrMetallicRoughness':{'baseColorFactor':[1.0,0.23,0.015,1.0],'metallicFactor':0.05,'roughnessFactor':0.62},'doubleSided':True})
    mat_idx=len(mats)-1
    meshes=gltf.setdefault('meshes',[])
    meshes.append({'name':'TrafficCone_BaseGrip','primitives':[{'attributes':{'POSITION':ac_pos},'indices':ac_idx,'material':mat_idx}]})
    mesh_idx=len(meshes)-1
    node={'name':'TrafficCone_LeftHand_BaseGrip','mesh':mesh_idx,'translation':[0.0,0.0,0.0],'rotation':[0.0,0.0,0.0,1.0],'scale':[1.0,1.0,1.0]}
    gltf.setdefault('nodes',[]).append(node)
    cone_idx=len(gltf['nodes'])-1
    gltf['nodes'][hand_index].setdefault('children',[]).append(cone_idx)
    return cone_idx


def bake():
    gltf, binbuf = read_glb(SRC)
    names={n.get('name'):i for i,n in enumerate(gltf.get('nodes',[])) if n.get('name')}
    required=['Head','Spine02','L_Upperarm','L_Hand','R_Upperarm','R_Hand']
    missing=[n for n in required if n not in names]
    if missing: raise RuntimeError(f'Missing required bones: {missing}')
    # Cone base pivot is attached directly to L_Hand.
    add_cone(gltf,binbuf,names['L_Hand'])
    target_names=[n for n in ['Head','Spine02','L_Upperarm','L_Forearm','L_Hand','R_Upperarm','R_Forearm','R_Hand'] if n in names]
    times=[i/FPS for i in range(int(DURATION*FPS)+1)]
    raw_t=b''.join(struct.pack('<f',t) for t in times)
    bv_t=add_blob(gltf,binbuf,raw_t)
    ac_t=add_accessor(gltf,bv_t,5126,len(times),'SCALAR',[0.0],[DURATION])
    samplers=[]; channels=[]
    for name in target_names:
        node=gltf['nodes'][names[name]]
        base=base_rotation(node)
        quats=[]
        for t in times:
            ex,ey,ez=pose(t,name)
            quats.append(qnorm(qmul(base,q_from_euler_xyz(ex,ey,ez))))
        raw=b''.join(struct.pack('<4f',*q) for q in quats)
        bv=add_blob(gltf,binbuf,raw)
        ac=add_accessor(gltf,bv,5126,len(quats),'VEC4')
        si=len(samplers); samplers.append({'input':ac_t,'output':ac,'interpolation':'LINEAR'})
        channels.append({'sampler':si,'target':{'node':names[name],'path':'rotation'}})
    gltf.setdefault('animations',[]).append({'name':'Sherlock_Damaged_Salute_Cone_30s','samplers':samplers,'channels':channels})
    gltf.setdefault('asset',{})['generator']='OpenAI Sherlock 30s GLB baker'
    gltf.setdefault('extras',{})['sherlockAnimation']={'durationSeconds':30,'fps':FPS,'coneGrip':'left-hand base','saluteArm':'right'}
    gltf.setdefault('buffers',[{}])
    gltf['buffers'][0]['byteLength']=len(binbuf)
    pad4(binbuf)
    js=json.dumps(gltf,separators=(',',':')).encode('utf-8')
    while len(js)%4: js+=b' '
    while len(binbuf)%4: binbuf.append(0)
    total=12+8+len(js)+8+len(binbuf)
    out=bytearray(struct.pack('<4sII',b'glTF',2,total))
    out+=struct.pack('<II',len(js),0x4E4F534A)+js
    out+=struct.pack('<II',len(binbuf),0x004E4942)+binbuf
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(out)
    print(f'Wrote {OUT} ({len(out)} bytes), animation 30s @ {FPS}fps, cone child of L_Hand')

if __name__=='__main__': bake()
