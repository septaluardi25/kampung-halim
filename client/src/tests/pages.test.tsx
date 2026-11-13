import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { useAuthStore } from '../stores/authStore';

function renderRoute(initialPath: string) {
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

function loginDummyUser() {
  useAuthStore.getState().setAuth('token-user', {
    id: 99,
    name: 'Pengguna Uji',
    email: 'pengguna@wargahalim.id',
    role: 'user',
    employee_id: null,
  });
}

describe('Pages Integration (Home, Employees, Memories, Messages)', () => {
  it('FE-HOME-01: HomePage menampilkan loading skeleton, error + Coba Lagi, lalu galeri foto publik tanpa nama', async () => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response(
          JSON.stringify({
            success: false,
            data: null,
            message: 'Koneksi bermasalah',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              photo_url: 'https://example.com/foto-1.jpg',
            },
          ],
          message: 'OK',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const user = userEvent.setup();
    renderRoute('/');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Gagal Memuat Data')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }));

    const img = await screen.findByAltText('Potret rekan Warga Halim');
    expect(img).toHaveAttribute('src', 'https://example.com/foto-1.jpg');
  });

  it('FE-EMP-01a: EmployeesPage mendukung avatar inisial & live search', async () => {
    loginDummyUser();

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('search=Siti')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                id: 2,
                full_name: 'Siti Rahma',
                nickname: 'Siti',
                photo_url: null,
                initials: 'SR',
              },
            ],
            message: 'OK',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              full_name: 'Andi Budi',
              nickname: 'Andi',
              photo_url: null,
              initials: 'AB',
            },
          ],
          message: 'OK',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const user = userEvent.setup();
    renderRoute('/karyawan');

    expect(await screen.findByText('Andi Budi')).toBeInTheDocument();
    expect(screen.getByLabelText('Avatar inisial Andi Budi')).toHaveTextContent('AB');

    const searchInput = screen.getByLabelText('Cari nama karyawan');
    await user.type(searchInput, 'Siti');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/employees?search=Siti'),
        expect.any(Object)
      );
      expect(screen.getByText('Siti Rahma')).toBeInTheDocument();
    });
  });

  it('FE-EMP-01b: EmployeeDetailPage aman merender field NULL dan daftar kenangan/pesan', async () => {
    loginDummyUser();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 1,
            full_name: 'Andi Budi',
            nickname: 'Andi',
            hometown: null,
            hobby: 'Membaca',
            contact: null,
            favorite_quote: null,
            photo_url: null,
            initials: 'AB',
            memories: [{ id: 10, title: 'Outing Puncak', event_date: '2022-08-17' }],
            messages: [],
          },
          message: 'OK',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    renderRoute('/karyawan/1');

    expect(
      await screen.findByRole('heading', { name: 'Andi Budi' })
    ).toBeInTheDocument();
    expect(screen.getByText('Membaca')).toBeInTheDocument();
    expect(screen.getAllByText('Belum diisi').length).toBe(2);
    expect(screen.getByText('Outing Puncak')).toBeInTheDocument();
    expect(screen.getByText('17 Agustus 2022')).toBeInTheDocument();
  });

  it('FE-MEM-01: MemoryDetailPage menampilkan cerita dan link tag ke /karyawan/:id', async () => {
    loginDummyUser();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 2,
            title: 'Outing Puncak 2022',
            event_date: '2022-08-17',
            story: 'Cerita lengkap kenangan.',
            employees: [
              { id: 1, full_name: 'Andi Budi', photo_url: null, initials: 'AB' },
            ],
          },
          message: 'OK',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    renderRoute('/kenangan/2');

    expect(await screen.findByText('Outing Puncak 2022')).toBeInTheDocument();
    expect(screen.getByText('Cerita lengkap kenangan.')).toBeInTheDocument();
    const tagLink = screen.getByRole('link', { name: /Andi Budi/i });
    expect(tagLink).toHaveAttribute('href', '/karyawan/1');
  });

  it('FE-MSG-01: MessagesPage menampilkan pesan read-only tanpa tombol tambah/edit/hapus', async () => {
    loginDummyUser();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 5,
              sender_employee_id: 3,
              sender_name: 'Citra Dewi',
              sender_initials: 'CD',
              recipient_employee_id: 1,
              recipient_name: 'Andi Budi',
              recipient_initials: 'AB',
              message: 'Terima kasih selalu membantu!',
              impression: 'Sabar dan ramah',
              created_at: '2026-11-12T10:00:00.000Z',
              updated_at: '2026-11-12T10:00:00.000Z',
            },
          ],
          message: 'OK',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    renderRoute('/pesan');

    expect(await screen.findByText('Terima kasih selalu membantu!')).toBeInTheDocument();
    expect(screen.getByText('Dari: Citra Dewi')).toBeInTheDocument();
    expect(screen.getByText('Untuk: Andi Budi')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tambah|Edit|Ubah|Hapus/i })).not.toBeInTheDocument();
  });
});
