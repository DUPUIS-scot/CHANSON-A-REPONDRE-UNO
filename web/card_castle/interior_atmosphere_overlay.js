// Theatrical atmosphere and lighting layer for the Castle interior.
// Keeps the exterior rig untouched while giving the interior a dedicated
// bright gothic stage treatment: readable architecture first, then selective
// moonlight, firelight and focal accents.
if (!window.__castleInteriorAtmosphereInstalled) {
  window.__castleInteriorAtmosphereInstalled = true;

  const root = document.getElementById('scene');
  if (root) {
    const style = document.createElement('style');
    style.id = 'castle-interior-atmosphere-style';
    style.textContent = `
      #castle-interior-atmosphere {
        position:absolute; inset:0; z-index:2; pointer-events:none;
        display:none; overflow:hidden; opacity:0;
        transition:opacity 1.1s ease;
        background:
          radial-gradient(ellipse at 50% 62%, rgba(255,172,80,.07) 0 8%, transparent 31%),
          radial-gradient(ellipse at 18% 38%, rgba(120,174,220,.12) 0 11%, transparent 38%),
          radial-gradient(ellipse at 82% 34%, rgba(94,146,194,.09) 0 9%, transparent 35%),
          linear-gradient(180deg, rgba(1,4,9,.025), rgba(0,0,0,.08));
        box-shadow:
          inset 0 0 min(17vw,190px) rgba(0,0,0,.32),
          inset 0 -13vh 17vh rgba(0,0,0,.14),
          inset 0 8vh 12vh rgba(0,0,0,.055);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before,
      #castle-interior-atmosphere::after { content:""; position:absolute; inset:-15%; pointer-events:none; }
      #castle-interior-atmosphere::before {
        background:
          linear-gradient(111deg, transparent 7%, rgba(172,215,248,.105) 18%, transparent 31%),
          linear-gradient(74deg, transparent 50%, rgba(143,188,226,.07) 61%, transparent 72%);
        filter:blur(10px); opacity:.72;
        animation:castle-moon-breathe 9s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        inset:auto -10% -8% -10%; height:46%;
        background:
          radial-gradient(ellipse at 20% 70%, rgba(170,195,205,.07), transparent 43%),
          radial-gradient(ellipse at 72% 60%, rgba(150,178,191,.055), transparent 46%),
          linear-gradient(180deg, transparent, rgba(125,151,164,.035));
        filter:blur(18px);
        animation:castle-mist-drift 20s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:15vw; height:21vh; max-width:205px; max-height:250px;
        border-radius:50%; filter:blur(18px); opacity:.13; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,210,118,.78) 0 9%, rgba(255,123,37,.34) 30%, transparent 72%);
        animation:castle-fire-flicker 3s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:46%; animation-delay:-.7s; }
      .castle-interior-fire.right { right:12%; top:44%; animation-delay:-1.6s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:43%; width:36vw; height:48vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(255,190,106,.075) 0 14%, transparent 66%);
        filter:blur(9px); opacity:.72;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.10; transform:scale(.96) translateY(1px); }
        30% { opacity:.16; transform:scale(1.04) translateY(-2px); }
        55% { opacity:.12; transform:scale(.99) translateY(1px); }
        78% { opacity:.18; transform:scale(1.06) translateY(-3px); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-2%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.62; } to { opacity:.82; } }
      @media (prefers-reduced-motion:reduce) {
        #castle-interior-atmosphere::before,#castle-interior-atmosphere::after,.castle-interior-fire { animation:none; }
      }
      @media (max-width:700px) {
        #castle-interior-atmosphere {
          background:
            radial-gradient(ellipse at 50% 62%, rgba(255,172,80,.08) 0 9%, transparent 33%),
            radial-gradient(ellipse at 18% 38%, rgba(120,174,220,.13) 0 12%, transparent 40%),
            radial-gradient(ellipse at 82% 34%, rgba(94,146,194,.10) 0 10%, transparent 37%),
            linear-gradient(180deg, transparent, rgba(0,0,0,.035));
          box-shadow:inset 0 0 70px rgba(0,0,0,.22), inset 0 -10vh 14vh rgba(0,0,0,.08);
        }
        .castle-interior-fire { width:30vw; height:20vh; }
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'castle-interior-atmosphere';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<span class="castle-interior-fire left"></span><span class="castle-interior-fire right"></span><span class="castle-interior-focus"></span>';
    root.appendChild(overlay);

    const gradeCanvas = active => {
      const canvas = root.querySelector('canvas');
      if (!canvas) return;
      canvas.style.transition = 'filter .75s ease';
      canvas.style.filter = active
        ? 'contrast(1.04) saturate(.97) brightness(1.18)'
        : '';
    };

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

      const rig = new THREE.Group();
      rig.name = 'castle-interior-gothic-lighting';
      rig.visible = false;
      scene.add(rig);

      const add = light => {
        rig.add(light);
        return light;
      };
      const addTargeted = (light, targetPosition) => {
        const target = new THREE.Object3D();
        target.position.copy(targetPosition);
        rig.add(target);
        light.target = target;
        rig.add(light);
        return light;
      };

      // Readable architectural foundation. This is intentionally much brighter
      // than v1 so mobile users can see stone, stairs and the central hall while
      // directional keys still preserve gothic depth.
      add(new THREE.AmbientLight(0x526b82, 0.58));
      add(new THREE.HemisphereLight(0xa8c4dc, 0x2b1710, 0.78));

      // Broad cool frontal fill: guarantees the nave and staircase remain
      // readable even on the iOS profile where dynamic shadows are disabled.
      const architecturalFill = new THREE.DirectionalLight(0x9fc9ed, 2.65);
      architecturalFill.position.set(2, 20, 22);
      addTargeted(architecturalFill, new THREE.Vector3(0, 6.8, -3.2));

      // Silver-blue moonlight remains the dominant theatrical key.
      const moon = new THREE.SpotLight(0xb4dcff, 176, 66, Math.PI / 6.8, 0.68, 1.35);
      moon.position.set(-13, 27, 9);
      addTargeted(moon, new THREE.Vector3(1, 8.3, -4.2));

      // Warm throne/jester key, balanced by a colder rear rim.
      const throneKey = new THREE.SpotLight(0xffb968, 122, 40, Math.PI / 7.6, 0.70, 1.45);
      throneKey.position.set(5, 19, 4);
      addTargeted(throneKey, new THREE.Vector3(0, 9.2, -7.2));

      const throneRim = new THREE.SpotLight(0x8dc9fa, 76, 36, Math.PI / 6.5, 0.68, 1.45);
      throneRim.position.set(-7, 14, -15);
      addTargeted(throneRim, new THREE.Vector3(0, 8.5, -7));

      // Dedicated warm museum light for the DUPUIS* construction panel.
      const panelLight = new THREE.SpotLight(0xffcd82, 78, 30, Math.PI / 6.7, 0.70, 1.50);
      panelLight.position.set(-2, 13, 10);
      addTargeted(panelLight, new THREE.Vector3(0, 4.8, 3.8));

      // Stronger but still local amber torch pools.
      [
        [-8, 5.2, -1.2, 48, 15],
        [8, 5.2, -1.2, 48, 15],
        [-10.5, 4.2, 6.0, 40, 14],
        [10.5, 4.2, 6.0, 40, 14],
      ].forEach(([x, y, z, intensity, distance]) => {
        const fire = new THREE.PointLight(0xffa451, intensity, distance, 1.85);
        fire.position.set(x, y, z);
        add(fire);
      });

      // Selective shadows only on capable desktop/high-quality profiles.
      if (renderer.shadowMap.enabled) {
        [moon, throneKey].forEach(light => {
          light.castShadow = true;
          light.shadow.mapSize.set(1024, 1024);
          light.shadow.camera.near = 1;
          light.shadow.camera.far = 66;
          light.shadow.bias = -0.00035;
        });
      }

      syncThreeLighting = () => {
        const interior = document.body.dataset.sceneMode === 'interior';
        rig.visible = interior;
        exteriorLights.forEach(light => {
          light.intensity = interior ? 0 : (exteriorIntensities.get(light) ?? light.intensity);
        });
        renderer.toneMappingExposure = interior ? 2.22 : exteriorExposure;
        if (interior) {
          // The direct environment uses a very dense black fog indoors. Ease it
          // substantially so the far staircase and throne stay visible.
          scene.fog = new THREE.FogExp2(0x07111c, 0.0065);
          document.body.dataset.interiorLighting = 'bright-scottish-gothic-stage-v2';
          document.body.dataset.interiorLightingShadows = renderer.shadowMap.enabled
            ? 'selective-moon-throne'
            : 'disabled-performance-profile';
        } else {
          delete document.body.dataset.interiorLighting;
          delete document.body.dataset.interiorLightingShadows;
        }
      };

      window.__castleInteriorLightingRig = {group:rig, sync:syncThreeLighting};
      syncThreeLighting();
    };

    const syncInteriorAtmosphere = () => {
      const interior = document.body.dataset.sceneMode === 'interior';
      gradeCanvas(interior);
      syncThreeLighting();
      if (interior) {
        document.body.dataset.interiorAtmosphere = 'bright-gothic-moonlight-firelight-mist-v3';
      } else {
        delete document.body.dataset.interiorAtmosphere;
      }
    };

    const observer = new MutationObserver(syncInteriorAtmosphere);
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    installThreeLighting();
    syncInteriorAtmosphere();
    document.body.dataset.interiorAtmosphereLayer = 'ready-bright-gothic-three-lighting-v3';
  }
}
