import { GLTFLoader } from '../vendor/GLTFLoader.js';

(() => {
  if (window.__castleLaboratoryBridgeInstalled) return;
  window.__castleLaboratoryBridgeInstalled = true;

  const LABORATORY_URL = new URL(
    '../assets/assets/models/laboratory_interior.glb',
    document.baseURI,
  ).href;

  let attempts = 0;
  let laboratoryRoot = null;
  let laboratoryPromise = null;
  let laboratoryActive = false;
  let down = null;

  function install() {
    const THREE = window.THREE;
    const runtime = window.__castleSearchRuntime;
    if (!THREE || !runtime?.scene || !runtime?.camera || !runtime?.renderer) {
      if (attempts++ < 300) setTimeout(install, 100);
      return;
    }

    if (document.getElementById('bureau-affairs-ai')) return;

    const style = document.createElement('style');
    style.textContent = `
      #bureau-affairs-ai,#return-interior-castle{display:none}
      body[data-scene-mode="interior"] #bureau-affairs-ai{display:flex}
      body[data-castle-subscene="laboratory"] #bureau-affairs-ai{display:none}
      body[data-castle-subscene="laboratory"] #return-interior-castle{display:flex}
      body[data-castle-subscene="laboratory"] #return-exterior{display:none!important}
    `;
    document.head.appendChild(style);

    const leftGroup = document.querySelector('.castle-toolbar-group');
    if (!leftGroup) return;

    const bureauButton = document.createElement('button');
    bureauButton.id = 'bureau-affairs-ai';
    bureauButton.className = 'castle-control';
    bureauButton.type = 'button';
    bureauButton.setAttribute('aria-label', 'Bureau of Affairs AI');
    bureauButton.innerHTML = '<span class="control-medallion">AI</span><span class="control-copy"><span class="control-title">BUREAU OF AFFAIRS AI</span><span class="control-subtitle">Enter the laboratory</span></span>';
    leftGroup.appendChild(bureauButton);

    const returnButton = document.createElement('button');
    returnButton.id = 'return-interior-castle';
    returnButton.className = 'castle-control';
    returnButton.type = 'button';
    returnButton.setAttribute('aria-label', 'Return to interior castle');
    returnButton.innerHTML = '<span class="control-medallion">←</span><span class="control-copy"><span class="control-title">RETURN TO CASTLE</span><span class="control-subtitle">Interior castle</span></span>';
    leftGroup.appendChild(returnButton);

    function fitLaboratory(root) {
      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const maxHorizontal = Math.max(size.x, size.z, 0.001);
      const scale = 34 / maxHorizontal;
      root.scale.setScalar(scale);
      root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      root.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(root);
      const fittedSize = fitted.getSize(new THREE.Vector3());
      const fittedCenter = fitted.getCenter(new THREE.Vector3());
      root.userData.laboratoryFittedSize = fittedSize.clone();
      root.userData.laboratoryFittedCenter = fittedCenter.clone();
    }

    function loadLaboratory() {
      if (laboratoryRoot) return Promise.resolve(laboratoryRoot);
      if (laboratoryPromise) return laboratoryPromise;
      document.body.dataset.laboratoryReady = 'loading';
      document.body.dataset.laboratoryModelAsset = LABORATORY_URL;
      laboratoryPromise = new Promise((resolve, reject) => {
        new GLTFLoader().load(
          LABORATORY_URL,
          gltf => {
            laboratoryRoot = gltf.scene;
            laboratoryRoot.name = 'laboratory-interior-root';
            laboratoryRoot.visible = false;
            laboratoryRoot.traverse(object => {
              if (!object.isMesh) return;
              object.frustumCulled = false;
              object.castShadow = false;
              object.receiveShadow = false;
            });
            fitLaboratory(laboratoryRoot);
            runtime.scene.add(laboratoryRoot);
            document.body.dataset.laboratoryReady = 'true';
            document.body.dataset.laboratoryAnimations = String(gltf.animations.length);
            resolve(laboratoryRoot);
          },
          undefined,
          error => {
            document.body.dataset.laboratoryReady = 'false';
            document.body.dataset.laboratoryError = String(error?.message || error);
            laboratoryPromise = null;
            reject(error);
          },
        );
      });
      return laboratoryPromise;
    }

    function setLaboratoryView() {
      const orbit = runtime.orbit;
      const center = laboratoryRoot?.userData?.laboratoryFittedCenter;
      const size = laboratoryRoot?.userData?.laboratoryFittedSize;
      if (!orbit?.target || !center || !size) return;
      orbit.yaw = 0;
      orbit.pitch = 0.08;
      orbit.target.copy(center);
      orbit.target.y = Math.max(2.2, Math.min(center.y, size.y * 0.42));
      orbit.distance = Math.max(13, Math.min(24, Math.max(size.x, size.z) * 0.48));
      runtime.updateOrbit?.();
      document.body.dataset.laboratoryStartingView = 'central-bureau-reference';
    }

    async function enterLaboratory() {
      if (laboratoryActive) return;
      try {
        await loadLaboratory();
      } catch (error) {
        console.error('Laboratory GLB failed to load.', error);
        return;
      }
      laboratoryActive = true;
      if (runtime.castleRoot) runtime.castleRoot.visible = false;
      if (runtime.interiorRoot) runtime.interiorRoot.visible = false;
      if (runtime.scene && laboratoryRoot) laboratoryRoot.visible = true;
      document.body.dataset.sceneMode = 'interior';
      document.body.dataset.castleSubscene = 'laboratory';
      setLaboratoryView();
      document.body.dataset.laboratoryTransition = 'entered-from-bureau-of-affairs-ai';
    }

    function returnToInteriorCastle() {
      if (!laboratoryActive) return;
      laboratoryActive = false;
      if (laboratoryRoot) laboratoryRoot.visible = false;
      if (runtime.castleRoot) runtime.castleRoot.visible = false;
      if (runtime.interiorRoot) runtime.interiorRoot.visible = true;
      document.body.dataset.sceneMode = 'interior';
      delete document.body.dataset.castleSubscene;
      runtime.setInteriorStartingView?.();
      document.body.dataset.laboratoryTransition = 'returned-to-interior-castle';
    }

    function isBureauNode(object) {
      let current = object;
      for (let i = 0; current && i < 7; i++, current = current.parent) {
        const label = `${current.name || ''} ${current.userData?.name || ''} ${current.userData?.label || ''}`.toLowerCase();
        if (/bureau\s*(of\s*)?affairs|affairs\s*ai|bureau[_\-\s]*ai/.test(label)) return true;
      }
      return false;
    }

    const canvas = runtime.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    canvas.addEventListener('pointerdown', event => {
      down = { x: event.clientX, y: event.clientY, id: event.pointerId };
    }, true);

    canvas.addEventListener('pointerup', event => {
      if (laboratoryActive || document.body.dataset.sceneMode !== 'interior') return;
      if (!down || down.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
      down = null;
      if (distance > 8 || !runtime.interiorRoot?.visible) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, runtime.camera);
      const hits = raycaster.intersectObject(runtime.interiorRoot, true);
      const hit = hits.find(candidate => isBureauNode(candidate.object));
      if (hit) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void enterLaboratory();
      }
    }, true);

    bureauButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      void enterLaboratory();
    });
    returnButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      returnToInteriorCastle();
    });

    window.__castleLaboratoryBridge = {
      enterLaboratory,
      returnToInteriorCastle,
      get laboratoryRoot() { return laboratoryRoot; },
      get active() { return laboratoryActive; },
    };

    document.body.dataset.laboratoryBridge = 'ready';
  }

  setTimeout(install, 100);
})();
