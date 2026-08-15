import 'dotenv/config';

const placeholderFragments = [
  'your-project',
  'your_project',
  'your_real',
  'replace_with',
  'placeholder',
];
const required = [
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CREDENTIAL_ENCRYPTION_KEY',
  'OPENAI_API_KEY',
];

function status(value) {
  const normalized = value?.trim().toLowerCase() || '';
  if (!normalized) return 'missing';
  if (placeholderFragments.some((fragment) => normalized.includes(fragment))) {
    return 'placeholder';
  }
  return 'configured';
}

const statuses = Object.fromEntries(
  required.map((name) => [name, status(process.env[name])]),
);
const ready = Object.values(statuses).every((value) => value === 'configured');

console.log('Backend configuration check\n');
for (const name of required) console.log(`${name}: ${statuses[name]}`);
console.log(`\nBackend ready to start: ${ready ? 'yes' : 'no'}`);
process.exitCode = ready ? 0 : 1;
