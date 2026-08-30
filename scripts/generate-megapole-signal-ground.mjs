import fs from 'node:fs';
import path from 'node:path';

const OUT='assets/models/SILMARI_LLION_MEGAPOLE_signal_ground.glb';
const ROWS=28, COLS=40;
const width=34, depth=52;
const positions=[]; const indices=[];
for(let r=0;r<ROWS;r++){
  const z=(r/(ROWS-1)-0.5)*depth;
  for(let c=0;c<COLS;c++){
    const x=(c/(COLS-1)-0.5)*width;
    const nx=x/(width*0.5), nz=z/(depth*0.5);
    const wave=(Math.sin(c*0.52)*Math.cos(r*0.41))*0.42;
    const ridge=(Math.sin(c*0.27+r*0.19)+Math.sin(c*0.11-r*0.31))*0.18;
    const bowl=-0.20*(nx*nx+nz*nz);
    const y=wave+ridge+bowl;
    positions.push(x,y,z);
  }
}
for(let r=0;r<ROWS-1;r++) for(let c=0;c<COLS-1;c++){
  const a=r*COLS+c,b=a+1,d=(r+1)*COLS+c,e=d+1;
  indices.push(a,d,b,b,d,e);
}
const posBuf=Buffer.from(new Float32Array(positions).buffer);
const idxBuf=Buffer.from(new Uint32Array(indices).buffer);
const pad4=b=>Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);
const bin=pad4(Buffer.concat([posBuf,idxBuf]));
const json={asset:{version:'2.0',generator:'CHANSON A REPONDRE UNO megapole 40x28 inverted SIGNAL ground'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'MEGAPOLE_SIGNAL_GROUND_40x28'}],meshes:[{name:'MEGAPOLE_SIGNAL_GROUND_40x28',primitives:[{attributes:{POSITION:0},indices:1,material:0}]}],materials:[{name:'Carbon_Cyan_SIGNAL',doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[0.008,0.014,0.024,1],metallicFactor:0.02,roughnessFactor:0.94},emissiveFactor:[0.002,0.24,1.0],extensions:{KHR_materials_emissive_strength:{emissiveStrength:3.6}}}],extensionsUsed:['KHR_materials_emissive_strength'],buffers:[{byteLength:bin.length}],bufferViews:[{buffer:0,byteOffset:0,byteLength:posBuf.length,target:34962},{buffer:0,byteOffset:posBuf.length,byteLength:idxBuf.length,target:34963}],accessors:[{bufferView:0,componentType:5126,count:positions.length/3,type:'VEC3',min:[-width/2,-1.1,-depth/2],max:[width/2,1.1,depth/2]},{bufferView:1,componentType:5125,count:indices.length,type:'SCALAR'}]};
const jsonBuf=pad4(Buffer.from(JSON.stringify(json).replace(/\s+$/,''),'utf8'));
const header=Buffer.alloc(12); header.writeUInt32LE(0x46546c67,0); header.writeUInt32LE(2,4); header.writeUInt32LE(12+8+jsonBuf.length+8+bin.length,8);
const jh=Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length,0); jh.writeUInt32LE(0x4e4f534a,4);
const bh=Buffer.alloc(8); bh.writeUInt32LE(bin.length,0); bh.writeUInt32LE(0x004e4942,4);
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,Buffer.concat([header,jh,jsonBuf,bh,bin]));
console.log(`wrote ${OUT}`);
