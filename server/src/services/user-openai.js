import OpenAI from 'openai';

import { decryptCredential, encryptCredential, maskCredential } from './credential-crypto.js';
import { SupabaseCredentialStore } from './credential-store.js';
import { AppError, mapUpstreamError } from '../utilities/errors.js';

const apiKeyPattern = /^sk-[A-Za-z0-9_-]{12,}$/;

export class UserOpenAiService {
  constructor(environment, { store, openAiFactory } = {}) {
    this.environment = environment;
    this.store = store || new SupabaseCredentialStore(environment);
    this.openAiFactory =
      openAiFactory ||
      ((apiKey) => new OpenAI({
        apiKey,
        timeout: environment.requestTimeoutMs,
        maxRetries: 1,
      }));
  }

  async status(userId) {
    const record = await this.store.get(userId);
    return record
      ? {
          connected: true,
          maskedKey: record.masked_key,
          updatedAt: record.updated_at,
        }
      : { connected: false, maskedKey: null, updatedAt: null };
  }

  async clientFor(userId, { allowSharedKey = false } = {}) {
    const record = await this.store.get(userId);
    if (record) {
      const apiKey = decryptCredential(record, this.environment.credentialEncryptionKey);
      return this.openAiFactory(apiKey);
    }
    if (allowSharedKey) {
      if (!this.environment.openAiApiKey) {
        throw new AppError(
          503,
          'PUBLIC_AI_NOT_CONFIGURED',
          'Public AI is not configured on the server.',
        );
      }
      return this.openAiFactory(this.environment.openAiApiKey);
    }
    throw new AppError(
      409,
      'OPENAI_CONNECTION_REQUIRED',
      'Connect your OpenAI API account in Profile to use this AI feature.',
    );
  }

  async validate(apiKey) {
    const normalized = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!apiKeyPattern.test(normalized)) {
      throw new AppError(
        400,
        'OPENAI_CREDENTIAL_INVALID',
        'OpenAI API key could not be authenticated.',
      );
    }
    try {
      await this.openAiFactory(normalized).models.list();
      return normalized;
    } catch (error) {
      const mapped = mapUpstreamError(error);
      throw new AppError(
        mapped.status === 504 ? 504 : 400,
        'OPENAI_CREDENTIAL_INVALID',
        'OpenAI API key could not be authenticated.',
      );
    }
  }

  async connect(userId, apiKey, { replace = false } = {}) {
    const current = await this.store.get(userId);
    if (current && !replace) {
      throw new AppError(409, 'OPENAI_ALREADY_CONNECTED', 'OpenAI is already connected.');
    }
    const normalized = await this.validate(apiKey);
    const encrypted = encryptCredential(
      normalized,
      this.environment.credentialEncryptionKey,
    );
    const maskedKey = maskCredential(normalized);
    const updatedAt = await this.store.put(userId, { ...encrypted, maskedKey });
    return { connected: true, maskedKey, updatedAt };
  }

  async test(userId) {
    const client = await this.clientFor(userId);
    try {
      await client.models.list();
      return { connected: true, message: 'OpenAI connection successful.' };
    } catch {
      throw new AppError(
        400,
        'OPENAI_CONNECTION_FAILED',
        'OpenAI connection failed. Replace or reconnect your API key.',
      );
    }
  }

  async disconnect(userId) {
    await this.store.delete(userId);
  }
}
