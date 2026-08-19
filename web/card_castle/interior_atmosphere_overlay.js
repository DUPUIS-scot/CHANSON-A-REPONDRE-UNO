// Theatrical atmosphere and lighting layer for the Castle interior.
// Keeps the exterior rig untouched while giving the interior its own
// low-ambient gothic chiaroscuro lighting. The DOM overlay remains a subtle
// finishing layer so the Three.js lights, not a CSS darkening filter, define
// the architecture.
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
          radial-gradient(ellipse at 50% 62%, rgba(255,158,60,.045) 0 7%, transparent 28%),
          radial-gradient(ellipse at 18% 38%, rgba(104,154,202,.085) 0 10%, transparent 36%),
          radial-gradient(ellipse at 82% 34%, rgba(82,129,176,.055) 0 8%, transparent 32%),
          linear-gradient(180deg, rgba(1,4,9,.12), rgba(0,0,0,.28));
        box-shadow:
          inset 0 0 min(20vw,230px) rgba(0,0,0,.68),
          inset 0 -16vh 20vh rgba(0,0,0,.34),
          inset 0 9vh 14vh rgba(0,0,0,.14);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before,
      #castle-interior-atmosphere::after { content:""; position:absolute; inset:-15%; pointer-events:none; }
      #castle-interior-atmosphere::before {
        background:
          linear-gradient(111deg, transparent 8%, rgba(154,201,239,.075) 18%, transparent 29%),
          linear-gradient(74deg, transparent 52%, rgba(126,174,215,.045) 61%, transparent 70%);
        filter:blur(12px); opacity:.58;
        animation:castle-moon-breathe 9s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        inset:auto -10% -8% -10%; height:50%;
        background:
          radial-gradient(ellipse at 20% 70%, rgba(157,181,191,.075), transparent 42%),
          radial-gradient(ellipse at 72% 60%, rgba(137,163,176,.06), transparent 45%),
          linear-gradient(180deg, transparent, rgba(112,137,150,.045));
        filter:blur(20px);
        animation:castle-mist-drift 20s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:14vw; height:20vh; max-width:190px; max-height:235px;
        border-radius:50%; filter:blur(20px); opacity:.075; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,198,100,.68) 0 8%, rgba(255,111,31,.28) 28%, transparent 70%);
        animation:castle-fire-flicker 3s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:46%; animation-delay:-.7s; }
      .castle-interior-fire.right { right:12%; top:44%; animation-delay:-1.6s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:43%; width:32vw; height:45vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(255,182,88,.035) 0 12%, transparent 64%);
        filter:blur(10px); opacity:.5;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.055; transform:scale(.96) translateY(1px); }
        30% { opacity:.09; transform:scale(1.04) translateY(-2px); }
        55% { opacity:.065; transform:scale(.99) translateY(1px); }
        78% { opacity:.10; transform:scale(1.06) translateY(-3px); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-2%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.46; } to { opacity:.66; } }
      @media (prefers-reduced-motion:reduce) {
        #castle-interior-atmosphere::before,#castle-interior-atmosphere::after,.castle-interior-fire { animation:none; }
      }
      @media (max-width:700px) {
        #castle-interior-atmosphere {
          box-shadow:inset 0 0 95px rgba(0,0,0,.62), inset 0 -13vh 17vh rgba(0,0,0,.30);
        }
        .castle-interior-fire { width:28vw; height:18vh; }
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
        ? 'contrast(1.08) saturate(.90) brightness(.96)'
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

      // Very low ambient foundation: enough to retain material detail without
      // flattening the vaults and recesses.
      add(new THREE.AmbientLight(0x233243, 0.12));
      add(new THREE.HemisphereLight(0x6f91ad, 0x120b08, 0.20));

      // Silver-blue moonlight: the dominant gothic key across staircase,
      // columns and upper throne architecture.
      const moon = new THREE.SpotLight(0xa9d4ff, 108, 58, Math.PI / 7.5, 0.72, 1.45);
      moon.position.set(-13, 27, 9);
      addTargeted(moon, new THREE.Vector3(1, 8.3, -4.2));

      // Warm throne/jester key, balanced by a colder rear rim.
      const throneKey = new THREE.SpotLight(0xffb160, 68, 34, Math.PI / 8.5, 0.74, 1.55);
      throneKey.position.set(5, 19, 4);
      addTargeted(throneKey, new THREE.Vector3(0, 9.2, -7.2));

      const throneRim = new THREE.SpotLight(0x78b8ee, 44, 30, Math.PI / 7, 0.72, 1.55);
      throneRim.position.set(-7, 14, -15);
      addTargeted(throneRim, new THREE.Vector3(0, 8.5, -7));

      // Dedicated museum-style light for the DUPUIS* construction panel.
      const panelLight = new THREE.SpotLight(0xffc77a, 32, 24, Math.PI / 7.5, 0.78, 1.65);
      panelLight.position.set(-2, 13, 10);
      addTargeted(panelLight, new THREE.Vector3(0, 4.8, 3.8));

      // Short-range amber pools at plausible architectural torch positions.
      [
        [-8, 5.2, -1.2, 27, 12],
        [8, 5.2, -1.2, 27, 12],
        [-10.5, 4.2, 6.0, 21, 11],
        [10.5, 4.2, 6.0, 21, 11],
      ].forEach(([x, y, z, intensity, distance]) => {
        const fire = new THREE.PointLight(0xffa451, intensity, distance, 2.0);
        fire.position.set(x, y, z);
        add(fire);
      });

      // Only the two principal theatrical keys cast dynamic shadows, and only
      // where the existing performance profile already enables shadow maps.
      if (renderer.shadowMap.enabled) {
        [moon, throneKey].forEach(light => {
          light.castShadow = true;
          light.shadow.mapSize.set(1024, 1024);
          light.shadow.camera.near = 1;
          light.shadow.camera.far = 60;
          light.shadow.bias = -0.00035;
        });
      }

      syncThreeLighting = () => {
        const interior = document.body.dataset.sceneMode === 'interior';
        rig.visible = interior;
        exteriorLights.forEach(light => {
          light.intensity = interior ? 0 : (exteriorIntensities.get(light) ?? light.intensity);
        });
        renderer.toneMappingExposure = interior ? 1.42 : exteriorExposure;
        if (interior) {
          document.body.dataset.interiorLighting = 'scottish-gothic-chiaroscuro-v1';
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
        document.body.dataset.interiorAtmosphere = 'gothic-moonlight-firelight-mist-v2';
      } else {
        delete document.body.dataset.interiorAtmosphere;
      }
    };

    const observer = new MutationObserver(syncInteriorAtmosphere);
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    installThreeLighting();
    syncInteriorAtmosphere();
    document.body.dataset.interiorAtmosphereLayer = 'ready-gothic-three-lighting-v2';
  }
}
