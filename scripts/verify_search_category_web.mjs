import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const buildRoot = new URL('../build/web/', import.meta.url);
const basePath = '/CHANSON-A-REPONDRE-UNO/';
const port = 8123;
const debugPort = 9223;
const chromePath = process.env.CHROME_PATH || 'google-chrome';
const profilePath = join(
  tmpdir(),
  `chanson-search-category-profile-${process.pid}`,
);

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function startServer() {
  const rootPath = normalize(fileURLToPath(buildRoot));
  const server = createServer(async (request, response) => {
    try {
      const incoming = new URL(request.url, `http://127.0.0.1:${port}`);
      let relative = incoming.pathname.startsWith(basePath)
        ? incoming.pathname.slice(basePath.length)
        : incoming.pathname.slice(1);
      relative = decodeURIComponent(relative);
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      const filePath = normalize(join(rootPath, relative));
      if (!filePath.startsWith(rootPath)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const contents = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      response.end(contents);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function waitForDebugTarget() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting.
    }
    await delay(250);
  }
  throw new Error('Chrome DevTools target did not become available.');
}

class DevTools {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.consoleMessages = [];
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.consoleAPICalled') {
        const values = message.params.args.map((argument) =>
          argument.value === undefined
            ? argument.description
            : argument.value,
        );
        this.consoleMessages.push({ level: message.params.type, values });
      }
      if (message.method === 'Runtime.exceptionThrown') {
        this.consoleMessages.push({
          level: 'exception',
          values: [message.params.exceptionDetails.text],
        });
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

async function waitFor(client, expression, description, timeout = 30000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeout) {
    try {
      if (await client.evaluate(expression)) return;
      lastError = undefined;
    } catch (error) {
      lastError = error;
    }
    await delay(400);
  }
  throw new Error(
    `Timed out waiting for ${description}.` +
      (lastError ? ` Last evaluation error: ${lastError.message}` : ''),
  );
}

async function main() {
  const server = await startServer();
  const url = `http://127.0.0.1:${port}${basePath}#/search`;
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profilePath}`,
      '--no-first-run',
      '--disable-default-apps',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--window-size=1440,1000',
      url,
    ],
    { stdio: 'ignore' },
  );
  let client;
  try {
    const debuggerUrl = await waitForDebugTarget();
    client = new DevTools(debuggerUrl);
    await client.connect();
    await Promise.all([
      client.send('Page.enable'),
      client.send('Runtime.enable'),
      client.send('Log.enable'),
      client.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
      }),
    ]);

    await waitFor(
      client,
      `document.querySelector('flutter-view') !== null`,
      'Flutter to start',
    );

    const searchState = {
      castleActive: true,
      category: 'CLASSIQUE',
      selectedCardId: null,
      discoveredCardIds: [],
      shuffleSeed: 0,
    };
    const encodedPreference = JSON.stringify(JSON.stringify(searchState));
    await client.evaluate(
      `localStorage.setItem('flutter.search_path_state_v1', ${JSON.stringify(
        encodedPreference,
      )}); location.hash = '#/search'; location.reload(); true`,
    );

    await waitFor(
      client,
      `document.getElementById('search-card-castle-frame')
        ?.contentDocument?.body.dataset.rendererStatus === 'ready'`,
      'the category-filtered Search castle',
      90000,
    );
    await waitFor(
      client,
      `(() => {
        const body = document.getElementById('search-card-castle-frame')
          ?.contentDocument?.body;
        const count = Number(body?.dataset.cardCount || 0);
        return count > 0 && count < 84 &&
          body?.dataset.activeCategory === 'CLASSIQUE';
      })()`,
      'a non-empty CLASSIQUE subset to reach the castle',
      20000,
    );

    const visibleCardCount = await client.evaluate(
      `Number(document.getElementById('search-card-castle-frame')
        ?.contentDocument?.body.dataset.cardCount || 0)`,
    );
    await waitFor(
      client,
      `(() => {
        const body = document.getElementById('search-card-castle-frame')
          ?.contentDocument?.body;
        return Number(body?.dataset.textureCount || 0) === ${visibleCardCount} &&
          Number(body?.dataset.textureErrorCount || 0) === 0;
      })()`,
      'all selected-category card textures',
      180000,
    );

    const result = await client.evaluate(`(() => {
      const frame = document.getElementById('search-card-castle-frame');
      const body = frame?.contentDocument?.body;
      const canvas = frame?.contentDocument?.querySelector('canvas');
      return {
        route: location.hash,
        frame: Boolean(frame),
        canvas: Boolean(canvas),
        rendererStatus: body?.dataset.rendererStatus || '',
        cardCount: Number(body?.dataset.cardCount || 0),
        meshCount: Number(body?.dataset.meshCount || 0),
        textureCount: Number(body?.dataset.textureCount || 0),
        activeCategory: body?.dataset.activeCategory || '',
        surfaceAnchorCount: Number(body?.dataset.surfaceAnchorCount || 0),
        modelPath: body?.dataset.modelAsset
          ? new URL(body.dataset.modelAsset).pathname
          : '',
        framePath: frame ? new URL(frame.src).pathname : '',
        threeLoaded: Boolean(frame?.contentWindow?.THREE),
      };
    })()`);

    if (
      result.route !== '#/search' ||
      !result.frame ||
      !result.canvas ||
      result.rendererStatus !== 'ready' ||
      result.cardCount !== visibleCardCount ||
      result.cardCount < 1 ||
      result.cardCount >= 84 ||
      result.meshCount !== visibleCardCount ||
      result.textureCount !== visibleCardCount ||
      result.activeCategory !== 'CLASSIQUE' ||
      result.surfaceAnchorCount !== 84 ||
      result.modelPath !== `${basePath}assets/assets/models/search_castle.glb` ||
      result.framePath !== `${basePath}card_castle/card_castle.html` ||
      !result.threeLoaded
    ) {
      throw new Error(
        `Invalid category-filtered Search castle result: ${JSON.stringify(result)}`,
      );
    }

    client.consoleMessages.length = 0;
    await client.evaluate(`(() => {
      const frame = document.getElementById('search-card-castle-frame');
      frame?.contentDocument?.getElementById('back-to-categories')?.click();
      return true;
    })()`);
    await waitFor(
      client,
      `location.hash === '#/search' &&
        document.getElementById('search-card-castle-frame') === null`,
      'the castle CATEGORIES control to restore the category selector',
      5000,
    );

    const fatalConsoleMessages = client.consoleMessages.filter((message) => {
      const text = message.values.join(' ');
      if (!['error', 'exception', 'assert'].includes(message.level)) {
        return false;
      }
      return !(
        text.includes('WidgetsBindingObserver.didChangeViewFocus') &&
        text.includes('RenderSemanticsAnnotations')
      );
    });
    if (fatalConsoleMessages.length) {
      throw new Error(
        `Search castle console errors: ${JSON.stringify(fatalConsoleMessages)}`,
      );
    }

    console.log(JSON.stringify({
      ok: true,
      url,
      result,
      returnedToCategorySelector: true,
    }, null, 2));
  } finally {
    client?.close();
    chrome.kill();
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
