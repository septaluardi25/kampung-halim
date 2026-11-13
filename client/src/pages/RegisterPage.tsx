import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import {
  type RegisterFormValues,
  registerSchema,
} from '../schemas/auth.schema';
import { useAuthStore } from '../stores/authStore';
import type { RegisterRequest, RegisterResponseData } from '../types/auth';

export function RegisterPage() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) =>
      apiRequest<RegisterResponseData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setRegisteredEmail(data.email);
      toast.success('Registrasi berhasil! Menunggu persetujuan admin.');
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Gagal mendaftar. Periksa koneksi Anda dan coba lagi.';
      toast.error(message);
    },
  });

  if (isHydrated && isAuthenticated) {
    return <Navigate to="/karyawan" replace />;
  }

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      name: values.name,
      email: values.email,
      password: values.password,
    });
  };

  if (registeredEmail) {
    return (
      <div className="mx-auto max-w-md py-6 sm:py-10">
        <div className="rounded-3xl border border-[#8ECDF2]/80 bg-white p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
            Pendaftaran Berhasil Dikirim
          </h1>
          <p className="text-base text-slate-700">
            Akun Anda (<span className="font-semibold">{registeredEmail}</span>)
            telah terdaftar dengan status{' '}
            <span className="font-semibold">menunggu persetujuan Admin</span>.
            Anda dapat masuk setelah Admin mengaktifkan akun Anda.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              to="/login"
              className="w-full rounded-xl bg-[#E32636] px-5 py-3 text-base font-semibold text-white hover:bg-[#C81E2D] transition-colors"
            >
              Ke Halaman Masuk
            </Link>
            <Link
              to="/"
              className="text-base font-medium text-sky-700 hover:underline"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <div className="rounded-3xl border border-[#8ECDF2]/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF7FE] text-[#E32636]">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-slate-900">
            Daftar Akun Warga Halim
          </h1>
          <p className="text-base text-slate-600">
            Isi data di bawah untuk mengajukan pendaftaran akun. Akun akan aktif
            setelah disetujui admin.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-base font-medium text-slate-800 mb-1.5"
            >
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Minimal 5 karakter"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#8ECDF2] focus:outline-none focus:ring-2 focus:ring-[#8ECDF2]/50"
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-[#E32636]" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-base font-medium text-slate-800 mb-1.5"
            >
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi password Anda"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#8ECDF2] focus:outline-none focus:ring-2 focus:ring-[#8ECDF2]/50"
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-[#E32636]" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full rounded-xl bg-[#E32636] px-5 py-3 text-base font-semibold text-white hover:bg-[#C81E2D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {registerMutation.isPending ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-base text-slate-600">
          Sudah punya akun?{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-700 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
