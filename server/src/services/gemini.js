import { AppError } from '../utilities/errors.js';

function textFromGeminiResponse(payload) {
  return (payload?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

export class GeminiService {
  constructor(environment, { fetchImpl = globalThis.fetch } = {}) {
    this.environment = environment;
    this.fetchImpl = fetchImpl;
  }

  async generateContent({ contents, systemInstruction, signal }) {
    if (!this.environment.geminiApiKey) {
      throw new AppError(
        503,
        'PUBLIC_AI_NOT_CONFIGURED',
        'Public AI is not configured on the server.',
      );
    }

    const model = this.environment.geminiModel;
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const body = { contents };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.environment.geminiApiKey,
      },
      body: JSON.stringify(body),
      signal,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // Preserve the HTTP status even if Google returns a non-JSON error body.
    }

    if (!response.ok) {
      const error = new Error(payload?.error?.message || 'Gemini API request failed.');
      error.name = 'GeminiApiError';
      error.status = response.status;
      error.code = payload?.error?.status || `HTTP_${response.status}`;
      error.type = 'gemini_api_error';
      throw error;
    }

    return {
      text: textFromGeminiResponse(payload),
      model: payload?.modelVersion || model,
      id: response.headers.get('x-request-id') || null,
    };
  }

  async transcribe({ prompt, imageBytes, mimeType, signal }) {
    return this.generateContent({
      signal,
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBytes.toString('base64'),
            },
          },
        ],
      }],
    });
  }

  async chat({ instructions, history, message, signal }) {
    return this.generateContent({
      signal,
      systemInstruction: instructions,
      contents: [
        ...history.map(({ role, content }) => ({
          role: role === 'assistant' ? 'model' : 'user',
          parts: [{ text: content }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ],
    });
  }
}
