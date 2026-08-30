import * as THREE from 'three';

let installed = false;

function buildEmberTerrain(megapoleRoot) {
  if (installed || !megapoleRoot) return;
  installed = true;
  try {
    megapoleRoot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(megapoleRoot);
    if (box.isEmpty()) throw new Error('Megapole bounds unavailable');
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cols = 40, rows = 28;
    const width = Math.max(30, size.x * 0.72), depth = Math.max(46, size.z * 0.72);
    const geometry = new THREE.PlaneGeometry(width, depth, cols - 1, rows - 1);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i), y = positions.getY(i);
      const ridge = Math.sin(x * 0.19) * 0.34 + Math.cos(y * 0.23) * 0.26 + Math.sin((x + y) * 0.11) * 0.18;
      positions.setZ(i, ridge);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    const terrain = new THREE.Group();
    terrain.name = 'MEGAPOLE_SIGNAL_GROUND_40x28';
    const coal = new THREE.MeshStandardMaterial({
      color: 0x17100e, emissive: 0x6f1705, emissiveIntensity: 1.35,
      roughness: 0.9, metalness: 0.04, side: THREE.DoubleSide,
    });
    const bed = new THREE.Mesh(geometry, coal);
    bed.rotation.x = -Math.PI / 2;
    const lattice = new THREE.Mesh(
      geometry.clone(),
      new THREE.MeshBasicMaterial({ color: 0xff4a0a, wireframe: true, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    lattice.rotation.x = -Math.PI / 2;
    lattice.position.y = 0.035;
    terrain.add(bed, lattice);
    terrain.position.set(center.x, box.min.y + Math.max(0.04, size.y * 0.002), center.z);
    megapoleRoot.parent.add(terrain);
    const emberA = new THREE.PointLight(0xff3508, 70, width * 1.5, 1.7);
    const emberB = new THREE.PointLight(0xff7a16, 52, depth * 0.9, 1.65);
    emberA.position.set(-width * 0.18, 1.2, depth * 0.10);
    emberB.position.set(width * 0.20, 0.9, -depth * 0.14);
    terrain.add(emberA, emberB);
    console.info('MEGAPOLE 40x28 charcoal/ember terrain installed');
  } catch (error) {
    installed = false;
    console.warn('Megapole ember terrain unavailable; main Megapole remains active.', error);
  }
}

const originalAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === 'SILMARI_LLION_MEGAPOLE_PBR' || object?.name === 'SILMARI_LLION_MEGAPOLE') {
      queueMicrotask(() => buildEmberTerrain(object));
    }
  }
  return result;
};