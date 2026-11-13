const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Memformat string tanggal YYYY-MM-DD atau ISO timestamp ke format Indonesia
 * misalnya "17 Agustus 2022".
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) {
    return '-';
  }

  const datePart = dateStr.split('T')[0];
  const segments = datePart.split('-');
  if (segments.length === 3) {
    const year = Number(segments[0]);
    const month = Number(segments[1]);
    const day = Number(segments[2]);
    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      month >= 1 &&
      month <= 12
    ) {
      return `${day} ${INDONESIAN_MONTHS[month - 1]} ${year}`;
    }
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return `${parsed.getDate()} ${INDONESIAN_MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

