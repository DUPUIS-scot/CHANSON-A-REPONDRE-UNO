(()=>{
  'use strict';
  const VERSION='v2',STORE='doubleJesterPortalSpinnerSizeV1',RATE=.82;
  const MODEL_URL='/assets/assets/models/laboratory_portal_mirror.glb?v=20260828-v1';

  async function mountMirror(shield,panel,inner){
    const platter=shield.querySelector('.djs-platter');
    if(!platter||platter.dataset.mirrorGlb===VERSION)return;
    platter.dataset.mirrorGlb=VERSION;
    platter.setAttribute('aria-hidden','true');
    const canvas=document.createElement('canvas');
    canvas.className='djs-mirror-canvas';
    platter.replaceChildren(canvas);
    try{
      const [THREE,{GLTFLoader}]=await Promise.all([import('/vendor/three.module.js'),import('/vendor/GLTFLoader.js')]);
      if(!platter.isConnected)return;
      const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
      renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(26,1,.1,30);camera.position.set(0,0,6.2);
      scene.add(new THREE.HemisphereLight(0xd8f7ff,0x130b05,2.25));
      const key=new THREE.DirectionalLight(0xffc86f,3.1);key.position.set(3,4,5);scene.add(key);
      const rim=new THREE.DirectionalLight(0x24ddff,2.4);rim.position.set(-4,1,2);scene.add(rim);
      const gltf=await new GLTFLoader().loadAsync(MODEL_URL);
      if(!platter.isConnected){renderer.dispose();return}
      const mirror=gltf.scene;mirror.name='2JESTER laboratory portal mirror';mirror.rotation.set(0,0,0);
      mirror.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;if(object.material){object.material.side=THREE.DoubleSide;object.material.needsUpdate=true}}});
      const bounds=new THREE.Box3().setFromObject(mirror),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=3.8/Math.max(size.x,size.y,.001);
      mirror.scale.multiplyScalar(scale);mirror.position.set(-center.x*scale,-center.y*scale,-center.z*scale);scene.add(mirror);
      let disposed=false,last=performance.now();
      const resize=()=>{const rect=platter.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()};
      const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(platter);resize();
      const render=now=>{if(disposed)return;const delta=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!panel.classList.contains('open'))mirror.rotation.y=(mirror.rotation.y+RATE*delta)%(Math.PI*2);renderer.render(scene,camera);requestAnimationFrame(render)};
      requestAnimationFrame(render);platter.dataset.mirrorReady='true';
      inner.defaultView.__enochDoubleJesterMirrorGlb={version:VERSION,url:MODEL_URL,mirror,renderer};
      inner.defaultView.addEventListener('pagehide',()=>{disposed=true;resizeObserver.disconnect();renderer.dispose()},{once:true});
    }catch(error){platter.dataset.mirrorError='true';console.warn('2JESTER mirror GLB unavailable',error)}
  }

  function install(host){
    try{
      const live=host?.contentDocument,deck=live?.getElementById('deck'),inner=deck?.contentDocument;
      const panel=document.getElementById('doubleDeckerSpecial'),shield=document.getElementById('doubleJeckerShield');
      if(!inner||!panel||!shield)return false;if(shield.dataset.portalSpinner===VERSION)return true;
      shield.dataset.portalSpinner=VERSION;panel.classList.add('jester-mirror-format');
      let style=document.getElementById('double-jester-portal-spinner-v1-style');style?.remove();style=document.createElement('style');style.id='double-jester-portal-spinner-v1-style';
      style.textContent=`
        #doubleJeckerShield{width:var(--j2-size,150px)!important;height:var(--j2-size,150px)!important;min-width:112px!important;min-height:112px!important;max-width:min(38vmin,360px)!important;max-height:min(38vmin,360px)!important;overflow:visible!important}
        #doubleJeckerShield .djs-platter{overflow:hidden!important;background:radial-gradient(circle,#10232b 0 42%,#030608 72%,#000 100%)!important;animation:none!important;transform:none!important}
        #doubleJeckerShield .djs-mirror-canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;pointer-events:none}
        #doubleJeckerShield.panel-open .djs-mirror-canvas{filter:saturate(.76) brightness(.78)}
        #doubleDeckerSpecial.jecker-radial.jester-mirror-format{background:radial-gradient(ellipse at 31% 21%,rgba(197,235,245,.19) 0 2%,transparent 8%),radial-gradient(ellipse at 69% 75%,rgba(51,123,147,.26) 0 5%,transparent 22%),radial-gradient(circle at 50% 50%,#132d38 0 22%,#071116 38%,#020608 63%,#151716 64%,#020405 74%,#010203 100%)!important;box-shadow:inset 0 0 0 2px #8bc4d1,inset 0 0 0 7px #10191d,inset 0 0 0 10px #b98939,inset 0 0 52px #000,0 18px 56px #000d!important}
        #doubleJeckerShield .djs-resize-handle{position:absolute;right:-4px;bottom:-4px;width:18px;height:18px;border:1px solid #f3b542;border-radius:50%;z-index:30;background:#061018;box-shadow:0 0 8px #28dcff,0 0 12px #ff9b24;cursor:nwse-resize;touch-action:none}
        #doubleJeckerShield .djs-resize-handle::before,#doubleJeckerShield .djs-resize-handle::after{content:'';position:absolute;background:#f3b542;opacity:.9}#doubleJeckerShield .djs-resize-handle::before{width:8px;height:1px;left:4px;top:8px}#doubleJeckerShield .djs-resize-handle::after{width:1px;height:8px;left:8px;top:4px}
        @media(max-width:720px){#doubleJeckerShield{width:var(--j2-size,112px)!important;height:var(--j2-size,112px)!important}}
      `;document.head.appendChild(style);void mountMirror(shield,panel,inner);
      const saved=Number.parseFloat(localStorage.getItem(STORE)||'');if(Number.isFinite(saved))shield.style.setProperty('--j2-size',`${Math.max(112,Math.min(360,saved))}px`);
      let handle=shield.querySelector('.djs-resize-handle');if(!handle){handle=document.createElement('i');handle.className='djs-resize-handle';handle.setAttribute('aria-hidden','true');shield.appendChild(handle)}
      let resize=null;const clamp=size=>Math.max(112,Math.min(Math.min(innerWidth,innerHeight)*.38,360,size));
      handle.addEventListener('pointerdown',event=>{event.preventDefault();event.stopImmediatePropagation();const rect=shield.getBoundingClientRect();resize={id:event.pointerId,x:event.clientX,y:event.clientY,size:rect.width};try{handle.setPointerCapture(event.pointerId)}catch(_){}});
      handle.addEventListener('pointermove',event=>{if(!resize||resize.id!==event.pointerId)return;event.preventDefault();event.stopImmediatePropagation();const size=clamp(resize.size+Math.max(event.clientX-resize.x,event.clientY-resize.y));shield.style.setProperty('--j2-size',`${size}px`)});
      const finish=event=>{if(!resize||resize.id!==event.pointerId)return;const size=shield.getBoundingClientRect().width;resize=null;try{localStorage.setItem(STORE,String(Math.round(size)));handle.releasePointerCapture(event.pointerId)}catch(_){}};
      handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
      const onResize=()=>{const size=shield.getBoundingClientRect().width;if(size>clamp(size))shield.style.setProperty('--j2-size',`${clamp(size)}px`)};window.addEventListener('resize',onResize);
      inner.defaultView.__enochDoubleJesterPortalSpinner={version:VERSION,rate:RATE,secondsPerTurn:Math.PI*2/RATE,modelUrl:MODEL_URL,shield};return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJesterPortalSpinnerV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
  window.installEnochianDoubleJesterPortalSpinnerV1=window.installEnochianDoubleJesterPortalSpinnerV2;
})();
