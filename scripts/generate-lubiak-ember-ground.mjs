import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || 'assets/models/lubiak_ember_ground.glb';
const segs = 160;
const rings = 10;
const width = 7.5;
const length = 85;
const vertices = [];
const normals = [];
const uvs = [];
const indices = [];

for (let j=0;j<=rings;j++) {
  const v = j/rings;
  const z = (v-0.5)*length;
  for (let i=0;i<=segs;i++) {
    const u = i/segs;
    const x = (u-0.5)*width;
    const edge = Math.abs((u-0.5)*2);
    const wave = Math.sin(z*0.23 + x*1.7)*0.035 + Math.sin(z*0.71 - x*0.8)*0.018;
    const crown = (1-edge*edge)*0.06;
    vertices.push(x, wave+crown, z);
    normals.push(0,1,0);
    uvs.push(u, v*8);
  }
}
for (let j=0;j<rings;j++) {
  for (let i=0;i<segs;i++) {
    const a=j*(segs+1)+i, b=a+1, c=a+(segs+1), d=c+1;
    indices.push(a,c,b,b,c,d);
  }
}

const positions = new Float32Array(vertices);
const normalArr = new Float32Array(normals);
const uvArr = new Float32Array(uvs);
const indexArr = new Uint32Array(indices);

function pad4(n){return (n+3)&~3}
const chunks=[]; let offset=0;
function addBuffer(arr){const b=Buffer.from(arr.buffer,arr.byteOffset,arr.byteLength);const p=Buffer.alloc(pad4(b.length));b.copy(p);const o=offset;offset+=p.length;chunks.push(p);return {byteOffset:o,byteLength:b.length}}
const pPos=addBuffer(positions), pNor=addBuffer(normalArr), pUv=addBuffer(uvArr), pIdx=addBuffer(indexArr);
const bin=Buffer.concat(chunks);

const min=[-width/2,-0.08,-length/2], max=[width/2,0.14,length/2];
const gltf={asset:{version:'2.0',generator:'OpenAI LUBIAK ember-ground generator'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'LUBIAK_EmberGround'}],meshes:[{name:'LUBIAK_EmberGround',primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0}]}],materials:[{name:'Charbons_Ardents',pbrMetallicRoughness:{baseColorFactor:[0.025,0.012,0.008,1],metallicFactor:0.05,roughnessFactor:0.92},emissiveFactor:[1.0,0.085,0.004],doubleSided:true}],buffers:[{byteLength:bin.length}],bufferViews:[{buffer:0,...pPos,target:34962},{buffer:0,...pNor,target:34962},{buffer:0,...pUv,target:34962},{buffer:0,...pIdx,target:34963}],accessors:[{bufferView:0,componentType:5126,count:positions.length/3,type:'VEC3',min,max},{bufferView:1,componentType:5126,count:normalArr.length/3,type:'VEC3'},{bufferView:2,componentType:5126,count:uvArr.length/2,type:'VEC2'},{bufferView:3,componentType:5125,count:indexArr.length,type:'SCALAR'}]};
const jsonBuf=Buffer.from(JSON.stringify(gltf)); const jsonPad=Buffer.alloc(pad4(jsonBuf.length),0x20);jsonBuf.copy(jsonPad);
const total=12+8+jsonPad.length+8+bin.length; const out=Buffer.alloc(total); let o=0;
out.writeUInt32LE(0x46546c67,o);o+=4;out.writeUInt32LE(2,o);o+=4;out.writeUInt32LE(total,o);o+=4;
out.writeUInt32LE(jsonPad.length,o);o+=4;out.writeUInt32LE(0x4e4f534a,o);o+=4;jsonPad.copy(out,o);o+=jsonPad.length;
out.writeUInt32LE(bin.length,o);o+=4;out.writeUInt32LE(0x004e4942,o);o+=4;bin.copy(out,o);
fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,out);console.log(`wrote ${OUT} ${out.length} bytes`);
