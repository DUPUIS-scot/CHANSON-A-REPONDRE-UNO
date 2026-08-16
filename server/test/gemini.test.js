import assert from 'node:assert/strict';
import test from 'node:test';

import { parseEnvironment } from '../src/config/environment.js';
import { GeminiService } from '../src/services/gemini.js';

const environment = parseEnvironment({
  PORT: '3000',
  NODE_ENV: 'development',
  SUPABASE_URL: 'https://project-ref.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString('base64'),
  GEMINI_API_KEY: 'gemini-secret-test-key',
  GEMINI_MODEL: 'gemini-2.5-flash',
  ALLOWED_ORIGINS: 'https://www.chanson-a-repondre-uno.scot',
}, { allowTestValues: true });

test('Gemini transcription sends inline base64 image with API key header', async () => {
  const requests = [];
  const service = new GeminiService(environment, {
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Exact card text' }] } }],
        modelVersion: 'gemini-2.5-flash',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'x-request-id': 'gemini-1' },
      });
    },
  });

  const result = await service.transcribe({
    prompt: 'Transcribe exactly.',
    imageBytes: Buffer.from('image-bytes'),
    mimeType: 'image/png',
  });

  assert.equal(result.text, 'Exact card text');
  assert.equal(result.model, 'gemini-2.5-flash');
  assert.equal(result.id, 'gemini-1');
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /gemini-2\.5-flash:generateContent$/);
  assert.equal(requests[0].options.headers['x-goog-api-key'], 'gemini-secret-test-key');
  const payload = JSON.parse(requests[0].options.body);
  assert.equal(payload.contents[0].parts[0].text, 'Transcribe exactly.');
  assert.equal(payload.contents[0].parts[1].inline_data.mime_type, 'image/png');
  assert.equal(
    Buffer.from(payload.contents[0].parts[1].inline_data.data, 'base64').toString(),
    'image-bytes',
  );
});

test('Gemini chat maps assistant history to model role and uses system instructions', async () => {
  let payload;
  const service = new GeminiService(environment, {
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body);
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Gemini reply' }] } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  const result = await service.chat({
    instructions: 'Ground answers in the transcription.',
    history: [
      { role: 'user', content: 'Question one' },
      { role: 'assistant', content: 'Answer one' },
    ],
    message: 'Question two',
  });

  assert.equal(result.text, 'Gemini reply');
  assert.equal(payload.systemInstruction.parts[0].text, 'Ground answers in the transcription.');
  assert.deepEqual(payload.contents.map(({ role }) => role), ['user', 'model', 'user']);
});

test('Gemini HTTP errors preserve sanitized upstream status and code', async () => {
  const service = new GeminiService(environment, {
    fetchImpl: async () => new Response(JSON.stringify({
      error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded' },
    }), { status: 429, headers: { 'Content-Type': 'application/json' } }),
  });

  await assert.rejects(
    () => service.chat({ instructions: 'Test', history: [], message: 'Hello' }),
    (error) => {
      assert.equal(error.name, 'GeminiApiError');
      assert.equal(error.status, 429);
      assert.equal(error.code, 'RESOURCE_EXHAUSTED');
      assert.equal(error.type, 'gemini_api_error');
      return true;
    },
  );
});
