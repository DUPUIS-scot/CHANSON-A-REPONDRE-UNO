// Theatrical atmosphere and lighting layer for the Castle interior.
// Keeps the exterior rig untouched while giving the interior a dedicated
// bright gothic stage treatment: clearly readable architecture first, then
// selective moonlight, firelight and focal accents.
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
          radial-gradient(ellipse at 50% 62%, rgba(255,178,88,.085) 0 9%, transparent 34%),
          radial-gradient(ellipse at 18% 38%, rgba(133,190,235,.14) 0 12%, transparent 41%),
          radial-gradient(ellipse at 82% 34%, rgba(106,161,209,.11) 0 10%, transparent 39%),
          linear-gradient(180deg, transparent, rgba(0,0,0,.035));
        box-shadow:
          inset 0 0 min(15vw,165px) rgba(0,0,0,.18),
          inset 0 -11vh 15vh rgba(0,0,0,.07),
          inset 0 7vh 10vh rgba(0,0,0,.025);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before,
      #castle-interior-atmosphere::after { content:""; position:absolute; inset:-15%; pointer-events:none; }
      #castle-interior-atmosphere::before {
        background:
          linear-gradient(111deg, transparent 6%, rgba(184,224,255,.13) 18%, transparent 32%),
          linear-gradient(74deg, transparent 49%, rgba(151,199,237,.09) 61%, transparent 73%);
        filter:blur(9px); opacity:.78;
        animation:castle-moon-breathe 9s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        inset:auto -10% -8% -10%; height:42%;
        background:
          radial-gradient(ellipse at 20% 70%, rgba(181,205,215,.06), transparent 44%),
          radial-gradient(ellipse at 72% 60%, rgba(159,188,201,.05), transparent 47%),
          linear-gradient(180deg, transparent, rgba(130,157,170,.025));
        filter:blur(17px);
        animation:castle-mist-drift 20s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:16vw; height:22vh; max-width:215px; max-height:260px;
        border-radius:50%; filter:blur(17px); opacity:.16; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,216,130,.84) 0 10%, rgba(255,130,42,.38) 31%, transparent 73%);
        animation:castle-fire-flicker 3s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:46%; animation-delay:-.7s; }
      .castle-interior-fire.right { right:12%; top:44%; animation-delay:-1.6s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:43%; width:40vw; height:52vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(255,197,118,.095) 0 15%, transparent 68%);
        filter:blur(8px); opacity:.78;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.13; transform:scale(.96) translateY(1px); }
        30% { opacity:.20; transform:scale(1.04) translateY(-2px); }
        55% { opacity:.15; transform:scale(.99) translateY(1px); }
        78% { opacity:.22; transform:scale(1.06) translateY(-3px); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-2%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.68; } to { opacity:.88; } }
      @media (prefers-reduced-motion:reduce) {
        #castle-interior-atmosphere::before,#castle-interior-atmosphere::after,.castle-interior-fire { animation:none; }
      }
      @media (max-width:700px) {
        #castle-interior-atmosphere {
          background:
            radial-gradient(ellipse at 50% 62%, rgba(255,178,88,.10) 0 10%, transparent 36%),
            radial-gradient(ellipse at 18% 38%, rgba(133,190,235,.16) 0 13%, transparent 43%),
            radial-gradient(ellipse at 82% 34%, rgba(106,161,209,.13) 0 11%, transparent 41%),
            linear-gradient(180deg, transparent, rgba(0,0,0,.015));
          box-shadow:inset 0 0 54px rgba(0,0,0,.10), inset 0 -8vh 12vh rgba(0,0,0,.035);
        }
        .castle-interior-fire { width:32vw; height:21vh; }
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
        ? 'contrast(1.02) saturate(1.00) brightness(1.25)'
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

      // Strong architectural base so the hall remains immediately readable on
      // iPhone while the directional lights preserve theatrical depth.
      add(new THREE.AmbientLight(0x6d879e, 1.15));
      add(new THREE.HemisphereLight(0xc0d7e9, 0x3a2015, 1.42));

      // Broad frontal fill reveals the nave, staircase, arches and lower hall.
      const architecturalFill = new THREE.DirectionalLight(0xb5d9f5, 4.8);
      architecturalFill.position.set(2, 21, 24);
      addTargeted(architecturalFill, new THREE.Vector3(0, 6.5, -3.2));

      // A softer side fill prevents the central architecture disappearing into
      // black on narrow/mobile views without flattening the entire hall.
      const sideFill = new THREE.DirectionalLight(0x88b9df, 2.65);
      sideFill.position.set(-18, 12, 10);
      addTargeted(sideFill, new THREE.Vector3(0, 6.2, -2.5));

      // Silver-blue moonlight remains the dominant gothic key.
      const moon = new THREE.SpotLight(0xc0e3ff, 268, 72, Math.PI / 6.3, 0.64, 1.28);
      moon.position.set(-13, 27, 9);
      addTargeted(moon, new THREE.Vector3(1, 8.3, -4.2));

      // Warm throne/jester key, balanced by a colder rear rim.
      const throneKey = new THREE.SpotLight(0xffc274, 184, 44, Math.PI / 7.0, 0.66, 1.38);
      throneKey.position.set(5, 19, 4);
      addTargeted(throneKey, new THREE.Vector3(0, 9.2, -7.2));

      const throneRim = new THREE.SpotLight(0xa0d4ff, 118, 40, Math.PI / 6.0, 0.64, 1.38);
      throneRim.position.set(-7, 14, -15);
      addTargeted(throneRim, new THREE.Vector3(0, 8.5, -7));

      // Dedicated warm museum light for the DUPUIS* construction panel.
      const panelLight = new THREE.SpotLight(0xffd493, 132, 34, Math.PI / 6.1, 0.66, 1.42);
      panelLight.position.set(-2, 13, 10);
      addTargeted(panelLight, new THREE.Vector3(0, 4.8, 3.8));

      // Strong local amber torch pools retain the warm/cold gothic contrast.
      [
        [-8, 5.2, -1.2, 72, 18],
        [8, 5.2, -1.2, 72, 18],
        [-10.5, 4.2, 6.0, 62, 17],
        [10.5, 4.2, 6.0, 62, 17],
      ].forEach(([x, y, z, intensity, distance]) => {
        const fire = new THREE.PointLight(0xffaa55, intensity, distance, 1.72);
        fire.position.set(x, y, z);
        add(fire);
      });

      // Selective shadows only on capable desktop/high-quality profiles.
      if (renderer.shadowMap.enabled) {
        [moon, throneKey].forEach(light => {
          light.castShadow = true;
          light.shadow.mapSize.set(1024, 1024);
          light.shadow.camera.near = 1;
          light.shadow.camera.far = 72;
          light.shadow.bias = -0.00035;
        });
      }

      syncThreeLighting = () => {
        const interior = document.body.dataset.sceneMode === 'interior';
        rig.visible = interior;
        exteriorLights.forEach(light => {
          light.intensity = interior ? 0 : (exteriorIntensities.get(light) ?? light.intensity);
        });
        const mobileInterior = matchMedia('(max-width: 700px)').matches;
        renderer.toneMappingExposure = interior
          ? (mobileInterior ? 3.15 : 2.90)
          : exteriorExposure;
        if (interior) {
          // Single authoritative interior fog value. The direct environment no
          // longer writes interior fog, preventing the previous iOS race.
          scene.fog = new THREE.FogExp2(0x0b1824, 0.0038);
          document.body.dataset.interiorLighting = mobileInterior
            ? 'high-visibility-scottish-gothic-mobile-v4'
            : 'high-visibility-scottish-gothic-v4';
          document.body.dataset.interiorLightingShadows = renderer.shadowMap.enabled
            ? 'selective-moon-throne'
            : 'disabled-performance-profile';
          document.body.dataset.interiorFog = 'single-owner-0.0038-v4';
        } else {
          delete document.body.dataset.interiorLighting;
          delete document.body.dataset.interiorLightingShadows;
          delete document.body.dataset.interiorFog;
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
        document.body.dataset.interiorAtmosphere = 'high-visibility-gothic-moonlight-firelight-v4';
      } else {
        delete document.body.dataset.interiorAtmosphere;
      }
    };

    const observer = new MutationObserver(syncInteriorAtmosphere);
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    installThreeLighting();
    syncInteriorAtmosphere();
    document.body.dataset.interiorAtmosphereLayer = 'ready-high-visibility-gothic-v4';
  }
}
