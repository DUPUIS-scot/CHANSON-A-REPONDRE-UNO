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
const homeOutputPath = new URL(
  '../build/home-verification.png',
  import.meta.url,
);
const homeMobileOutputPath = new URL(
  '../build/home-mobile-verification.png',
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
  // Search opens on its category-selection state. ALL CATEGORIES is the first
  // prominent option, so activate it and certify the complete 84-card castle.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const frameMounted = await client.evaluate(
      `document.getElementById('search-card-castle-frame') !== null`,
    );
    if (frameMounted) break;
    const viewport = await client.evaluate(
      `({width: innerWidth, height: innerHeight})`,
    );
    const position = {x: viewport.width / 2, y: viewport.height * .43};
    await client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...position,
      button: 'left',
      clickCount: 1,
    });
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...position,
      button: 'left',
      clickCount: 1,
    });
    await delay(800);
  }
  try {
    await waitFor(
      client,
      `document.getElementById('search-card-castle-frame')
        ?.contentDocument?.body.dataset.rendererStatus === 'ready'`,
      'the Search Three.js castle',
      90000,
    );
  } catch (error) {
    const debug = await client.evaluate(`(() => {
      const frame = document.getElementById('search-card-castle-frame');
      const body = frame?.contentDocument?.body;
      return {
        href: location.href,
        hash: location.hash,
        title: document.title,
        flutterViews: document.querySelectorAll('flutter-view').length,
        platformViews: document.querySelectorAll('flt-platform-view').length,
        frameFound: Boolean(frame),
        framePath: frame ? new URL(frame.src).pathname : '',
        frameReadyState: frame?.contentDocument?.readyState || '',
        rendererStatus: body?.dataset.rendererStatus || '',
        bodyText: body?.innerText?.slice(0, 200) || '',
        threeLoaded: Boolean(frame?.contentWindow?.THREE),
        canvasFound: Boolean(frame?.contentDocument?.querySelector('canvas')),
      };
    })()`);
    console.error(
      'SEARCH CASTLE VERIFICATION DEBUG',
      JSON.stringify({debug, console: client.consoleMessages}, null, 2),
    );
    throw error;
  }
  await waitFor(
    client,
    `Number(document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.cardCount || 0) > 0 &&
      Number(document.getElementById('search-card-castle-frame')
        ?.contentDocument?.body.dataset.cardCount || 0) === 84`,
    'all 84 permanent cards to reach the ALL CATEGORIES castle',
    20000,
  );
  const visibleCardCount = await client.evaluate(
    `Number(document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.dataset.cardCount || 0)`,
  );
  try {
    await waitFor(
      client,
      `Number(document.getElementById('search-card-castle-frame')
        ?.contentDocument?.body.dataset.textureCount || 0) ===
          ${visibleCardCount}`,
      'all ALL CATEGORIES card textures in the castle',
      180000,
    );
  } catch (error) {
    const textureDebug = await client.evaluate(`(() => {
      const frame = document.getElementById('search-card-castle-frame');
      const body = frame?.contentDocument?.body;
      const resources = frame?.contentWindow?.performance
        ?.getEntriesByType('resource')
        ?.filter((entry) => entry.name.includes('/cards/final_import/')) || [];
      return {
        textureCount: Number(body?.dataset.textureCount || 0),
        rendererStatus: body?.dataset.rendererStatus || '',
        cardCount: Number(body?.dataset.cardCount || 0),
        meshCount: Number(body?.dataset.meshCount || 0),
        surfaceAnchorCount: Number(body?.dataset.surfaceAnchorCount || 0),
        firstTextureUrl: body?.dataset.firstTextureUrl || '',
        textureQueueCount: Number(body?.dataset.textureQueueCount || 0),
        textureRequestCount: Number(body?.dataset.textureRequestCount || 0),
        textureErrorCount: Number(body?.dataset.textureErrorCount || 0),
        resourceCount: resources.length,
        resources: resources.slice(-15).map((entry) => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize,
          decodedBodySize: entry.decodedBodySize,
        })),
      };
    })()`);
    console.error('SEARCH TEXTURE VERIFICATION DEBUG', JSON.stringify({
      textureDebug,
      console: client.consoleMessages,
    }, null, 2));
    const completedAtDeadline =
      textureDebug.textureCount === visibleCardCount &&
      textureDebug.textureErrorCount === 0 &&
      textureDebug.textureQueueCount === 0;
    if (!completedAtDeadline) throw error;
  }
  await capture(client, castleOutputPath);
  client.consoleMessages.length = 0;
  const requestedFocusId = await client.evaluate(`(() => {
    const frame = document.getElementById('search-card-castle-frame');
    const cardId = frame?.contentDocument?.body.dataset.firstCardId || '';
     frame?.contentWindow?.postMessage(JSON.stringify({
       type: 'focusCard',
       cardId,
       animate: false,
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
      return (rect?.width || 0) >= innerWidth * .9 &&
        (rect?.height || 0) >= innerHeight * .85;
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
      textureCount: Number(body?.dataset.textureCount || 0),
      activeCategory: body?.dataset.activeCategory || '',
      cardCategories: body?.dataset.cardCategories || '',
      focusedCardId: body?.dataset.focusedCardId || '',
      focusMode: body?.dataset.focusMode || '',
      rendererInstanceId: body?.dataset.rendererInstanceId || '',
      castleMeshCount: Number(body?.dataset.castleMeshCount || 0),
      surfaceAnchorCount: Number(body?.dataset.surfaceAnchorCount || 0),
      modelPath: body?.dataset.modelAsset
        ? new URL(body.dataset.modelAsset).pathname
        : '',
      sceneObjectCount: Number(body?.dataset.sceneObjectCount || 0),
      bottomNavigation: Boolean(
        frame?.contentDocument?.querySelector('#hint, #navigation')
      ),
      fullscreen: body?.classList.contains('fullscreen-castle') || false,
      threeLoaded: Boolean(frame?.contentWindow?.THREE),
      framePath: frame ? new URL(frame.src).pathname : '',
      canvas: Boolean(canvas),
      width: rect?.width || 0,
      height: rect?.height || 0,
    };
  })()`);
  if (
    result.route !== '#/search' ||
    !result.frame ||
    !result.canvas ||
    result.rendererStatus !== 'ready' ||
    result.cardCount !== visibleCardCount ||
    result.meshCount !== visibleCardCount ||
    result.textureCount !== visibleCardCount ||
    result.activeCategory !== 'ALL CATEGORIES' ||
    result.cardCategories.split('|').filter(Boolean).length !== 5 ||
    result.textureCount < 1 ||
    result.focusedCardId !== requestedFocusId ||
    result.focusMode !== 'immediate' ||
    result.rendererInstanceId !== rendererInstanceId ||
    result.castleMeshCount < 1 ||
    result.surfaceAnchorCount !== 84 ||
    result.modelPath !== `${basePath}assets/assets/models/search_castle.glb` ||
    result.sceneObjectCount < 40 ||
    result.bottomNavigation ||
    !result.fullscreen ||
    !result.threeLoaded ||
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
    restored.cardCount !== visibleCardCount ||
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
  await client.evaluate(`(() => {
    const frame = document.getElementById('search-card-castle-frame');
    frame?.contentDocument?.getElementById('enter-fullscreen')?.click();
    return true;
  })()`);
  await waitFor(
    client,
    `document.getElementById('search-card-castle-frame')
      ?.contentDocument?.body.classList.contains('fullscreen-castle') === true`,
    'the Search castle to re-enter fullscreen before returning to categories',
    5000,
  );
  await client.evaluate(`(() => {
    const frame = document.getElementById('search-card-castle-frame');
    frame?.contentDocument?.getElementById('back-to-categories')?.click();
    return true;
  })()`);
  await waitFor(
    client,
    `location.hash === '#/search' &&
      document.getElementById('search-card-castle-frame') === null &&
      (() => {
        const raw = localStorage.getItem('flutter.search_path_state_v1');
        if (!raw) return false;
        const decoded = JSON.parse(raw);
        return JSON.parse(typeof decoded === 'string' ? decoded : raw)
          .castleActive === false;
      })()`,
    'the iframe CATEGORIES control to restore the Search category selector',
    5000,
  );
  const categoriesReturn = await client.evaluate(`(() => ({
    route: location.hash,
    frame: Boolean(document.getElementById('search-card-castle-frame')),
    castleActive: (() => {
      const raw = localStorage.getItem('flutter.search_path_state_v1');
      if (!raw) return null;
      const decoded = JSON.parse(raw);
      return JSON.parse(typeof decoded === 'string' ? decoded : raw).castleActive;
    })(),
  }))()`);
  if (
    categoriesReturn.route !== '#/search' ||
    categoriesReturn.frame ||
    categoriesReturn.castleActive !== false
  ) {
    throw new Error(
      `Invalid Search categories return: ${JSON.stringify(categoriesReturn)}`,
    );
  }
  console.log(JSON.stringify({
    ok: true,
    url,
    result,
    restored,
    categoriesReturn,
    screenshots: [
      castleOutputPath.pathname.slice(1),
      castleFullscreenOutputPath.pathname.slice(1),
    ],
    console: client.consoleMessages,
  }, null, 2));
}

