import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { type LoginFormValues, loginSchema } from '../schemas/auth.schema';
import { useAuthStore } from '../stores/authStore';
import type { LoginResponseData } from '../types/auth';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function LoginPage() {
  const { isAuthenticated, isHydrated, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const destination = state?.from?.pathname || '/karyawan';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginFormValues) =>
      apiRequest<LoginResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      toast.success(`Selamat datang, ${data.user.name}`);
      navigate(destination, { replace: true });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Gagal masuk. Periksa koneksi Anda dan coba lagi.';
      toast.error(message);
    },
  });

  if (isHydrated && isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <div className="rounded-3xl border border-[#8ECDF2]/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF7FE] text-[#E32636]">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
            Masuk Warga Halim
          </h1>
          <p className="text-base text-slate-600">
            Gunakan email dan password yang telah didaftarkan oleh admin.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-base font-medium text-slate-800 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@wargahalim.id"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#8ECDF2] focus:outline-none focus:ring-2 focus:ring-[#8ECDF2]/50"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-[#E32636]" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-base font-medium text-slate-800 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Minimal 6 karakter"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#8ECDF2] focus:outline-none focus:ring-2 focus:ring-[#8ECDF2]/50"
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-[#E32636]" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-[#E32636] px-5 py-3 text-base font-semibold text-white hover:bg-[#C81E2D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loginMutation.isPending ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-base text-slate-600">
          Belum punya akun?{' '}
          <Link
            to="/register"
            className="font-semibold text-sky-700 hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

