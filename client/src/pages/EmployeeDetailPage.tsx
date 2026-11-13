import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Heart,
  MapPin,
  MessageSquareHeart,
  Phone,
  Quote,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ApiError, apiRequest } from '../lib/api';
import { formatIndonesianDate } from '../lib/formatDate';
import type { EmployeeDetail } from '../types/employee';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employee-detail', id],
    queryFn: () => apiRequest<EmployeeDetail>(`/employees/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          to="/karyawan"
          className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Daftar Karyawan
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
            to="/karyawan"
            className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Daftar Karyawan
          </Link>
          <EmptyState
            title="Data Karyawan Tidak Ditemukan"
            description="Profil karyawan yang Anda cari tidak tersedia atau belum diterbitkan."
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Link
          to="/karyawan"
          className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Daftar Karyawan
        </Link>
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Gagal memuat biodata karyawan.'
          }
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!employee) {
    return (
      <EmptyState
        title="Data Karyawan Tidak Ditemukan"
        description="Profil karyawan tidak tersedia."
      />
    );
  }

  return (
    <div className="space-y-8">
      <Link
        to="/karyawan"
        className="inline-flex items-center gap-2 text-base font-medium text-sky-700 hover:text-sky-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke Daftar Karyawan
      </Link>

      {/* Kartu Profil & Biodata */}
      <section className="rounded-3xl border border-[#8ECDF2]/70 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar
            src={employee.photo_url}
            name={employee.full_name}
            initials={employee.initials}
            size="xl"
          />
          <div className="text-center sm:text-left space-y-2">
            <span className="inline-block rounded-full bg-[#EBF7FE] px-3.5 py-1 text-sm font-semibold text-sky-800">
              Panggilan: {employee.nickname}
            </span>
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
              {employee.full_name}
            </h1>
            {employee.favorite_quote && (
              <blockquote className="mt-2 flex items-start justify-center sm:justify-start gap-2 text-base italic text-slate-700">
                <Quote
                  className="h-5 w-5 text-[#8ECDF2] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>&ldquo;{employee.favorite_quote}&rdquo;</span>
              </blockquote>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#EBF7FE]/50 p-4 border border-[#8ECDF2]/40">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <MapPin className="h-4 w-4 text-sky-700" aria-hidden="true" />
              Kota Asal
            </div>
            <p className="mt-1 text-base font-medium text-slate-900">
              {employee.hometown || 'Belum diisi'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#EBF7FE]/50 p-4 border border-[#8ECDF2]/40">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Heart className="h-4 w-4 text-[#E32636]" aria-hidden="true" />
              Hobi
            </div>
            <p className="mt-1 text-base font-medium text-slate-900">
              {employee.hobby || 'Belum diisi'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#EBF7FE]/50 p-4 border border-[#8ECDF2]/40">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Phone className="h-4 w-4 text-sky-700" aria-hidden="true" />
              Kontak
            </div>
            <p className="mt-1 text-base font-medium text-slate-900 break-all">
              {employee.contact || 'Belum diisi'}
            </p>
          </div>
        </div>
      </section>

      {/* Kenangan Bersama */}
      <section className="space-y-4">
        <h2 className="font-serif-heading text-xl sm:text-2xl font-bold text-slate-900">
          Kenangan Bersama
        </h2>
        {employee.memories.length === 0 ? (
          <EmptyState
            title="Belum Ada Kenangan Terkait"
            description="Belum ada catatan kenangan terbit yang menandai karyawan ini."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employee.memories.map((memory) => (
              <Link
                key={memory.id}
                to={`/kenangan/${memory.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#8ECDF2] hover:bg-[#EBF7FE]/30 transition-all"
              >
                <div className="flex items-center gap-2 text-sm text-sky-700 font-medium">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>{formatIndonesianDate(memory.event_date)}</span>
                </div>
                <h3 className="mt-1.5 font-serif-heading text-lg font-bold text-slate-900">
                  {memory.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Pesan & Kesan Terkait (Read-Only) */}
      <section className="space-y-4">
        <h2 className="font-serif-heading text-xl sm:text-2xl font-bold text-slate-900">
          Pesan &amp; Kesan Terkait
        </h2>
        {employee.messages.length === 0 ? (
          <EmptyState
            title="Belum Ada Pesan Terkait"
            description="Belum ada pesan atau kesan untuk maupun dari karyawan ini."
          />
        ) : (
          <div className="space-y-4">
            {employee.messages.map((msg) => (
              <article
                key={msg.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
                  <MessageSquareHeart
                    className="h-4 w-4 text-[#E32636]"
                    aria-hidden="true"
                  />
                  <span>Dari:</span>
                  <Link
                    to={`/karyawan/${msg.sender_employee_id}`}
                    className="text-sky-700 hover:underline"
                  >
                    {msg.sender_name}
                  </Link>
                  <span aria-hidden="true">&rarr;</span>
                  <span>Untuk:</span>
                  <Link
                    to={`/karyawan/${msg.recipient_employee_id}`}
                    className="text-sky-700 hover:underline"
                  >
                    {msg.recipient_name}
                  </Link>
                </div>

                <p className="text-base text-slate-800 whitespace-pre-line">
                  {msg.message}
                </p>

                {msg.impression && (
                  <p className="rounded-xl bg-[#EBF7FE] px-4 py-2.5 text-sm font-medium text-slate-700">
                    Kesan: &ldquo;{msg.impression}&rdquo;
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

