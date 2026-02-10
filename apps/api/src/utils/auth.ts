import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function requireAuth(app: FastifyInstance) {
  return async function requireAuthHandler(req: FastifyRequest, reply: FastifyReply) {
    void app;
    try {
      const verified = (await req.jwtVerify()) as any;

      // If jwt plugin isn't using formatUser, verified will likely be payload with `sub`.
      // Normalize so downstream code can always use req.user.id
      if (
        !req.user &&
        verified &&
        typeof verified === 'object' &&
        typeof verified.sub === 'string'
      ) {
        (req as any).user = {
          id: verified.sub,
          email: verified.email,
          name: verified.name,
          role: verified.role,
        };
      }

      if (!req.user) {
        return reply.status(401).send({
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
        });
      }
    } catch {
      return reply.status(401).send({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      });
    }
  };
}
