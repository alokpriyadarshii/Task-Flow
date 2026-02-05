import { useAuthStore } from './auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string; details?: unknown } };

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    const json = (await res.json()) as ApiOk<{ accessToken: string }> | ApiErr;
    if (!json.ok) return null;

    const token = json.data.accessToken;
    const st = useAuthStore.getState();
    if (st.user) st.setAuth({ user: st.user, accessToken: token });
    return token;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const st = useAuthStore.getState();
  const headers = new Headers(init?.headers ?? {});
  headers.set('Content-Type', 'application/json');

  if (st.accessToken) headers.set('Authorization', `Bearer ${st.accessToken}`);

  const makeReq = async () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

  let res = await makeReq();

  if (res.status === 401) {
    const next = await refreshAccessToken();
    if (next) {
      headers.set('Authorization', `Bearer ${next}`);
      res = await makeReq();
    }
  }

  const json = (await res.json()) as ApiOk<T> | ApiErr;

  if (!json.ok) {
    const error = new Error(json.error.message) as Error & { code?: string; details?: unknown };
    error.code = json.error.code;
    error.details = json.error.details;
    throw error;
  }

  return json.data;
}
