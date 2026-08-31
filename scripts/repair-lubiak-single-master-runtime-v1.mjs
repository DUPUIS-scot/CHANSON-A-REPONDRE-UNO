import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');
let changed = false;

const early = "refreshLubiakModeButtons();\n\nlet verticalTrigger = 0;";
if (src.includes(early)) {
  src = src.replace(early, "queueMicrotask(() => refreshLubiakModeButtons());\n\nlet verticalTrigger = 0;");
  changed = true;
}

const candidatesRe = /const candidates = \[\s*\{ url: '\/assets\/assets\/models\/LUBIAK_master_optimized\.glb\?v=[^']+', label: 'LOADING LUBIAK MASTER', finish: 'ENTER LUBIAK', timeoutMs: 26000 \},\s*\{ url: '\/assets\/assets\/models\/LUBIAK\.glb\?v=[^']+', label: 'LOADING LUBIAK FALLBACK', finish: 'ENTER LUBIAK · RECOVERY MODEL', timeoutMs: 18000 \},\s*\];/m;
if (candidatesRe.test(src)) {
  src = src.replace(candidatesRe, "const candidates = [\n    { url: '/assets/assets/models/LUBIAK_master_optimized.glb?v=20260831-single-master-v1', label: 'LOADING LUBIAK MASTER', finish: 'ENTER LUBIAK', timeoutMs: 26000 },\n  ];");
  changed = true;
}

if (src.includes("/assets/assets/models/LUBIAK.glb")) {
  throw new Error('Legacy LUBIAK.glb environment candidate still present');
}
if (!src.includes("/assets/assets/models/LUBIAK_master_optimized.glb")) {
  throw new Error('Primary LUBIAK master candidate missing');
}
if (!src.includes("queueMicrotask(() => refreshLubiakModeButtons())")) {
  throw new Error('verticalDock initialization-order repair missing');
}

if (changed) fs.writeFileSync(path, src);
console.log('LUBIAK runtime repaired: one environment GLB only; verticalDock refresh deferred past initialization.');
