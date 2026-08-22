import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent || '') ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (isIOS && !window.__castleIOSLaboratoryResilienceV62Installed) {
  window.__castleIOSLaboratoryResilienceV62Installed = true;

  const LABORATORY_URL = new URL(
    '../assets/assets/models/laboratory_interior.glb',
    document.baseURI,
  ).href;
  const LABORATORY_TARGET_SPAN = 50;
  const FETCH_TIMEOUT_MS = 16000;
  const PARSE_TIMEOUT_MS = 14000;

  let runtime = null;
  let laboratoryRoot = null;
  let laboratoryBounds = null;
  let laboratoryBytes = null;
  let laboratoryBytesPromise = null;
  let laboratoryRootPromise = null;
  let entryPromise = null;
  let warmTimer = 0;
  let warmupFailed = false;
  let activeFetchController = null;

  document.body.dataset.iosLaboratoryOwner = 'ios-resilience-v62';
  document.body.dataset.iosLaboratoryAsset = LABORATORY_URL;

  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function refreshRuntime() {
    runtime = window.__castleSearchRuntime || runtime;
    return runtime;
  }

  function publishSceneState(nextMode) {
    document.body.dataset.sceneMode = nextMode;
    document.body.dataset.castleNavigationScene = nextMode;
    document.body.dataset.castleSubscene = nextMode === 'laboratory' ? 'laboratory' : '';
  }

  function findCardGroup() {
    return runtime?.scene?.children?.find(
      child => child?.isGroup && child.children?.some(item => item?.userData?.card),
    ) || null;
  }

  function withTimeout(promise, timeoutMs, code) {
    let timer = 0;
    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => {
        const error = new Error(code);
        error.code = code;
        reject(error);
      }, timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
  }

  async function fetchLaboratoryBytes({reload = false, silent = false} = {}) {
    if (laboratoryBytes) return laboratoryBytes;
    if (laboratoryBytesPromise) return laboratoryBytesPromise;

    const controller = new AbortController();
    activeFetchController = controller;
    const timeout = window.setTimeout(() => controller.abort('laboratory-fetch-timeout'), FETCH_TIMEOUT_MS);

    if (!silent) {
      document.body.dataset.iosLaboratoryStage = 'fetching-v62';
    } else {
      document.body.dataset.iosLaboratoryWarmup = 'fetching-v62';
    }

    laboratoryBytesPromise = fetch(LABORATORY_URL, {
      cache: reload ? 'reload' : 'force-cache',
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error(`laboratory-http-${response.status}`);
        return response.arrayBuffer();
      })
      .then(buffer => {
        if (!buffer?.byteLength) throw new Error('laboratory-empty-response');
        laboratoryBytes = buffer;
        warmupFailed = false;
        document.body.dataset.iosLaboratoryBytes = String(buffer.byteLength);
        document.body.dataset.iosLaboratoryWarmup = 'ready-v62';
        return buffer;
      })
      .catch(error => {
        laboratoryBytes = null;
        warmupFailed = true;
        document.body.dataset.iosLaboratoryWarmup = 'failed-v62';
        document.body.dataset.iosLaboratoryWarmupError = String(error?.message || error);
        throw error;
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (activeFetchController === controller) activeFetchController = null;
        laboratoryBytesPromise = null;
      });

    return laboratoryBytesPromise;
  }

  function createLaboratoryLoader() {
    const loader = new GLTFLoader();
    let draco = null;
    const SharedDRACOLoader = window.DRACOLoader;
    const shared = window.__castleSharedDraco;
    if (typeof SharedDRACOLoader === 'function' && shared) {
      draco = new SharedDRACOLoader();
      draco.setDecoderPath(shared.decoderPath);
      draco.setDecoderConfig({type: shared.decoderType || 'js'});
      draco.setWorkerLimit(1);
      draco.preload();
      loader.setDRACOLoader(draco);
      document.body.dataset.iosLaboratoryDraco = `${shared.decoderType || 'js'}-worker-1-v62`;
    }
    return {loader, draco};
  }

  async function parseLaboratory(buffer) {
    const {loader, draco} = createLaboratoryLoader();
    const basePath = new URL('.', LABORATORY_URL).href;
    document.body.dataset.iosLaboratoryStage = 'decoding-v62';
    try {
      const gltf = await withTimeout(
        loader.parseAsync(buffer, basePath),
        PARSE_TIMEOUT_MS,
        'laboratory-decode-timeout',
      );
      return gltf.scene;
    } finally {
      draco?.dispose?.();
    }
  }

  function normalizeLaboratory(root) {
    root.updateMatrixWorld(true);
    let bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const horizontalSpan = Math.max(size.x, size.z, 0.001);
    const scale = LABORATORY_TARGET_SPAN / horizontalSpan;
    root.scale.multiplyScalar(scale);
    root.updateMatrixWorld(true);

    bounds = new THREE.Box3().setFromObject(root);
    const center = bounds.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.y -= bounds.min.y;
    root.position.z -= center.z;
    root.updateMatrixWorld(true);

    laboratoryBounds = new THREE.Box3().setFromObject(root);
    root.userData.laboratoryNormalized = true;
    root.userData.laboratoryNormalizationScale = scale;
    document.body.dataset.laboratoryNormalization = 'ios-resilient-center-floor-v62';
  }

  async function ensureLaboratoryRoot() {
    refreshRuntime();
    if (laboratoryRoot) return laboratoryRoot;
    if (!runtime?.scene) throw new Error('laboratory-runtime-unavailable');
    if (laboratoryRootPromise) return laboratoryRootPromise;

    laboratoryRootPromise = (async () => {
      const buffer = await fetchLaboratoryBytes({reload: warmupFailed});
      const root = await parseLaboratory(buffer);
      root.name = 'BureauOfAI';
      root.visible = false;
      normalizeLaboratory(root);
      runtime.scene.add(root);
      laboratoryRoot = root;
      laboratoryBytes = null;
      document.body.dataset.laboratoryReady = 'true';
      document.body.dataset.iosLaboratoryStage = 'ready-v62';
      delete document.body.dataset.laboratoryError;
      delete document.body.dataset.iosLaboratoryError;
      return root;
    })()
      .catch(error => {
        laboratoryBytes = null;
        warmupFailed = true;
        document.body.dataset.laboratoryReady = 'false';
        document.body.dataset.iosLaboratoryStage = 'failed-v62';
        document.body.dataset.iosLaboratoryError = String(error?.message || error);
        document.body.dataset.laboratoryError = String(error?.message || error);
        throw error;
      })
      .finally(() => {
        if (!laboratoryRoot) laboratoryRootPromise = null;
      });

    return laboratoryRootPromise;
  }

  function setLaboratoryStartingView() {
    if (!runtime?.orbit || !laboratoryRoot) return;
    laboratoryBounds = new THREE.Box3().setFromObject(laboratoryRoot);
    const sphere = laboratoryBounds.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center.clone();
    const size = laboratoryBounds.getSize(new THREE.Vector3());
    center.y = THREE.MathUtils.clamp(center.y, 2.2, Math.max(3.5, size.y * 0.56));
    runtime.orbit.target.copy(center);
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.10;
    runtime.orbit.distance = THREE.MathUtils.clamp(
      Math.max(12, Math.max(size.x, size.z) * 0.68),
      12,
      62,
    );
    runtime.updateOrbit?.();
    document.body.dataset.laboratoryStartingView = 'ios-resilient-bounds-v62';
  }

  async function openLaboratory() {
    refreshRuntime();
    if (!runtime || mode() !== 'interior') return false;
    if (entryPromise) return entryPromise;

    window.__castleBureauVideoPrime?.();
    document.body.dataset.laboratoryReady = 'loading';
    document.body.dataset.iosLaboratoryStage = 'opening-v62';

    entryPromise = (async () => {
      try {
        const root = await ensureLaboratoryRoot();
        if (mode() !== 'interior') {
          root.visible = false;
          return false;
        }
        if (runtime.castleRoot) runtime.castleRoot.visible = false;
        if (runtime.interiorRoot) runtime.interiorRoot.visible = false;
        const cardGroup = findCardGroup();
        if (cardGroup) cardGroup.visible = false;
        root.visible = true;
        publishSceneState('laboratory');
        setLaboratoryStartingView();
        document.body.dataset.laboratoryReady = 'true';
        document.body.dataset.iosLaboratoryStage = 'visible-v62';
        window.__castleBureauVideoPlay?.();
        return true;
      } catch (error) {
        document.body.dataset.laboratoryReady = 'false';
        document.body.dataset.iosLaboratoryStage = 'retry-available-v62';
        document.body.dataset.iosLaboratoryError = String(error?.message || error);
        return false;
      } finally {
        entryPromise = null;
      }
    })();

    return entryPromise;
  }

  function restoreInterior() {
    refreshRuntime();
    if (!runtime?.interiorRoot) return false;
    if (laboratoryRoot) laboratoryRoot.visible = false;
    if (runtime.castleRoot) runtime.castleRoot.visible = false;
    runtime.interiorRoot.visible = true;
    const cardGroup = findCardGroup();
    if (cardGroup) cardGroup.visible = false;
    publishSceneState('interior');
    runtime.setInteriorStartingView?.();
    document.body.dataset.iosLaboratoryStage = laboratoryRoot ? 'cached-v62' : 'idle-v62';
    return true;
  }

  function scheduleWarmup() {
    if (warmTimer || laboratoryRoot || laboratoryBytes || laboratoryBytesPromise || mode() !== 'interior') return;
    warmTimer = window.setTimeout(() => {
      warmTimer = 0;
      if (mode() !== 'interior' || laboratoryRoot) return;
      fetchLaboratoryBytes({silent: true}).catch(() => {});
    }, 450);
  }

  function interceptClick(event) {
    const target = event.target?.closest?.('#bureau-of-ai, #laboratory-medallion-button, #return-exterior');
    if (!target) return;

    if (mode() === 'laboratory' && (target.id === 'bureau-of-ai' || target.id === 'return-exterior')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      restoreInterior();
      return;
    }

    if (mode() === 'interior' && (target.id === 'bureau-of-ai' || target.id === 'laboratory-medallion-button')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void openLaboratory();
    }
  }

  function interceptEscape(event) {
    if (event.key !== 'Escape' || mode() !== 'laboratory') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    restoreInterior();
  }

  function handleOpenEvent(event) {
    if (mode() !== 'interior') return;
    event?.preventDefault?.();
    void openLaboratory();
  }

  window.__castleOpenLaboratory = openLaboratory;
  window.__castleRestoreInteriorFromLaboratory = restoreInterior;

  document.addEventListener('click', interceptClick, true);
  window.addEventListener('keydown', interceptEscape, true);
  window.addEventListener('castle-open-laboratory', handleOpenEvent, true);
  window.addEventListener('castleRuntimeReady', () => {
    refreshRuntime();
    scheduleWarmup();
  });

  const observer = new MutationObserver(() => {
    refreshRuntime();
    if (mode() === 'interior') scheduleWarmup();
  });
  observer.observe(document.body, {attributes: true, attributeFilter: ['data-scene-mode']});
  scheduleWarmup();

  window.addEventListener('pagehide', () => {
    if (warmTimer) window.clearTimeout(warmTimer);
    activeFetchController?.abort?.('pagehide');
    observer.disconnect();
    document.removeEventListener('click', interceptClick, true);
    window.removeEventListener('keydown', interceptEscape, true);
    window.removeEventListener('castle-open-laboratory', handleOpenEvent, true);
    delete window.__castleOpenLaboratory;
    delete window.__castleRestoreInteriorFromLaboratory;
  }, {once: true});
}
