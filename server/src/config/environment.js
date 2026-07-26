const placeholderPattern =
  /(replace[_ -]?with|placeholder|example|your[_ -]|real[_ -]?project|dummy)/i;

export class EnvironmentError extends Error {
  constructor(problems) {
    super(`Invalid backend configuration:\n${problems.map((item) => `- ${item}`).join('\n')}`);
    this.name = 'EnvironmentError';
    this.problems = problems;
  }
}

function positiveInteger(value, fallback, name, problems) {
  const parsed = Number.parseInt(value || String(fallback), 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    problems.push(`${name} must be a positive integer`);
    return fallback;
  }
  return parsed;
}

export function parseEnvironment(source, { allowTestValues = false } = {}) {
  const problems = [];
  const nodeEnvironment = (source.NODE_ENV || 'development').trim();
  const openaiApiKey = (source.OPENAI_API_KEY || '').trim();
  const supabaseUrl = (source.SUPABASE_URL || '').trim();
  const supabasePublishableKey = (source.SUPABASE_PUBLISHABLE_KEY || '').trim();

  if (!openaiApiKey || placeholderPattern.test(openaiApiKey)) {
    problems.push('OPENAI_API_KEY is missing or contains a placeholder');
  }

  let parsedSupabaseUrl;
  try {
    parsedSupabaseUrl = new URL(supabaseUrl);
  } catch {
    parsedSupabaseUrl = null;
  }
  if (
    placeholderPattern.test(supabaseUrl) ||
    !parsedSupabaseUrl ||
    parsedSupabaseUrl.protocol !== 'https:' ||
    !parsedSupabaseUrl.hostname.endsWith('.supabase.co')
  ) {
    problems.push('SUPABASE_URL is missing or invalid');
  }

  const legacyAnonKey =
    supabasePublishableKey.startsWith('eyJ') && supabasePublishableKey.length > 80;
  const modernPublishableKey = supabasePublishableKey.startsWith('sb_publishable_');
  const permittedTestKey = allowTestValues && supabasePublishableKey === 'test-publishable-key';
  if (
    placeholderPattern.test(supabasePublishableKey) ||
    (!modernPublishableKey && !legacyAnonKey && !permittedTestKey) ||
    /service[_-]?role|sb_secret_/i.test(supabasePublishableKey)
  ) {
    problems.push('SUPABASE_PUBLISHABLE_KEY is missing or invalid');
  }

  const allowedOrigins = (source.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  for (const origin of allowedOrigins) {
    try {
      const url = new URL(origin);
      if (url.origin !== origin) throw new Error();
    } catch {
      problems.push(`ALLOWED_ORIGINS contains an invalid origin: ${origin}`);
    }
  }
  if (
    nodeEnvironment === 'production' &&
    !allowedOrigins.includes('https://jameshpdy-dev.github.io')
  ) {
    problems.push('ALLOWED_ORIGINS must include https://jameshpdy-dev.github.io in production');
  }
  if (
    nodeEnvironment === 'production' &&
    parsedSupabaseUrl &&
    ['localhost', '127.0.0.1'].includes(parsedSupabaseUrl.hostname)
  ) {
    problems.push('SUPABASE_URL cannot use localhost in production');
  }
  const port = positiveInteger(source.PORT, 3000, 'PORT', problems);
  if (port > 65535) problems.push('PORT must not exceed 65535');

  const requestTimeoutMs = positiveInteger(
    source.REQUEST_TIMEOUT_MS,
    60000,
    'REQUEST_TIMEOUT_MS',
    problems,
  );
  const maxRequestBodyBytes = positiveInteger(
    source.MAX_REQUEST_BODY_BYTES,
    10 * 1024 * 1024,
    'MAX_REQUEST_BODY_BYTES',
    problems,
  );
  if (problems.length) throw new EnvironmentError(problems);

  return Object.freeze({
    port,
    nodeEnvironment,
    openaiApiKey,
    openaiModel: (source.OPENAI_MODEL || 'gpt-4o-mini').trim(),
    supabaseUrl,
    supabasePublishableKey,
    allowedOrigins,
    requestTimeoutMs,
    maxRequestBodyBytes,
  });
}
