(() => {
  const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS || window.__castleIosUnoPreviewFixInstalled) return;
  window.__castleIosUnoPreviewFixInstalled = true;

  let attempts = 0;
  function install() {
    const THREE = window.THREE;
    const prototype = THREE?.TextureLoader?.prototype;
    if (!prototype) {
      if (attempts++ < 240) setTimeout(install, 50);
      return;
    }
    if (prototype.__castleIosUnoPreviewPathFixed) return;

    const originalLoad = prototype.load;
    prototype.load = function castleIosUnoPreviewLoad(url, onLoad, onProgress, onError) {
      let fixedUrl = url;
      if (typeof fixedUrl === 'string') {
        fixedUrl = fixedUrl.replace(
          /\/assets\/assets\/share-previews\/(UNO-\d{3}\.jpg)(\?.*)?$/i,
          '/assets/share-previews/$1$2',
        );
      }
      return originalLoad.call(this, fixedUrl, onLoad, onProgress, onError);
    };
    prototype.__castleIosUnoPreviewPathFixed = true;
    document.body.dataset.iosUnoPreviewPathFix = 'canonical-share-preview-v36';
  }

  install();
})();
