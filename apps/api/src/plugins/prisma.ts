import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
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
