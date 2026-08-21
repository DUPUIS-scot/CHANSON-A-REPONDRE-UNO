import * as THREE from 'three';

if (!window.__castlePlatformStabilityV54Installed) {
  window.__castlePlatformStabilityV54Installed = true;

  const INTERIOR_MAX_DISTANCE = 78;
  const PASSAGE_PATTERN = /(?:laboratory|laboratoire|bureau|passage|portal|door|doorway|gate|arch|corridor|entrance|entry|tunnel)/i;
  const STATUE_PATTERN = /(?:walking|walker|statue|figure|robed|metallic|character|human|dee)/i;
  const touchPointers = new Map();
  let runtime = null;
  let canvas = null;
  let pinch = null;
  let touchDown = null;
  let attempts = 0;

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  const emit = (type, payload = {}) => {
    try {
      parent.postMessage(JSON.stringify({ type, ...payload }), location.origin);
    } catch (_) {}
  };

  function objectLabel(object) {
    const materials = object?.material
      ? (Array.isArray(object.material) ? object.material : [object.material])
          .map(material => material?.name || '')
          .join(' ')
      : '';
    const ancestors = [];
    let current = object;
    for (let i = 0; current && i < 5; i += 1, current = current.parent) {
      ancestors.push(current.name || '');
    }
    return `${ancestors.join(' ')} ${materials}`.trim();
  }

  function findWalkingStatue(root) {
    if (!root) return null;
    let best = null;
    let bestScore = -Infinity;
    root.traverse(object => {
      if (!(object.isObject3D || object.isMesh || object.isSkinnedMesh)) return;
      const label = objectLabel(object);
      let score = 0;
      if (/walking|walker/i.test(label)) score += 120;
      if (/statue/i.test(label)) score += 100;
      if (/robed|metallic/i.test(label)) score += 75;
      if (/figure|character|human|dee/i.test(label)) score += 50;
      if (object.isSkinnedMesh) score += 65;
      if (object.skeleton) score += 30;
      if (STATUE_PATTERN.test(label)) score += 20;
      if (score > bestScore) {
        bestScore = score;
        best = object;
      }
    });
    return bestScore > 20 ? best : null;
  }

  function focusLaboratoryOnWalkingStatue() {
    if (mode() !== 'laboratory' || !runtime?.orbit || !runtime?.scene) return false;
    const labRoot = runtime.scene.getObjectByName('BureauOfAI');
    if (!labRoot?.visible) return false;
    const statue = findWalkingStatue(labRoot);
    if (!statue) {
      document.body.dataset.laboratoryFocus = 'walking-statue-not-found-v54';
      return false;
    }

    statue.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(statue);
    const target = box.isEmpty()
      ? statue.getWorldPosition(new THREE.Vector3())
      : box.getCenter(new THREE.Vector3());
    const size = box.isEmpty() ? new THREE.Vector3(2, 5, 2) : box.getSize(new THREE.Vector3());
    runtime.orbit.target.copy(target);
    runtime.orbit.yaw = 0;
    runtime.orbit.pitch = 0.10;
    runtime.orbit.distance = THREE.MathUtils.clamp(
      Math.max(12, size.y * 2.2, size.x * 2.8),
      12,
      34,
    );
    runtime.updateOrbit?.();
    document.body.dataset.laboratoryStartingView = 'walking-statue-focus-v54';
    document.body.dataset.laboratoryFocus = statue.name || 'walking-statue-v54';
    return true;
  }

  function scheduleStatueFocus() {
    if (mode() !== 'laboratory') return;
    requestAnimationFrame(() => requestAnimationFrame(focusLaboratoryOnWalkingStatue));
    setTimeout(focusLaboratoryOnWalkingStatue, 180);
    setTimeout(focusLaboratoryOnWalkingStatue, 500);
    setTimeout(focusLaboratoryOnWalkingStatue, 1000);
  }

  function enterLaboratoryFromPassage() {
    if (mode() !== 'interior') return false;
    const button = document.getElementById('bureau-of-ai');
    if (!button || button.disabled) return false;
    button.click();
    document.body.dataset.laboratoryPassageEntry = 'spatial-hit-v54';
    return true;
  }

  function raycastInteriorPassage(clientX, clientY) {
    if (mode() !== 'interior' || !runtime?.camera || !runtime?.interiorRoot || !canvas) return false;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, runtime.camera);
    const hits = raycaster.intersectObject(runtime.interiorRoot, true);
    for (const hit of hits.slice(0, 10)) {
      if (PASSAGE_PATTERN.test(objectLabel(hit.object))) return enterLaboratoryFromPassage();
    }
    return false;
  }

  function bindInteriorNavigation(targetCanvas) {
    if (!targetCanvas || targetCanvas.dataset.castlePlatformStabilityV54 === 'true') return;
    targetCanvas.dataset.castlePlatformStabilityV54 = 'true';
    targetCanvas.style.touchAction = 'none';

    targetCanvas.addEventListener('wheel', event => {
      if (mode() !== 'interior' || !runtime?.orbit) return;
      runtime.orbit.distance = THREE.MathUtils.clamp(
        runtime.orbit.distance + event.deltaY * 0.025,
        4.5,
        INTERIOR_MAX_DISTANCE,
      );
      runtime.updateOrbit?.();
      document.body.dataset.castleNavigationGesture = 'wheel-zoom-v54';
      document.body.dataset.interiorMaxDistance = String(INTERIOR_MAX_DISTANCE);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });

    targetCanvas.addEventListener('pointerdown', event => {
      if (mode() !== 'interior' || event.pointerType !== 'touch' || !runtime?.orbit) return;
      touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchPointers.size === 1) {
        touchDown = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          yaw: runtime.orbit.yaw,
          pitch: runtime.orbit.pitch,
          moved: false,
        };
      } else {
        touchDown = null;
      }
      if (touchPointers.size === 2) {
        const [a, b] = [...touchPointers.values()];
        pinch = {
          distance: Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)),
          orbitDistance: runtime.orbit.distance,
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          target: runtime.orbit.target.clone(),
        };
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });

    targetCanvas.addEventListener('pointermove', event => {
      if (mode() !== 'interior' || event.pointerType !== 'touch' || !touchPointers.has(event.pointerId) || !runtime?.orbit) return;
      touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (touchPointers.size === 2 && pinch) {
        const [a, b] = [...touchPointers.values()];
        const distance = Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
        const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        runtime.orbit.distance = THREE.MathUtils.clamp(
          pinch.orbitDistance * pinch.distance / distance,
          4.5,
          INTERIOR_MAX_DISTANCE,
        );
        const scale = runtime.orbit.distance * 0.0018;
        const right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 1);
        runtime.orbit.target.copy(pinch.target)
          .addScaledVector(right, -(center.x - pinch.center.x) * scale)
          .addScaledVector(up, (center.y - pinch.center.y) * scale);
        runtime.updateOrbit?.();
        document.body.dataset.castleNavigationGesture = 'ios-pinch-pan-zoom-v54';
      } else if (touchPointers.size === 1 && touchDown?.id === event.pointerId) {
        const dx = event.clientX - touchDown.x;
        const dy = event.clientY - touchDown.y;
        if (Math.hypot(dx, dy) > 5) touchDown.moved = true;
        if (touchDown.moved) {
          runtime.orbit.yaw = touchDown.yaw - dx * 0.008;
          runtime.orbit.pitch = THREE.MathUtils.clamp(touchDown.pitch + dy * 0.006, 0.04, 1.24);
          runtime.updateOrbit?.();
          document.body.dataset.castleNavigationGesture = 'ios-orbit-v54';
        }
      }

      document.body.dataset.interiorMaxDistance = String(INTERIOR_MAX_DISTANCE);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });

    const release = event => {
      if (event.pointerType !== 'touch' || !touchPointers.has(event.pointerId)) return;
      const down = touchDown;
      touchPointers.delete(event.pointerId);
      if (touchPointers.size < 2) pinch = null;
      if (down?.id === event.pointerId && !down.moved && mode() === 'interior') {
        raycastInteriorPassage(event.clientX, event.clientY);
      }
      if (down?.id === event.pointerId) touchDown = null;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    targetCanvas.addEventListener('pointerup', release, { capture: true, passive: false });
    targetCanvas.addEventListener('pointercancel', release, { capture: true, passive: false });

    targetCanvas.addEventListener('gesturestart', event => {
      if (mode() === 'interior') event.preventDefault();
    }, { passive: false });
    targetCanvas.addEventListener('gesturechange', event => {
      if (mode() === 'interior') event.preventDefault();
    }, { passive: false });

    targetCanvas.addEventListener('dblclick', event => {
      if (raycastInteriorPassage(event.clientX, event.clientY)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, { capture: true });
  }

  function ensureEntranceLoadingUi() {
    const transition = document.getElementById('castle-entrance-transition');
    if (!transition) return null;
    let label = document.getElementById('castle-interior-loading-label');
    if (!label) {
      label = document.createElement('div');
      label.id = 'castle-interior-loading-label';
      label.textContent = 'LOADING CASTLE INTERIOR…';
      Object.assign(label.style, {
        position: 'absolute',
        left: '50%',
        bottom: 'max(28px, env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: '2',
        padding: '10px 14px',
        border: '1px solid rgba(218,174,93,.62)',
        borderRadius: '8px',
        background: 'rgba(2,6,11,.82)',
        color: '#e5c98f',
        font: '700 12px/1.2 system-ui,sans-serif',
        letterSpacing: '.12em',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      });
      transition.appendChild(label);
    }
    return label;
  }

  function showEntranceLoading() {
    const transition = document.getElementById('castle-entrance-transition');
    const label = ensureEntranceLoadingUi();
    if (!transition) return;
    transition.setAttribute('aria-hidden', 'false');
    document.body.classList.add('entrance-video-active');
    if (label) label.style.display = 'block';
    document.body.dataset.castleEntranceState = 'interior-loading-visible-v54';
  }

  function bindEntranceSequence() {
    window.addEventListener('castleJesterEnter', showEntranceLoading, true);
    const video = document.getElementById('castle-entrance-video');
    if (!video || video.dataset.castleStableEntranceV54 === 'true') return;
    video.dataset.castleStableEntranceV54 = 'true';
    const label = ensureEntranceLoadingUi();
    const hideLabel = () => { if (label) label.style.display = 'none'; };
    video.addEventListener('play', hideLabel);
    video.addEventListener('playing', hideLabel);
    video.addEventListener('timeupdate', () => {
      if (video.currentTime < 0.4 || mode() === 'interior') return;
      if (runtime?.interiorRoot && runtime?.switchToInterior?.()) {
        document.body.dataset.castleEntranceSwitch = 'reliable-timeupdate-v54';
      }
    });
  }

  function bindFullscreen() {
    const enter = document.getElementById('enter-fullscreen');
    const exit = document.getElementById('exit-fullscreen');
    if (!enter || !exit || enter.dataset.castleFullscreenV54 === 'true') return;
    enter.dataset.castleFullscreenV54 = 'true';

    const setClass = active => {
      document.body.classList.toggle('fullscreen-castle', active);
      document.body.dataset.fullscreenActive = String(active);
    };
    const requestFallback = () => {
      setClass(true);
      emit('fullscreenFallbackRequested');
    };

    enter.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const request = document.documentElement.requestFullscreen;
      if (typeof request !== 'function') {
        requestFallback();
        return;
      }
      try {
        Promise.resolve(request.call(document.documentElement)).catch(requestFallback);
      } catch (_) {
        requestFallback();
      }
    }, true);

    exit.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        Promise.resolve(document.exitFullscreen()).catch(() => {
          setClass(false);
          emit('fullscreenFallbackExit');
        });
        return;
      }
      setClass(false);
      emit('fullscreenFallbackExit');
    }, true);

    document.addEventListener('fullscreenchange', () => {
      const active = Boolean(document.fullscreenElement);
      setClass(active);
      emit('fullscreenChanged', { active });
    });

    window.addEventListener('message', event => {
      let message = event.data;
      try { if (typeof message === 'string') message = JSON.parse(message); } catch (_) { return; }
      if (message?.type !== 'setInAppFullscreen') return;
      setClass(message.active === true);
    });
  }

  function syncVisibility() {
    if (!runtime?.scene) return;
    const sceneMode = mode();
    const directCards = runtime.scene.getObjectByName('castle-direct-card-previews');
    if (directCards) directCards.visible = sceneMode === 'exterior';
    if (sceneMode !== 'exterior') {
      runtime.scene.children.forEach(child => {
        if (!child?.isGroup) return;
        let hasCards = false;
        child.traverse?.(object => { if (object?.userData?.card) hasCards = true; });
        if (hasCards) child.visible = false;
      });
    }

    const jester = runtime.scene.getObjectByName('castle-jester-gatekeeper');
    if (jester) {
      const visible = sceneMode === 'exterior';
      jester.visible = visible;
      jester.traverse(object => {
        if (object.userData?.castleGatekeeper === true) object.visible = visible;
      });
    }
    document.body.dataset.castlePlatformVisibility = `${sceneMode}-v54`;
  }

  function sync() {
    if (!runtime) runtime = window.__castleSearchRuntime;
    if (!runtime?.renderer?.domElement) return;
    canvas = runtime.renderer.domElement;
    bindInteriorNavigation(canvas);
    bindEntranceSequence();
    bindFullscreen();
    syncVisibility();
    if (mode() === 'laboratory') scheduleStatueFocus();
  }

  function install() {
    runtime = window.__castleSearchRuntime;
    if (!runtime?.renderer?.domElement || !runtime?.orbit) {
      if (attempts++ < 180) setTimeout(install, 100);
      return;
    }
    document.body.dataset.interiorMaxDistance = String(INTERIOR_MAX_DISTANCE);
    document.body.dataset.castleCrossPlatformNavigation = 'single-owner-v54';
    sync();

    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => {
        syncVisibility();
        if (mode() === 'laboratory') scheduleStatueFocus();
      });
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene-mode', 'data-laboratory-ready'],
    });

    window.addEventListener('resize', sync);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  }

  window.addEventListener('castleRuntimeReady', install, { once: true });
  install();
}
