import fp from 'fastify-plugin';
import { createRequire } from 'module';
import type { PrismaClient as PrismaClientType } from '@prisma/client';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client') as {
  PrismaClient: new (...args: any[]) => PrismaClientType;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClientType;
  }
}

export const prismaPlugin = fp(async (app, opts: { databaseUrl: string }) => {
  const prisma = new PrismaClient({
    datasources: { db: { url: opts.databaseUrl } },
  });

  await prisma.$connect();
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
