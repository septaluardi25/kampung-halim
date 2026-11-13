import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db/pool';
import { loginAs, seedAdmin, seedEmployee, seedUser } from './setup';

describe('Admin Employee Photo API (/api/admin/employees/:id/photo)', () => {
  it('ADP-01: Upload PNG/JPEG valid <= 2MB -> 200, unggah ulang ganti URL, DELETE -> photo_url: null', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Emp Photo');

    // 1. Upload valid PNG
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const resPng = await request(app)
      .post(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', pngBuffer, { filename: 'avatar.png', contentType: 'image/png' });

    expect(resPng.status).toBe(200);
    expect(resPng.body.data.photo_url).toBeDefined();
    const firstUrl = resPng.body.data.photo_url;

    // 2. Re-upload with JPEG replaces URL
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const resJpeg = await request(app)
      .post(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', jpegBuffer, { filename: 'avatar.jpg', contentType: 'image/jpeg' });

    expect(resJpeg.status).toBe(200);
    expect(resJpeg.body.data.photo_url).not.toBe(firstUrl);

    // 3. DELETE photo
    const resDel = await request(app)
      .delete(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDel.status).toBe(200);
    expect(resDel.body.data.photo_url).toBeNull();

    const [rows] = await pool.query<any[]>('SELECT photo_url FROM employees WHERE id = ?', [empId]);
    expect(rows[0].photo_url).toBeNull();
  });

  it('ADP-02: File > 2 MB -> 400 Ukuran foto maksimal 2 MB', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Emp Photo');

    const bigBuffer = Buffer.alloc(2 * 1024 * 1024 + 100);
    bigBuffer[0] = 0x89;
    bigBuffer[1] = 0x50;
    bigBuffer[2] = 0x4e;
    bigBuffer[3] = 0x47;
    bigBuffer[4] = 0x0d;
    bigBuffer[5] = 0x0a;
    bigBuffer[6] = 0x1a;
    bigBuffer[7] = 0x0a;

    const res = await request(app)
      .post(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', bigBuffer, { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('2 MB');
  });

  it('ADP-03: Format tidak didukung (PDF/TXT) -> 400', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Emp Photo');

    const pdfBuffer = Buffer.from('%PDF-1.4 file content');
    const res = await request(app)
      .post(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', pdfBuffer, { filename: 'doc.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  it('ADP-04: File MIME palsu (header image/jpeg tapi isi teks biasa) -> 400 (magic bytes)', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Emp Photo');

    const fakeBuffer = Buffer.from('bukan gambar asli hanya teks biasa');
    const res = await request(app)
      .post(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', fakeBuffer, { filename: 'fake.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
  });

  it('ADP-05: Field bukan photo / tanpa file -> 400', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Emp Photo');

    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const resWrongField = await request(app)
      .post(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', buf, { filename: 'avatar.png', contentType: 'image/png' });
    expect(resWrongField.status).toBe(400);

    const resNoFile = await request(app)
      .post(`/api/admin/employees/${empId}/photo`)
      .set('Authorization', `Bearer ${token}`);
    expect(resNoFile.status).toBe(400);
  });

  it('ADP-06: Employee tidak ada -> 404', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = await request(app)
      .post('/api/admin/employees/99999/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', buf, { filename: 'avatar.png', contentType: 'image/png' });
    expect(res.status).toBe(404);

    const resDel = await request(app)
      .delete('/api/admin/employees/99999/photo')
      .set('Authorization', `Bearer ${token}`);
    expect(resDel.status).toBe(404);
  });

  it('ADP-07: 401 tanpa token, 403 untuk user biasa', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const userToken = await loginAs('user@wargahalim.id', 'UserPass123!');

    const resNoToken = await request(app).post('/api/admin/employees/1/photo');
    expect(resNoToken.status).toBe(401);

    const resForbidden = await request(app)
      .post('/api/admin/employees/1/photo')
      .set('Authorization', `Bearer ${userToken}`);
    expect(resForbidden.status).toBe(403);
  });

  it('ADP-08: Hapus employee dengan photo_url -> DB terhapus dulu, blob best-effort (M3 & M4)', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Emp Photo Del', 'EPD', 'published');

    // Attach mock photo_url
    await pool.query("UPDATE employees SET photo_url = 'https://mock-blob.local/test.png' WHERE id = ?", [empId]);

    const res = await request(app)
      .delete(`/api/admin/employees/${empId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const [rows] = await pool.query<any[]>('SELECT id FROM employees WHERE id = ?', [empId]);
    expect(rows.length).toBe(0);
  });
});
