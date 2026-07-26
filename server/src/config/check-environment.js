import 'dotenv/config';
import { parseEnvironment } from './environment.js';

try {
  parseEnvironment(process.env);
  console.log('Backend configuration is valid.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Backend configuration is invalid.');
  process.exitCode = 1;
}