async function verifyHome(client, url, mobile) {
  await client.evaluate(
    `localStorage.removeItem('flutter.home_experience_settings');
     location.hash = '#/home';
     location.reload();
     true`,
  );
  await waitFor(
    client,
    `document.querySelector('flutter-view') !== null`,
    'Home to start',
  );
  await delay(1000);
  const bootstrapConsole = [...client.consoleMessages];
  client.consoleMessages.length = 0;
  const viewport = await client.evaluate(`({width: innerWidth, height: innerHeight})`);
  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: viewport.width / 2,
    y: viewport.height - 32,
    button: 'left',
    clickCount: 1,
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: viewport.width / 2,
    y: viewport.height - 32,
    button: 'left',
    clickCount: 1,
  });
  await delay(1900);
  const result = await client.evaluate(`(() => {
    const view = document.querySelector('flutter-view');
    const rect = view?.getBoundingClientRect();
    return {
      route: location.hash,
      innerWidth,
      innerHeight,
      viewWidth: rect?.width || 0,
      viewHeight: rect?.height || 0,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      horizontalOverflow:
        document.documentElement.scrollWidth > innerWidth + 1,
    };
  })()`);
  const fatalConsoleMessages = client.consoleMessages.filter(
    ({ level }) => level === 'error',
  );
  if (
    result.route !== '#/home' ||
    !result.viewWidth ||
    !result.viewHeight ||
    result.horizontalOverflow ||
    fatalConsoleMessages.length
  ) {
    throw new Error(
      `Invalid Home result: ${JSON.stringify({result, fatalConsoleMessages})}`,
    );
  }
  const output = mobile ? homeMobileOutputPath : homeOutputPath;
  await capture(client, output);
  console.log(JSON.stringify({
    ok: true,
    url,
    mode: mobile ? 'mobile' : 'desktop',
    result,
    screenshot: output.pathname.slice(1),
    bootstrapConsole,
    console: client.consoleMessages,
  }, null, 2));
}

