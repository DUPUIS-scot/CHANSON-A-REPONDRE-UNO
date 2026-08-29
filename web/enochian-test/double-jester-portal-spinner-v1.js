(()=>{
  'use strict';
  const VERSION='v4',STORE='doubleJesterPortalSpinnerSizeV1',RATE=.82;
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
      renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(26,1,.1,30);camera.position.set(0,0,6.2);
      scene.add(new THREE.HemisphereLight(0xd8f7ff,0x130b05,2.25));
      const key=new THREE.DirectionalLight(0xffc86f,3.1);key.position.set(3,4,5);scene.add(key);
      const rim=new THREE.DirectionalLight(0x24ddff,2.4);rim.position.set(-4,1,2);scene.add(rim);
      const faceFill=new THREE.PointLight(0xffdfac,3.2,12);faceFill.position.set(0,-1,4.8);scene.add(faceFill);
      const gltf=await new GLTFLoader().loadAsync(MODEL_URL);
      if(!platter.isConnected){renderer.dispose();return}
      const rig=new THREE.Group();rig.name='2J two-sided turntable';
      const mirror=gltf.scene;mirror.name='2J original laboratory mirror face';mirror.rotation.set(0,0,0);
      mirror.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;if(object.material){object.material.side=THREE.DoubleSide;object.material.needsUpdate=true}}});
      const bounds=new THREE.Box3().setFromObject(mirror),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=3.8/Math.max(size.x,size.y,.001);
      mirror.scale.multiplyScalar(scale);mirror.position.set(-center.x*scale,-center.y*scale,-center.z*scale);rig.add(mirror);
      const faceCanvas=document.createElement('canvas');faceCanvas.width=faceCanvas.height=512;
      const context=faceCanvas.getContext('2d'),gradient=context.createRadialGradient(205,160,20,256,256,250);
      gradient.addColorStop(0,'#17323d');gradient.addColorStop(.42,'#071319');gradient.addColorStop(.76,'#020507');gradient.addColorStop(1,'#000');
      context.fillStyle=gradient;context.fillRect(0,0,512,512);
      context.strokeStyle='#34e2f4';context.lineWidth=10;context.beginPath();context.arc(256,256,226,0,Math.PI*2);context.stroke();
      context.strokeStyle='#f2a33c';context.lineWidth=6;context.beginPath();context.arc(256,256,204,0,Math.PI*2);context.stroke();
      context.fillStyle='#061116';context.beginPath();context.arc(256,256,94,0,Math.PI*2);context.fill();context.strokeStyle='#efaa48';context.lineWidth=5;context.stroke();
      context.textAlign='center';context.fillStyle='#f4ae48';context.font='700 34px monospace';context.fillText('2J',256,245);
      context.fillStyle='#66efff';context.font='700 20px monospace';context.fillText('STEMS DOUBLE DECK',256,282);
      context.fillStyle='#d8edf1';context.font='700 17px monospace';context.fillText('MIX   STEM   JOG',256,352);
      const faceTexture=new THREE.CanvasTexture(faceCanvas);faceTexture.colorSpace=THREE.SRGBColorSpace;
      const deckFace=new THREE.Mesh(new THREE.CircleGeometry(1.72,96),new THREE.MeshStandardMaterial({name:'2J STEMS DOUBLE DECK face',map:faceTexture,metalness:.58,roughness:.34,side:THREE.FrontSide}));
      deckFace.name='2J STEMS DOUBLE DECK face';deckFace.rotation.y=Math.PI;deckFace.position.z=-.20;rig.add(deckFace);scene.add(rig);
      let disposed=false,last=performance.now();
      const resize=()=>{const rect=platter.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()};
      const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(platter);resize();
      let faceState='';
      const render=now=>{
        if(disposed)return;
        const delta=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
        const authority=inner.defaultView.__enochDoubleJesterAuthority||window.__enochDoubleJesterAuthority;
        const phase=authority?.phase||(panel.classList.contains('open')?'2jester-active':'2j-spinning');
        const open=phase==='2jester-active';
        shield.dataset.j2State=phase;
        if(!open)rig.rotation.y=(rig.rotation.y+RATE*delta)%(Math.PI*2);
        const deckActive=!open&&Math.cos(rig.rotation.y)<-.72;
        const nextFace=open?'paused':deckActive?'double-deck':'mirror';
        if(nextFace!==faceState){faceState=nextFace;shield.dataset.twoJFace=nextFace;shield.classList.toggle('djs-deck-face-active',deckActive)}
        renderer.render(scene,camera);requestAnimationFrame(render);
      };
      requestAnimationFrame(render);platter.dataset.mirrorReady='true';
      inner.defaultView.__enochDoubleJesterMirrorGlb={version:VERSION,url:MODEL_URL,rig,mirror,deckFace,renderer};
      inner.defaultView.addEventListener('pagehide',()=>{disposed=true;resizeObserver.disconnect();renderer.dispose()},{once:true});
    }catch(error){platter.dataset.mirrorError='true';console.warn('2J mirror GLB unavailable',error)}
  }

  function install(host){
    try{
      const live=host?.contentDocument,deck=live?.getElementById('deck'),inner=deck?.contentDocument;
      const panel=document.getElementById('doubleDeckerSpecial'),shield=document.getElementById('doubleJeckerShield');
      if(!inner||!panel||!shield)return false;if(shield.dataset.portalSpinner===VERSION)return true;
      shield.dataset.portalSpinner=VERSION;panel.classList.add('jester-mirror-format');
      shield.querySelectorAll('.djs-mode-strip').forEach(node=>node.remove());
      let style=document.getElementById('double-jester-portal-spinner-v1-style');style?.remove();style=document.createElement('style');style.id='double-jester-portal-spinner-v1-style';
      style.textContent=`
        #doubleJeckerShield{width:var(--j2-size,150px)!important;height:var(--j2-size,150px)!important;min-width:112px!important;min-height:112px!important;max-width:min(38vmin,360px)!important;max-height:min(38vmin,360px)!important;overflow:visible!important}
        #doubleJeckerShield .djs-platter{overflow:hidden!important;background:radial-gradient(circle,#10232b 0 42%,#030608 72%,#000 100%)!important;animation:none!important;transform:none!important}
        #doubleJeckerShield .djs-mirror-canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;pointer-events:none}
        #doubleJeckerShield[data-j2-state="2jester-active"] .djs-mirror-canvas{filter:saturate(.76) brightness(.78)}
        #doubleJeckerShield:not(.djs-deck-face-active) .djs-center{pointer-events:auto}
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
      inner.defaultView.__enochDoubleJesterPortalSpinner={version:VERSION,rate:RATE,secondsPerTurn:Math.PI*2/RATE,modelUrl:MODEL_URL,faces:['mirror','double-deck'],modeAuthority:'2J performance v6',stateAuthority:'2JESTER runtime authority v11',shield};return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJesterPortalSpinnerV4=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
  window.installEnochianDoubleJesterPortalSpinnerV3=window.installEnochianDoubleJesterPortalSpinnerV4;
  window.installEnochianDoubleJesterPortalSpinnerV2=window.installEnochianDoubleJesterPortalSpinnerV4;
  window.installEnochianDoubleJesterPortalSpinnerV1=window.installEnochianDoubleJesterPortalSpinnerV4;
})();
