import { create } from 'zustand';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  setAuth: (payload: { user: User; accessToken: string }) => void;
  clear: () => void;
};

const STORAGE_KEY = 'taskflow_auth_v1';

function loadInitial(): Pick<AuthState, 'user' | 'accessToken'> {
  if (typeof window === 'undefined') return { user: null, accessToken: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, accessToken: null };
    const parsed = JSON.parse(raw) as { user: User; accessToken: string };
    return { user: parsed.user ?? null, accessToken: parsed.accessToken ?? null };
  } catch {
    return { user: null, accessToken: null };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadInitial(),
  setAuth: (payload) => {
    set({ user: payload.user, accessToken: payload.accessToken });
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },
  clear: () => {
    set({ user: null, accessToken: null });
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  },
}));
