import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../lib/api';
import { AUTH_TOKEN_STORAGE_KEY, useAuthStore } from '../stores/authStore';
import type { AuthUser } from '../types/auth';

const dummyUser: AuthUser = {
  id: 2,
  name: 'Andi Budi',
  email: 'andi@wargahalim.id',
  role: 'user',
  employee_id: 1,
};

describe('Zustand authStore & API Client', () => {
  it('FE-STORE-01: setAuth menyimpan token ke localStorage & logout menghapusnya', () => {
    useAuthStore.getState().setAuth('jwt-token-123', dummyUser);

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('jwt-token-123');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.name).toBe('Andi Budi');

    useAuthStore.getState().logout();

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('FE-STORE-02a: hydrateAuth berhasil memverifikasi token lewat /auth/me', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'valid-token');
    useAuthStore.setState({ isHydrated: false });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: dummyUser,
          message: 'Data akun berhasil diambil',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await useAuthStore.getState().hydrateAuth();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer valid-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isHydrated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('andi@wargahalim.id');
  });

  it('FE-STORE-02b: respons 401 pada API terproteksi otomatis memanggil logout', async () => {
    useAuthStore.getState().setAuth('expired-token', dummyUser);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          message: 'Token kedaluwarsa',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(apiRequest('/employees')).rejects.toThrow('Token kedaluwarsa');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });
});

