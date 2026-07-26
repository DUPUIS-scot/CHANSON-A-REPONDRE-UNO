import 'dotenv/config';
import http from 'node:http';
import { pathToFileURL } from 'node:url';

import { createApp } from './app.js';
import { parseEnvironment } from './config/environment.js';

export function startServer(rawEnvironment = process.env) {
  const environment = parseEnvironment(rawEnvironment);
  const server = http.createServer(createApp(environment));
  server.requestTimeout = environment.requestTimeoutMs + 5000;
  server.listen(environment.port, '0.0.0.0', () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'server_started',
      port: environment.port,
    }));
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    startServer();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Backend startup failed.');
    process.exitCode = 1;
  }
}
