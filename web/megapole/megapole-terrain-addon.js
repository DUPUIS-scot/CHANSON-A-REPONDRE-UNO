import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const TERRAIN_URL = '/assets/assets/models/SILMARI_LLION_MEGAPOLE_signal_ground.glb?v=20260830-signal-ground-coal-ember-v3';
let installed = false;

function preserveBakedGroundMaterial(material) {
  if (!material) return;
  material.side = THREE.DoubleSide;
  material.needsUpdate = true;
}

async function installTerrain(megapoleRoot) {
  if (installed || !megapoleRoot) return;
  installed = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 120));
    megapoleRoot.updateMatrixWorld(true);
    const envBox = new THREE.Box3().setFromObject(megapoleRoot);
    if (envBox.isEmpty()) throw new Error('Megapole bounds unavailable');
    const envSize = envBox.getSize(new THREE.Vector3());
    const envCenter = envBox.getCenter(new THREE.Vector3());

    const terrain = await new Promise((resolve, reject) => {
      new GLTFLoader().load(TERRAIN_URL, gltf => resolve(gltf.scene), undefined, reject);
    });
    terrain.name = 'MEGAPOLE_SIGNAL_GROUND_ADDON';
    terrain.traverse(object => {
      if (!object.isMesh) return;
      object.frustumCulled = false;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(preserveBakedGroundMaterial);
      const lattice = new THREE.Mesh(object.geometry, new THREE.MeshBasicMaterial({
        color: 0xff3a0a,
        wireframe: true,
        transparent: true,
        opacity: 0.31,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      lattice.name = 'SIGNAL_40x28_EMBER_LATTICE_GLOW';
      lattice.scale.setScalar(1.003);
      object.add(lattice);
    });

    terrain.updateMatrixWorld(true);
    const sourceBox = new THREE.Box3().setFromObject(terrain);
    const sourceSize = sourceBox.getSize(new THREE.Vector3());
    const targetWidth = Math.max(30, envSize.x * 0.72);
    const targetDepth = Math.max(46, envSize.z * 0.72);
    const parentScale = megapoleRoot.getWorldScale(new THREE.Vector3());
    terrain.scale.set(
      targetWidth / Math.max(sourceSize.x, 0.001) / Math.max(parentScale.x, 0.001),
      1 / Math.max(parentScale.y, 0.001),
      targetDepth / Math.max(sourceSize.z, 0.001) / Math.max(parentScale.z, 0.001),
    );
    const worldTarget = new THREE.Vector3(envCenter.x, envBox.min.y + Math.max(0.02, envSize.y * 0.0015), envCenter.z);
    terrain.position.copy(megapoleRoot.worldToLocal(worldTarget.clone()));
    megapoleRoot.add(terrain);

    const emberA = new THREE.PointLight(0xff2d05, 58, Math.max(42, targetWidth * 1.7), 1.65);
    emberA.position.set(-targetWidth * 0.18 / Math.max(parentScale.x, 0.001), 0.8, targetDepth * 0.10 / Math.max(parentScale.z, 0.001));
    const emberB = new THREE.PointLight(0xff7a16, 44, Math.max(38, targetWidth * 1.5), 1.7);
    emberB.position.set(targetWidth * 0.20 / Math.max(parentScale.x, 0.001), 0.65, -targetDepth * 0.14 / Math.max(parentScale.z, 0.001));
    terrain.add(emberA, emberB);
    console.info('MEGAPOLE 40x28 coal/ember SIGNAL terrain installed', { targetWidth, targetDepth });
  } catch (error) {
    installed = false;
    console.warn('Megapole SIGNAL terrain addon unavailable; main Megapole remains active.', error);
  }
}

const originalAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === 'SILMARI_LLION_MEGAPOLE_PBR' || object?.name === 'SILMARI_LLION_MEGAPOLE') installTerrain(object);
  }
  return result;
};
