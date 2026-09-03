import fs from 'node:fs';
const path='web/lubiak/lubiak.js';
let s=fs.readFileSync(path,'utf8');
const start=s.indexOf('async function installEnvironment() {');
const end=s.indexOf('\nfunction findSafeEntranceSpawn(',start);
if(start<0||end<0) throw new Error('installEnvironment anchors missing');
const replacement=`async function installEnvironment() {
  setStatus('STARTING 3D ENGINE', 4);
  const decoder = await getMeshoptDecoder();
  // LUBIAK_COMPLETE_MASTER_RESTORE_V1
  // Restore the last complete authored world as one scene. Keep the eight modular
  // asset URLs as a cache/deploy manifest only; they are not separate scene roots.
  const LUBIAK_MODULAR_CACHE_MANIFEST = [
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/freak%20street.glb?v=20260903-restore-master-v1',
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/avenue.glb?v=20260903-restore-master-v1',
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/roof%20top.glb?v=20260903-restore-master-v1',
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/palace.glb?v=20260903-restore-master-v1',
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/circus.glb?v=20260903-restore-master-v1',
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/district.glb?v=20260903-restore-master-v1',
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/card%20room.glb?v=20260903-restore-master-v1',
    '/assets/assets/models/textured-glb-comparison/lubiak-assets/dragon%20lair.glb?v=20260903-restore-master-v1',
  ];
  void LUBIAK_MODULAR_CACHE_MANIFEST;
  const url='/assets/assets/models/textured-glb-comparison/LUBIAK_REASSEMBLED_MODULAR_WEB.glb?v=20260903-complete-master-restore-v1';
  try {
    setStatus('LOADING COMPLETE LUBIAK',8);
    const gltf=await loadGlb(url,decoder,'LOADING COMPLETE LUBIAK',true,45000);
    const root=gltf.scene;
    root.name='LUBIAK_ENVIRONMENT';
    scene.add(root);
    if(!frameLoadedEnvironment(root)) { scene.remove(root); throw new Error('Complete LUBIAK has invalid or empty bounds'); }
    exteriorRoot=root;
    repairLubiakStaticWorld();
    await renderConfirmedFrame();
    finishLoad('ENTER LUBIAK');
    setTimeout(()=>{ void Promise.allSettled([installDragon(decoder),installPlayer(decoder)]); },350);
  } catch(error) {
    console.error('Complete LUBIAK master failed.',error);
    finishLoad('LUBIAK MASTER UNAVAILABLE');
    await renderConfirmedFrame();
  }
}
`;
s=s.slice(0,start)+replacement+s.slice(end);
fs.writeFileSync(path,s);
console.log('Restored complete LUBIAK master loader.');