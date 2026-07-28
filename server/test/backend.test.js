import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../src/app.js';
import { EnvironmentError, parseEnvironment } from '../src/config/environment.js';
import { UserOpenAiService } from '../src/services/user-openai.js';

const source = {
  PORT: '3000',
  NODE_ENV: 'development',
  SUPABASE_URL: 'https://project-ref.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
  ALLOWED_ORIGINS: 'http://localhost:8080,https://jameshpdy-dev.github.io',
  REQUEST_TIMEOUT_MS: '1000',
  MAX_REQUEST_BODY_BYTES: '1048576',
};
const env = (overrides = {}) =>
  parseEnvironment({ ...source, ...overrides }, { allowTestValues: true });

async function withServer(app, action) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await action(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

class MemoryCredentialStore {
  records = new Map();

  async get(userId) {
    return this.records.get(userId) || null;
  }

  async put(userId, record) {
    const updatedAt = new Date().toISOString();
    this.records.set(userId, {
      user_id: userId,
      encrypted_key: record.ciphertext,
      iv: record.iv,
      auth_tag: record.authTag,
      encryption_version: record.version,
      masked_key: record.maskedKey,
      updated_at: updatedAt,
    });
    return updatedAt;
  }

  async delete(userId) {
    this.records.delete(userId);
  }
}

const rejectedAuth = {
  auth: {
    getUser: async () => ({
      data: { user: null },
      error: new Error('invalid'),
    }),
  },
};

const perUserAuth = {
  auth: {
    getUser: async (token) => {
      const id = token === 'token-a'
        ? 'user-a'
        : token === 'token-b'
          ? 'user-b'
          : null;
      return id
        ? { data: { user: { id } }, error: null }
        : { data: { user: null }, error: new Error('invalid') };
    },
  },
};

function testDependencies({ invalidKeys = new Set() } = {}) {
  const store = new MemoryCredentialStore();
  const calls = [];
  const openAiFactory = (apiKey) => ({
    models: {
      list: async () => {
        if (invalidKeys.has(apiKey)) throw Object.assign(new Error('invalid'), { status: 401 });
        return { data: [] };
      },
    },
    responses: {
      create: async (request) => {
        calls.push({ apiKey, request });
        return {
          id: 'response-1',
          model: request.model,
          output_text: request.input?.[0]?.content instanceof Array
            ? `Exact transcription for ${apiKey.slice(-4)}`
            : `Assistant reply for ${apiKey.slice(-4)}`,
        };
      },
    },
  });
  return {
    store,
    calls,
    authClient: perUserAuth,
    userOpenAiService: new UserOpenAiService(env(), { store, openAiFactory }),
  };
}

const jsonHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

test('configuration requires backend credential storage secrets, not a shared OpenAI key', () => {
  assert.throws(() => env({ CREDENTIAL_ENCRYPTION_KEY: '' }), EnvironmentError);
  assert.throws(() => env({ SUPABASE_SERVICE_ROLE_KEY: '' }), EnvironmentError);
  assert.throws(() => env({ SUPABASE_URL: 'https://your-project.supabase.co' }), EnvironmentError);
  assert.doesNotThrow(() => env({ OPENAI_API_KEY: '' }));
});

test('health and readiness are public and secret-free', () =>
  withServer(createApp(env(), {
    authClient: rejectedAuth,
    userOpenAiService: testDependencies().userOpenAiService,
  }), async (url) => {
    for (const path of ['/health', '/ready']) {
      const response = await fetch(`${url}${path}`);
      assert.equal(response.status, 200);
      const body = await response.text();
      assert.equal(body.includes('service-role'), false);
      assert.equal(body.includes(source.CREDENTIAL_ENCRYPTION_KEY), false);
    }
  }));

test('protected endpoints reject missing, fake, and invalid tokens', () =>
  withServer(createApp(env(), {
    authClient: rejectedAuth,
    userOpenAiService: testDependencies().userOpenAiService,
  }), async (url) => {
    for (const authorization of [null, 'Bearer fake-development-token', 'Bearer invalid']) {
      const response = await fetch(`${url}/api/profile/openai-status`, {
        headers: authorization ? { Authorization: authorization } : {},
      });
      assert.equal(response.status, 401);
    }
  }));

test('credentials are encrypted, masked, isolated by user, and never returned', () => {
  const dependencies = testDependencies();
  const keyA = 'sk-proj-user-a-secret-1234';
  return withServer(createApp(env(), dependencies), async (url) => {
    const connect = await fetch(`${url}/api/profile/openai-credential`, {
      method: 'POST',
      headers: jsonHeaders('token-a'),
      body: JSON.stringify({ apiKey: keyA }),
    });
    assert.equal(connect.status, 201);
    const connectText = await connect.text();
    assert.equal(connectText.includes(keyA), false);
    assert.equal(JSON.parse(connectText).maskedKey.endsWith('1234'), true);

    const stored = dependencies.store.records.get('user-a');
    assert.equal(stored.encrypted_key.includes(keyA), false);
    assert.equal(dependencies.store.records.has('user-b'), false);

    const statusA = await (await fetch(`${url}/api/profile/openai-status`, {
      headers: jsonHeaders('token-a'),
    })).json();
    const statusB = await (await fetch(`${url}/api/profile/openai-status`, {
      headers: jsonHeaders('token-b'),
    })).json();
    assert.equal(statusA.connected, true);
    assert.equal(statusB.connected, false);
    assert.equal(JSON.stringify(statusA).includes(keyA), false);
  });
});

test('AI requests use only the authenticated user credential', () => {
  const dependencies = testDependencies();
  const keyA = 'sk-proj-user-a-secret-1234';
  const keyB = 'sk-proj-user-b-secret-5678';
  return withServer(createApp(env(), dependencies), async (url) => {
    for (const [token, apiKey] of [['token-a', keyA], ['token-b', keyB]]) {
      assert.equal((await fetch(`${url}/api/profile/openai-credential`, {
        method: 'POST',
        headers: jsonHeaders(token),
        body: JSON.stringify({ apiKey }),
      })).status, 201);
    }
    for (const token of ['token-a', 'token-b']) {
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: jsonHeaders(token),
        body: JSON.stringify({ message: 'Hello' }),
      });
      assert.equal(response.status, 200);
    }
    const png = new Blob([Buffer.from('image')], { type: 'image/png' });
    const form = new FormData();
    form.set('image', png, 'card.png');
    form.set('cardId', 'final-84-01');
    const transcription = await fetch(`${url}/api/card-transcription`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-a' },
      body: form,
    });
    assert.equal(transcription.status, 200);
    assert.deepEqual(
      dependencies.calls.map(({ apiKey }) => apiKey),
      [keyA, keyB, keyA],
    );
  });
});

