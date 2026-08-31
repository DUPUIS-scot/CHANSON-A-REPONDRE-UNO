import fs from 'node:fs';

const runtimePath = 'web/lubiak/lubiak.js';
const deployPath = '.github/workflows/deploy-pages.yml';
const exact = '/assets/assets/models/textured-glb-comparison/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb?v=20260831-exact-webopt-v1';

let js = fs.readFileSync(runtimePath, 'utf8');
js = js.replace(/\/assets\/assets\/models\/LUBIAK_master_optimized\.glb\?v=[^'"\s]+/g, exact);
if (!js.includes(exact)) throw new Error('Exact LUBIAK WEB_OPTIMIZED URL was not installed');
if (js.includes("/assets/assets/models/LUBIAK.glb")) throw new Error('Legacy LUBIAK fallback is still present');
fs.writeFileSync(runtimePath, js);

let yml = fs.readFileSync(deployPath, 'utf8');
yml = yml.replace(
  'js, n = re.subn(r"(LUBIAK_master_optimized\\.glb\\?v=)[^\'\\"\\s]+", rf"\\g<1>{token}", js)',
  'js, n = re.subn(r"(LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\\.glb\\?v=)[^\'\\"\\s]+", rf"\\g<1>{token}", js)'
);
yml = yml.replace(
  'if n < 1: raise RuntimeError(\'LUBIAK master cache token not found\')',
  'if n < 1: raise RuntimeError(\'LUBIAK exact WEB_OPTIMIZED cache token not found\')'
);
yml = yml.replace(
  'grep -q "LUBIAK_master_optimized.glb?v=safe-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}" build/web/lubiak/lubiak.js',
  'grep -q "LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb?v=safe-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}" build/web/lubiak/lubiak.js'
);
if (!yml.includes('LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\\.glb\\?v=')) throw new Error('Deploy cache rewrite was not updated for exact WEB_OPTIMIZED model');
fs.writeFileSync(deployPath, yml);
console.log('LUBIAK now loads only the exact WEB_OPTIMIZED PBR model path.');
