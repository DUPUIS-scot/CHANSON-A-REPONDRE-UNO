import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
const exact = '/assets/assets/models/textured-glb-comparison/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb?v=20260831-single-webopt-v2';
let src = fs.readFileSync(path, 'utf8');

const early = "refreshLubiakModeButtons();\n\nlet verticalTrigger = 0;";
if (src.includes(early)) {
  src = src.replace(early, "queueMicrotask(() => refreshLubiakModeButtons());\n\nlet verticalTrigger = 0;");
}

// Collapse every historical LUBIAK environment wire onto the one authoritative GLB.
src = src.replace(/\/assets\/assets\/models\/LUBIAK_master_optimized\.glb\?v=[^'"\s]+/g, exact);
src = src.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR\.glb\?v=[^'"\s]+/g, exact);
src = src.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\.glb\?v=[^'"\s]+/g, exact);

const candidates = src.match(/const candidates = \[([\s\S]*?)\];/);
if (!candidates) throw new Error('LUBIAK candidates block missing');
const normalized = `const candidates = [\n    { url: '${exact}', label: 'LOADING LUBIAK MASTER', finish: 'ENTER LUBIAK', timeoutMs: 26000 },\n  ];`;
src = src.replace(/const candidates = \[[\s\S]*?\];/, normalized);

if (src.includes('/assets/assets/models/LUBIAK.glb')) throw new Error('Legacy LUBIAK.glb environment wire still present');
if (src.includes('/assets/assets/models/LUBIAK_master_optimized.glb')) throw new Error('Legacy LUBIAK master alias still present');
if (src.includes('LUBIAK_master_optimized_4_ELEMENT_PBR.glb')) throw new Error('Unoptimized detailed LUBIAK environment wire still present');
if (!src.includes('LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb')) throw new Error('Authoritative WEB_OPTIMIZED LUBIAK environment missing');
if ((src.match(/LOADING LUBIAK MASTER/g) || []).length !== 1) throw new Error('LUBIAK must expose exactly one environment candidate');
if (!src.includes("queueMicrotask(() => refreshLubiakModeButtons())")) throw new Error('verticalDock initialization-order repair missing');

fs.writeFileSync(path, src);
console.log('LUBIAK runtime locked to one environment GLB: LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb');
