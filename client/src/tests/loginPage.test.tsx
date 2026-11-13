import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { useAuthStore } from '../stores/authStore';

function renderLogin() {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LoginPage (Zod Validation & Auth Flow)', () => {
  it('FE-LOGIN-01: input email tidak valid atau password < 6 karakter menampilkan error Zod tanpa memanggil fetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitBtn = screen.getByRole('button', { name: 'Masuk' });

    await user.type(emailInput, 'abc');
    await user.type(passwordInput, '123');
    await user.click(submitBtn);

    expect(await screen.findByText('Email minimal 5 karakter')).toBeInTheDocument();
    expect(await screen.findByText('Password minimal 6 karakter')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-02a: login gagal (401) menampilkan toast error dan mempertahankan input email', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          message: 'Email atau password salah',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText<HTMLInputElement>('Email');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'andi@wargahalim.id');
    await user.type(passwordInput, 'salahpass');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(await screen.findByText('Email atau password salah')).toBeInTheDocument();
    expect(emailInput.value).toBe('andi@wargahalim.id');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('FE-LOGIN-02b: login sukses menyimpan token ke authStore dan redirect ke /karyawan', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              token: 'token-baru',
              user: {
                id: 2,
                name: 'Andi Budi',
                email: 'andi@wargahalim.id',
                role: 'user',
                employee_id: 1,
              },
            },
            message: 'Login berhasil',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, data: [], message: 'OK' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'andi@wargahalim.id');
    await user.type(screen.getByLabelText('Password'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(screen.getByText('Daftar Karyawan')).toBeInTheDocument();
    });
  });
});

