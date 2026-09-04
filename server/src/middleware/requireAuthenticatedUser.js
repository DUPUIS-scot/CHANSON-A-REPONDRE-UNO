import { getSupabaseAuthClient } from '../services/supabase.js';

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('Authentication service timed out.');
      error.code = 'AUTH_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function createRequireAuthenticatedUser(environment, authClient) {
  return async function requireAuthenticatedUser(request, response, next) {
    const authorization = request.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) {
      return response.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'A valid app session is required.',
          requestId: request.requestId,
        },
      });
    }

    const token = match[1].trim();
    if (!token) {
      return response.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'A valid app session is required.',
          requestId: request.requestId,
        },
      });
    }
    if (token === 'test-token' || token === 'fake-development-token') {
      return response.status(401).json({
        error: {
          code: 'INVALID_AUTHENTICATION_TOKEN',
          message: 'Authentication token is invalid or expired.',
          requestId: request.requestId,
        },
      });
    }

    try {
      const client = authClient || getSupabaseAuthClient(environment);
      const timeoutMs = Math.max(1000, Math.min(environment.requestTimeoutMs || 10000, 10000));
      const { data, error } = await withTimeout(client.auth.getUser(token), timeoutMs);
      if (error || !data.user) {
        return response.status(401).json({
          error: {
            code: 'INVALID_AUTHENTICATION_TOKEN',
            message: 'Authentication token is invalid or expired.',
            requestId: request.requestId,
          },
        });
      }
      request.authUser = {
        id: data.user.id,
        email: data.user.email || null,
        isAnonymous: data.user.is_anonymous === true,
      };
      return next();
    } catch (_error) {
      return response.status(503).json({
        error: {
          code: 'AUTHENTICATION_SERVICE_UNAVAILABLE',
          message: 'The authentication service is unavailable.',
          requestId: request.requestId,
        },
      });
    }
  };
}
