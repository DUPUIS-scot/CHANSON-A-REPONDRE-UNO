import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const TERRAIN_URL = '/assets/assets/models/lubiak_ember_ground.glb?v=20260830-ember-terrain-v2';
let installed = false;

function warmMaterial(material) {
  if (!material) return;
  if (material.color) material.color.setHex(0x090504);
  if (material.emissive) material.emissive.setHex(0xff2d05);
  material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 2.7);
  if ('roughness' in material) material.roughness = 0.94;
  if ('metalness' in material) material.metalness = 0.0;
  material.side = THREE.DoubleSide;
  material.needsUpdate = true;
}

async function installTerrain(environmentRoot) {
  if (installed || !environmentRoot) return;
  installed = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 120));
    environmentRoot.updateMatrixWorld(true);
    const envBox = new THREE.Box3().setFromObject(environmentRoot);
    if (envBox.isEmpty()) throw new Error('environment bounds unavailable');
    const envSize = envBox.getSize(new THREE.Vector3());
    const envCenter = envBox.getCenter(new THREE.Vector3());

    const terrain = await new Promise((resolve, reject) => {
      new GLTFLoader().load(TERRAIN_URL, gltf => resolve(gltf.scene), undefined, reject);
    });
    terrain.name = 'LUBIAK_EMBER_GROUND_ADDON';
    terrain.traverse(object => {
      if (!object.isMesh) return;
      object.frustumCulled = false;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(warmMaterial);
    });

    terrain.updateMatrixWorld(true);
    const sourceBox = new THREE.Box3().setFromObject(terrain);
    const sourceSize = sourceBox.getSize(new THREE.Vector3());
    const targetWidth = Math.max(7.5, Math.min(envSize.x * 0.30, 22));
    const targetDepth = Math.max(70, envSize.z * 0.86);
    const parentScale = environmentRoot.getWorldScale(new THREE.Vector3());
    terrain.scale.set(
      targetWidth / Math.max(sourceSize.x, 0.001) / Math.max(parentScale.x, 0.001),
      1 / Math.max(parentScale.y, 0.001),
      targetDepth / Math.max(sourceSize.z, 0.001) / Math.max(parentScale.z, 0.001),
    );

    const worldTarget = new THREE.Vector3(envCenter.x, envBox.min.y + Math.max(0.025, envSize.y * 0.002), envCenter.z);
    terrain.position.copy(environmentRoot.worldToLocal(worldTarget.clone()));
    environmentRoot.add(terrain);

    const glowA = new THREE.PointLight(0xff3a08, 34, Math.max(30, targetWidth * 3.2), 1.8);
    glowA.position.set(0, 0.7, targetDepth * 0.18 / Math.max(parentScale.z, 0.001));
    const glowB = new THREE.PointLight(0xff6a12, 26, Math.max(26, targetWidth * 2.8), 1.9);
    glowB.position.set(0, 0.55, -targetDepth * 0.22 / Math.max(parentScale.z, 0.001));
    terrain.add(glowA, glowB);
    console.info('LUBIAK ember terrain addon installed', { targetWidth, targetDepth });
  } catch (error) {
    installed = false;
    console.warn('LUBIAK ember terrain addon unavailable; main environment remains active.', error);
  }
}

const originalAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === 'LUBIAK_ENVIRONMENT') installTerrain(object);
  }
  return result;
};
