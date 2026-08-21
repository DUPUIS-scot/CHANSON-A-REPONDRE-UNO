import * as THREE from 'three';

// Dedicated background owner: interior keeps its dark Gothic atmosphere,
// independent from the exterior texture and laboratory scene.
if (!window.__castleInteriorBackgroundFixInstalled) {
  window.__castleInteriorBackgroundFixInstalled = true;
  let runtime = null;
  let attempts = 0;
  let exteriorBackground = null;
  let laboratoryBackground = null;
  const interiorBackground = new THREE.Color(0x07111c);
  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function sync() {
    if (!runtime?.scene) return;
    const current = mode();
    if (current === 'interior') {
      runtime.scene.background = interiorBackground;
      runtime.renderer?.setClearColor?.(0x07111c, 1);
      document.body.dataset.interiorBackground = 'restored-gothic-blue-v50';
      return;
    }
    delete document.body.dataset.interiorBackground;
    if (current === 'laboratory') {
      if (runtime.scene.background && runtime.scene.background !== interiorBackground) laboratoryBackground = runtime.scene.background;
      runtime.scene.background = laboratoryBackground || new THREE.Color(0x08131e);
      runtime.renderer?.setClearColor?.(0x08131e, 1);
      return;
    }
    if (exteriorBackground) runtime.scene.background = exteriorBackground;
    runtime.renderer?.setClearColor?.(0x000000, 1);
  }

  function scheduleSync() { setTimeout(sync,0); setTimeout(sync,80); setTimeout(sync,220); }
  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.scene) { if (attempts++ < 180) setTimeout(install,100); return; }
    exteriorBackground = runtime.scene.background;
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready']});
    window.addEventListener('resize',scheduleSync);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync();});
    document.body.dataset.castleInteriorBackgroundFix='restored-v50';
    scheduleSync();
  }
  window.addEventListener('castleRuntimeReady',install,{once:true});
  install();
}
