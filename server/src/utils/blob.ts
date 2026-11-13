import { del, put } from '@vercel/blob';
import crypto from 'crypto';
import { env } from '../config/env';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Memeriksa kesesuaian MIME type sekaligus magic bytes (file signature) buffer gambar.
 * Mencegah file teks/PDF/executable yang hanya diganti ekstensi atau header MIME-nya.
 */
export function validateImageBuffer(
  buffer: Buffer,
  declaredMimeType: string
): 'jpg' | 'png' | 'webp' | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(declaredMimeType)) {
    return null;
  }

  // JPEG: FF D8 FF
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // WebP: RIFF....WEBP
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if (declaredMimeType === 'image/jpeg' && isJpeg) return 'jpg';
  if (declaredMimeType === 'image/png' && isPng) return 'png';
  if (declaredMimeType === 'image/webp' && isWebp) return 'webp';

  return null;
}

export async function uploadPhotoToBlob(
  employeeId: number,
  buffer: Buffer,
  extension: 'jpg' | 'png' | 'webp',
  contentType: string
): Promise<string> {
  const filename = `employees/${employeeId}-${crypto.randomUUID()}.${extension}`;

  if (!env.BLOB_READ_WRITE_TOKEN) {
    // Fallback deterministik untuk pengembangan/testing lokal tanpa token Vercel Blob
    return `https://mock-blob.local/${filename}`;
  }

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

export async function deletePhotoFromBlob(photoUrl: string | null): Promise<void> {
  if (!photoUrl || photoUrl.startsWith('https://mock-blob.local/')) {
    return;
  }
  if (!env.BLOB_READ_WRITE_TOKEN) {
    return;
  }
  try {
    await del(photoUrl, { token: env.BLOB_READ_WRITE_TOKEN });
  } catch (error) {
    console.error('[DeleteBlob Warning]', error);
  }
}
