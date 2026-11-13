import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { apiRequest } from '../lib/api';
import type { EmployeeCard } from '../types/employee';

export function EmployeesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data: employees,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employees', debouncedSearch],
    queryFn: () => {
      const params = debouncedSearch
        ? `?search=${encodeURIComponent(debouncedSearch)}`
        : '';
      return apiRequest<EmployeeCard[]>(`/employees${params}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
            Daftar Karyawan
          </h1>
          <p className="mt-1 text-base text-slate-600">
            Klik kartu untuk melihat biodata lengkap, kenangan, dan pesan.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama atau panggilan..."
            aria-label="Cari nama karyawan"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#8ECDF2] focus:outline-none focus:ring-2 focus:ring-[#8ECDF2]/50"
          />
        </div>
      </div>

      {isLoading && <LoadingSkeleton variant="grid" count={6} />}

      {isError && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Gagal memuat daftar karyawan.'
          }
          onRetry={() => {
            void refetch();
          }}
        />
      )}

      {!isLoading && !isError && (!employees || employees.length === 0) && (
        <EmptyState
          title={
            debouncedSearch
              ? 'Karyawan Tidak Ditemukan'
              : 'Belum Ada Data Karyawan'
          }
          description={
            debouncedSearch
              ? `Tidak ada karyawan yang cocok dengan kata kunci "${debouncedSearch}".`
              : 'Data karyawan yang telah diterbitkan akan muncul di sini.'
          }
          actionLabel={debouncedSearch ? 'Reset Pencarian' : undefined}
          onAction={debouncedSearch ? () => setSearchInput('') : undefined}
        />
      )}

      {!isLoading && !isError && employees && employees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <Link
              key={emp.id}
              to={`/karyawan/${emp.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#8ECDF2] hover:bg-[#EBF7FE]/35 hover:shadow-xs transition-all"
            >
              <Avatar
                src={emp.photo_url}
                name={emp.full_name}
                initials={emp.initials}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sky-700 truncate">
                  {emp.nickname}
                </p>
                <h2 className="font-serif-heading text-lg font-bold text-slate-900 truncate group-hover:text-sky-800">
                  {emp.full_name}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

