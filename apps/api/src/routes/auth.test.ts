import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from '../test-utils.js';

describe('auth', () => {
  const email = `user_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Test User';

  let app: Awaited<ReturnType<typeof buildTestApp>> | undefined;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('registers and returns access token', async () => {
    const res = await app!.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password, name },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.accessToken).toBeTypeOf('string');
    expect(body.data.user.email).toBe(email);
  });

  it('logs in and returns access token', async () => {
    const res = await app!.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.accessToken).toBeTypeOf('string');
  });
});
