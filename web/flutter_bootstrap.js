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

// The uploaded Castle interior is Draco-compressed. Inject dedicated,
// same-origin Three.js/atmosphere bridges into the Castle iframe as it is
// created so the interior can preload without relying on Dart iframe DOM APIs.
const nativeCreateElement = document.createElement.bind(document);
document.createElement = function(tagName, options) {
  const element = nativeCreateElement(tagName, options);
  if (String(tagName).toLowerCase() === 'iframe') {
    element.addEventListener('load', () => {
      try {
        if (!element.src.includes('card_castle/card_castle.html')) return;
        const frameDocument = element.contentDocument;
        if (!frameDocument?.body ||
            frameDocument.getElementById('castle-interior-draco-bridge')) {
          return;
        }
        const script = frameDocument.createElement('script');
        script.id = 'castle-interior-draco-bridge';
        script.type = 'module';
        const bridgeUrl = new URL(
          'card_castle/interior_draco_bridge.js',
          document.baseURI,
        );
        if (buildId) bridgeUrl.searchParams.set('v', buildId);
        script.src = bridgeUrl.href;
        frameDocument.body.appendChild(script);

        const atmosphereScript = frameDocument.createElement('script');
        atmosphereScript.id = 'castle-interior-atmosphere-bridge';
        const atmosphereUrl = new URL(
          'card_castle/interior_atmosphere_overlay.js',
          document.baseURI,
        );
        if (buildId) atmosphereUrl.searchParams.set('v', buildId);
        atmosphereScript.src = atmosphereUrl.href;
        frameDocument.body.appendChild(atmosphereScript);
      } catch (error) {
        console.warn('Castle interior bridge injection failed.', error);
      }
    });
  }
  return element;
};

_flutter.loader.load();