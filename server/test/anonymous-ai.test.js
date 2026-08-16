import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../src/app.js';
import { parseEnvironment } from '../src/config/environment.js';
import { UserOpenAiService } from '../src/services/user-openai.js';

const environment = parseEnvironment({
  PORT: '3000',
  NODE_ENV: 'development',
  SUPABASE_URL: 'https://project-ref.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString('base64'),
  GEMINI_API_KEY: 'test-gemini-key',
  GEMINI_MODEL: 'gemini-2.5-flash',
  ALLOWED_ORIGINS: 'http://localhost:8080,https://www.chanson-a-repondre-uno.scot',
  REQUEST_TIMEOUT_MS: '1000',
  MAX_REQUEST_BODY_BYTES: '1048576',
}, { allowTestValues: true });

async function withServer(app, action) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await action(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

class EmptyCredentialStore {
  async get() {
    return null;
  }
  async put() {
    throw new Error('not expected');
  }
  async delete() {}
}

class FailingCredentialStore extends EmptyCredentialStore {
  async get() {
    throw new Error('anonymous AI must not query the credential store');
  }
}

const authClient = {
  auth: {
    getUser: async (token) => {
      if (token === 'guest-token') {
        return {
          data: { user: { id: 'guest-1', is_anonymous: true } },
          error: null,
        };
      }
      if (token === 'member-token') {
        return {
          data: {
            user: {
              id: 'member-1',
              email: 'member@example.com',
              is_anonymous: false,
            },
          },
          error: null,
        };
      }
      return { data: { user: null }, error: new Error('invalid') };
    },
  },
};

function dependencies({ store = new EmptyCredentialStore() } = {}) {
  const geminiCalls = [];
  return {
    geminiCalls,
    authClient,
    geminiService: {
      async chat(request) {
        geminiCalls.push({ kind: 'chat', request });
        return { text: 'Guest assistant reply', model: 'gemini-2.5-flash', id: 'gemini-chat' };
      },
      async transcribe(request) {
        geminiCalls.push({ kind: 'transcribe', request });
        return { text: 'Guest transcription', model: 'gemini-2.5-flash', id: 'gemini-transcribe' };
      },
    },
    userOpenAiService: new UserOpenAiService(environment, {
      store,
      openAiFactory: () => ({ models: { list: async () => ({ data: [] }) } }),
    }),
  };
}

const jsonHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

test('anonymous Supabase JWT uses Gemini for chat and transcription without BYOK lookup', () => {
  const deps = dependencies({ store: new FailingCredentialStore() });
  return withServer(createApp(environment, deps), async (url) => {
    const chat = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: jsonHeaders('guest-token'),
      body: JSON.stringify({
        message: 'Explain this card',
        transcription: 'Bonjour le monde',
      }),
    });
    assert.equal(chat.status, 200);
    const chatBody = await chat.json();
    assert.equal(chatBody.reply, 'Guest assistant reply');
    assert.equal(chatBody.model, 'gemini-2.5-flash');

    const form = new FormData();
    form.set('image', new Blob([Buffer.from('image')], { type: 'image/png' }), 'card.png');
    form.set('cardId', 'BRIO-001');
    const transcription = await fetch(`${url}/api/card-transcription`, {
      method: 'POST',
      headers: { Authorization: 'Bearer guest-token' },
      body: form,
    });
    assert.equal(transcription.status, 200);
    const transcriptionBody = await transcription.json();
    assert.equal(transcriptionBody.transcription, 'Guest transcription');
    assert.equal(transcriptionBody.model, 'gemini-2.5-flash');

    assert.deepEqual(deps.geminiCalls.map(({ kind }) => kind), ['chat', 'transcribe']);
  });
});

test('Gemini shared key is not available to unauthenticated or permanent users', () => {
  const deps = dependencies();
  return withServer(createApp(environment, deps), async (url) => {
    const noSession = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(noSession.status, 401);

    const permanentWithoutByok = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: jsonHeaders('member-token'),
      body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(permanentWithoutByok.status, 409);
    assert.equal(
      (await permanentWithoutByok.json()).error.code,
      'OPENAI_CONNECTION_REQUIRED',
    );

    assert.equal(deps.geminiCalls.length, 0);
  });
});
