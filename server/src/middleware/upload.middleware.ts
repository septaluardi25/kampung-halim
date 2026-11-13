import type { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { sendError } from '../utils/response';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

export function uploadEmployeePhotoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const handler = upload.single('photo');

  handler(req, res, (err: unknown) => {
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        sendError(res, 400, 'Ukuran foto maksimal 2 MB');
        return;
      }
      sendError(res, 400, 'Gagal memproses file foto yang diunggah');
      return;
    }

    if (err) {
      sendError(res, 400, 'Format unggahan foto tidak valid');
      return;
    }

    next();
  });
}