test('profile connection test verifies the saved user credential without exposing it', () => {
  const dependencies = testDependencies();
  const apiKey = 'sk-proj-user-a-secret-1234';
  return withServer(createApp(env(), dependencies), async (url) => {
    await fetch(`${url}/api/profile/openai-credential`, {
      method: 'POST',
      headers: jsonHeaders('token-a'),
      body: JSON.stringify({ apiKey }),
    });
    const response = await fetch(`${url}/api/profile/openai-test`, {
      method: 'POST',
      headers: jsonHeaders('token-a'),
    });
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.match(text, /OpenAI connection successful/);
    assert.equal(text.includes(apiKey), false);
  });
});

test('missing connection blocks AI and invalid replacement retains the valid key', () => {
  const invalid = 'sk-proj-invalid-secret-0000';
  const dependencies = testDependencies({ invalidKeys: new Set([invalid]) });
  const valid = 'sk-proj-valid-secret-1234';
  return withServer(createApp(env(), dependencies), async (url) => {
    const missing = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: jsonHeaders('token-b'),
      body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(missing.status, 409);
    assert.equal((await missing.json()).error.code, 'OPENAI_CONNECTION_REQUIRED');

    await fetch(`${url}/api/profile/openai-credential`, {
      method: 'POST',
      headers: jsonHeaders('token-a'),
      body: JSON.stringify({ apiKey: valid }),
    });
    const before = dependencies.store.records.get('user-a').encrypted_key;
    const replacement = await fetch(`${url}/api/profile/openai-credential`, {
      method: 'PUT',
      headers: jsonHeaders('token-a'),
      body: JSON.stringify({ apiKey: invalid }),
    });
    assert.equal(replacement.status, 400);
    assert.equal(dependencies.store.records.get('user-a').encrypted_key, before);
  });
});

test('disconnect removes only the credential and leaves other app data untouched', () => {
  const dependencies = testDependencies();
  return withServer(createApp(env(), dependencies), async (url) => {
    await fetch(`${url}/api/profile/openai-credential`, {
      method: 'POST',
      headers: jsonHeaders('token-a'),
      body: JSON.stringify({ apiKey: 'sk-proj-user-a-secret-1234' }),
    });
    const response = await fetch(`${url}/api/profile/openai-credential`, {
      method: 'DELETE',
      headers: jsonHeaders('token-a'),
    });
    assert.equal(response.status, 204);
    assert.equal(dependencies.store.records.has('user-a'), false);
  });
});

test('CORS accepts Pages/local origins and BYOK methods', () =>
  withServer(createApp(env(), {
    authClient: rejectedAuth,
    userOpenAiService: testDependencies().userOpenAiService,
  }), async (url) => {
    for (const origin of ['https://jameshpdy-dev.github.io', 'http://localhost:8080']) {
      const response = await fetch(`${url}/health`, { headers: { Origin: origin } });
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    }
    const preflight = await fetch(`${url}/api/profile/openai-credential`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://jameshpdy-dev.github.io',
        'Access-Control-Request-Method': 'PUT',
      },
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get('access-control-allow-methods'), /PUT/);
  }));
