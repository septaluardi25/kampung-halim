import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../db/pool';
import { sendError, sendSuccess } from '../utils/response';

export async function getHealthStatus(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    await checkDatabaseConnection();

    sendSuccess(
      res,
      200,
      {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      'Server dan database berjalan normal'
    );
  } catch (error) {
    console.error('[Health Check Error]', error);
    sendError(res, 500, 'Gagal terhubung ke database', {
      status: 'error',
      database: 'disconnected',
    });
  }
}

