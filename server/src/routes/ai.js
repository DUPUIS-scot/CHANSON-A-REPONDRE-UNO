import express from 'express';
import multer from 'multer';

import { createRequireAuthenticatedUser } from '../middleware/requireAuthenticatedUser.js';
import { GeminiService } from '../services/gemini.js';
import { UserOpenAiService } from '../services/user-openai.js';
import { AppError, mapUpstreamError } from '../utilities/errors.js';

const imageMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const supportedRoles = new Set(['user', 'assistant']);

export function createAiRouter(environment, dependencies = {}) {
  const router = express.Router();
  const userOpenAi =
    dependencies.userOpenAiService ||
    new UserOpenAiService(environment, dependencies);
  const gemini = dependencies.geminiService || new GeminiService(environment, dependencies);
  const authenticate = createRequireAuthenticatedUser(
    environment,
    dependencies.authClient,
  );
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: environment.maxRequestBodyBytes, files: 1 },
    fileFilter(_request, file, callback) {
      if (!imageMimeTypes.has(file.mimetype)) {
        return callback(new AppError(
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          'Use a PNG, JPEG, or WebP card image.',
        ));
      }
      callback(null, true);
    },
  });
  const protect = [dependencies.aiLimiter, authenticate].filter(Boolean);

  const transcriptionHandler = async (request, response, next) => {
    try {
      if (!request.file || request.file.size === 0) {
        throw new AppError(400, 'IMAGE_REQUIRED', 'A non-empty card image is required.');
      }
      const mode = request.body.mode === 'clean' ? 'clean' : 'exact';
      const prompt = mode === 'clean'
        ? 'Transcribe every readable word. Normalize obvious spacing and line-wrap artifacts only. Preserve the original language, wording, headings, lists and meaningful line breaks. Do not summarize, explain, translate or invent. Mark uncertain text as [uncertain] and unreadable text as [unreadable]. Return plain UTF-8 text only.'
        : 'Transcribe every readable word exactly. Preserve the original language, spelling, punctuation, headings, lists and meaningful line breaks. Do not summarize, explain, translate or invent. Mark uncertain text as [uncertain] and unreadable text as [unreadable]. Ignore decorative borders. Return plain UTF-8 text only.';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), environment.requestTimeoutMs);
      let transcription;
      let model;
      let requestId;
      try {
        if (request.authUser.isAnonymous) {
          const result = await gemini.transcribe({
            prompt,
            imageBytes: request.file.buffer,
            mimeType: request.file.mimetype,
            signal: controller.signal,
          });
          transcription = result.text;
          model = result.model;
          requestId = result.id;
        } else {
          const openai = await userOpenAi.clientFor(request.authUser.id);
          const result = await openai.responses.create({
            model: environment.openaiModel,
            input: [{
              role: 'user',
              content: [
                { type: 'input_text', text: prompt },
                {
                  type: 'input_image',
                  image_url: `data:${request.file.mimetype};base64,${request.file.buffer.toString('base64')}`,
                  detail: 'high',
                },
              ],
            }],
          }, { signal: controller.signal });
          transcription = (result.output_text || '').trim();
          model = result.model || environment.openaiModel;
          requestId = result.id;
        }
      } finally {
        clearTimeout(timer);
      }
      transcription = (transcription || '').trim();
      if (!transcription) {
        throw new AppError(502, 'INVALID_UPSTREAM_RESPONSE', 'No readable text was detected.');
      }
      response.json({
        cardId: request.body.cardId || null,
        transcription,
        exactText: mode === 'exact' ? transcription : '',
        cleanedText: mode === 'clean' ? transcription : null,
        detectedLanguage: 'und',
        status: /\[(uncertain|unreadable)\]/i.test(transcription)
          ? 'needsReview'
          : 'unreviewed',
        model: model || (request.authUser.isAnonymous ? environment.geminiModel : environment.openaiModel),
        requestId: requestId || request.requestId,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      next(mapUpstreamError(error));
    }
  };

  const chatHandler = async (request, response, next) => {
    try {
      const body = request.body || {};
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) throw new AppError(400, 'INVALID_MESSAGE', 'Message is required.');
      if (message.length > 8000) {
        throw new AppError(400, 'MESSAGE_TOO_LONG', 'Message is too long.');
      }
      if (!Array.isArray(body.history ?? body.conversation ?? [])) {
        throw new AppError(400, 'INVALID_HISTORY', 'Conversation history is invalid.');
      }
      const rawHistory = body.history ?? body.conversation ?? [];
      const invalidHistory = rawHistory.some(
        (item) =>
          !item ||
          !supportedRoles.has(item.role) ||
          typeof item.content !== 'string' ||
          item.content.length > 8000,
      );
      if (invalidHistory) {
        throw new AppError(400, 'INVALID_HISTORY', 'Conversation history is invalid.');
      }
      const history = rawHistory.slice(-12).map(({ role, content }) => ({
        role,
        content: content.trim(),
      }));
      const transcription =
        typeof body.transcription === 'string' ? body.transcription.slice(0, 30000) : '';
      const cardTitle = body.cardTitle || body.title || body.cardId || 'selected card';
      const instructions = transcription
        ? `You are the card discussion assistant for Chanson a Repondre. The transcription is the primary source. Ground answers in it, label interpretation and uncertainty, and never invent unreadable text. Card: ${cardTitle}\nTranscription:\n${transcription}`
        : 'Answer the user clearly. Do not claim access to card text that was not supplied.';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), environment.requestTimeoutMs);
      let reply;
      let model;
      let requestId;
      try {
        if (request.authUser.isAnonymous) {
          const result = await gemini.chat({
            instructions,
            history,
            message,
            signal: controller.signal,
          });
          reply = result.text;
          model = result.model;
          requestId = result.id;
        } else {
          const openai = await userOpenAi.clientFor(request.authUser.id);
          const result = await openai.responses.create({
            model: environment.openaiModel,
            instructions,
            input: [...history, { role: 'user', content: message }],
          }, { signal: controller.signal });
          reply = (result.output_text || '').trim();
          model = result.model || environment.openaiModel;
          requestId = result.id;
        }
      } finally {
        clearTimeout(timer);
      }
      reply = (reply || '').trim();
      if (!reply) {
        throw new AppError(502, 'INVALID_UPSTREAM_RESPONSE', 'The AI response was empty.');
      }
      response.json({
        cardId: body.cardId || null,
        reply,
        message: reply,
        model: model || (request.authUser.isAnonymous ? environment.geminiModel : environment.openaiModel),
        requestId: requestId || request.requestId,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      next(mapUpstreamError(error));
    }
  };

  router.post('/api/card-transcription', ...protect, upload.single('image'), transcriptionHandler);
  router.post('/api/cards/transcribe', ...protect, upload.single('image'), transcriptionHandler);
  router.post('/api/chat', ...protect, chatHandler);
  router.post('/api/cards/chat', ...protect, chatHandler);
  return router;
}
