// Theatrical atmosphere layer for the Castle interior.
// DOM/CSS based so it stays inexpensive and never competes with the Three.js GLB loader.
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
          radial-gradient(ellipse at 50% 64%, rgba(255,158,60,.075) 0 7%, transparent 28%),
          radial-gradient(ellipse at 18% 38%, rgba(72,118,170,.115) 0 10%, transparent 36%),
          radial-gradient(ellipse at 82% 34%, rgba(65,103,150,.08) 0 8%, transparent 32%),
          linear-gradient(180deg, rgba(1,4,9,.28), rgba(0,0,0,.55));
        box-shadow:
          inset 0 0 min(22vw,260px) rgba(0,0,0,.82),
          inset 0 -18vh 22vh rgba(0,0,0,.52),
          inset 0 10vh 16vh rgba(0,0,0,.22);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before,
      #castle-interior-atmosphere::after { content:""; position:absolute; inset:-15%; pointer-events:none; }
      #castle-interior-atmosphere::before {
        background:
          linear-gradient(111deg, transparent 8%, rgba(135,181,225,.10) 18%, transparent 29%),
          linear-gradient(74deg, transparent 52%, rgba(115,158,202,.065) 61%, transparent 70%);
        filter:blur(12px); opacity:.72;
        animation:castle-moon-breathe 9s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        inset:auto -10% -8% -10%; height:50%;
        background:
          radial-gradient(ellipse at 20% 70%, rgba(157,181,191,.105), transparent 42%),
          radial-gradient(ellipse at 72% 60%, rgba(137,163,176,.09), transparent 45%),
          linear-gradient(180deg, transparent, rgba(112,137,150,.07));
        filter:blur(20px);
        animation:castle-mist-drift 20s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:14vw; height:20vh; max-width:190px; max-height:235px;
        border-radius:50%; filter:blur(20px); opacity:.11; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,198,100,.82) 0 8%, rgba(255,111,31,.38) 28%, transparent 70%);
        animation:castle-fire-flicker 3s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:46%; animation-delay:-.7s; }
      .castle-interior-fire.right { right:12%; top:44%; animation-delay:-1.6s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:43%; width:32vw; height:45vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(255,182,88,.06) 0 12%, transparent 64%);
        filter:blur(10px); opacity:.66;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.08; transform:scale(.96) translateY(1px); }
        30% { opacity:.15; transform:scale(1.04) translateY(-2px); }
        55% { opacity:.10; transform:scale(.99) translateY(1px); }
        78% { opacity:.17; transform:scale(1.06) translateY(-3px); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-2%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.55; } to { opacity:.82; } }
      @media (prefers-reduced-motion:reduce) {
        #castle-interior-atmosphere::before,#castle-interior-atmosphere::after,.castle-interior-fire { animation:none; }
      }
      @media (max-width:700px) {
        #castle-interior-atmosphere {
          box-shadow:inset 0 0 105px rgba(0,0,0,.76), inset 0 -14vh 18vh rgba(0,0,0,.46);
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
        ? 'contrast(1.12) saturate(.82) brightness(.74)'
        : '';
    };

    const syncInteriorAtmosphere = () => {
      const interior = document.body.dataset.sceneMode === 'interior';
      gradeCanvas(interior);
      if (interior) {
        document.body.dataset.interiorAtmosphere = 'dark-moonlight-firelight-mist';
      } else {
        delete document.body.dataset.interiorAtmosphere;
      }
    };

    const observer = new MutationObserver(syncInteriorAtmosphere);
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    syncInteriorAtmosphere();
    document.body.dataset.interiorAtmosphereLayer = 'ready-single-runtime';
  }
}
