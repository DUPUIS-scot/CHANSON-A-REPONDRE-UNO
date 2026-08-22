if (!window.__castleBureauVideoRefreshV70Installed) {
  window.__castleBureauVideoRefreshV70Installed = true;
  const VIDEO_PATH = '../assets/assets/videos/bureau_screen_loop.mp4';
  let refreshed = false;

  function refreshVideo() {
    const video = document.getElementById('bureau-screen-loop-video');
    if (!video) return false;
    if (!refreshed) {
      const url = new URL(VIDEO_PATH, document.baseURI);
      url.searchParams.set('v', '70');
      video.src = url.href;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = true;
      video.autoplay = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('muted', '');
      video.load();
      refreshed = true;
      document.body.dataset.bureauVideoRefresh = 'fresh-source-v70';
    }
    if (document.body.dataset.sceneMode === 'laboratory') {
      Promise.resolve(video.play()).catch(() => {});
    }
    return true;
  }

  const hydrate = () => {
    refreshVideo();
    window.__castleBureauVideoPlay?.();
  };

  const observer = new MutationObserver(() => {
    if (document.body.dataset.sceneMode === 'laboratory') {
      hydrate();
      requestAnimationFrame(hydrate);
      setTimeout(hydrate, 120);
      setTimeout(hydrate, 420);
    }
  });
  observer.observe(document.body, {attributes: true, attributeFilter: ['data-scene-mode', 'data-laboratory-ready']});

  let attempts = 0;
  const timer = setInterval(() => {
    if (refreshVideo() || attempts++ > 300) clearInterval(timer);
  }, 200);
}
