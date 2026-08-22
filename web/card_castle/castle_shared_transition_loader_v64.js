const LOADER_ART_URL = new URL('../assets/assets/images/castle_jester_loading_bar.png', document.baseURI).href;

if (!window.__castleSharedTransitionLoaderV64Installed) {
  window.__castleSharedTransitionLoaderV64Installed = true;

  let previousMode = document.body.dataset.sceneMode || 'exterior';

  function ensureLoader() {
    let root = document.getElementById('castle-shared-transition-loader');
    if (root) return root;
    const style = document.createElement('style');
    style.id = 'castle-shared-transition-loader-style';
    style.textContent = `#castle-shared-transition-loader{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:radial-gradient(circle at 50% 44%,rgba(66,6,5,.42),rgba(2,6,11,.96) 58%,#02060b);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}#castle-shared-transition-loader.is-visible{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .12s ease}.castle-shared-loader-shell{width:min(96vw,1280px);text-align:center;padding:18px}.castle-shared-loader-art{position:relative;width:100%;aspect-ratio:3/1;margin:auto;background:url('${LOADER_ART_URL}') center/contain no-repeat;filter:drop-shadow(0 18px 30px rgba(0,0,0,.7)) brightness(.72)}.castle-shared-loader-stage{margin-top:8px;color:#d7c8b0;font:600 clamp(13px,2vw,18px)/1.2 Georgia,serif;letter-spacing:.18em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,.8)}@media(max-width:700px){.castle-shared-loader-shell{width:96vw;padding:8px}.castle-shared-loader-stage{font-size:clamp(12px,3.6vw,16px);letter-spacing:.12em}}`;
    document.head.append(style);
    root = document.createElement('div');
    root.id = 'castle-shared-transition-loader';
    root.setAttribute('aria-live', 'polite');
    root.innerHTML = '<div class="castle-shared-loader-shell"><div class="castle-shared-loader-art"></div><div class="castle-shared-loader-stage">LOADING</div></div>';
    document.body.append(root);
    return root;
  }

  function show(label) {
    const root = ensureLoader();
    const stage = root.querySelector('.castle-shared-loader-stage');
    if (stage) stage.textContent = label || 'LOADING';
    root.classList.add('is-visible');
    document.body.dataset.castleSharedLoader = 'visible-v64';
  }

  function hide() {
    const root = document.getElementById('castle-shared-transition-loader');
    if (!root) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.remove('is-visible');
      document.body.dataset.castleSharedLoader = 'hidden-v64';
    }));
  }

  function handleClick(event) {
    const target = event.target?.closest?.('#bureau-of-ai, #laboratory-medallion-button, #return-exterior');
    if (!target) return;
    const mode = document.body.dataset.sceneMode || 'exterior';
    if (mode === 'interior' && (target.id === 'bureau-of-ai' || target.id === 'laboratory-medallion-button')) show('LABORATORY LOADING');
    else if (mode === 'laboratory' && (target.id === 'bureau-of-ai' || target.id === 'return-exterior')) show('INTERIOR LOADING');
  }

  window.__castleShowSceneLoader = label => show(label || 'LOADING');
  window.__castleHideSceneLoader = hide;
  window.addEventListener('castleJesterEnter', () => show('INTERIOR LOADING'), true);
  window.addEventListener('castle-open-laboratory', () => show('LABORATORY LOADING'), true);
  document.addEventListener('pointerdown', handleClick, true);
  document.addEventListener('click', handleClick, true);

  const observer = new MutationObserver(() => {
    const mode = document.body.dataset.sceneMode || 'exterior';
    if (mode === previousMode) return;
    previousMode = mode;
    if (mode === 'interior' || mode === 'laboratory') hide();
  });
  observer.observe(document.body, {attributes:true, attributeFilter:['data-scene-mode']});
}