async function main() {
  const argumentsList = process.argv.slice(2);
  const verifySearch = argumentsList.includes('--search');
  const verifyHomeMode = argumentsList.includes('--home');
  const mobile = argumentsList.includes('--mobile');
  const requestedUrl = argumentsList.find((value) => !value.startsWith('--'));
  const server = requestedUrl ? null : await startServer();
  const url =
    requestedUrl ||
    `http://127.0.0.1:${port}${basePath}#/${
      verifySearch ? 'search' : verifyHomeMode ? 'home' : 'play'
    }`;
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
      `--window-size=${mobile ? '390,844' : '1440,1000'}`,
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
        width: mobile ? 390 : 1440,
        height: mobile ? 844 : 1000,
        deviceScaleFactor: 1,
        mobile,
      }),
    ]);

    await waitFor(
      client,
      `document.querySelector('flutter-view') !== null`,
      'Flutter to start',
    );
    if (verifyHomeMode) {
      await verifyHome(client, url, mobile);
      return;
    }
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
        `document.querySelector('[id^="dealer-3d-container-"]')
          ?.dataset.dealerStatus === 'ready'`,
        'the 3D dealer',
        120000,
      );
    } catch (error) {
      const debug = await client.evaluate(`(() => {
        const host = document.querySelector('[id^="dealer-3d-container-"]');
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
          modelAsset: host?.dataset.modelAsset,
          modelProgress: host?.dataset.modelProgress,
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
      const host = document.querySelector('[id^="dealer-3d-container-"]');
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
        modelAsset: host?.dataset.modelAsset,
        modelAnimations: host?.dataset.modelAnimations,
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
      `(() => {
        const host = document.querySelector('[id^="dealer-3d-container-"]');
        return window.puppetDealerDeal(host?.id || '', ${JSON.stringify(
          textureUrl,
        )});
      })()`,
    );
    if (!animationStarted) throw new Error('Dealer animation did not start.');
    await waitFor(
      client,
      `document.querySelector('[id^="dealer-3d-container-"]')
        ?.dataset.dealerAnimation !== 'idle'`,
      'the dealer animation to leave IDLE',
      3000,
    );
    let animationDiagnostic = await client.evaluate(
      `document.querySelector('[id^="dealer-3d-container-"]')
        ?.dataset.dealerAnimation || ''`,
    );
    await waitFor(
      client,
      `document.querySelector('[id^="dealer-3d-container-"]')
        ?.dataset.cardTexture === 'ready'`,
      'the real card texture',
      15000,
    );
    await waitFor(
      client,
      `document.querySelector('[id^="dealer-3d-container-"]')
        ?.dataset.dealerAnimation === 'idle'`,
      'the first dealer animation to finish',
      5000,
    );
    const texturedAnimationStarted = await client.evaluate(
      `(() => {
        const host = document.querySelector('[id^="dealer-3d-container-"]');
        return window.puppetDealerDeal(host?.id || '', ${JSON.stringify(
          textureUrl,
        )});
      })()`,
    );
    if (!texturedAnimationStarted) {
      throw new Error('Textured dealer animation did not restart.');
    }
    await waitFor(
      client,
      `document.querySelector('[id^="dealer-3d-container-"]')
        ?.dataset.dealerAnimation !== 'idle'`,
      'the textured dealer animation',
      3000,
    );
    animationDiagnostic = await client.evaluate(
      `document.querySelector('[id^="dealer-3d-container-"]')
        ?.dataset.dealerAnimation || ''`,
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
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
