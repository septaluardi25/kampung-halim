import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MessageSquareHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { apiRequest } from '../lib/api';
import type { MessageItem } from '../types/message';

export function MessagesPage() {
  const {
    data: messages,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messages'],
    queryFn: () => apiRequest<MessageItem[]>('/messages'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
          Pesan &amp; Kesan
        </h1>
        <p className="mt-1 text-base text-slate-600">
          Catatan hangat dari dan untuk rekan kerja di Keluarga Warga Halim.
        </p>
      </div>

      {isLoading && <LoadingSkeleton variant="list" count={4} />}

      {isError && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Gagal memuat daftar pesan dan kesan.'
          }
          onRetry={() => {
            void refetch();
          }}
        />
      )}

      {!isLoading && !isError && (!messages || messages.length === 0) && (
        <EmptyState
          title="Belum Ada Pesan & Kesan"
          description="Pesan dan kesan yang ditambahkan oleh admin akan tampil di halaman ini."
        />
      )}

      {!isLoading && !isError && messages && messages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">
                <Link
                  to={`/karyawan/${msg.sender_employee_id}`}
                  className="inline-flex items-center gap-2 text-sky-800 hover:underline"
                >
                  <Avatar
                    name={msg.sender_name}
                    initials={msg.sender_initials}
                    size="sm"
                  />
                  <span>Dari: {msg.sender_name}</span>
                </Link>

                <ArrowRight
                  className="h-4 w-4 text-[#E32636] shrink-0"
                  aria-hidden="true"
                />

                <Link
                  to={`/karyawan/${msg.recipient_employee_id}`}
                  className="inline-flex items-center gap-2 text-sky-800 hover:underline"
                >
                  <Avatar
                    name={msg.recipient_name}
                    initials={msg.recipient_initials}
                    size="sm"
                  />
                  <span>Untuk: {msg.recipient_name}</span>
                </Link>
              </div>

              <p className="text-base text-slate-800 whitespace-pre-line">
                {msg.message}
              </p>

              {msg.impression && (
                <div className="flex items-start gap-2 rounded-xl bg-[#EBF7FE] px-4 py-3 text-sm font-medium text-slate-700">
                  <MessageSquareHeart
                    className="h-4 w-4 text-[#E32636] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>Kesan: &ldquo;{msg.impression}&rdquo;</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

