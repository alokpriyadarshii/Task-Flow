import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function errorHandler(
  err: FastifyError | AppError,
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = (err as AppError).statusCode ?? err.statusCode ?? 500;
  const code = (err as AppError).code ?? 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'Internal Server Error' : err.message;

  if (statusCode >= 500) reply.log.error(err);

  return reply.status(statusCode).send({
    ok: false,
    error: {
      code,
      message,
      details: statusCode >= 500 ? undefined : (err as AppError).details,
    },
  });
}
