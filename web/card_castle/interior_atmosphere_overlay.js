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
      const runtime = window.__castleSearchRuntime;
      const renderer = runtime?.renderer;
      if (!renderer) {
        if (lightingAttempts++ < 120) setTimeout(installThreeLighting, 100);
        return;
      }
      syncThreeLighting = () => {
        const interior = document.body.dataset.sceneMode === 'interior';
        if (interior) {
          document.body.dataset.interiorLighting = 'base-profile-single-owner-0.82';
          document.body.dataset.interiorFog = 'base-profile-0.0038';
        } else {
          delete document.body.dataset.interiorLighting;
          delete document.body.dataset.interiorFog;
        }
      };
      window.__castleInteriorLightingRig = {group:null, sync:syncThreeLighting};
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
