interface LoadingSkeletonProps {
  variant?: 'grid' | 'detail' | 'list' | 'page';
  count?: number;
}

export function LoadingSkeleton({
  variant = 'grid',
  count = 6,
}: LoadingSkeletonProps) {
  if (variant === 'detail') {
    return (
      <div
        role="status"
        aria-label="Memuat detail data"
        className="animate-pulse space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="h-24 w-24 rounded-full bg-sky-100 shrink-0" />
          <div className="w-full space-y-3">
            <div className="h-6 w-2/3 rounded bg-sky-100" />
            <div className="h-4 w-1/3 rounded bg-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-16 rounded-xl bg-slate-100" />
          <div className="h-16 rounded-xl bg-slate-100" />
          <div className="h-16 rounded-xl bg-slate-100" />
          <div className="h-16 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        role="status"
        aria-label="Memuat daftar data"
        className="animate-pulse space-y-4"
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <div className="h-5 w-1/2 rounded bg-sky-100" />
            <div className="h-4 w-1/4 rounded bg-slate-100" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div
        role="status"
        aria-label="Memuat halaman"
        className="animate-pulse py-12 space-y-4 max-w-2xl mx-auto"
      >
        <div className="h-8 w-1/2 rounded bg-sky-100 mx-auto" />
        <div className="h-4 w-2/3 rounded bg-slate-100 mx-auto" />
        <div className="h-40 w-full rounded-2xl bg-slate-100 mt-6" />
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Memuat galeri atau daftar kartu"
      className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4"
        >
          <div className="h-14 w-14 rounded-full bg-sky-100 shrink-0" />
          <div className="w-full space-y-2">
            <div className="h-5 w-3/4 rounded bg-sky-100" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

