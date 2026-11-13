import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { queryClient } from '../lib/queryClient';
import { AUTH_TOKEN_STORAGE_KEY, useAuthStore } from '../stores/authStore';

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isHydrated: true,
  });
  queryClient.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
