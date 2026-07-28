import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = new URL('../', import.meta.url);
const buildRoot = new URL('../build/web/', import.meta.url);
const basePath = '/CHANSON-A-REPONDRE-UNO/';
const port = 8123;
const debugPort = 9223;
const chromePath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'google-chrome');
const profilePath = join(
  tmpdir(),
  `chanson-dealer-chrome-profile-${process.pid}`,
);
const outputPath = new URL('../build/dealer-verification.png', import.meta.url);
const animationOutputPath = new URL(
  '../build/dealer-animation-verification.png',
  import.meta.url,
);
const castleOutputPath = new URL(
  '../build/search-castle-verification.png',
  import.meta.url,
);
const castleFullscreenOutputPath = new URL(
  '../build/search-castle-fullscreen-verification.png',
  import.meta.url,
);

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
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
        this.consoleMessages.push({
          level: message.params.type,
          values,
        });
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
      // Flutter may replace a platform-view iframe between animation frames.
      lastError = error;
    }
    await delay(400);
  }
  throw new Error(
    `Timed out waiting for ${description}.` +
      (lastError ? ` Last evaluation error: ${lastError.message}` : ''),
  );
}

async function seedGame(client) {
  const source = await readFile(
    new URL('assets/json/cards.json', projectRoot),
    'utf8',
  );
  const catalog = JSON.parse(source.replace(/^\uFEFF/, ''));
  const cards = catalog.decks[0].cards.slice(0, 12);
  const state = {
    deckId: catalog.decks[0].id,
    topCard: cards[0],
    currentColour: 'custom',
    currentCategory: cards[0].category,
    playDirection: 'clockwise',
    drawPile: cards.slice(5),
    discardPile: [cards[0]],
    players: [
      { id: 'player-0', name: 'Player 1', hand: cards.slice(1, 3) },
      { id: 'player-1', name: 'Player 2', hand: cards.slice(3, 5) },
    ],
    currentPlayerIndex: 0,
    drawRule: 'drawOneAndPass',
    matchRule: 'colourOrCategory',
    allowStacking: false,
    timedTurns: false,
    collaborativeMode: false,
    conversationMode: false,
    journalMode: false,
    winnerName: null,
  };
  const encodedPreference = JSON.stringify(JSON.stringify(state));
  await client.evaluate(
    `localStorage.setItem('flutter.saved_game', ${JSON.stringify(
      encodedPreference,
    )}); location.hash = '#/play'; location.reload(); true`,
  );
  return cards[5].path;
}

async function capture(client, path) {
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(path, Buffer.from(screenshot.data, 'base64'));
}

