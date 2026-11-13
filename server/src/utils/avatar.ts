/**
 * Menghasilkan inisial nama 1-2 karakter kapital.
 * Contoh:
 * - "Andi Budi Santoso" -> "AB"
 * - "Nadya" -> "N"
 * - "M Dimas Septaluardi" -> "MD"
 */
export function generateInitials(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'WH';
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'WH';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  const firstChar = parts[0].charAt(0);
  const secondChar = parts[1].charAt(0);
  return (firstChar + secondChar).toUpperCase();
}
