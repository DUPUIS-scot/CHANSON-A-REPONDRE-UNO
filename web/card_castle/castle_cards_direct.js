(() => {
  if (window.__castleDirectCardsInstalled) return;
  window.__castleDirectCardsInstalled = true;

  let pendingCards = null;
  let installAttempts = 0;

  function decode(event) {
    let message = event.data;
    try { if (typeof message === 'string') message = JSON.parse(message); } catch (_) { return null; }
    return message && typeof message === 'object' ? message : null;
  }

  window.addEventListener('message', event => {
    const message = decode(event);
    if (!message) return;
    if (message.type === 'setCards' && Array.isArray(message.cards)) {
      pendingCards = message;
      renderWhenReady();
    } else if (message.type === 'rendererReady') {
      renderWhenReady();
    }
  }, true);

  function textureCandidates(card) {
    const urls = [];
    const add = value => {
      if (!value || urls.includes(value)) return;
      urls.push(value);
    };

    const id = String(card?.id || '').toLowerCase();
    const brio = id.match(/^brio-(\d{1,3})$/);
    if (brio) {
      const number = brio[1].padStart(3, '0');
      add(new URL(`../assets/assets/decks/chanson_a_repondre_brio/cards/${number}.jpeg`, document.baseURI).href);
    }

    const source = String(card?.rectoUrl || card?.imagePath || card?.thumbnailUrl || '').trim();
    if (!source) return urls;
    if (/^(blob:|data:)/i.test(source)) {
      add(source);
      return urls;
    }

    try {
      const resolved = new URL(source, location.href);
      if (resolved.origin === location.origin) {
        let path = resolved.pathname;
        path = path.replace(/^\/assets\/(?:assets\/)+/, '/assets/assets/');
        if (path.startsWith('/assets/') && !path.startsWith('/assets/assets/')) {
          add(new URL(`/assets${path}${resolved.search}`, location.origin).href);
        }
        const normalized = new URL(resolved.href);
        normalized.pathname = path;
        add(normalized.href);
      }
      add(resolved.href);
    } catch (_) {
      const clean = source.replace(/^\/+/, '');
      const relative = clean.replace(/^assets\/(?:assets\/)?/, '');
      add(new URL(`../assets/assets/${relative}`, document.baseURI).href);
      add(new URL(source, document.baseURI).href);
    }
    return urls;
  }

  function deriveAnchors(THREE, castleRoot, limit) {
    const anchors = [];
    const bounds = new THREE.Box3().setFromObject(castleRoot);
    const size = bounds.getSize(new THREE.Vector3());
    const ray = new THREE.Raycaster();
    const meshes = [];
    castleRoot.traverse(object => {
      if (object.isMesh && object.visible !== false && !object.userData?.hiddenAsOutlier) meshes.push(object);
    });

    const minY = bounds.min.y + size.y * 0.43;
    const maxY = bounds.min.y + size.y * 0.92;
    const minSpacingSq = 1.22 * 1.22;

    const addHit = (hit, outward) => {
      if (!hit || anchors.length >= limit) return;
      const normal = hit.face?.normal
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : outward.clone();
      if (normal.dot(outward) < 0) normal.negate();
      if (Math.abs(normal.y) > 0.75) return;
      normal.y = THREE.MathUtils.clamp(normal.y, -0.16, 0.24);
      normal.normalize();
      const position = hit.point.clone().addScaledVector(normal, 0.12);
      if (anchors.some(anchor => anchor.position.distanceToSquared(position) < minSpacingSq)) return;
      anchors.push({ position, normal });
    };

    const cast = (origin, direction, outward) => {
      ray.set(origin, direction);
      ray.near = 0;
      ray.far = Math.max(size.x, size.z) * 2.8;
      const hits = ray.intersectObjects(meshes, false);
      const hit = hits.find(candidate => candidate.point.y >= minY && candidate.point.y <= maxY);
      if (hit) addHit(hit, outward);
    };

    const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const xSamples = isIOS ? 12 : 18;
    const ySamples = isIOS ? 5 : 7;
    const zSamples = isIOS ? 7 : 11;
    const frontZ = bounds.max.z + Math.max(8, size.z * 0.45);

    for (let yi = 0; yi < ySamples && anchors.length < limit; yi += 1) {
      const y = THREE.MathUtils.lerp(minY, maxY, yi / Math.max(1, ySamples - 1));
      for (let xi = 0; xi < xSamples && anchors.length < limit; xi += 1) {
        const x = THREE.MathUtils.lerp(bounds.min.x + size.x * 0.05, bounds.max.x - size.x * 0.05, xi / Math.max(1, xSamples - 1));
        cast(new THREE.Vector3(x, y, frontZ), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1));
      }
    }

    for (const side of [-1, 1]) {
      const x = side < 0
        ? bounds.min.x - Math.max(8, size.x * 0.35)
        : bounds.max.x + Math.max(8, size.x * 0.35);
      const direction = new THREE.Vector3(-side, 0, 0);
      const outward = new THREE.Vector3(side, 0, 0);
      for (let yi = 0; yi < ySamples && anchors.length < limit; yi += 1) {
        const y = THREE.MathUtils.lerp(minY, maxY, yi / Math.max(1, ySamples - 1));
        for (let zi = 0; zi < zSamples && anchors.length < limit; zi += 1) {
          const z = THREE.MathUtils.lerp(bounds.min.z + size.z * 0.08, bounds.max.z - size.z * 0.08, zi / Math.max(1, zSamples - 1));
          cast(new THREE.Vector3(x, y, z), direction, outward);
        }
      }
    }

    const minimumUseful = Math.min(limit, 12);
    if (anchors.length < minimumUseful) {
      const rows = 3;
      const cols = Math.max(4, Math.min(10, Math.ceil(limit / rows)));
      for (let row = 0; row < rows && anchors.length < limit; row += 1) {
        const y = THREE.MathUtils.lerp(bounds.min.y + size.y * 0.56, bounds.min.y + size.y * 0.82, row / Math.max(1, rows - 1));
        for (let col = 0; col < cols && anchors.length < limit; col += 1) {
          const x = THREE.MathUtils.lerp(bounds.min.x + size.x * 0.16, bounds.max.x - size.x * 0.16, col / Math.max(1, cols - 1));
          anchors.push({
            position: new THREE.Vector3(x, y, bounds.max.z + 0.16),
            normal: new THREE.Vector3(0, 0, 1),
          });
        }
      }
      document.body.dataset.surfaceAnchorFallback = 'front-rampart-grid';
    }

    document.body.dataset.surfaceAnchorMode = 'direct-raycast-with-fallback-v32';
    document.body.dataset.surfaceAnchorCount = String(anchors.length);
    return anchors.slice(0, limit);
  }

  function renderWhenReady() {
    if (!pendingCards) return;
    const THREE = window.THREE;
    const runtime = window.__castleSearchRuntime;
    if (!THREE || !runtime?.scene || !runtime?.renderer || !runtime?.camera || !runtime?.castleRoot) {
      if (installAttempts++ < 240) setTimeout(renderWhenReady, 100);
      return;
    }
    renderCards(THREE, runtime, pendingCards);
  }

  function renderCards(THREE, runtime, payload) {
    let group = runtime.scene.getObjectByName('castle-direct-card-previews');
    if (!group) {
      group = new THREE.Group();
      group.name = 'castle-direct-card-previews';
      runtime.scene.add(group);
      installInteractions(THREE, runtime, group);
    }

    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      child.geometry?.dispose?.();
      child.material?.map?.dispose?.();
      child.material?.dispose?.();
    }

    for (const child of runtime.scene.children) {
      if (child === group || !child?.isGroup) continue;
      if (child.children?.some(item => item?.userData?.card)) child.visible = false;
    }

    const cards = payload.cards || [];
    const anchors = deriveAnchors(THREE, runtime.castleRoot, cards.length);
    const loader = new THREE.TextureLoader();
    const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const concurrency = isIOS ? 1 : (/Windows/i.test(navigator.userAgent) ? 5 : 4);
    const queue = [];
    let active = 0;
    let loadedCount = 0;
    let failedCount = 0;

    const orient = (mesh, normal) => {
      const up = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, normal).normalize();
      const correctedUp = new THREE.Vector3().crossVectors(normal, right).normalize();
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, correctedUp, normal));
    };

    const pump = () => {
      while (active < concurrency && queue.length) {
        const job = queue.shift();
        if (!job.mesh.parent) continue;
        const url = job.urls[job.urlIndex];
        if (!url) {
          failedCount += 1;
          document.body.dataset.directCardTextureFailures = String(failedCount);
          continue;
        }
        active += 1;
        loader.load(
          url,
          texture => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(runtime.renderer.capabilities.getMaxAnisotropy(), 4);
            if (job.mesh.parent) {
              const old = job.mesh.material;
              job.mesh.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
              old.dispose();
              loadedCount += 1;
              document.body.dataset.directCardTextureLoaded = String(loadedCount);
            }
            active -= 1;
            pump();
          },
          undefined,
          () => {
            active -= 1;
            if (!job.mesh.parent) {
              pump();
              return;
            }
            if (job.urlIndex + 1 < job.urls.length) {
              job.urlIndex += 1;
              queue.push(job);
            } else if (job.retries < 2) {
              job.retries += 1;
              job.urlIndex = 0;
              setTimeout(() => { if (job.mesh.parent) { queue.push(job); pump(); } }, 260 * job.retries);
            } else {
              failedCount += 1;
              job.mesh.material.color.setHex(0x2b1c15);
              document.body.dataset.directCardTextureFailures = String(failedCount);
            }
            pump();
          },
        );
      }
    };

    cards.slice(0, anchors.length).forEach((card, index) => {
      const anchor = anchors[index];
      const geometry = new THREE.PlaneGeometry(1.12, 1.68);
      const material = new THREE.MeshBasicMaterial({ color: 0x1b1713, side: THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.card = card;
      mesh.position.copy(anchor.position);
      mesh.scale.setScalar(1.48 + (index % 5) * 0.035);
      orient(mesh, anchor.normal);
      mesh.renderOrder = 5;
      group.add(mesh);
      const urls = textureCandidates(card);
      if (urls.length) queue.push({ mesh, urls, urlIndex: 0, retries: 0 });
    });

    group.visible = document.body.dataset.sceneMode !== 'interior';
    document.body.dataset.directCardPreviewCount = String(group.children.length);
    document.body.dataset.directCardPreviewMode = 'rampart-textures-v32';
    document.body.dataset.directCardTextureLoaded = '0';
    document.body.dataset.directCardTextureFailures = '0';
    pump();

    if (!group.userData.sceneObserver) {
      const syncVisibility = () => { group.visible = document.body.dataset.sceneMode !== 'interior'; };
      group.userData.sceneObserver = new MutationObserver(syncVisibility);
      group.userData.sceneObserver.observe(document.body, { attributes: true, attributeFilter: ['data-scene-mode'] });
    }
  }

  function installInteractions(THREE, runtime, group) {
    const canvas = runtime.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = null;
    let longTimer = 0;

    const hitCard = event => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      raycaster.setFromCamera(pointer, runtime.camera);
      return raycaster.intersectObjects(group.children, false)[0]?.object || null;
    };

    canvas.addEventListener('pointerdown', event => {
      const mesh = hitCard(event);
      if (!mesh) return;
      down = { id: event.pointerId, x: event.clientX, y: event.clientY, mesh, longFired: false };
      clearTimeout(longTimer);
      longTimer = setTimeout(() => {
        if (!down || down.mesh !== mesh) return;
        down.longFired = true;
        parent.postMessage(JSON.stringify({ type: 'cardLongPressed', cardId: mesh.userData.card.id }), location.origin);
      }, 600);
    }, true);

    canvas.addEventListener('pointermove', event => {
      if (!down || down.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 9) {
        clearTimeout(longTimer);
        down = null;
      }
    }, true);

    const release = event => {
      if (!down || down.id !== event.pointerId) return;
      clearTimeout(longTimer);
      const current = down;
      down = null;
      if (!current.longFired && hitCard(event) === current.mesh) {
        parent.postMessage(JSON.stringify({ type: 'cardSelected', cardId: current.mesh.userData.card.id }), location.origin);
      }
    };
    canvas.addEventListener('pointerup', release, true);
    canvas.addEventListener('pointercancel', () => { clearTimeout(longTimer); down = null; }, true);
  }

  setTimeout(renderWhenReady, 1000);
})();