import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { EnvironmentError, parseEnvironment } from '../src/config/environment.js';

const source = {
  PORT: '3000',
  NODE_ENV: 'development',
  OPENAI_API_KEY: 'sk-safe-test-value',
  SUPABASE_URL: 'https://project-ref.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_safe_test',
  ALLOWED_ORIGINS: 'http://localhost:8080,https://jameshpdy-dev.github.io',
  REQUEST_TIMEOUT_MS: '1000',
  MAX_REQUEST_BODY_BYTES: '1048576',
};
const env = (overrides = {}) => parseEnvironment({ ...source, ...overrides });

async function withServer(app, action) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await action(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const acceptedAuth = {
  auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
};
const rejectedAuth = {
  auth: { getUser: async () => ({ data: { user: null }, error: new Error('invalid') }) },
};
const openai = {
  responses: {
    create: async (request) => ({
      id: 'response-1',
      model: request.model,
      output_text: request.input?.[0]?.content instanceof Array
        ? 'Exact transcription'
        : 'Assistant reply',
    }),
  },
};

test('configuration validates secrets, Supabase, and production origin', () => {
  assert.throws(() => env({ OPENAI_API_KEY: '' }), EnvironmentError);
  assert.throws(() => env({ SUPABASE_URL: 'https://your-project.supabase.co' }), EnvironmentError);
  assert.throws(
    () => env({ NODE_ENV: 'production', ALLOWED_ORIGINS: 'https://example.org' }),
    /jameshpdy-dev/,
  );
  assert.equal(env().allowedOrigins.length, 2);
});

test('health and readiness are public and secret-free', () =>
  withServer(createApp(env(), { authClient: rejectedAuth, openai }), async (url) => {
    for (const path of ['/health', '/ready']) {
      const response = await fetch(`${url}${path}`);
      assert.equal(response.status, 200);
      assert.equal((await response.text()).includes('sb_publishable'), false);
    }
  }));

test('protected endpoints reject missing, malformed, fake, and invalid tokens', () =>
  withServer(createApp(env(), { authClient: rejectedAuth, openai }), async (url) => {
    for (const authorization of [null, 'Token value', 'Bearer fake-development-token', 'Bearer invalid']) {
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({ message: 'Hello' }),
      });
      assert.equal(response.status, 401);
    }
  }));

test('chat validates messages and returns non-empty model output', () =>
  withServer(createApp(env(), { authClient: acceptedAuth, openai }), async (url) => {
    const headers = { Authorization: 'Bearer genuine-token', 'Content-Type': 'application/json' };
    assert.equal((await fetch(`${url}/api/chat`, {
      method: 'POST', headers, body: JSON.stringify({ message: ' ' }),
    })).status, 400);
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST', headers, body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).reply, 'Assistant reply');
  }));

test('card transcription rejects unsupported MIME and returns model output', () =>
  withServer(createApp(env(), { authClient: acceptedAuth, openai }), async (url) => {
    const headers = { Authorization: 'Bearer genuine-token' };
    const invalid = new FormData();
    invalid.append('image', new Blob(['x'], { type: 'text/plain' }), 'card.txt');
    assert.equal((await fetch(`${url}/api/card-transcription`, {
      method: 'POST', headers, body: invalid,
    })).status, 415);
    const valid = new FormData();
    valid.append('image', new Blob(['png'], { type: 'image/png' }), 'card.png');
    const response = await fetch(`${url}/api/card-transcription`, {
      method: 'POST', headers, body: valid,
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).transcription, 'Exact transcription');
  }));

test('CORS accepts Pages/local origins, rejects others, and supports preflight', () =>
  withServer(createApp(env(), { authClient: rejectedAuth, openai }), async (url) => {
    for (const origin of ['https://jameshpdy-dev.github.io', 'http://localhost:8080']) {
      const response = await fetch(`${url}/health`, { headers: { Origin: origin } });
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    }
    assert.equal((await fetch(`${url}/health`, {
      headers: { Origin: 'https://attacker.example' },
    })).status, 403);
    assert.equal((await fetch(`${url}/api/chat`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://jameshpdy-dev.github.io',
        'Access-Control-Request-Method': 'POST',
      },
    })).status, 204);
  }));
