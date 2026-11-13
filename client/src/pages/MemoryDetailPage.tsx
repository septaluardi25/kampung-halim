import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ApiError, apiRequest } from '../lib/api';
import { formatIndonesianDate } from '../lib/formatDate';
import type { MemoryDetail } from '../types/memory';

export function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: memory,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['memory-detail', id],
    queryFn: () => apiRequest<MemoryDetail>(`/memories/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          to="/kenangan"
          className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Daftar Kenangan
        </Link>
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="space-y-6">
          <Link
            to="/kenangan"
            className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Daftar Kenangan
          </Link>
          <EmptyState
            title="Kenangan Tidak Ditemukan"
            description="Cerita kenangan yang Anda cari tidak tersedia atau masih berstatus draft."
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Link
          to="/kenangan"
          className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Daftar Kenangan
        </Link>
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Gagal memuat detail kenangan.'
          }
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!memory) {
    return (
      <EmptyState
        title="Kenangan Tidak Ditemukan"
        description="Cerita kenangan tidak tersedia."
      />
    );
  }

  return (
    <div className="space-y-8">
      <Link
        to="/kenangan"
        className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke Daftar Kenangan
      </Link>

      <article className="rounded-3xl border border-[#8ECDF2]/70 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{formatIndonesianDate(memory.event_date)}</span>
          </div>
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
            {memory.title}
          </h1>
        </div>

        <p className="text-base sm:text-lg text-slate-800 whitespace-pre-line leading-relaxed">
          {memory.story}
        </p>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h2 className="flex items-center gap-2 font-serif-heading text-lg font-bold text-slate-900">
            <Users className="h-5 w-5 text-sky-700" aria-hidden="true" />
            Karyawan yang Terlibat
          </h2>

          {memory.employees.length === 0 ? (
            <p className="text-base text-slate-600">
              Belum ada karyawan yang ditandai pada kenangan ini.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {memory.employees.map((emp) => (
                <Link
                  key={emp.id}
                  to={`/karyawan/${emp.id}`}
                  className="inline-flex items-center gap-2.5 rounded-full border border-[#8ECDF2] bg-[#EBF7FE]/60 py-1.5 pl-2 pr-4 text-base font-medium text-slate-900 hover:bg-[#8ECDF2]/40 transition-colors"
                >
                  <Avatar
                    src={emp.photo_url}
                    name={emp.full_name}
                    initials={emp.initials}
                    size="sm"
                  />
                  <span>{emp.full_name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

