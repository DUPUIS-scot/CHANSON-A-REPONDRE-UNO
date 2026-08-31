import fs from 'node:fs';

const detailed = 'LUBIAK_master_optimized_4_ELEMENT_PBR.glb';
const optimized = 'LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED.glb';
const detailedUrl = `/assets/assets/models/textured-glb-comparison/${detailed}`;

function edit(path, transform) {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) console.log(`${path}: already compliant or no change`);
  else fs.writeFileSync(path, after);
}

edit('web/lubiak/lubiak.js', (src) => {
  src = src.replace(/\/assets\/assets\/models\/LUBIAK_master_optimized\.glb\?v=[^'"\s]+/g, `${detailedUrl}?v=20260831-detailed-pbr-v1`);
  src = src.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\.glb\?v=[^'"\s]+/g, `${detailedUrl}?v=20260831-detailed-pbr-v1`);
  const env = src.match(/const candidates = \[([\s\S]*?)\];/);
  if (!env) throw new Error('LUBIAK candidates block missing');
  if ((env[1].match(/url:/g) || []).length !== 1) throw new Error('LUBIAK environment must have exactly one candidate');
  if (!env[1].includes(detailed)) throw new Error('Detailed PBR source is not the sole environment candidate');
  if (env[1].includes('LUBIAK.glb') || env[1].includes(optimized)) throw new Error('Legacy/WEB_OPTIMIZED LUBIAK environment still referenced');
  return src;
});

edit('web/lubiak/index.html', (src) => {
  src = src.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_master_optimized_4_ELEMENT_PBR_WEB_OPTIMIZED\.glb\?v=[^'"\s]+/g, `${detailedUrl}?v=20260831-detailed-pbr-v1`);
  src = src.replace(/\/assets\/assets\/models\/LUBIAK_master_optimized\.glb/g, detailedUrl);
  return src;
});

edit('.github/workflows/deploy-pages.yml', (src) => {
  src = src.replaceAll(`$safe/${optimized}`, `$safe/${detailed}`);
  src = src.replaceAll(`assets/models/textured-glb-comparison/${optimized}`, `assets/models/textured-glb-comparison/${detailed}`);
  src = src.replace(/\(LUBIAK_master_optimized\\\.glb\\\?v=\)/g, `(textured-glb-comparison\\/${detailed.replaceAll('.', '\\.') }\\?v=)`);
  src = src.replace(/grep -q "LUBIAK_master_optimized\.glb\?v=safe-\$\{GITHUB_RUN_ID\}-\$\{GITHUB_RUN_ATTEMPT\}" build\/web\/lubiak\/lubiak\.js/g,
    `grep -q "textured-glb-comparison/${detailed}?v=safe-\${GITHUB_RUN_ID}-\${GITHUB_RUN_ATTEMPT}" build/web/lubiak/lubiak.js`);
  return src;
});

console.log('LUBIAK detailed PBR master is now the sole environment source.');
