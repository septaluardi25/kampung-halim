import app from './app';
import { env } from './config/env';
import { checkDatabaseConnection } from './db/pool';

async function startServer(): Promise<void> {
  try {
    await checkDatabaseConnection();
    console.log('[DB] Koneksi pool MySQL berhasil diverifikasi.');

    app.listen(env.PORT, () => {
      console.log(`[Server] Berjalan di http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('[Startup Error] Gagal menyalakan server:', error);
    process.exit(1);
  }
}

void startServer();

