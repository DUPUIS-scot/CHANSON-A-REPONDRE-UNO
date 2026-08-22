{{flutter_js}}
{{flutter_build_config}}

// Forward the page cache-busting build ID to the compiled Flutter entrypoint.
const searchParams = new URLSearchParams(window.location.search);
const buildId = searchParams.get('v');
const castleRuntimeRevision = '62';
const isWindows = /Windows/i.test(navigator.userAgent);
if (buildId && globalThis._flutter?.buildConfig?.builds) {
  for (const build of globalThis._flutter.buildConfig.builds) {
    if (typeof build.mainJsPath === 'string' && build.mainJsPath.length > 0) {
      const separator = build.mainJsPath.includes('?') ? '&' : '?';
      build.mainJsPath = `${build.mainJsPath}${separator}v=${encodeURIComponent(buildId)}`;
    }
  }
}

// Castle renderer compatibility. The Three.js iframe emits legacy event names
// while the current Flutter host listens for the newer bridge names.
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
  window.postMessage(
    JSON.stringify({...message, type: translatedType}),
    location.origin,
  );
}, true);

const nativeCreateElement = document.createElement.bind(document);
const iframeSrcDescriptor = Object.getOwnPropertyDescriptor(
  HTMLIFrameElement.prototype,
  'src',
);

function versionedCastleUrl(path) {
  const url = new URL(path, document.baseURI);
  url.searchParams.set('v', buildId || castleRuntimeRevision);
  return url.href;
}

document.documentElement.dataset.castleRuntimeRevision = castleRuntimeRevision;

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

  if (iframeSrcDescriptor?.get && iframeSrcDescriptor?.set) {
    Object.defineProperty(element, 'src', {
      configurable: true,
      enumerable: true,
      get() {
        return iframeSrcDescriptor.get.call(this);
      },
      set(value) {
        const source = String(value || '');
        let optimized = source.includes('card_castle/card_castle.html')
          ? source.replace(
              'card_castle/card_castle.html',
              'card_castle/card_castle_fast.html',
            )
          : source;
        if (optimized.includes('card_castle/card_castle_fast.html')) {
          const url = new URL(optimized, document.baseURI);
          url.searchParams.set('v', buildId || castleRuntimeRevision);
          optimized = url.href;
        }
        iframeSrcDescriptor.set.call(this, optimized);
      },
    });
  }

  element.addEventListener('load', () => {
    try {
      if (!element.src.includes('card_castle/card_castle')) return;
      if (element.dataset.castleStagingArmed === 'true') return;
      element.dataset.castleStagingArmed = 'true';

      let readyHandled = false;
      let essentialsInjected = false;
      let enhancedInjected = false;

      const injectEssentials = () => {
        if (essentialsInjected) return;
        const frameDocument = element.contentDocument;
        if (!frameDocument?.body) return;
        essentialsInjected = true;
        frameDocument.body.dataset.bootstrapPerformanceMode = 'exterior-first';
        appendCastleScript(frameDocument, {
          id: 'castle-bridge-compat',
          path: 'card_castle/castle_bridge_compat.js',
        });
        appendCastleScript(frameDocument, {
          id: 'castle-navigation-bridge',
          path: 'card_castle/castle_navigation_overlay.js',
          module: true,
        });
        frameDocument.body.dataset.bootstrapEssentialBridges = 'ready';
      };

      const finishWindowsPostExteriorStage = jesterState => {
        if (!isWindows) return;
        const frameDocument = element.contentDocument;
        const frameWindow = element.contentWindow;
        if (!frameDocument?.body || !frameWindow) return;
        frameDocument.body.dataset.windowsPostExteriorStage =
            `interior-preload-after-jester-${jesterState}`;
        frameWindow.__castlePreloadInterior?.();
      };

      const waitForWindowsJester = () => {
        if (!isWindows) return;
        const frameDocument = element.contentDocument;
        const body = frameDocument?.body;
        if (!body) return;
        body.dataset.windowsPostExteriorStage = 'waiting-for-jester-terminal-state';

        let observer;
        let finished = false;
        const finishIfTerminal = () => {
          if (finished) return true;
          const jesterState = body.dataset.castleJester;
          if (jesterState !== 'ready' && jesterState !== 'failed') return false;
          finished = true;
          observer?.disconnect();
          const finish = () => finishWindowsPostExteriorStage(jesterState);
          if ('requestIdleCallback' in window) {
            requestIdleCallback(finish, {timeout: 5000});
          } else {
            setTimeout(finish, 1500);
          }
          return true;
        };

        if (finishIfTerminal()) return;
        observer = new MutationObserver(finishIfTerminal);
        observer.observe(body, {
          attributes: true,
          attributeFilter: ['data-castle-jester'],
        });
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
        waitForWindowsJester();
      };

      const handleRendererReady = () => {
        if (readyHandled) return;
        readyHandled = true;
        injectEssentials();

        // The jester is the heaviest post-exterior GLB. Do not begin it until
        // the deferred ground/atmosphere hydration has finished (or a bounded
        // safety window expires). This keeps the exterior-first contract real.
        let environmentPolls = 0;
        const environmentPoll = setInterval(() => {
          const environmentState =
              element.contentDocument?.body?.dataset.exteriorEnvironment;
          if (environmentState !== 'ready' && environmentPolls++ <= 32) return;
          clearInterval(environmentPoll);
          const hydrate = () => injectEnhancedOverlays();
          if ('requestIdleCallback' in window) {
            requestIdleCallback(hydrate, {timeout: 1800});
          } else {
            setTimeout(hydrate, 900);
          }
        }, 250);
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
        handleRendererReady();
      };
      window.addEventListener('message', onRendererMessage);

      // Safety polling never injects heavy Castle work before the renderer is
      // actually ready. This replaces the old 2.4s/3.4s unconditional timers.
      let polls = 0;
      const readyPoll = setInterval(() => {
        const body = element.contentDocument?.body;
        if (
          body?.dataset.rendererStatus === 'ready' ||
          body?.classList.contains('ready')
        ) {
          clearInterval(readyPoll);
          window.removeEventListener('message', onRendererMessage);
          handleRendererReady();
          return;
        }
        if (polls++ > 180) {
          clearInterval(readyPoll);
          window.removeEventListener('message', onRendererMessage);
        }
      }, 1000);
    } catch (error) {
      console.warn('Castle exterior-first staging failed.', error);
    }
  });
  return element;
};

_flutter.loader.load();