async function verifySearchCastle(client, url) {
  await waitFor(
    client,
    `document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.rendererStatus === 'ready'`,
    'the Search Three.js castle',
    40000,
  );
  await waitFor(
    client,
    `Number(document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.cardCount || 0) === 84`,
    'all 84 stable cards to reach the castle',
    20000,
  );
  await waitFor(
    client,
    `Number(document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.textureCount || 0) >=
      Number(document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.visibleMeshCount || 0)`,
    'every visible castle card texture',
    30000,
  );
  await capture(client, castleOutputPath);
  client.consoleMessages.length = 0;
  const requestedFocusId = await client.evaluate(`(() => {
    const frame = document.getElementById('search-card-castle-frame');
    const cardId = frame?.contentDocument?.body.dataset.firstCardId || '';
    frame?.contentWindow?.postMessage(JSON.stringify({
      type: 'focusCard',
      cardId,
      animate: true,
    }), location.origin);
    return cardId;
  })()`);
  if (!requestedFocusId) {
    throw new Error('The Search castle did not expose a stable card ID.');
  }
  await waitFor(
    client,
    `document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.focusedCardId ===
        ${JSON.stringify(requestedFocusId)}`,
    'the selected card to focus in the castle',
    5000,
  );
  await waitFor(
    client,
    `document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.focusSettled === 'true'`,
    'the castle camera focus animation to settle',
    15000,
  );
  await delay(250);
  const rendererInstanceId = await client.evaluate(
    `document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.rendererInstanceId || ''`,
  );
  await client.evaluate(`(() => {
    const frame = document.getElementById('search-card-castle-frame');
    frame?.contentWindow?.postMessage(
      JSON.stringify({type: 'enterFullscreen'}),
      location.origin,
    );
    return true;
  })()`);
  await waitFor(
    client,
    `document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.classList.contains('fullscreen-castle') === true`,
    'the existing Search castle to enter fullscreen',
    5000,
  );
  await waitFor(
    client,
    `(() => {
      const canvas = document.getElementById('search-card-castle-frame')
        ?.contentDocument?.querySelector('canvas');
      const rect = canvas?.getBoundingClientRect();
      return (rect?.width || 0) >= 1300 && (rect?.height || 0) >= 850;
    })()`,
    'the fullscreen castle canvas to fill the browser',
    5000,
  );
  const result = await client.evaluate(`(() => {
    const frame = document.getElementById('search-card-castle-frame');
    const body = frame?.contentDocument?.body;
    const canvas = frame?.contentDocument?.querySelector('canvas');
    const rect = canvas?.getBoundingClientRect();
    return {
      route: location.hash,
      frame: Boolean(frame),
      rendererStatus: body?.dataset.rendererStatus,
      cardCount: Number(body?.dataset.cardCount || 0),
      meshCount: Number(body?.dataset.meshCount || 0),
      visibleMeshCount: Number(body?.dataset.visibleMeshCount || 0),
      textureCount: Number(body?.dataset.textureCount || 0),
      referenceBackground: body?.dataset.referenceBackground || '',
      focusedCardId: body?.dataset.focusedCardId || '',
      focusMode: body?.dataset.focusMode || '',
      rendererInstanceId: body?.dataset.rendererInstanceId || '',
      sceneObjectCount: Number(body?.dataset.sceneObjectCount || 0),
      fullscreen: body?.classList.contains('fullscreen-castle') || false,
      threeLoaded: Boolean(frame?.contentWindow?.THREE),
      framePath: frame ? new URL(frame.src).pathname : '',
      canvas: Boolean(canvas),
      backdrop: frame?.contentDocument
        ? getComputedStyle(frame.contentDocument.getElementById('scene'))
            .backgroundImage.includes('search_castle_background.png')
        : false,
      width: rect?.width || 0,
      height: rect?.height || 0,
    };
  })()`);
  if (
    result.route !== '#/search' ||
    !result.frame ||
    !result.canvas ||
    result.rendererStatus !== 'ready' ||
    result.cardCount !== 84 ||
    result.meshCount !== 84 ||
    result.visibleMeshCount < 1 ||
    result.visibleMeshCount > 28 ||
    result.textureCount < result.visibleMeshCount ||
    result.referenceBackground !== 'search_castle_background.png' ||
    result.focusedCardId !== requestedFocusId ||
    result.focusMode !== 'animated' ||
    result.rendererInstanceId !== rendererInstanceId ||
    result.sceneObjectCount < 40 ||
    !result.fullscreen ||
    !result.threeLoaded ||
    !result.backdrop ||
    result.framePath !== `${basePath}card_castle/card_castle.html` ||
    result.width <= 0 ||
    result.height <= 0
  ) {
    throw new Error(`Invalid Search castle result: ${JSON.stringify(result)}`);
  }
  await capture(client, castleFullscreenOutputPath);
  await client.evaluate(`(() => {
    const frame = document.getElementById('search-card-castle-frame');
    frame?.contentWindow?.postMessage(
      JSON.stringify({type: 'exitFullscreen'}),
      location.origin,
    );
    return true;
  })()`);
  await waitFor(
    client,
    `document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.classList.contains('fullscreen-castle') === false`,
    'the Search castle to exit fullscreen',
    5000,
  );
  const restored = await client.evaluate(`(() => {
    const body = document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body;
    return {
      rendererInstanceId: body?.dataset.rendererInstanceId || '',
      cardCount: Number(body?.dataset.cardCount || 0),
      focusedCardId: body?.dataset.focusedCardId || '',
    };
  })()`);
  if (
    restored.rendererInstanceId !== rendererInstanceId ||
    restored.cardCount !== 84 ||
    restored.focusedCardId !== requestedFocusId
  ) {
    throw new Error(
      `Castle state was not preserved after fullscreen: ${JSON.stringify(restored)}`,
    );
  }
  const fatalConsoleMessages = client.consoleMessages.filter((message) =>
    ['error', 'exception', 'assert'].includes(message.level),
  );
  if (fatalConsoleMessages.length) {
    throw new Error(
      `Search castle console errors: ${JSON.stringify(fatalConsoleMessages)}`,
    );
  }
  console.log(JSON.stringify({
    ok: true,
    url,
    result,
    restored,
    screenshots: [
      castleOutputPath.pathname.slice(1),
      castleFullscreenOutputPath.pathname.slice(1),
    ],
    console: client.consoleMessages,
  }, null, 2));
}

