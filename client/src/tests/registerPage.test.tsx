import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AUTH_TOKEN_STORAGE_KEY, useAuthStore } from '../stores/authStore';

function renderRegister() {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <AppRoutes />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RegisterPage (Zod Validation & Registration Flow)', () => {
  it('FE-REG-01: input tidak valid atau konfirmasi password tidak cocok menampilkan error Zod tanpa memanggil fetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Nama Lengkap'), 'Budi');
    await user.type(screen.getByLabelText('Email'), 'bukan-email');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.type(screen.getByLabelText('Konfirmasi Password'), '456789');
    await user.click(screen.getByRole('button', { name: 'Daftar' }));

    expect(
      await screen.findByText('Nama minimal 5 karakter')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Format email tidak valid')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Password minimal 6 karakter')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Konfirmasi password tidak cocok')
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('FE-REG-02: registrasi valid mengirim POST /auth/register tanpa confirmPassword, tidak login otomatis, dan menampilkan konfirmasi approval admin', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 10,
            name: 'Warga Baru Halim',
            email: 'wargabaru@wargahalim.id',
            role: 'user',
            is_active: false,
          },
          message: 'Registrasi berhasil. Menunggu persetujuan admin untuk aktivasi akun.',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Nama Lengkap'), 'Warga Baru Halim');
    await user.type(screen.getByLabelText('Email'), 'wargabaru@wargahalim.id');
    await user.type(screen.getByLabelText('Password'), 'rahasia123');
    await user.type(
      screen.getByLabelText('Konfirmasi Password'),
      'rahasia123'
    );
    await user.click(screen.getByRole('button', { name: 'Daftar' }));

    expect(
      await screen.findByText('Pendaftaran Berhasil Dikirim')
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toMatch(/\/auth\/register$/);
    expect(requestInit?.method).toBe('POST');
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      name: 'Warga Baru Halim',
      email: 'wargabaru@wargahalim.id',
      password: 'rahasia123',
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();

    const loginLink = screen.getByRole('link', { name: 'Ke Halaman Masuk' });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('FE-REG-03: email sudah terdaftar (409) menampilkan toast error dan mempertahankan input form', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          message: 'Email sudah terdaftar',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const user = userEvent.setup();
    renderRegister();

    const nameInput = screen.getByLabelText<HTMLInputElement>('Nama Lengkap');
    const emailInput = screen.getByLabelText<HTMLInputElement>('Email');

    await user.type(nameInput, 'Warga Duplikat');
    await user.type(emailInput, 'duplikat@wargahalim.id');
    await user.type(screen.getByLabelText('Password'), 'rahasia123');
    await user.type(
      screen.getByLabelText('Konfirmasi Password'),
      'rahasia123'
    );
    await user.click(screen.getByRole('button', { name: 'Daftar' }));

    expect(await screen.findByText('Email sudah terdaftar')).toBeInTheDocument();
    expect(nameInput.value).toBe('Warga Duplikat');
    expect(emailInput.value).toBe('duplikat@wargahalim.id');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('FE-REG-04: tombol submit disabled dan menampilkan Memproses... saat request berjalan', async () => {
    let resolveFetch!: (value: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Nama Lengkap'), 'Warga Pending');
    await user.type(screen.getByLabelText('Email'), 'pending@wargahalim.id');
    await user.type(screen.getByLabelText('Password'), 'rahasia123');
    await user.type(
      screen.getByLabelText('Konfirmasi Password'),
      'rahasia123'
    );
    await user.click(screen.getByRole('button', { name: 'Daftar' }));

    const pendingBtn = await screen.findByRole('button', {
      name: 'Memproses...',
    });
    expect(pendingBtn).toBeDisabled();

    resolveFetch(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 11,
            name: 'Warga Pending',
            email: 'pending@wargahalim.id',
            role: 'user',
            is_active: false,
          },
          message: 'Registrasi berhasil',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await waitFor(() => {
      expect(
        screen.getByText('Pendaftaran Berhasil Dikirim')
      ).toBeInTheDocument();
    });
  });
});
