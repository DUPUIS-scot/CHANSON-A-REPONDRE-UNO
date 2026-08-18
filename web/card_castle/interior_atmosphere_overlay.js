// Theatrical atmosphere layer for the Draco castle interior.
// Kept DOM/CSS based so it remains inexpensive on mobile and does not compete
// with the dedicated Three.js interior renderer.
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
        transition:opacity 1.25s ease;
        background:
          radial-gradient(ellipse at 50% 68%, rgba(255,167,72,.10) 0 8%, transparent 30%),
          radial-gradient(ellipse at 18% 42%, rgba(78,126,177,.14) 0 10%, transparent 38%),
          linear-gradient(180deg, rgba(3,8,15,.18), rgba(0,0,0,.34));
        box-shadow:inset 0 0 min(19vw,220px) rgba(0,0,0,.72), inset 0 -16vh 18vh rgba(0,0,0,.38);
      }
      body[data-scene-mode="interior"] #castle-interior-atmosphere { display:block; opacity:1; }
      #castle-interior-atmosphere::before,
      #castle-interior-atmosphere::after { content:""; position:absolute; inset:-15%; pointer-events:none; }
      #castle-interior-atmosphere::before {
        background:
          linear-gradient(111deg, transparent 8%, rgba(145,190,230,.11) 18%, transparent 29%),
          linear-gradient(74deg, transparent 52%, rgba(125,172,215,.075) 61%, transparent 70%);
        filter:blur(10px); opacity:.82;
        animation:castle-moon-breathe 8s ease-in-out infinite alternate;
      }
      #castle-interior-atmosphere::after {
        inset:auto -10% -8% -10%; height:48%;
        background:
          radial-gradient(ellipse at 20% 70%, rgba(175,196,205,.13), transparent 42%),
          radial-gradient(ellipse at 72% 60%, rgba(151,176,188,.11), transparent 45%),
          linear-gradient(180deg, transparent, rgba(128,153,163,.08));
        filter:blur(18px);
        animation:castle-mist-drift 18s ease-in-out infinite alternate;
      }
      .castle-interior-fire {
        position:absolute; width:15vw; height:22vh; max-width:210px; max-height:260px;
        border-radius:50%; filter:blur(18px); opacity:.13; mix-blend-mode:screen;
        background:radial-gradient(circle, rgba(255,205,112,.88) 0 8%, rgba(255,121,38,.45) 28%, transparent 70%);
        animation:castle-fire-flicker 2.8s steps(5,end) infinite;
      }
      .castle-interior-fire.left { left:12%; top:45%; animation-delay:-.7s; }
      .castle-interior-fire.right { right:12%; top:43%; animation-delay:-1.6s; }
      .castle-interior-focus {
        position:absolute; left:50%; top:42%; width:34vw; height:48vh; transform:translate(-50%,-50%);
        background:radial-gradient(ellipse, rgba(255,190,102,.075) 0 12%, transparent 64%);
        filter:blur(8px); opacity:.75;
      }
      @keyframes castle-fire-flicker {
        0%,100% { opacity:.10; transform:scale(.96) translateY(1px); }
        30% { opacity:.18; transform:scale(1.04) translateY(-2px); }
        55% { opacity:.12; transform:scale(.99) translateY(1px); }
        78% { opacity:.20; transform:scale(1.06) translateY(-3px); }
      }
      @keyframes castle-mist-drift { from { transform:translate3d(-2%,0,0); } to { transform:translate3d(3%,-2%,0); } }
      @keyframes castle-moon-breathe { from { opacity:.62; } to { opacity:.92; } }
      @media (prefers-reduced-motion:reduce) {
        #castle-interior-atmosphere::before,#castle-interior-atmosphere::after,.castle-interior-fire { animation:none; }
      }
      @media (max-width:700px) {
        #castle-interior-atmosphere { box-shadow:inset 0 0 90px rgba(0,0,0,.62), inset 0 -12vh 15vh rgba(0,0,0,.3); }
        .castle-interior-fire { width:28vw; height:18vh; }
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'castle-interior-atmosphere';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<span class="castle-interior-fire left"></span><span class="castle-interior-fire right"></span><span class="castle-interior-focus"></span>';
    root.appendChild(overlay);

    const applyInteriorGrade = () => {
      const canvas = document.getElementById('castle-interior-draco-canvas');
      if (!canvas) return;
      // Cool stone shadows + restrained warm highlights. Avoid crushing texture detail.
      canvas.style.filter = 'contrast(1.08) saturate(.92) brightness(.91)';
    };

    const observer = new MutationObserver(() => {
      if (document.body.dataset.sceneMode === 'interior') {
        applyInteriorGrade();
        document.body.dataset.interiorAtmosphere = 'moonlight-firelight-mist';
      }
    });
    observer.observe(document.body, { attributes:true, attributeFilter:['data-scene-mode'] });
    applyInteriorGrade();
    document.body.dataset.interiorAtmosphereLayer = 'ready';
  }
}
