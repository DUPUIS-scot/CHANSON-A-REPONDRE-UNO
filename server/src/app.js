import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { createAiRouter } from './routes/ai.js';
import { createProfileRouter } from './routes/profile.js';
import { AppError } from './utilities/errors.js';

const safeRequestId = /^[A-Za-z0-9._:-]{1,128}$/;
const aiPathPattern = /^\/api\/(?:card-transcription|cards\/transcribe|chat|cards\/chat)$/;

function safeDiagnosticValue(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().slice(0, 128);
  return /^[A-Za-z0-9._:-]+$/.test(normalized) ? normalized : null;
}

export function createApp(environment, dependencies = {}) {
  const app = express();
  const startedAt = new Date().toISOString();
  const diagnostics = {
    lastAiSuccess: null,
    lastAiFailure: null,
  };
  app.disable('x-powered-by');
  app.use(helmet());
  app.use((request, response, next) => {
    const supplied = request.get('X-Request-ID') || '';
    request.requestId = safeRequestId.test(supplied) ? supplied : crypto.randomUUID();
    response.set('X-Request-ID', request.requestId);
    request.startedAt = Date.now();
    response.on('finish', () => {
      if (aiPathPattern.test(request.path) && response.statusCode < 400) {
        diagnostics.lastAiSuccess = {
          timestamp: new Date().toISOString(),
          requestId: request.requestId,
          path: request.path,
          status: response.statusCode,
          anonymousUser: request.authUser?.isAnonymous === true,
        };
      }
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        status: response.statusCode,
        durationMs: Date.now() - request.startedAt,
        authenticatedUserId: request.authUser?.id,
        anonymousUser: request.authUser?.isAnonymous,
        errorCode: response.locals.errorCode,
      }));
    });
    next();
  });

  const allowedOrigins = new Set(environment.allowedOrigins);
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'This origin is not allowed.'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    credentials: false,
    maxAge: 86400,
  }));
  app.use(express.json({ limit: environment.maxRequestBodyBytes }));

  app.get('/health', (_request, response) => response.json({
    status: 'ok',
    service: 'chanson-a-repondre-uno-backend',
  }));
  app.get('/ready', (_request, response) => response.json({
    status: 'ready',
    configuration: {
      byok: true,
      supabase: true,
      anonymousAi: Boolean(environment.geminiApiKey),
      anonymousAiProvider: 'gemini',
    },
  }));
  app.get('/diagnostics', (_request, response) => response.json({
    status: 'ok',
    service: 'chanson-a-repondre-uno-backend',
    runtime: {
      node: process.version,
      startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      renderCommit: safeDiagnosticValue(process.env.RENDER_GIT_COMMIT)?.slice(0, 12) || null,
    },
    configuration: {
      nodeEnvironment: environment.nodeEnvironment,
      geminiConfigured: Boolean(environment.geminiApiKey),
      geminiModel: environment.geminiModel,
      openAiByokSupported: true,
      openAiConfigured: Boolean(environment.openAiApiKey),
      openAiModel: environment.openaiModel,
      supabaseConfigured: Boolean(
        environment.supabaseUrl &&
        environment.supabasePublishableKey &&
        environment.supabaseServiceRoleKey,
      ),
      allowedOriginsCount: environment.allowedOrigins.length,
      requestTimeoutMs: environment.requestTimeoutMs,
      maxRequestBodyBytes: environment.maxRequestBodyBytes,
    },
    ai: diagnostics,
  }));

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler(request, response) {
      response.locals.errorCode = 'RATE_LIMITED';
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Try again later.',
          requestId: request.requestId,
        },
      });
    },
  });
  app.use(createProfileRouter(environment, dependencies));
  app.use(createAiRouter(environment, { ...dependencies, aiLimiter }));

  app.use((_request, _response, next) => {
    next(new AppError(404, 'NOT_FOUND', 'Endpoint not found.'));
  });
  app.use((error, request, response, _next) => {
    const payloadTooLarge =
      error?.type === 'entity.too.large' || error?.code === 'LIMIT_FILE_SIZE';
    const appError = payloadTooLarge
      ? new AppError(413, 'PAYLOAD_TOO_LARGE', 'The uploaded image is too large.', error)
      : error instanceof AppError
        ? error
        : new AppError(500, 'INTERNAL_ERROR', 'The backend could not complete the request.', error);
    if (aiPathPattern.test(request.path)) {
      const upstream = appError.cause;
      diagnostics.lastAiFailure = {
        timestamp: new Date().toISOString(),
        requestId: request.requestId,
        path: request.path,
        status: appError.status,
        code: appError.code,
        anonymousUser: request.authUser?.isAnonymous === true,
        upstream: upstream
          ? {
              name: safeDiagnosticValue(upstream.name),
              status: Number.isSafeInteger(upstream.status) ? upstream.status : null,
              code: safeDiagnosticValue(upstream.code),
              type: safeDiagnosticValue(upstream.type),
            }
          : null,
      };
    }
    response.locals.errorCode = appError.code;
    response.status(appError.status).json({
      error: {
        code: appError.code,
        message: appError.message,
        requestId: request.requestId,
      },
    });
  });
  return app;
}
