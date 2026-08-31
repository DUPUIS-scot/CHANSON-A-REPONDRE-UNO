import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const FREAK_STREET_2_URL = '/assets/assets/models/lubiak_freak_street_2_ultralight.glb?v=20260831-integrity-v1';
let installing = false;
let installed = false;

function tuneStreetMaterial(material) {
  if (!material) return;
  material.side = THREE.DoubleSide;
  material.depthTest = true;
  material.depthWrite = true;
  if (material.map) {
    material.map.colorSpace = THREE.SRGBColorSpace;
    material.map.needsUpdate = true;
  }
  material.needsUpdate = true;
}

async function installFreakStreet2(masterRoot) {
  if (!masterRoot || installed || installing) return;
  installing = true;
  try {
    masterRoot.updateMatrixWorld(true);
    const envBox = new THREE.Box3().setFromObject(masterRoot);
    if (envBox.isEmpty()) throw new Error('LUBIAK master bounds unavailable');
    const envSize = envBox.getSize(new THREE.Vector3());
    const envCenter = envBox.getCenter(new THREE.Vector3());

    const gltf = await new Promise((resolve, reject) => {
      new GLTFLoader().load(FREAK_STREET_2_URL, resolve, undefined, reject);
    });
    const street = gltf.scene;
    street.name = 'LUBIAK_FREAK_STREET_2_EXTENSION';
    street.updateMatrixWorld(true);
    const sourceBox = new THREE.Box3().setFromObject(street);
    if (sourceBox.isEmpty()) throw new Error('Freak Street 2 bounds unavailable');
    const sourceSize = sourceBox.getSize(new THREE.Vector3());
    const sourceCenter = sourceBox.getCenter(new THREE.Vector3());

    // Secondary branch: large enough to read as a full street, but kept inside
    // the existing navigation envelope so player/circus bounds stay stable.
    const targetWidth = Math.max(18, envSize.x * 0.34);
    const scale = targetWidth / Math.max(sourceSize.x, 0.001);
    street.scale.setScalar(scale);
    street.rotation.y = Math.PI * 0.5;
    street.position.set(
      envCenter.x - envSize.x * 0.29 - sourceCenter.x * scale,
      envBox.min.y - sourceBox.min.y * scale + 0.035,
      envCenter.z - envSize.z * 0.12 - sourceCenter.z * scale,
    );

    street.traverse((object) => {
      if (!object.isMesh) return;
      object.frustumCulled = false;
      object.castShadow = false;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(tuneStreetMaterial);
    });

    masterRoot.add(street);
    street.updateMatrixWorld(true);
    installed = true;
    console.info('LUBIAK Freak Street 2 installed', {
      targetWidth,
      position: street.position.toArray(),
      scale,
    });
  } catch (error) {
    console.warn('LUBIAK Freak Street 2 unavailable; master remains active.', error);
  } finally {
    installing = false;
  }
}

const originalAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === 'LUBIAK_ENVIRONMENT') {
      queueMicrotask(() => installFreakStreet2(object));
    }
  }
  return result;
};
