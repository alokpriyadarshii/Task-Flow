import { buildApp } from './server.js';
import { loadEnv } from './config.js';

export async function buildTestApp() {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    JWT_SECRET: process.env.JWT_SECRET ?? 'x'.repeat(32),
    COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'y'.repeat(32),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    DATABASE_URL:
      process.env.DATABASE_URL ??
      'postgresql://taskflow:taskflow@localhost:5432/taskflow?schema=public',
    REFRESH_TOKEN_TTL_DAYS: process.env.REFRESH_TOKEN_TTL_DAYS ?? '30',
    PORT: process.env.PORT ?? '4001',
  });

  const app = await buildApp({ env });
  return app;
}
