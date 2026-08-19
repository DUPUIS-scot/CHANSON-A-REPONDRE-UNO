(() => {
  // The direct card renderer may derive an /assets/assets/share-previews URL
  // before trying the canonical /assets/share-previews location. Normalize
  // that request on every web platform so Windows does not pay for a failed
  // texture request and iOS keeps the existing safe path correction.
  if (window.__castleUnoPreviewFixInstalled) return;
  window.__castleUnoPreviewFixInstalled = true;

  let attempts = 0;
  function install() {
    const THREE = window.THREE;
    const prototype = THREE?.TextureLoader?.prototype;
    if (!prototype) {
      if (attempts++ < 240) setTimeout(install, 50);
      return;
    }
    if (prototype.__castleUnoPreviewPathFixed) return;

    const originalLoad = prototype.load;
    prototype.load = function castleUnoPreviewLoad(url, onLoad, onProgress, onError) {
      let fixedUrl = url;
      if (typeof fixedUrl === 'string') {
        fixedUrl = fixedUrl.replace(
          /\/assets\/assets\/share-previews\/(UNO-\d{3}\.jpg)(\?.*)?$/i,
          '/assets/share-previews/$1$2',
        );
      }
      return originalLoad.call(this, fixedUrl, onLoad, onProgress, onError);
    };
    prototype.__castleUnoPreviewPathFixed = true;
    document.body.dataset.unoPreviewPathFix = 'canonical-share-preview-all-platforms-v37';
  }

  install();
})();
