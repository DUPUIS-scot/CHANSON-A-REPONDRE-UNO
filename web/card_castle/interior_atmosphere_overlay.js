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
          radial-gradient(ellipse at 50% 42%, rgba(190,218,255,.10), transparent 42%),
          radial-gradient(ellipse at 18% 48%, rgba(255,158,82,.05), transparent 30%),
          radial-gradient(ellipse at 82% 46%, rgba(155,191,230,.07), transparent 32%),
          linear-gradient(180deg, rgba(3,7,14,.04), rgba(1,3,8,.08));
        box-shadow:inset 0 0 min(14vw,150px) rgba(0,0,0,.20), inset 0 -10vh 14vh rgba(0,0,0,.10);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before {
        content:""; position:absolute; inset:-16%;
        background:
          linear-gradient(112deg, transparent 6%, rgba(198,227,255,.11) 19%, transparent 33%),
          linear-gradient(72deg, transparent 54%, rgba(155,195,232,.06) 63%, transparent 74%);
        filter:blur(12px);
        animation:castle-moon-breathe 12s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        content:""; position:absolute; left:-10%; right:-10%; bottom:-8%; height:38%;
        background:radial-gradient(ellipse at 50% 72%, rgba(138,160,178,.06), transparent 64%);
        filter:blur(20px);
        animation:castle-mist-drift 24s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:12vw; height:16vh; max-width:160px; max-height:190px;
        border-radius:50%; filter:blur(18px); opacity:.08; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,220,160,.68) 0 10%, rgba(255,124,52,.26) 30%, transparent 72%);
        animation:castle-fire-flicker 3s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:47%; animation-delay:-.6s; }
      .castle-interior-fire.right { right:12%; top:45%; animation-delay:-1.4s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:39%; width:34vw; height:48vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(196,223,255,.08), transparent 68%);
        filter:blur(10px); opacity:.66;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.07; transform:scale(.98); }
        33% { opacity:.10; transform:scale(1.02) translateY(-2px); }
        67% { opacity:.08; transform:scale(1); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-1%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.66; } to { opacity:.84; } }
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
      rig.name = 'castle-interior-readable-gothic-v6';
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

      // Stronger cool base so stone, timber and stairs remain readable.
      add(new THREE.AmbientLight(0x516579, 0.42));
      add(new THREE.HemisphereLight(0x8da8c4, 0x17110d, 0.58));

      const moonKey = new THREE.DirectionalLight(0xb8d6ff, 1.55);
      moonKey.position.set(-11, 10, -12);
      addTargeted(moonKey, new THREE.Vector3(0, 6.0, -2));

      const throneSpot = new THREE.SpotLight(0xe2efff, 30, 44, Math.PI / 7.2, 0.84, 1.45);
      throneSpot.position.set(-3.5, 16, 8);
      addTargeted(throneSpot, new THREE.Vector3(0, 8.2, -7));

      const leftTorch = new THREE.PointLight(0xff9a55, 14, 14, 2);
      leftTorch.position.set(-8, 4.4, 0.5);
      add(leftTorch);
      const rightTorch = new THREE.PointLight(0xd86f46, 12, 14, 2);
      rightTorch.position.set(8, 4.0, 0.2);
      add(rightTorch);

      const rim = new THREE.SpotLight(0x96c7ef, 16, 32, Math.PI / 6.5, 0.80, 1.55);
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

        renderer.toneMappingExposure = interior ? 1.40 : exteriorExposure;
        if (interior) {
          scene.fog = new THREE.FogExp2(0x0b1520, 0.0034);
          const canvas = renderer.domElement;
          if (canvas) canvas.style.filter = 'contrast(1.02) saturate(.95)';
          document.body.dataset.interiorLighting = 'readable-gothic-v6';
          document.body.dataset.interiorFog = 'soft-blue-exp2-v6';
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
        document.body.dataset.interiorAtmosphere = 'readable-gothic-moon-fog-v6';
      } else {
        delete document.body.dataset.interiorAtmosphere;
      }
    };

    const observer = new MutationObserver(syncInteriorAtmosphere);
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    installThreeLighting();
    syncInteriorAtmosphere();
    document.body.dataset.interiorAtmosphereLayer = 'ready-readable-gothic-v6';
  }
}
