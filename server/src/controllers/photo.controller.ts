import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { sendError, sendSuccess } from '../utils/response';

interface PublicPhotoRow extends RowDataPacket {
  id: number;
  photo_url: string;
}

/**
 * Mengambil daftar URL foto karyawan berstatus published yang memiliki foto
 * untuk halaman Home publik tanpa membocorkan nama atau biodata.
 */
export async function getPublicPhotos(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const query = `
      SELECT id, photo_url
      FROM employees
      WHERE status = 'published'
        AND photo_url IS NOT NULL
        AND photo_url <> ''
      ORDER BY id ASC
    `;

    const [rows] = await pool.query<PublicPhotoRow[]>(query);

    sendSuccess(res, 200, rows, 'Daftar foto galeri berhasil diambil');
  } catch (error) {
    console.error('[GetPublicPhotos Error]', error);
    sendError(res, 500, 'Gagal mengambil daftar foto galeri');
  }
}

