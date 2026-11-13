import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Terjadi kesalahan saat memuat data. Silakan coba lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-10 text-center"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#E32636] shadow-xs">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">
        Gagal Memuat Data
      </h3>
      <p className="mt-2 text-base text-slate-700 max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#E32636] px-5 py-2.5 text-base font-medium text-white hover:bg-[#C81E2D] transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}

