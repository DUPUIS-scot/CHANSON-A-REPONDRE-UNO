const LOADER_ART_URL = new URL('../assets/assets/images/castle_jester_loading_bar.png', document.baseURI).href;

if (!window.__castleSharedTransitionLoaderV64Installed) {
  window.__castleSharedTransitionLoaderV64Installed = true;

  let previousMode = document.body.dataset.sceneMode || 'exterior';
  let progressTimer = 0;
  let progressValue = 0;

  function ensureLoader() {
    let root = document.getElementById('castle-shared-transition-loader');
    if (root) return root;
    const style = document.createElement('style');
    style.id = 'castle-shared-transition-loader-style';
    style.textContent = `#castle-shared-transition-loader{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:radial-gradient(circle at 50% 44%,rgba(66,6,5,.42),rgba(2,6,11,.96) 58%,#02060b);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}#castle-shared-transition-loader.is-visible{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .12s ease}.castle-shared-loader-shell{width:min(96vw,1280px);text-align:center;padding:18px}.castle-shared-loader-art{width:100%;aspect-ratio:3/1;margin:auto;background:url('${LOADER_ART_URL}') center/contain no-repeat;filter:drop-shadow(0 18px 30px rgba(0,0,0,.7)) brightness(.72)}.castle-shared-loader-stage{margin-top:8px;color:#d7c8b0;font:600 clamp(13px,2vw,18px)/1.2 Georgia,serif;letter-spacing:.18em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,.8)}.castle-shared-loader-track{width:min(78vw,760px);height:9px;margin:16px auto 0;border:1px solid rgba(218,174,93,.7);border-radius:999px;background:rgba(0,0,0,.48);overflow:hidden}.castle-shared-loader-progress{height:100%;width:0%;background:linear-gradient(90deg,#7f1d1d,#d6ad5d,#f1d99b);transition:width .18s ease}.castle-shared-loader-percent{margin-top:7px;color:#d7c8b0;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.12em}@media(max-width:700px){.castle-shared-loader-shell{width:96vw;padding:8px}.castle-shared-loader-stage{font-size:clamp(12px,3.6vw,16px);letter-spacing:.12em}.castle-shared-loader-track{width:86vw}}`;
    document.head.append(style);
    root = document.createElement('div');
    root.id = 'castle-shared-transition-loader';
    root.setAttribute('aria-live', 'polite');
    root.innerHTML = '<div class="castle-shared-loader-shell"><div class="castle-shared-loader-art"></div><div class="castle-shared-loader-stage">LOADING</div><div class="castle-shared-loader-track"><div class="castle-shared-loader-progress"></div></div><div class="castle-shared-loader-percent">0%</div></div>';
    document.body.append(root);
    return root;
  }

  function setProgress(value) {
    const root = ensureLoader();
    progressValue = Math.max(0, Math.min(100, value));
    const bar = root.querySelector('.castle-shared-loader-progress');
    const percent = root.querySelector('.castle-shared-loader-percent');
    if (bar) bar.style.width = `${progressValue}%`;
    if (percent) percent.textContent = `${Math.round(progressValue)}%`;
  }

  function startProgress() {
    clearInterval(progressTimer);
    setProgress(4);
    progressTimer = window.setInterval(() => {
      if (progressValue >= 92) return;
      setProgress(progressValue + Math.max(1, (94 - progressValue) * 0.08));
    }, 180);
  }

  function show(label) {
    const root = ensureLoader();
    const stage = root.querySelector('.castle-shared-loader-stage');
    if (stage) stage.textContent = label || 'LOADING';
    root.classList.add('is-visible');
    startProgress();
    document.body.dataset.castleSharedLoader = 'visible-v64';
  }

  function hide() {
    const root = document.getElementById('castle-shared-transition-loader');
    if (!root) return;
    clearInterval(progressTimer);
    setProgress(100);
    window.setTimeout(() => {
      root.classList.remove('is-visible');
      document.body.dataset.castleSharedLoader = 'hidden-v64';
    }, 160);
  }

  window.__castleShowSceneLoader = label => show(label || 'LOADING');
  window.__castleSetSceneLoaderProgress = setProgress;
  window.__castleHideSceneLoader = hide;
  window.addEventListener('castleJesterEnter', () => show('INTERIOR LOADING'), true);
  window.addEventListener('castle-open-laboratory', () => show('LABORATORY LOADING'), true);

  const observer = new MutationObserver(() => {
    const mode = document.body.dataset.sceneMode || 'exterior';
    if (mode === previousMode) return;
    previousMode = mode;
    if (mode === 'interior' || mode === 'laboratory') hide();
  });
  observer.observe(document.body, {attributes:true, attributeFilter:['data-scene-mode']});
}
