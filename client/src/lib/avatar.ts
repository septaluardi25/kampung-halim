const AVATAR_COLORS = [
  'bg-sky-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white',
  'bg-amber-600 text-white',
  'bg-emerald-600 text-white',
  'bg-rose-600 text-white',
  'bg-cyan-700 text-white',
  'bg-slate-700 text-white',
];

/**
 * Menghasilkan inisial maksimal 2 huruf kapital dari nama lengkap.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'WH';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Menghasilkan kelas warna latar deterministik berdasarkan nama karyawan
 * agar avatar inisial untuk nama yang sama selalu konsisten.
 */
export function getDeterministicAvatarColor(name: string): string {
  const normalized = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

