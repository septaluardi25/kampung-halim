import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-100 bg-[#EBF7FE]/40 py-5 text-center text-sm text-slate-600 px-4">
        <p>Warga Halim — Ruang Nostalgia &amp; Silaturahmi Mantan Karyawan</p>
      </footer>
    </div>
  );
}

