// Readable Gothic atmosphere and lighting layer for the castle interior.
if (!window.__castleInteriorAtmosphereInstalled) {
  window.__castleInteriorAtmosphereInstalled = true;

  const root = document.getElementById('scene');
  if (root) {
    const style = document.createElement('style');
    style.id = 'castle-interior-atmosphere-style';
    style.textContent = `
      #castle-interior-atmosphere {
        position:absolute; inset:0; z-index:2; pointer-events:none;
        display:none; opacity:0; overflow:hidden;
        transition:opacity .7s ease;
        background:
          radial-gradient(ellipse at 50% 42%, rgba(210,232,255,.16), transparent 46%),
          radial-gradient(ellipse at 18% 48%, rgba(255,176,104,.08), transparent 32%),
          radial-gradient(ellipse at 82% 46%, rgba(178,211,242,.11), transparent 35%),
          linear-gradient(180deg, rgba(8,14,23,.02), rgba(3,7,13,.035));
        box-shadow:inset 0 0 min(14vw,150px) rgba(0,0,0,.10), inset 0 -10vh 14vh rgba(0,0,0,.04);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before {
        content:""; position:absolute; inset:-16%;
        background:
          linear-gradient(112deg, transparent 6%, rgba(214,237,255,.17) 19%, transparent 36%),
          linear-gradient(72deg, transparent 52%, rgba(178,214,245,.10) 64%, transparent 76%);
        filter:blur(12px);
        animation:castle-moon-breathe 12s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        content:""; position:absolute; left:-10%; right:-10%; bottom:-8%; height:38%;
        background:radial-gradient(ellipse at 50% 72%, rgba(158,181,200,.08), transparent 66%);
        filter:blur(20px);
        animation:castle-mist-drift 24s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:12vw; height:16vh; max-width:160px; max-height:190px;
        border-radius:50%; filter:blur(18px); opacity:.12; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,225,174,.78) 0 10%, rgba(255,139,65,.34) 30%, transparent 72%);
        animation:castle-fire-flicker 3s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:47%; animation-delay:-.6s; }
      .castle-interior-fire.right { right:12%; top:45%; animation-delay:-1.4s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:39%; width:40vw; height:54vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(211,232,255,.13), transparent 70%);
        filter:blur(10px); opacity:.78;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.10; transform:scale(.98); }
        33% { opacity:.15; transform:scale(1.02) translateY(-2px); }
        67% { opacity:.12; transform:scale(1); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-1%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.72; } to { opacity:.92; } }
      @media (prefers-reduced-motion:reduce) {
        #castle-interior-atmosphere::before,#castle-interior-atmosphere::after,.castle-interior-fire { animation:none; }
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'castle-interior-atmosphere';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<span class="castle-interior-fire left"></span><span class="castle-interior-fire right"></span><span class="castle-interior-focus"></span>';
    root.appendChild(overlay);

    let syncThreeLighting = () => {};
    let lightingAttempts = 0;

    const installThreeLighting = () => {
      const THREE = window.THREE;
      const runtime = window.__castleSearchRuntime;
      if (!THREE || !runtime?.scene || !runtime?.renderer) {
        if (lightingAttempts++ < 120) setTimeout(installThreeLighting, 100);
        return;
      }
      if (window.__castleInteriorLightingRig) {
        syncThreeLighting = window.__castleInteriorLightingRig.sync;
        syncThreeLighting();
        return;
      }

      const scene = runtime.scene;
      const renderer = runtime.renderer;
      const exteriorExposure = renderer.toneMappingExposure;
      const exteriorLights = scene.children.filter(object => object?.isLight);
      const exteriorIntensities = new Map(exteriorLights.map(light => [light, light.intensity]));

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      const rig = new THREE.Group();
      rig.name = 'castle-interior-readable-gothic-v7';
      rig.visible = false;
      scene.add(rig);

      const add = light => { rig.add(light); return light; };
      const addTargeted = (light, targetPosition) => {
        const target = new THREE.Object3D();
        target.position.copy(targetPosition);
        rig.add(target);
        light.target = target;
        rig.add(light);
        return light;
      };

      add(new THREE.AmbientLight(0x607b94, 0.82));
      add(new THREE.HemisphereLight(0xa8c3dc, 0x241a13, 1.05));

      const moonKey = new THREE.DirectionalLight(0xc6e0ff, 2.65);
      moonKey.position.set(-11, 10, -12);
      addTargeted(moonKey, new THREE.Vector3(0, 6.0, -2));

      const throneSpot = new THREE.SpotLight(0xeaf4ff, 48, 48, Math.PI / 6.6, 0.82, 1.35);
      throneSpot.position.set(-3.5, 16, 8);
      addTargeted(throneSpot, new THREE.Vector3(0, 8.2, -7));

      const leftTorch = new THREE.PointLight(0xffa866, 22, 17, 2);
      leftTorch.position.set(-8, 4.4, 0.5);
      add(leftTorch);
      const rightTorch = new THREE.PointLight(0xe98458, 20, 17, 2);
      rightTorch.position.set(8, 4.0, 0.2);
      add(rightTorch);

      const rim = new THREE.SpotLight(0xaed8f7, 25, 38, Math.PI / 6.2, 0.78, 1.45);
      rim.position.set(5, 12, -14);
      addTargeted(rim, new THREE.Vector3(0, 7.3, -6));

      [moonKey, throneSpot].forEach(light => {
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.near = 0.8;
        light.shadow.camera.far = 72;
        light.shadow.bias = -0.00035;
      });

      syncThreeLighting = () => {
        const interior = document.body.dataset.sceneMode === 'interior';
        rig.visible = interior;
        exteriorLights.forEach(light => {
          light.intensity = interior ? 0 : (exteriorIntensities.get(light) ?? light.intensity);
        });

        renderer.toneMappingExposure = interior ? 1.92 : exteriorExposure;
        if (interior) {
          scene.fog = new THREE.FogExp2(0x101b26, 0.0021);
          const canvas = renderer.domElement;
          if (canvas) canvas.style.filter = 'contrast(.96) saturate(.94) brightness(1.10)';
          document.body.dataset.interiorLighting = 'bright-readable-gothic-v7';
          document.body.dataset.interiorFog = 'light-blue-exp2-v7';
        } else {
          const canvas = renderer.domElement;
          if (canvas) canvas.style.filter = '';
          delete document.body.dataset.interiorLighting;
          delete document.body.dataset.interiorFog;
        }
      };

      window.__castleInteriorLightingRig = { group:rig, sync:syncThreeLighting };
      syncThreeLighting();
    };

    const syncInteriorAtmosphere = () => {
      syncThreeLighting();
      if (document.body.dataset.sceneMode === 'interior') {
        document.body.dataset.interiorAtmosphere = 'bright-readable-gothic-moon-fog-v7';
      } else {
        delete document.body.dataset.interiorAtmosphere;
      }
    };

    const observer = new MutationObserver(syncInteriorAtmosphere);
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    installThreeLighting();
    syncInteriorAtmosphere();
    document.body.dataset.interiorAtmosphereLayer = 'ready-bright-readable-gothic-v7';
  }
}
