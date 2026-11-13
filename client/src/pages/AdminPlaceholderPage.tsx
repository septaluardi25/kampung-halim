import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminPlaceholderPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-[#8ECDF2] bg-[#EBF7FE]/50 p-8 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#E32636] shadow-xs">
        <Shield className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
        Panel Admin Warga Halim
      </h1>
      <p className="text-base text-slate-700">
        Akses Admin terverifikasi. Modul CRUD Karyawan, Foto, Kenangan, Pesan,
        dan Akun User akan diimplementasikan pada Tahap 6.
      </p>
      <div className="pt-2">
        <Link
          to="/karyawan"
          className="inline-flex items-center justify-center rounded-xl bg-[#E32636] px-5 py-2.5 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors"
        >
          Lihat Direktori Karyawan
        </Link>
      </div>
    </div>
  );
}

