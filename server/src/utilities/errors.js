export class AppError extends Error {
  constructor(status, code, message, cause) {
    super(message, { cause });
    this.status = status;
    this.code = code;
  }
}

export function mapUpstreamError(error) {
  if (error instanceof AppError) return error;
  if (error?.name === 'AbortError') {
    return new AppError(504, 'UPSTREAM_TIMEOUT', 'The AI service took too long to respond.');
  }
  if (error?.status === 401) {
    return new AppError(
      502,
      'OPENAI_AUTHENTICATION_FAILED',
      'OpenAI connection failed. Replace or reconnect your API key.',
    );
  }
  if (error?.status === 429) {
    return new AppError(429, 'OPENAI_RATE_LIMITED', 'The AI service is temporarily busy. Try again later.');
  }
  return new AppError(502, 'UPSTREAM_UNAVAILABLE', 'The AI service is temporarily unavailable.');
}
