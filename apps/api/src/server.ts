import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import { type Env } from './config.js';
import { prismaPlugin } from './plugins/prisma.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { projectRoutes } from './routes/projects.js';
import { taskRoutes } from './routes/tasks.js';
import { errorHandler } from './utils/errors.js';

export async function buildApp({ env }: { env: Env }) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(errorHandler);

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
  });

  await app.register(jwt, { secret: env.JWT_SECRET });

  await app.register(swagger, {
    openapi: {
      info: { title: 'TaskFlow API', version: '0.1.0' },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(prismaPlugin, { databaseUrl: env.DATABASE_URL });

  await app.register(authRoutes, { prefix: '/auth', env });
  await app.register(meRoutes, { prefix: '/me' });
  await app.register(projectRoutes, { prefix: '/projects' });
  await app.register(taskRoutes);

  app.get('/', async () => ({ ok: true, name: 'TaskFlow API', docs: '/docs' }));

  app.get('/health', async () => ({ ok: true }));

  return app;
}
