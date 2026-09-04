import express from 'express';

import { createRequireAuthenticatedUser } from '../middleware/requireAuthenticatedUser.js';
import { UserOpenAiService } from '../services/user-openai.js';

export function createProfileRouter(environment, dependencies = {}) {
  const router = express.Router();
  const authenticate = createRequireAuthenticatedUser(
    environment,
    dependencies.authClient,
  );
  const profileLimiter = dependencies.profileLimiter || ((_request, _response, next) => next());
  const credentials =
    dependencies.userOpenAiService ||
    new UserOpenAiService(environment, dependencies);

  router.get('/api/profile/openai-status', profileLimiter, authenticate, async (request, response, next) => {
    try {
      response.json(await credentials.status(request.authUser.id));
    } catch (error) {
      next(error);
    }
  });
  router.post('/api/profile/openai-credential', profileLimiter, authenticate, async (request, response, next) => {
    try {
      response.status(201).json(
        await credentials.connect(request.authUser.id, request.body?.apiKey),
      );
    } catch (error) {
      next(error);
    }
  });
  router.put('/api/profile/openai-credential', profileLimiter, authenticate, async (request, response, next) => {
    try {
      response.json(
        await credentials.connect(
          request.authUser.id,
          request.body?.apiKey,
          { replace: true },
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post('/api/profile/openai-test', profileLimiter, authenticate, async (request, response, next) => {
    try {
      response.json(await credentials.test(request.authUser.id));
    } catch (error) {
      next(error);
    }
  });
  router.delete('/api/profile/openai-credential', profileLimiter, authenticate, async (request, response, next) => {
    try {
      await credentials.disconnect(request.authUser.id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  return router;
}
