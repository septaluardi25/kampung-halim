import { useQuery } from '@tanstack/react-query';
import { BookHeart, MessageSquareHeart, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { PublicPhoto } from '../types/employee';

export function HomePage() {
  const { user, isAuthenticated } = useAuthStore();

  const {
    data: photos,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['public-photos'],
    queryFn: () => apiRequest<PublicPhoto[]>('/photos'),
  });

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="rounded-3xl border border-[#8ECDF2]/70 bg-gradient-to-br from-[#EBF7FE] via-white to-[#EBF7FE]/60 px-6 py-10 sm:px-10 sm:py-12">
        {isAuthenticated && user ? (
          <div className="space-y-6">
            <div>
              <span className="inline-block rounded-full bg-[#8ECDF2]/40 px-3.5 py-1 text-sm font-semibold text-slate-800">
                Selamat Datang Kembali
              </span>
              <h1 className="mt-3 font-serif-heading text-3xl sm:text-4xl font-bold text-slate-900">
                Halo, {user.name}
              </h1>
              <p className="mt-2 max-w-2xl text-base sm:text-lg text-slate-700">
                Silakan jelajahi direktori rekan kerja, cerita kenangan bersama,
                serta pesan dan kesan di keluarga besar Warga Halim.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/karyawan"
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#8ECDF2] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF7FE] text-sky-700">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-serif-heading text-lg font-bold text-slate-900 group-hover:text-sky-700">
                      Direktori Karyawan
                    </h2>
                    <p className="text-sm text-slate-600">
                      Lihat profil &amp; biodata rekan kerja
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/kenangan"
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#8ECDF2] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF7FE] text-sky-700">
                    <BookHeart className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-serif-heading text-lg font-bold text-slate-900 group-hover:text-sky-700">
                      Cerita Kenangan
                    </h2>
                    <p className="text-sm text-slate-600">
                      Arsip momen kebersamaan bertanggal
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/pesan"
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#8ECDF2] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF7FE] text-sky-700">
                    <MessageSquareHeart
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h2 className="font-serif-heading text-lg font-bold text-slate-900 group-hover:text-sky-700">
                      Pesan &amp; Kesan
                    </h2>
                    <p className="text-sm text-slate-600">
                      Baca catatan hangat antar karyawan
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {user.role === 'admin' && (
              <div>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#8ECDF2] bg-white px-4 py-2.5 text-base font-medium text-slate-800 hover:bg-[#EBF7FE] transition-colors"
                >
                  <Shield className="h-4 w-4 text-[#E32636]" aria-hidden="true" />
                  Buka Panel Admin
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl space-y-5">
            <span className="inline-block rounded-full bg-[#8ECDF2]/45 px-3.5 py-1 text-sm font-semibold text-slate-800">
              Ruang Nostalgia Warga Halim
            </span>
            <h1 className="font-serif-heading text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Menyimpan Wajah, Cerita, &amp; Kesan Kebersamaan Kita
            </h1>
            <p className="text-base sm:text-lg text-slate-700">
              Masuk dengan akun yang diberikan oleh admin untuk melihat biodata
              lengkap rekan kerja, cerita kenangan bersama, serta pesan dan
              kesan.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#E32636] px-6 py-3 text-base font-semibold text-white hover:bg-[#C81E2D] transition-colors shadow-xs"
              >
                Masuk untuk Membuka Data
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl border border-[#8ECDF2] bg-white px-5 py-3 text-base font-semibold text-slate-800 hover:bg-[#EBF7FE] transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Galeri Foto Publik */}
      <section aria-labelledby="galeri-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2
              id="galeri-heading"
              className="font-serif-heading text-2xl font-bold text-slate-900"
            >
              Galeri Foto Warga Halim
            </h2>
            <p className="text-base text-slate-600">
              Potret rekan-rekan yang pernah melangkah bersama di Kampung Halim.
            </p>
          </div>
        </div>

        {isLoading && <LoadingSkeleton variant="grid" count={6} />}

        {isError && (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : 'Gagal memuat galeri foto.'
            }
            onRetry={() => {
              void refetch();
            }}
          />
        )}

        {!isLoading && !isError && (!photos || photos.length === 0) && (
          <EmptyState
            title="Belum Ada Foto di Galeri"
            description="Foto-foto rekan kerja akan segera ditampilkan di sini setelah diunggah oleh admin."
          />
        )}

        {!isLoading && !isError && photos && photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-[#8ECDF2]/60 bg-white shadow-xs"
              >
                <div className="aspect-square w-full overflow-hidden bg-[#EBF7FE]">
                  <img
                    src={photo.photo_url}
                    alt="Potret rekan Warga Halim"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

