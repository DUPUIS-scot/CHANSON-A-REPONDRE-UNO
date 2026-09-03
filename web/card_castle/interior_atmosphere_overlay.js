// Substantive texture-reveal lighting for the castle interior.
if (!window.__castleInteriorAtmosphereInstalled) {
  window.__castleInteriorAtmosphereInstalled = true;
  const root = document.getElementById('scene');
  if (root) {
    const overlay = document.createElement('div');
    overlay.id = 'castle-interior-atmosphere';
    overlay.setAttribute('aria-hidden','true');
    overlay.style.cssText='position:absolute;inset:0;z-index:2;pointer-events:none;display:none;background:radial-gradient(ellipse at 50% 40%,rgba(220,238,255,.10),transparent 52%),linear-gradient(180deg,rgba(8,14,23,.01),rgba(3,7,13,.025))';
    root.appendChild(overlay);
    const style=document.createElement('style');
    style.textContent='body[data-scene-mode="interior"] #castle-interior-atmosphere{display:block}';
    document.head.appendChild(style);

    let attempts=0;
    const install=()=>{
      const THREE=window.THREE, runtime=window.__castleSearchRuntime;
      if(!THREE||!runtime?.scene||!runtime?.renderer){if(attempts++<180)setTimeout(install,100);return;}
      if(window.__castleInteriorLightingRig){window.__castleInteriorLightingRig.sync?.();return;}
      const scene=runtime.scene, renderer=runtime.renderer;
      const exteriorExposure=renderer.toneMappingExposure;
      const exteriorLights=scene.children.filter(o=>o?.isLight);
      const exteriorIntensities=new Map(exteriorLights.map(l=>[l,l.intensity]));
      renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping;
      const rig=new THREE.Group(); rig.name='castle-interior-texture-reveal-v8'; rig.visible=false; scene.add(rig);
      const target=(light,x,y,z)=>{const t=new THREE.Object3D();t.position.set(x,y,z);rig.add(t);light.target=t;rig.add(light);return light;};
      rig.add(new THREE.AmbientLight(0x8aa2b8,1.18));
      rig.add(new THREE.HemisphereLight(0xc5d9ea,0x39291e,1.35));
      const key=target(new THREE.DirectionalLight(0xd9ecff,3.25),0,6,-2); key.position.set(-12,14,-10);
      const cross=target(new THREE.DirectionalLight(0xffd7b0,1.55),0,5,-2); cross.position.set(11,9,7);
      const throne=target(new THREE.SpotLight(0xf2f8ff,58,52,Math.PI/5.8,.72,1.25),0,7.5,-7); throne.position.set(-3,17,9);
      const stair=target(new THREE.SpotLight(0xb9ddff,34,42,Math.PI/5.2,.72,1.3),-6,4,-1); stair.position.set(-10,11,8);
      const jester=target(new THREE.SpotLight(0xffddb8,31,32,Math.PI/6,.76,1.4),0,7,-6); jester.position.set(5,11,2);
      [[-8,4,.5,0xffa866,25],[8,4,.2,0xff9a62,23],[-3,3,-7,0x8fc8ee,14],[5,3,-6,0x9fd6f5,13]].forEach(([x,y,z,c,i])=>{const l=new THREE.PointLight(c,i,18,2);l.position.set(x,y,z);rig.add(l);});
      [key,throne,stair].forEach(l=>{l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.camera.near=.8;l.shadow.camera.far=72;l.shadow.bias=-.0003;});
      const sync=()=>{const on=document.body.dataset.sceneMode==='interior';rig.visible=on;exteriorLights.forEach(l=>l.intensity=on?0:(exteriorIntensities.get(l)??l.intensity));renderer.toneMappingExposure=on?2.12:exteriorExposure;if(on){scene.fog=new THREE.FogExp2(0x111b24,.00145);renderer.domElement.style.filter='contrast(.98) saturate(1.04) brightness(1.08)';document.body.dataset.interiorLighting='substantive-texture-reveal-v8';}else{renderer.domElement.style.filter='';delete document.body.dataset.interiorLighting;}};
      window.__castleInteriorLightingRig={group:rig,sync};
      new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-scene-mode']}); sync();
    };
    install();
  }
}
