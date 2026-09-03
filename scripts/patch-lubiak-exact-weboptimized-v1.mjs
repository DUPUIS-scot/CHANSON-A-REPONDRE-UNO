import fs from 'node:fs';

const runtimePath = 'web/lubiak/lubiak.js';
const htmlPath = 'web/lubiak/index.html';
const assetBase = '/assets/assets/models/textured-glb-comparison/lubiak-assets/';

const installEnvironment = `async function installEnvironment() {
  setStatus('STARTING 3D ENGINE', 4);
  const decoder = await getMeshoptDecoder();

  // LUBIAK_ORDERED_MODULAR_ENVIRONMENT_V1
  // Terrain is persistent and loaded independently by lubiak-terrain-addon.js.
  // Environment modules are decoded one-by-one in the authored progression order.
  const modules = [
    { name: 'FREAK STREET', file: 'freak%20street.glb', position: [0, 12.114883422851562, 34], rotation: null, scale: [72, 72, 72] },
    { name: 'AVENUE', file: 'avenue.glb', position: [11.479494094848633, 12.264254570007324, 49.055965423583984], rotation: [0, 0.4113151431083679, 0, 0.9114933013916016], scale: [71.86261749267578, 71.86260223388672, 71.86261749267578] },
    { name: 'ROOF TOP', file: 'roof%20top.glb', position: [-9.29807186126709, 22.525930404663086, 33.840213775634766], rotation: [-0.12447847425937653, -0.14730167388916016, -0.028115851804614067, 0.9808245897293091], scale: [28.742916107177734, 28.7429141998291, 28.742918014526367] },
    { name: 'PALACE', file: 'palace.glb', position: [0, 11.905579566955566, -18], rotation: null, scale: [77.90990447998047, 77.90990447998047, 77.90990447998047] },
    { name: 'CIRCUS', file: 'circus.glb', position: [0, 7.115546226501465, -17], rotation: [0, -0.4972151815891266, 0, 0.8676272630691528], scale: [25.0000057220459, 25, 25.0000057220459] },
    { name: 'DISTRICT 0', file: 'district.glb', position: [-24.26102638244629, 8.422406196594238, 29.6292724609375], rotation: [0.07996269315481186, -0.9552930593490601, 0.28146034479141235, 0.04244136065244675], scale: [9.534232139587402, 9.534231185913086, 9.53423023223877] },
    { name: 'CARD ROOM', file: 'card%20room.glb', position: [5.9719696044921875, 6.680505275726318, 29.453205108642578], rotation: [0.0668065994977951, 0.7124782204627991, 0.07561159133911133, 0.6944023966789246], scale: [11.452020645141602, 11.452018737792969, 11.452022552490234] },
    { name: 'DRAGON LAIR', file: 'dragon%20lair.glb', position: [-21.879623413085938, 4.855525016784668, -53.868255615234375], rotation: null, scale: [17.452329635620117, 17.452329635620117, 17.452329635620117] },
  ];

  const root = new THREE.Group();
  root.name = 'LUBIAK_ENVIRONMENT';
  scene.add(root);

  let loaded = 0;
  for (const module of modules) {
    try {
      const startPct = 8 + (loaded / modules.length) * 76;
      setStatus(\`LOADING \${module.name}\`, startPct);
      const gltf = await loadGlb(\`${assetBase}\${module.file}?v=20260903-modular-v2\`, decoder, \`LOADING \${module.name}\`, true, 32000);
      const part = gltf.scene;
      part.name = \`LUBIAK_\${module.name.replace(/\\s+/g, '_')}\`;
      part.position.fromArray(module.position);
      if (module.rotation) part.quaternion.fromArray(module.rotation);
      part.scale.fromArray(module.scale);
      root.add(part);
      part.updateMatrixWorld(true);
      loaded += 1;

      // Make the entrance visible as soon as Freak Street is decoded, then progressively
      // add the remaining authored zones without blocking the first rendered frame.
      if (loaded === 1) await renderConfirmedFrame();
    } catch (error) {
      console.error(\`LUBIAK module failed: \${module.name}\`, error);
      showStatus(\`\${module.name} UNAVAILABLE · CONTINUING\`, 850);
    }
  }

  if (!root.children.length) {
    scene.remove(root);
    console.error('LUBIAK modular environment unavailable; no authored module loaded.');
    finishLoad('LUBIAK ENVIRONMENT UNAVAILABLE');
    return;
  }

  if (!frameLoadedEnvironment(root)) {
    scene.remove(root);
    console.error('LUBIAK modular environment has invalid or empty bounds.');
    finishLoad('LUBIAK ENVIRONMENT UNAVAILABLE');
    return;
  }

  exteriorRoot = root;
  repairLubiakStaticWorld();
  await renderConfirmedFrame();
  finishLoad('ENTER LUBIAK');

  // Secondary actors remain deferred until the authored environment has rendered stably.
  setTimeout(() => {
    void Promise.allSettled([installDragon(decoder), installPlayer(decoder)]);
  }, 350);
}`;

let js = fs.readFileSync(runtimePath, 'utf8');
const environmentPattern = /async function installEnvironment\(\) \{[\s\S]*?\n\}\n\nfunction findSafeEntranceSpawn/;
if (!environmentPattern.test(js)) throw new Error('installEnvironment block not found');
js = js.replace(environmentPattern, `${installEnvironment}\n\nfunction findSafeEntranceSpawn`);

if (js.includes('LUBIAK_REASSEMBLED_MODULAR_WEB.glb')) throw new Error('Combined modular master is still wired');
for (const file of ['freak%20street.glb', 'avenue.glb', 'roof%20top.glb', 'palace.glb', 'circus.glb', 'district.glb', 'card%20room.glb', 'dragon%20lair.glb']) {
  if (!js.includes(`${assetBase}${file}`) && !js.includes(`\${assetBase}\${module.file}`)) {
    // URLs are assembled at runtime from assetBase + file; the file list itself is the contract.
    if (!js.includes(`file: '${file}'`)) throw new Error(`Missing modular asset: ${file}`);
  }
}
if ((js.match(/LUBIAK_ORDERED_MODULAR_ENVIRONMENT_V1/g) || []).length !== 1) throw new Error('Ordered modular environment marker missing or duplicated');
fs.writeFileSync(runtimePath, js);

let html = fs.readFileSync(htmlPath, 'utf8');
// Remove any obsolete combined-master preload/alias references. Terrain addon remains untouched.
html = html.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_REASSEMBLED_MODULAR_WEB\.glb\?v=[^'"\s<]+/g, '');
html = html.replace(/\/assets\/assets\/models\/textured-glb-comparison\/LUBIAK_REASSEMBLED_MODULAR_WEB\.glb/g, '');
fs.writeFileSync(htmlPath, html);

console.log('LUBIAK ordered modular environment installed: terrain + Freak Street -> Avenue -> Roof Top -> Palace -> Circus -> District 0 -> Card Room -> Dragon Lair');
