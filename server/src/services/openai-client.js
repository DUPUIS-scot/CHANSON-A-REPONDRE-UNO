import OpenAI from 'openai';

let client;
let signature;

export function getOpenAiClient(environment) {
  const nextSignature = `${environment.openaiApiKey}:${environment.requestTimeoutMs}`;
  if (!client || signature !== nextSignature) {
    client = new OpenAI({
      apiKey: environment.openaiApiKey,
      timeout: environment.requestTimeoutMs,
      maxRetries: 2,
    });
    signature = nextSignature;
  }
  return client;
}
