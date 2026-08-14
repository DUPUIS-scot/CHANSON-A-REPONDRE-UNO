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

_flutter.loader.load();
