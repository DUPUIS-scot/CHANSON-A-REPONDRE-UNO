{{flutter_js}}
{{flutter_build_config}}

// Forward the page cache-busting build ID to the compiled Flutter entrypoint.
// GitHub Pages can cache static JS independently from index.html, so a URL like
// ?v=<commit> must also version main.dart.js to guarantee that the selected
// deployment is the one the browser executes.
const searchParams = new URLSearchParams(window.location.search);
const buildId = searchParams.get('v');
if (buildId && globalThis._flutter?.buildConfig?.builds) {
  for (const build of globalThis._flutter.buildConfig.builds) {
    if (typeof build.mainJsPath === 'string' && build.mainJsPath.length > 0) {
      const separator = build.mainJsPath.includes('?') ? '&' : '?';
      build.mainJsPath =
          `${build.mainJsPath}${separator}v=${encodeURIComponent(buildId)}`;
    }
  }
}

// Castle renderer compatibility. The Three.js iframe emits the legacy event
// names while the current Flutter host listens for the newer bridge names.
window.addEventListener('message', event => {
  let message;
  try {
    message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
  } catch (_) {
    return;
  }
  if (!message || typeof message !== 'object') return;
  const translatedType = {
    backToCategories: 'categoriesRequested',
    cardTap: 'cardSelected',
    cardLongPress: 'cardLongPressed',
  }[message.type];
  if (!translatedType) return;
  const translated = {...message, type: translatedType};
  window.dispatchEvent(new MessageEvent('message', {
    data: JSON.stringify(translated),
    origin: event.origin || location.origin,
  }));
}, true);

const nativeCreateElement = document.createElement.bind(document);
const iframeSrcDescriptor = Object.getOwnPropertyDescriptor(
  HTMLIFrameElement.prototype,
  'src',
);

function versionedCastleUrl(path) {
  const url = new URL(path, document.baseURI);
  if (buildId) url.searchParams.set('v', buildId);
  return url.href;
}

function appendCastleScript(frameDocument, {id, path, module = false}) {
  if (!frameDocument?.body || frameDocument.getElementById(id)) return;
  const script = frameDocument.createElement('script');
  script.id = id;
  if (module) script.type = 'module';
  script.src = versionedCastleUrl(path);
  frameDocument.body.appendChild(script);
}

document.createElement = function(tagName, options) {
  const element = nativeCreateElement(tagName, options);
  if (String(tagName).toLowerCase() !== 'iframe') return element;

  // Route the Search Castle iframe through a staged loader. The loader keeps
  // the current renderer intact but moves non-critical work off first paint.
  if (iframeSrcDescriptor?.get && iframeSrcDescriptor?.set) {
    Object.defineProperty(element, 'src', {
      configurable: true,
      enumerable: true,
      get() {
        return iframeSrcDescriptor.get.call(this);
      },
      set(value) {
        const source = String(value || '');
        const optimized = source.includes('card_castle/card_castle.html')
          ? source.replace(
              'card_castle/card_castle.html',
              'card_castle/card_castle_fast.html',
            )
          : source;
        iframeSrcDescriptor.set.call(this, optimized);
      },
    });
  }

  element.addEventListener('load', () => {
    try {
      if (!element.src.includes('card_castle/card_castle_')) return;

      let essentialsInjected = false;
      let enhancedInjected = false;

      const injectEssentials = () => {
        if (essentialsInjected) return;
        const frameDocument = element.contentDocument;
        if (!frameDocument?.body) return;
        essentialsInjected = true;
        frameDocument.body.dataset.bootstrapPerformanceMode = 'staged';
        appendCastleScript(frameDocument, {
          id: 'castle-interior-draco-bridge',
          path: 'card_castle/interior_draco_bridge.js',
          module: true,
        });
        appendCastleScript(frameDocument, {
          id: 'castle-bridge-compat',
          path: 'card_castle/castle_bridge_compat.js',
        });
        frameDocument.body.dataset.bootstrapEssentialBridges = 'ready';
      };

      const injectEnhancedOverlays = () => {
        if (enhancedInjected) return;
        injectEssentials();
        const frameDocument = element.contentDocument;
        if (!frameDocument?.body) return;
        enhancedInjected = true;
        appendCastleScript(frameDocument, {
          id: 'castle-interior-atmosphere-bridge',
          path: 'card_castle/interior_atmosphere_overlay.js',
        });
        appendCastleScript(frameDocument, {
          id: 'castle-jester-gatekeeper-bridge',
          path: 'card_castle/castle_jester_overlay.js',
          module: true,
        });
        frameDocument.body.dataset.bootstrapEnhancedOverlays = 'ready';
      };

      const onRendererMessage = event => {
        if (event.source !== element.contentWindow) return;
        let message = event.data;
        try {
          if (typeof message === 'string') message = JSON.parse(message);
        } catch (_) {
          return;
        }
        if (message?.type !== 'rendererReady') return;
        window.removeEventListener('message', onRendererMessage);

        // The fast loader rewrites its initial document asynchronously. Waiting
        // for rendererReady ensures these scripts are injected into the final
        // Castle document, not into the temporary loader document.
        injectEssentials();
        if ('requestIdleCallback' in window) {
          requestIdleCallback(injectEnhancedOverlays, {timeout: 900});
        } else {
          setTimeout(injectEnhancedOverlays, 250);
        }
      };
      window.addEventListener('message', onRendererMessage);

      // Safety fallback for browsers where rendererReady is delayed or lost.
      setTimeout(injectEssentials, 2400);
      setTimeout(injectEnhancedOverlays, 3400);
    } catch (error) {
      console.warn('Castle staged bridge injection failed.', error);
    }
  });
  return element;
};

_flutter.loader.load();