async function main() {
  const argumentsList = process.argv.slice(2);
  const verifySearch = argumentsList.includes('--search');
  const requestedUrl = argumentsList.find((value) => !value.startsWith('--'));
  const server = requestedUrl ? null : await startServer();
  const url =
    requestedUrl ||
    `http://127.0.0.1:${port}${basePath}#/${verifySearch ? 'search' : 'play'}`;
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
    if (verifySearch) {
      await client.evaluate(
        `localStorage.removeItem('flutter.search_path_state_v1');
         location.hash = '#/search';
         location.reload();
         true`,
      );
      await verifySearchCastle(client, url);
      return;
    }
    const cardPath = await seedGame(client);
    try {
      await waitFor(
        client,
        `document.getElementById('dealer-3d-container')?.dataset.dealerStatus === 'ready'`,
        'the 3D dealer',
        40000,
      );
    } catch (error) {
      const debug = await client.evaluate(`(() => {
        const host = document.getElementById('dealer-3d-container');
        return {
          href: location.href,
          hash: location.hash,
          title: document.title,
          localStorageKeys: Object.keys(localStorage),
          savedGameLength: localStorage.getItem('flutter.saved_game')?.length,
          savedGamePrefix: localStorage
            .getItem('flutter.saved_game')
            ?.slice(0, 30),
          flutterViews: document.querySelectorAll('flutter-view').length,
          platformViews: document.querySelectorAll('flt-platform-view').length,
          hostFound: Boolean(host),
          hostStatus: host?.dataset.dealerStatus,
          hostSize: host
            ? [host.clientWidth, host.clientHeight]
            : null,
          diagnostic: host?.querySelector('.dealer-3d-diagnostic')?.textContent,
          canvases: [...document.querySelectorAll('canvas')].map((canvas) => ({
            id: canvas.id,
            width: canvas.width,
            height: canvas.height,
          })),
        };
      })()`);
      console.error('DEALER VERIFICATION DEBUG', JSON.stringify({
        debug,
        console: client.consoleMessages,
      }, null, 2));
      throw error;
    }
    const result = await client.evaluate(`(() => {
      const host = document.getElementById('dealer-3d-container');
      const canvas = host?.querySelector('canvas');
      const rect = canvas?.getBoundingClientRect();
      return {
        host: Boolean(host),
        canvas: Boolean(canvas),
        status: host?.dataset.dealerStatus,
        width: rect?.width || 0,
        height: rect?.height || 0,
        bufferWidth: canvas?.width || 0,
        bufferHeight: canvas?.height || 0,
        renderer: canvas?.dataset.renderer,
        diagnostic: host?.querySelector('.dealer-3d-diagnostic')?.textContent,
      };
    })()`);
    if (
      !result.host ||
      !result.canvas ||
      result.status !== 'ready' ||
      result.width <= 0 ||
      result.height <= 0
    ) {
      throw new Error(`Invalid dealer result: ${JSON.stringify(result)}`);
    }
    // Headless Chrome changes view focus while Flutter is still laying out its
    // root semantics node. Flutter reports that engine-only assertion during
    // bootstrap, so retain it for diagnostics but verify the settled scene and
    // animation against a fresh console window.
    const bootstrapConsole = [...client.consoleMessages];
    client.consoleMessages.length = 0;
    await capture(client, outputPath);

    const textureUrl = encodeURI(`assets/${cardPath}`).replaceAll('%', '%25');
    const textureResponse = await client.evaluate(
      `fetch(${JSON.stringify(textureUrl)}).then((response) => ({
        ok: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
      }))`,
    );
    if (
      !textureResponse.ok ||
      textureResponse.status !== 200 ||
      textureResponse.contentType !== 'image/png'
    ) {
      throw new Error(
        `Dealer texture is not reachable: ${JSON.stringify(textureResponse)}`,
      );
    }
    const animationStarted = await client.evaluate(
      `window.puppetDealerDeal('dealer-3d-container', ${JSON.stringify(
        textureUrl,
      )})`,
    );
    if (!animationStarted) throw new Error('Dealer animation did not start.');
    await waitFor(
      client,
      `document.getElementById('dealer-3d-container')
        ?.dataset.dealerAnimation === 'dealing'`,
      'the dealer animation to enter DEALING',
      3000,
    );
    let animationDiagnostic = await client.evaluate(
      `document.querySelector('.dealer-3d-diagnostic')?.textContent || ''`,
    );
    await waitFor(
      client,
      `document.getElementById('dealer-3d-container')?.dataset.cardTexture === 'ready'`,
      'the real card texture',
      15000,
    );
    await waitFor(
      client,
      `document.getElementById('dealer-3d-container')
        ?.dataset.dealerAnimation === 'idle'`,
      'the first dealer animation to finish',
      5000,
    );
    const texturedAnimationStarted = await client.evaluate(
      `window.puppetDealerDeal('dealer-3d-container', ${JSON.stringify(
        textureUrl,
      )})`,
    );
    if (!texturedAnimationStarted) {
      throw new Error('Textured dealer animation did not restart.');
    }
    await waitFor(
      client,
      `document.querySelector('.dealer-3d-diagnostic')
        ?.textContent?.includes('Animation: DEALING') === true`,
      'the textured dealer animation',
      3000,
    );
    animationDiagnostic = await client.evaluate(
      `document.querySelector('.dealer-3d-diagnostic')?.textContent || ''`,
    );
    await delay(100);
    await capture(client, animationOutputPath);

    const fatalConsoleMessages = client.consoleMessages.filter((message) => {
      const text = message.values.join(' ');
      if (
        message.level === 'warning' &&
        /(404|cors|unable to load|failed to fetch|three is not defined|platform view)/i
          .test(text)
      ) {
        return true;
      }
      if (!['error', 'exception', 'assert'].includes(message.level)) {
        return false;
      }
      const headlessFocusAssertion =
        text.includes('WidgetsBindingObserver.didChangeViewFocus') &&
        text.includes('RenderSemanticsAnnotations');
      return !headlessFocusAssertion;
    });
    if (fatalConsoleMessages.length) {
      throw new Error(
        `Browser console errors: ${JSON.stringify(fatalConsoleMessages)}`,
      );
    }
    console.log(JSON.stringify({
      ok: true,
      url,
      result,
      textureResponse,
      animationDiagnostic,
      screenshots: [
        outputPath.pathname.slice(1),
        animationOutputPath.pathname.slice(1),
      ],
      bootstrapConsole,
      console: client.consoleMessages,
    }, null, 2));
  } finally {
    client?.close();
    chrome.kill();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
