import { useState } from 'react';
import toast from 'react-hot-toast';
import { LogOut, Menu, Shield, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    toast.success('Anda telah keluar dari Warga Halim');
    navigate('/', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-base font-medium transition-colors ${
      isActive
        ? 'bg-[#8ECDF2]/40 text-slate-900 font-semibold'
        : 'text-slate-700 hover:bg-[#EBF7FE] hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-[#8ECDF2]/60 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="font-serif-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 shrink-0"
        >
          <span className="inline-block h-3 w-3 rounded-full bg-[#8ECDF2] ring-2 ring-[#E32636]/70" />
          Warga Halim
        </Link>

        {/* Navigasi Desktop */}
        {isAuthenticated && (
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-1"
          >
            <NavLink to="/karyawan" className={navLinkClass}>
              Karyawan
            </NavLink>
            <NavLink to="/kenangan" className={navLinkClass}>
              Kenangan
            </NavLink>
            <NavLink to="/pesan" className={navLinkClass}>
              Pesan
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-[#E32636]" aria-hidden="true" />
                  Panel Admin
                </span>
              </NavLink>
            )}
          </nav>
        )}

        {/* Aksi Kanan Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <span className="text-base font-medium text-slate-700 truncate max-w-[180px]">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E32636] px-4 py-2 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/register"
                className="rounded-lg border border-[#8ECDF2] px-4 py-2 text-base font-medium text-slate-800 hover:bg-[#EBF7FE] transition-colors"
              >
                Daftar
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-[#E32636] px-5 py-2 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>

        {/* Tombol Menu Mobile */}
        <div className="flex md:hidden items-center gap-2">
          {!isAuthenticated && (
            <>
              <Link
                to="/register"
                className="rounded-lg border border-[#8ECDF2] px-3 py-1.5 text-base font-medium text-slate-800 hover:bg-[#EBF7FE] transition-colors"
              >
                Daftar
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-[#E32636] px-4 py-1.5 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors"
              >
                Masuk
              </Link>
            </>
          )}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-[#EBF7FE] cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Navigasi Mobile */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="border-t border-[#8ECDF2]/40 bg-white px-4 py-3 md:hidden space-y-2">
          {user && (
            <div className="px-3 py-1.5 text-base font-semibold text-slate-800 border-b border-slate-100">
              Halo, {user.name}
            </div>
          )}
          <nav aria-label="Navigasi seluler" className="flex flex-col gap-1">
            <NavLink
              to="/karyawan"
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Karyawan
            </NavLink>
            <NavLink
              to="/kenangan"
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Kenangan
            </NavLink>
            <NavLink
              to="/pesan"
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Pesan
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-[#E32636]" aria-hidden="true" />
                  Panel Admin
                </span>
              </NavLink>
            )}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#E32636] px-4 py-2 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Keluar
          </button>
        </div>
      )}
    </header>
  );
}

