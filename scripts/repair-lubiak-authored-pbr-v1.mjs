import fs from 'node:fs';

const jsPath = 'web/lubiak/lubiak.js';
const htmlPath = 'web/lubiak/index.html';
let js = fs.readFileSync(jsPath, 'utf8');
let html = fs.readFileSync(htmlPath, 'utf8');

// Load the original authored detailed PBR master directly.
js = js.replace(/\/assets\/assets\/models\/LUBIAK_master_optimized\.glb\?v=[^'"\s]+/g,
  '/assets/assets/models/textured-glb-comparison/LUBIAK_master_optimized_4_ELEMENT_PBR.glb?v=20260831-authored-pbr-v1');
js = js.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\.glb\?v=[^'"\s]+/g,
  '/assets/assets/models/textured-glb-comparison/LUBIAK_master_optimized_4_ELEMENT_PBR.glb?v=20260831-authored-pbr-v1');

// Preserve all authored environment materials. Previous runtime code replaced broad/flat meshes
// with a synthetic coal/ember material, which could wipe PBR maps on Freak Street / Kumari Ghar.
const materialRewrite = /  const worldBox=new THREE\.Box3\(\)\.setFromObject\(exteriorRoot\);\n  const worldSize=worldBox\.getSize\(new THREE\.Vector3\(\)\);\n  const coal=new THREE\.MeshStandardMaterial\([\s\S]*?\n  \}\);\n  \/\/ LUBIAK_PALACE_MONUMENTAL_SCALE_V1/;
const replacement = `  const worldBox=new THREE.Box3().setFromObject(exteriorRoot);\n  const worldSize=worldBox.getSize(new THREE.Vector3());\n  const circusName=/circus|big[ _-]?top|bigtop|tent|marquee/i;\n  const circusRoots=[];\n  exteriorRoot.traverse(o=>{\n    if(o===exteriorRoot) return;\n    if(circusName.test(o.name||'')) circusRoots.push(o);\n    if(!o.isMesh) return;\n    const materials=Array.isArray(o.material)?o.material:[o.material];\n    for(const material of materials){\n      if(!material) continue;\n      // Keep original GLB PBR assignments intact; only ensure texture color-space/update flags.\n      if(material.map){ material.map.colorSpace=THREE.SRGBColorSpace; material.map.needsUpdate=true; }\n      for(const key of ['normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap']){\n        if(material[key]) material[key].needsUpdate=true;\n      }\n      material.needsUpdate=true;\n    }\n  });\n  // LUBIAK_PALACE_MONUMENTAL_SCALE_V1`;
if (!materialRewrite.test(js)) throw new Error('Expected LUBIAK material rewrite block not found');
js = js.replace(materialRewrite, replacement);

// Remove browser redirect to the compressed derivative and expose the original detailed source.
html = html.replace(/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\.glb\?v=[^'"\s]+/g,
  'LUBIAK_master_optimized_4_ELEMENT_PBR.glb?v=20260831-authored-pbr-v1');

if (!js.includes('LUBIAK_master_optimized_4_ELEMENT_PBR.glb?v=20260831-authored-pbr-v1')) throw new Error('Detailed PBR source not wired');
if (js.includes('LUBIAK_TERRAIN_COAL_V2')) throw new Error('Synthetic coal material override still present');
if (html.includes('LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb')) throw new Error('HTML still redirects to WEB_OPTIMIZED');

fs.writeFileSync(jsPath, js);
fs.writeFileSync(htmlPath, html);
console.log('LUBIAK authored PBR preserved; runtime material override removed.');
