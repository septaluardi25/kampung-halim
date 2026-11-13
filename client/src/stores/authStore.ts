import { create } from 'zustand';
import { apiRequest } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { AuthUser } from '../types/auth';

export const AUTH_TOKEN_STORAGE_KEY = 'warga_halim_token';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrateAuth: () => Promise<void>;
}

function readStoredToken(): string | null {
  try {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

function saveStoredToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // Abaikan jika storage tidak tersedia
  }
}

function removeStoredToken(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Abaikan jika storage tidak tersedia
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: readStoredToken(),
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (token, user) => {
    saveStoredToken(token);
    set({
      token,
      user,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  logout: () => {
    removeStoredToken();
    queryClient.clear();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },

  hydrateAuth: async () => {
    const storedToken = readStoredToken();
    if (!storedToken) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
      return;
    }

    set({ token: storedToken });

    try {
      const user = await apiRequest<AuthUser>('/auth/me');
      set({
        token: storedToken,
        user,
        isAuthenticated: true,
        isHydrated: true,
      });
    } catch {
      removeStoredToken();
      queryClient.clear();
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },
}));

