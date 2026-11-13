import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center space-y-4">
      <p className="text-sm font-bold uppercase tracking-widest text-sky-700">
        404
      </p>
      <h1 className="font-serif-heading text-3xl font-bold text-slate-900">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-base text-slate-600">
        Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-[#E32636] px-6 py-3 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

