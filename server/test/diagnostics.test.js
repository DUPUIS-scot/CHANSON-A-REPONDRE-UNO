import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../src/app.js';
import { parseEnvironment } from '../src/config/environment.js';

const secrets = {
  publishable: 'test-publishable-key',
  serviceRole: 'test-service-role-key',
  encryption: Buffer.alloc(32, 9).toString('base64'),
  gemini: 'test-gemini-secret-key',
};

const environment = parseEnvironment({
  PORT: '3000',
  NODE_ENV: 'development',
  SUPABASE_URL: 'https://project-ref.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: secrets.publishable,
  SUPABASE_SERVICE_ROLE_KEY: secrets.serviceRole,
  CREDENTIAL_ENCRYPTION_KEY: secrets.encryption,
  GEMINI_API_KEY: secrets.gemini,
  GEMINI_MODEL: 'gemini-2.5-flash',
  ALLOWED_ORIGINS: 'https://www.chanson-a-repondre-uno.scot',
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

const anonymousAuth = {
  auth: {
    getUser: async () => ({
      data: {
        user: {
          id: 'anonymous-user',
          email: null,
          is_anonymous: true,
        },
      },
      error: null,
    }),
  },
};

test('diagnostics expose Gemini operational state without secrets or AI content', () => {
  const upstreamError = Object.assign(new Error('private upstream details'), {
    name: 'GeminiApiError',
    status: 503,
    code: 'UNAVAILABLE',
    type: 'gemini_api_error',
  });
  const geminiService = {
    transcribe: async () => {
      throw upstreamError;
    },
  };

  return withServer(createApp(environment, {
    authClient: anonymousAuth,
    geminiService,
  }), async (url) => {
    const initial = await fetch(`${url}/diagnostics`);
    assert.equal(initial.status, 200);
    const initialText = await initial.text();
    for (const secret of Object.values(secrets)) {
      assert.equal(initialText.includes(secret), false);
    }

    const initialBody = JSON.parse(initialText);
    assert.equal(initialBody.configuration.geminiConfigured, true);
    assert.equal(initialBody.configuration.geminiModel, 'gemini-2.5-flash');

    const form = new FormData();
    form.set('image', new Blob([Buffer.from('image')], { type: 'image/png' }), 'card.png');
    form.set('cardId', 'final-84-01');
    const failure = await fetch(`${url}/api/card-transcription`, {
      method: 'POST',
      headers: { Authorization: 'Bearer anonymous-token' },
      body: form,
    });
    assert.equal(failure.status, 502);

    const diagnosticsResponse = await fetch(`${url}/diagnostics`);
    assert.equal(diagnosticsResponse.status, 200);
    const diagnosticsText = await diagnosticsResponse.text();
    assert.equal(diagnosticsText.includes('private upstream details'), false);
    for (const secret of Object.values(secrets)) {
      assert.equal(diagnosticsText.includes(secret), false);
    }

    const diagnostics = JSON.parse(diagnosticsText);
    assert.equal(diagnostics.configuration.geminiConfigured, true);
    assert.equal(diagnostics.configuration.supabaseConfigured, true);
    assert.equal(diagnostics.ai.lastAiFailure.code, 'UPSTREAM_UNAVAILABLE');
    assert.equal(diagnostics.ai.lastAiFailure.status, 502);
    assert.equal(diagnostics.ai.lastAiFailure.anonymousUser, true);
    assert.equal(diagnostics.ai.lastAiFailure.upstream.status, 503);
    assert.equal(diagnostics.ai.lastAiFailure.upstream.code, 'UNAVAILABLE');
    assert.equal(diagnostics.ai.lastAiFailure.upstream.type, 'gemini_api_error');
  });
});
