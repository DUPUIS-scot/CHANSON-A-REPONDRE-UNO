(() => {
  if (window.__castleDirectCardsInstalled) return;
  window.__castleDirectCardsInstalled = true;

  let pendingCards = null;
  let installAttempts = 0;
  let stagingAttempts = 0;
  let retryTimer = 0;

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
    const add = value => { if (value && !urls.includes(value)) urls.push(value); };
    const id = String(card?.id || '').toLowerCase();
    const brio = id.match(/^brio-(\d{1,3})$/);
    if (brio) add(new URL(`../assets/assets/decks/chanson_a_repondre_brio/cards/${brio[1].padStart(3, '0')}.jpeg`, document.baseURI).href);

    // Flutter web publishes bundled assets below /assets/assets/. Always add
    // the canonical bundled form first, then retain the bridge URL as fallback.
    const source = String(card?.rectoUrl || card?.imagePath || card?.thumbnailUrl || '').trim();
    if (!source) return urls;
    if (/^(blob:|data:)/i.test(source)) { add(source); return urls; }
    try {
      const resolved = new URL(source, location.href);
      if (resolved.origin === location.origin) {
        let path = resolved.pathname;
        if (path.startsWith('/assets/') && !path.startsWith('/assets/assets/') && !path.startsWith('/assets/share-previews/')) {
          add(new URL(`/assets${path}${resolved.search}`, location.origin).href);
        }
        path = path.replace(/^\/assets\/(?:assets\/)+/, '/assets/assets/');
        const normalized = new URL(resolved.href); normalized.pathname = path; add(normalized.href);
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
    const anchors = [], bounds = new THREE.Box3().setFromObject(castleRoot), size = bounds.getSize(new THREE.Vector3()), ray = new THREE.Raycaster(), meshes = [];
    castleRoot.traverse(object => { if (object.isMesh && object.visible !== false && !object.userData?.hiddenAsOutlier) meshes.push(object); });
    const minY=bounds.min.y+size.y*.43,maxY=bounds.min.y+size.y*.92,minSpacingSq=1.22*1.22;
    const addHit=(hit,outward)=>{if(!hit||anchors.length>=limit)return;const normal=hit.face?.normal?hit.face.normal.clone().transformDirection(hit.object.matrixWorld):outward.clone();if(normal.dot(outward)<0)normal.negate();if(Math.abs(normal.y)>.75)return;normal.y=THREE.MathUtils.clamp(normal.y,-.16,.24);normal.normalize();const position=hit.point.clone().addScaledVector(normal,.12);if(anchors.some(a=>a.position.distanceToSquared(position)<minSpacingSq))return;anchors.push({position,normal});};
    const cast=(origin,direction,outward)=>{ray.set(origin,direction);ray.near=0;ray.far=Math.max(size.x,size.z)*2.8;const hit=ray.intersectObjects(meshes,false).find(c=>c.point.y>=minY&&c.point.y<=maxY);if(hit)addHit(hit,outward);};
    const xSamples=18,ySamples=7,zSamples=11,frontZ=bounds.max.z+Math.max(8,size.z*.45);
    for(let yi=0;yi<ySamples&&anchors.length<limit;yi++){const y=THREE.MathUtils.lerp(minY,maxY,yi/Math.max(1,ySamples-1));for(let xi=0;xi<xSamples&&anchors.length<limit;xi++){const x=THREE.MathUtils.lerp(bounds.min.x+size.x*.05,bounds.max.x-size.x*.05,xi/Math.max(1,xSamples-1));cast(new THREE.Vector3(x,y,frontZ),new THREE.Vector3(0,0,-1),new THREE.Vector3(0,0,1));}}
    for(const side of [-1,1]){const x=side<0?bounds.min.x-Math.max(8,size.x*.35):bounds.max.x+Math.max(8,size.x*.35),direction=new THREE.Vector3(-side,0,0),outward=new THREE.Vector3(side,0,0);for(let yi=0;yi<ySamples&&anchors.length<limit;yi++){const y=THREE.MathUtils.lerp(minY,maxY,yi/Math.max(1,ySamples-1));for(let zi=0;zi<zSamples&&anchors.length<limit;zi++){const z=THREE.MathUtils.lerp(bounds.min.z+size.z*.08,bounds.max.z-size.z*.08,zi/Math.max(1,zSamples-1));cast(new THREE.Vector3(x,y,z),direction,outward);}}}
    const minimumUseful=Math.min(limit,12);if(anchors.length<minimumUseful){const rows=3,cols=Math.max(4,Math.min(10,Math.ceil(limit/rows)));for(let row=0;row<rows&&anchors.length<limit;row++){const y=THREE.MathUtils.lerp(bounds.min.y+size.y*.56,bounds.min.y+size.y*.82,row/Math.max(1,rows-1));for(let col=0;col<cols&&anchors.length<limit;col++){const x=THREE.MathUtils.lerp(bounds.min.x+size.x*.16,bounds.max.x-size.x*.16,col/Math.max(1,cols-1));anchors.push({position:new THREE.Vector3(x,y,bounds.max.z+.16),normal:new THREE.Vector3(0,0,1)});}}document.body.dataset.surfaceAnchorFallback='front-rampart-grid';}
    document.body.dataset.surfaceAnchorMode='direct-raycast-all-decks-v42';document.body.dataset.surfaceAnchorCount=String(anchors.length);return anchors.slice(0,limit);
  }

  // Cards are usable as soon as their environment is ready.  The gatekeeper
  // must never be able to hold card discovery behind its own load timeout.
  function exteriorStageReady(){return document.body.dataset.exteriorEnvironment==='ready';}
  function scheduleRenderRetry(){if(retryTimer)return;retryTimer=setTimeout(()=>{retryTimer=0;renderWhenReady();},100);}
  function renderWhenReady(){if(!pendingCards)return;if(!exteriorStageReady()){document.body.dataset.directCardsStage='waiting-for-environment';if(stagingAttempts++<1200)scheduleRenderRetry();return;}const THREE=window.THREE,runtime=window.__castleSearchRuntime;if(!THREE||!runtime?.scene||!runtime?.renderer||!runtime?.camera||!runtime?.castleRoot){if(installAttempts++<240)scheduleRenderRetry();return;}document.body.dataset.directCardsStage='environment-ready-textures';const payload=pendingCards;pendingCards=null;stagingAttempts=installAttempts=0;renderCards(THREE,runtime,payload);}

  function renderCards(THREE,runtime,payload){
    let group=runtime.scene.getObjectByName('castle-direct-card-previews');if(!group){group=new THREE.Group();group.name='castle-direct-card-previews';runtime.scene.add(group);installInteractions(THREE,runtime,group);}
    while(group.children.length){const child=group.children[0];group.remove(child);child.geometry?.dispose?.();child.material?.map?.dispose?.();child.material?.dispose?.();}
    for(const child of runtime.scene.children){if(child===group||!child?.isGroup)continue;if(child.children?.some(item=>item?.userData?.card))child.visible=false;}
    const cards=payload.cards||[],anchors=deriveAnchors(THREE,runtime.castleRoot,cards.length),loader=new THREE.TextureLoader();
    const isIOS=/iP(?:hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),isAndroid=/Android/i.test(navigator.userAgent),concurrency=isIOS?1:(isAndroid?2:(/Windows/i.test(navigator.userAgent)?5:4));document.body.dataset.directCardTextureConcurrency=String(concurrency);
    const queue=[];let active=0,loadedCount=0,failedCount=0;
    const orient=(mesh,normal)=>{const up=Math.abs(normal.y)>.9?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0),right=new THREE.Vector3().crossVectors(up,normal).normalize(),correctedUp=new THREE.Vector3().crossVectors(normal,right).normalize();mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,correctedUp,normal));};
    const pump=()=>{while(active<concurrency&&queue.length){const job=queue.shift();if(!job.mesh.parent)continue;const url=job.urls[job.urlIndex];if(!url){failedCount++;document.body.dataset.directCardTextureFailures=String(failedCount);continue;}active++;loader.load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(runtime.renderer.capabilities.getMaxAnisotropy(),4);if(job.mesh.parent){const old=job.mesh.material;job.mesh.material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false});old.dispose();loadedCount++;document.body.dataset.directCardTextureLoaded=String(loadedCount);}active--;pump();},undefined,()=>{active--;if(!job.mesh.parent){pump();return;}if(job.urlIndex+1<job.urls.length){job.urlIndex++;queue.push(job);}else if(job.retries<2){job.retries++;job.urlIndex=0;setTimeout(()=>{if(job.mesh.parent){queue.push(job);pump();}},260*job.retries);}else{failedCount++;job.mesh.material.color.setHex(0x2b1c15);document.body.dataset.directCardTextureFailures=String(failedCount);}pump();});}};
    cards.slice(0,anchors.length).forEach((card,index)=>{const anchor=anchors[index],geometry=new THREE.PlaneGeometry(1.12,1.68),material=new THREE.MeshBasicMaterial({color:0x1b1713,side:THREE.DoubleSide,toneMapped:false}),mesh=new THREE.Mesh(geometry,material);mesh.userData.card=card;mesh.position.copy(anchor.position);mesh.scale.setScalar(1.48+(index%5)*.035);orient(mesh,anchor.normal);mesh.renderOrder=5;group.add(mesh);const urls=textureCandidates(card);if(urls.length)queue.push({mesh,urls,urlIndex:0,retries:0});});
    group.visible=document.body.dataset.sceneMode==='exterior';document.body.dataset.directCardPreviewCount=String(group.children.length);document.body.dataset.directCardPreviewMode='all-decks-rampart-textures-v42';document.body.dataset.directCardTextureLoaded='0';document.body.dataset.directCardTextureFailures='0';pump();
    if(!group.userData.sceneObserver){const syncVisibility=()=>{group.visible=document.body.dataset.sceneMode==='exterior';};group.userData.sceneObserver=new MutationObserver(syncVisibility);group.userData.sceneObserver.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode']});}
  }

  function installInteractions(THREE,runtime,group){
    const canvas=runtime.renderer.domElement,raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),LONG_PRESS_MS=600;let down=null,longPressTimer=0;
    const hitCard=event=>{const rect=canvas.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/Math.max(1,rect.width))*2-1;pointer.y=-((event.clientY-rect.top)/Math.max(1,rect.height))*2+1;raycaster.setFromCamera(pointer,runtime.camera);return raycaster.intersectObjects(group.children,false)[0]?.object||null;};
    const cancelLongPress=()=>{if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=0;}};
    canvas.addEventListener('pointerdown',event=>{const mesh=hitCard(event);if(!mesh)return;down={id:event.pointerId,x:event.clientX,y:event.clientY,mesh,longPressed:false};longPressTimer=setTimeout(()=>{if(!down||down.id!==event.pointerId)return;down.longPressed=true;parent.postMessage(JSON.stringify({type:'cardLongPressed',cardId:mesh.userData.card.id}),location.origin);},LONG_PRESS_MS);},true);
    canvas.addEventListener('pointermove',event=>{if(!down||down.id!==event.pointerId)return;if(Math.hypot(event.clientX-down.x,event.clientY-down.y)>12){cancelLongPress();down=null;}},true);
    const release=event=>{if(!down||down.id!==event.pointerId)return;const current=down;cancelLongPress();down=null;if(hitCard(event)===current.mesh){event.preventDefault();event.stopPropagation();if(!current.longPressed)parent.postMessage(JSON.stringify({type:'cardSelected',cardId:current.mesh.userData.card.id}),location.origin);}};
    canvas.addEventListener('pointerup',release,true);canvas.addEventListener('pointercancel',()=>{cancelLongPress();down=null;},true);
  }
  setTimeout(renderWhenReady,1000);
})();
