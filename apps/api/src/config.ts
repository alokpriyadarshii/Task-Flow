import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(20),
  COOKIE_SECRET: z.string().min(20),
  CORS_ORIGIN: z.string().min(1),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(processEnv: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(processEnv);
  if (!parsed.success) {
    console.error('Invalid environment variables', parsed.error.format());
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
