import { getSupabaseAuthClient } from '../services/supabase.js';

export function createRequireAuthenticatedUser(environment, authClient) {
  return async function requireAuthenticatedUser(request, response, next) {
  const authorization = request.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) {
    return response.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to use this feature.',
        requestId: request.requestId,
      },
    });
  }

  const token = match[1].trim();
  if (!token) {
    return response.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to use this feature.',
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
    const { data, error } = await client.auth.getUser(token);
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
    };
    return next();
  } catch (error) {
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
