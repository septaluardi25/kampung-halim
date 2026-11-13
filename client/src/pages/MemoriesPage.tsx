import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { apiRequest } from '../lib/api';
import { formatIndonesianDate } from '../lib/formatDate';
import type { MemoryItem } from '../types/memory';

export function MemoriesPage() {
  const {
    data: memories,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['memories'],
    queryFn: () => apiRequest<MemoryItem[]>('/memories'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
          Cerita Kenangan
        </h1>
        <p className="mt-1 text-base text-slate-600">
          Kisah kebersamaan yang diurutkan dari momen paling baru.
        </p>
      </div>

      {isLoading && <LoadingSkeleton variant="list" count={4} />}

      {isError && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Gagal memuat daftar kenangan.'
          }
          onRetry={() => {
            void refetch();
          }}
        />
      )}

      {!isLoading && !isError && (!memories || memories.length === 0) && (
        <EmptyState
          title="Belum Ada Kenangan Terbit"
          description="Cerita kenangan bersama yang diterbitkan oleh admin akan muncul di halaman ini."
        />
      )}

      {!isLoading && !isError && memories && memories.length > 0 && (
        <div className="space-y-4">
          {memories.map((memory) => (
            <Link
              key={memory.id}
              to={`/kenangan/${memory.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#8ECDF2] hover:bg-[#EBF7FE]/30 transition-all"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>{formatIndonesianDate(memory.event_date)}</span>
              </div>
              <h2 className="mt-2 font-serif-heading text-xl font-bold text-slate-900">
                {memory.title}
              </h2>
              <p className="mt-2 text-base text-slate-700 line-clamp-3">
                {memory.story}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

