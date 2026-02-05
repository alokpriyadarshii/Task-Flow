import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../utils/auth.js';

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/',
    {
      preHandler: requireAuth(app),
      schema: {
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              user: z.object({
                id: z.string(),
                name: z.string(),
                email: z.string().email(),
                role: z.enum(['ADMIN', 'USER']),
              }),
            }),
          }),
        },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      });

      return { ok: true, data: { user } };
    },
  );
};
