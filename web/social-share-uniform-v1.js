(()=>{
  'use strict';

  if (window.__chansonUniformShareV1) return;
  window.__chansonUniformShareV1 = true;

  const SITE_ORIGIN = 'https://www.chanson-a-repondre-uno.scot';
  const PREVIEW_URL = SITE_ORIGIN + '/social/chanson-a-repondre-uno-share.png';
  const nativeShare = typeof navigator.share === 'function' ? navigator.share.bind(navigator) : null;
  const nativeCanShare = typeof navigator.canShare === 'function' ? navigator.canShare.bind(navigator) : null;

  function minimalUrl(input) {
    let url;
    try {
      url = new URL(input || location.href, location.href);
    } catch (_) {
      return SITE_ORIGIN + '/';
    }

    if (url.origin !== SITE_ORIGIN && url.origin !== location.origin) return url.href;

    url.protocol = 'https:';
    url.host = 'www.chanson-a-repondre-uno.scot';
    url.username = '';
    url.password = '';
    url.search = '';

    let path = url.pathname.replace(/\/index\.html$/i, '/');
    path = path.replace(/\/{2,}/g, '/');
    if (!path.startsWith('/')) path = '/' + path;

    if (/^\/enochian-test\//i.test(path) || /^\/enochian-terminal-live\/?$/i.test(path)) {
      path = '/enochian-terminal/';
    }

    if (!path.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(path)) path += '/';
    url.pathname = path;

    if (path === '/') {
      const hashRoute = (url.hash || '').match(/^#\/[A-Za-z0-9_\-/]+/);
      url.hash = hashRoute ? hashRoute[0] : '';
    } else {
      url.hash = '';
    }

    return url.href;
  }

  async function previewFile() {
    try {
      const response = await fetch(PREVIEW_URL, { cache: 'force-cache', credentials: 'omit' });
      if (!response.ok) return null;
      const blob = await response.blob();
      return new File([blob], 'chanson-a-repondre-uno-preview.png', {
        type: blob.type || 'image/png',
      });
    } catch (_) {
      return null;
    }
  }

  async function share(data = {}) {
    if (!nativeShare) throw new TypeError('Web Share API unavailable');

    const payload = {
      ...data,
      url: minimalUrl(data.url || location.href),
    };

    if ((!payload.files || !payload.files.length) && nativeCanShare) {
      const file = await previewFile();
      if (file) {
        const withPreview = { ...payload, files: [file] };
        try {
          if (nativeCanShare(withPreview)) return await nativeShare(withPreview);
        } catch (_) {}
      }
    }

    return nativeShare(payload);
  }

  window.ChansonSocialShare = Object.freeze({
    version: 'v1',
    previewUrl: PREVIEW_URL,
    minimalUrl,
    share,
  });

  if (nativeShare) {
    try {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        enumerable: true,
        value: share,
      });
    } catch (_) {}
  }
})();
