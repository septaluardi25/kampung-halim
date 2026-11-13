import { ShieldAlert } from 'lucide-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useAuthStore } from '../stores/authStore';

export function AdminRoute() {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const location = useLocation();

  if (!isHydrated) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center my-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#E32636] shadow-xs">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="font-serif-heading text-2xl font-bold text-slate-900">
          403 — Akses Ditolak
        </h1>
        <p className="mt-3 text-base text-slate-700">
          Anda tidak memiliki izin untuk membuka halaman Panel Admin.
        </p>
        <Link
          to="/karyawan"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#E32636] px-5 py-2.5 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors"
        >
          Kembali ke Halaman Karyawan
        </Link>
      </div>
    );
  }

  return <Outlet />;
}

