import 'dotenv/config';
import { buildApp } from './server.js';
import { loadEnv } from './config.js';

const env = loadEnv();
const app = await buildApp({ env });

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });

const shutdown = async (signal: string) => {
  try {
    app.log.info({ signal }, "shutting down")
    await app.close()
  } finally {
    process.exit(0)
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))

  app.log.info({ port: env.PORT }, 'API listening');
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
