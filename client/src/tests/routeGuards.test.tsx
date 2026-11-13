import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { useAuthStore } from '../stores/authStore';

function renderAtRoute(initialPath: string) {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Route Guards (ProtectedRoute & AdminRoute)', () => {
  it('FE-GUARD-01: pengunjung belum login mengakses /karyawan, /kenangan, /pesan diarahkan ke /login', () => {
    renderAtRoute('/karyawan');
    expect(screen.getByText('Masuk Warga Halim')).toBeInTheDocument();

    renderAtRoute('/kenangan');
    expect(screen.getAllByText('Masuk Warga Halim').length).toBeGreaterThan(0);

    renderAtRoute('/pesan');
    expect(screen.getAllByText('Masuk Warga Halim').length).toBeGreaterThan(0);
  });

  it('FE-GUARD-01b: saat isHydrated=false tampil loading skeleton, bukan redirect', () => {
    useAuthStore.setState({ isHydrated: false, isAuthenticated: false });
    renderAtRoute('/karyawan');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('FE-GUARD-02a: user biasa mengakses /admin ditolak dengan 403 Akses Ditolak', () => {
    useAuthStore.getState().setAuth('user-token', {
      id: 2,
      name: 'User Biasa',
      email: 'user@wargahalim.id',
      role: 'user',
      employee_id: 1,
    });

    renderAtRoute('/admin');
    expect(screen.getByText('403 — Akses Ditolak')).toBeInTheDocument();
  });

  it('FE-GUARD-02b: admin mengakses /admin berhasil melihat Panel Admin', () => {
    useAuthStore.getState().setAuth('admin-token', {
      id: 1,
      name: 'Admin Halim',
      email: 'admin@wargahalim.id',
      role: 'admin',
      employee_id: null,
    });

    renderAtRoute('/admin');
    expect(screen.getByText('Panel Admin Warga Halim')).toBeInTheDocument();
  });

  it('FE-GUARD-03a: pengunjung belum login dapat mengakses halaman /register', () => {
    renderAtRoute('/register');
    expect(screen.getByText('Daftar Akun Warga Halim')).toBeInTheDocument();
  });

  it('FE-GUARD-03b: user yang sudah login mengakses /register diarahkan ke /karyawan', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: [], message: 'OK' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    useAuthStore.getState().setAuth('user-token', {
      id: 2,
      name: 'User Biasa',
      email: 'user@wargahalim.id',
      role: 'user',
      employee_id: 1,
    });

    renderAtRoute('/register');
    expect(screen.getByText('Daftar Karyawan')).toBeInTheDocument();
  });

  it('Rute tidak dikenal (*) atau /daftar menampilkan halaman 404 Bahasa Indonesia', () => {
    renderAtRoute('/daftar');
    expect(screen.getByText('Halaman Tidak Ditemukan')).toBeInTheDocument();
  });
});

