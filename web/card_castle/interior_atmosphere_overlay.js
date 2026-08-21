// Gothic theatrical atmosphere and lighting layer for the castle interior.
// This preset is intentionally separate from the laboratory steampunk rig.
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
        transition:opacity .9s ease;
        background:
          radial-gradient(ellipse at 50% 44%, rgba(178,210,255,.08), transparent 38%),
          radial-gradient(ellipse at 18% 48%, rgba(255,145,62,.055), transparent 28%),
          radial-gradient(ellipse at 82% 46%, rgba(135,173,220,.065), transparent 30%),
          linear-gradient(180deg, rgba(3,7,14,.10), rgba(1,3,8,.20));
        box-shadow:inset 0 0 min(18vw,190px) rgba(0,0,0,.34), inset 0 -15vh 20vh rgba(0,0,0,.18);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before {
        content:""; position:absolute; inset:-18%;
        background:
          linear-gradient(112deg, transparent 5%, rgba(184,221,255,.12) 18%, transparent 31%),
          linear-gradient(72deg, transparent 52%, rgba(137,184,229,.07) 61%, transparent 72%);
        filter:blur(13px);
        animation:castle-moon-breathe 10s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        content:""; position:absolute; left:-12%; right:-12%; bottom:-8%; height:42%;
        background:radial-gradient(ellipse at 50% 70%, rgba(126,151,170,.08), transparent 62%);
        filter:blur(22px);
        animation:castle-mist-drift 22s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:13vw; height:18vh; max-width:180px; max-height:220px;
        border-radius:50%; filter:blur(20px); opacity:.10; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,214,142,.72) 0 10%, rgba(255,111,38,.30) 30%, transparent 72%);
        animation:castle-fire-flicker 2.8s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:47%; animation-delay:-.6s; }
      .castle-interior-fire.right { right:12%; top:45%; animation-delay:-1.4s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:39%; width:32vw; height:46vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(186,216,255,.07), transparent 66%);
        filter:blur(11px); opacity:.72;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.08; transform:scale(.97); }
        33% { opacity:.13; transform:scale(1.03) translateY(-2px); }
        67% { opacity:.10; transform:scale(.99); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-2%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.62; } to { opacity:.82; } }
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
      rig.name = 'castle-interior-gothic-theatrical-v5';
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

      // Dark, cold base: readable stone without flattening the hall.
      add(new THREE.AmbientLight(0x314052, 0.22));
      add(new THREE.HemisphereLight(0x6f88a6, 0x080708, 0.28));

      // Low off-axis pale blue key to carve arches, stairs and throne silhouette.
      const moonKey = new THREE.DirectionalLight(0xaecbff, 2.45);
      moonKey.position.set(-11, 7, -13);
      addTargeted(moonKey, new THREE.Vector3(0, 6.3, -3));

      // Narrow follow-spot on the throne/jester zone.
      const throneSpot = new THREE.SpotLight(0xdceaff, 64, 42, Math.PI / 8.5, 0.76, 1.35);
      throneSpot.position.set(-4, 17, 7);
      addTargeted(throneSpot, new THREE.Vector3(0, 8.7, -7));

      // Warm torch/candle contrast at architectural edges only.
      const leftTorch = new THREE.PointLight(0xff7d32, 28, 13, 2);
      leftTorch.position.set(-8, 4.4, 0.5);
      add(leftTorch);
      const rightTorch = new THREE.PointLight(0xb12b24, 20, 12, 2);
      rightTorch.position.set(8, 4.0, 0.2);
      add(rightTorch);

      // Cold rear rim separates figures from dark masonry.
      const rim = new THREE.SpotLight(0x88b9e8, 30, 30, Math.PI / 7.2, 0.72, 1.5);
      rim.position.set(5, 12, -14);
      addTargeted(rim, new THREE.Vector3(0, 7.6, -6));

      [moonKey, throneSpot].forEach(light => {
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.near = 0.8;
        light.shadow.camera.far = 72;
        light.shadow.bias = -0.0004;
      });

      syncThreeLighting = () => {
        const interior = document.body.dataset.sceneMode === 'interior';
        rig.visible = interior;
        exteriorLights.forEach(light => {
          light.intensity = interior ? 0 : (exteriorIntensities.get(light) ?? light.intensity);
        });

        renderer.toneMappingExposure = interior ? 0.70 : exteriorExposure;
        if (interior) {
          scene.fog = new THREE.FogExp2(0x050914, 0.0105);
          const canvas = renderer.domElement;
          if (canvas) canvas.style.filter = 'contrast(1.10) saturate(.84) brightness(.96)';
          document.body.dataset.interiorLighting = 'gothic-theatrical-v5';
          document.body.dataset.interiorFog = 'midnight-exp2-v5';
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
        document.body.dataset.interiorAtmosphere = 'gothic-theatrical-moon-fog-v5';
      } else {
        delete document.body.dataset.interiorAtmosphere;
      }
    };

    const observer = new MutationObserver(syncInteriorAtmosphere);
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    installThreeLighting();
    syncInteriorAtmosphere();
    document.body.dataset.interiorAtmosphereLayer = 'ready-gothic-theatrical-v5';
  }
}
