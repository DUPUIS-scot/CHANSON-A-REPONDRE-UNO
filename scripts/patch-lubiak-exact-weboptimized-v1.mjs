import fs from 'node:fs';

const runtimePath = 'web/lubiak/lubiak.js';
const htmlPath = 'web/lubiak/index.html';
const exact = '/assets/assets/models/textured-glb-comparison/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb?v=20260831-exact-webopt-v2';

let js = fs.readFileSync(runtimePath, 'utf8');
js = js.replace(/\/assets\/assets\/models\/LUBIAK_master_optimized\.glb\?v=[^'"\s]+/g, exact);
js = js.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR\.glb\?v=[^'"\s]+/g, exact);
js = js.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\.glb\?v=[^'"\s]+/g, exact);
js = js.replace(/const candidates = \[[\s\S]*?\];/, `const candidates = [\n    { url: '${exact}', label: 'LOADING LUBIAK MASTER', finish: 'ENTER LUBIAK', timeoutMs: 26000 },\n  ];`);

if (js.includes('/assets/assets/models/LUBIAK.glb')) throw new Error('Legacy LUBIAK fallback is still present');
if (js.includes('/assets/assets/models/LUBIAK_master_optimized.glb')) throw new Error('Legacy LUBIAK master alias is still present');
if (js.includes('LUBIAK_master_optimized_4_ELEMENT_PBR.glb')) throw new Error('Unoptimized detailed LUBIAK wire is still present');
if ((js.match(/LOADING LUBIAK MASTER/g) || []).length !== 1) throw new Error('Expected exactly one LUBIAK environment candidate');
if (!js.includes(exact)) throw new Error('Exact LUBIAK WEB_OPTIMIZED URL was not installed');
fs.writeFileSync(runtimePath, js);

let html = fs.readFileSync(htmlPath, 'utf8');
// Remove the old fetch interception/alias layer entirely. The runtime now requests the exact GLB directly.
html = html.replace(/<script>\(\(\)=>\{const nativeFetch=window\.fetch\.bind\(window\);[\s\S]*?window\.__LUBIAK_PRIMARY_MODEL__=direct\}\)\(\);<\/script>/, '');
html = html.replace(/\/assets\/assets\/models\/LUBIAK_master_optimized\.glb/g, exact.split('?')[0]);
html = html.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR\.glb\?v=[^'"\s]+/g, exact);
if (html.includes('/assets/assets/models/LUBIAK_master_optimized.glb')) throw new Error('HTML still contains legacy LUBIAK alias');
if (html.includes('LUBIAK_master_optimized_4_ELEMENT_PBR.glb')) throw new Error('HTML still contains unoptimized detailed LUBIAK wire');
fs.writeFileSync(htmlPath, html);

console.log('LUBIAK now has one direct environment wire only: LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb');
