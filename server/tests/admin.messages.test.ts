import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db/pool';
import { loginAs, seedAdmin, seedEmployee, seedUser } from './setup';

describe('Admin Messages API (/api/admin/messages)', () => {
  it('ADG-01: POST valid -> 201; impression opsional ("" -> null); muncul di public', async () => {
    await seedAdmin();
    const adminToken = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Sender Emp', 'SE', 'published');
    const e2 = await seedEmployee('Recipient Emp', 'RE', 'published');

    const res = await request(app)
      .post('/api/admin/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sender_employee_id: e1,
        recipient_employee_id: e2,
        message: 'Terima kasih banyak!',
        impression: '',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.message).toBe('Terima kasih banyak!');
    expect(res.body.data.impression).toBeNull();

    // Appears in public API
    const resPub = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resPub.body.data.some((m: any) => m.id === res.body.data.id)).toBe(true);
  });

  it('ADG-02: Sender == recipient / tak ada / message kosong / impression > 300 -> 400', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');

    const resSame = await request(app)
      .post('/api/admin/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sender_employee_id: e1,
        recipient_employee_id: e1,
        message: 'Pesan ke diri sendiri',
      });
    expect(resSame.status).toBe(400);

    const resNotFound = await request(app)
      .post('/api/admin/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sender_employee_id: e1,
        recipient_employee_id: 99999,
        message: 'Pesan',
      });
    expect(resNotFound.status).toBe(400);

    const resEmptyMsg = await request(app)
      .post('/api/admin/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sender_employee_id: e1,
        recipient_employee_id: 2,
        message: '   ',
      });
    expect(resEmptyMsg.status).toBe(400);

    const resLongImp = await request(app)
      .post('/api/admin/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sender_employee_id: e1,
        recipient_employee_id: 2,
        message: 'Valid',
        impression: 'a'.repeat(301),
      });
    expect(resLongImp.status).toBe(400);
  });

  it('ADG-03: GET list termasuk pesan dengan karyawan draft', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Sender Draft', 'SD', 'draft');
    const e2 = await seedEmployee('Recipient Pub', 'RP', 'published');

    await pool.query(
      `INSERT INTO messages (sender_employee_id, recipient_employee_id, message) VALUES (?, ?, 'Pesan Moderasi')`,
      [e1, e2]
    );

    const res = await request(app)
      .get('/api/admin/messages')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].message).toBe('Pesan Moderasi');
  });

  it('ADG-04: DELETE -> 200; tak ada -> 404', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');
    const e2 = await seedEmployee('Emp 2');

    const [msgRes] = await pool.query<ResultSetHeader>(
      `INSERT INTO messages (sender_employee_id, recipient_employee_id, message) VALUES (?, ?, 'Pesan Hapus')`,
      [e1, e2]
    );
    const msgId = msgRes.insertId;

    const resDel = await request(app)
      .delete(`/api/admin/messages/${msgId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDel.status).toBe(200);

    const [check] = await pool.query<any[]>('SELECT id FROM messages WHERE id = ?', [msgId]);
    expect(check.length).toBe(0);

    const res404 = await request(app)
      .delete('/api/admin/messages/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res404.status).toBe(404);
  });

  it('ADG-05: PUT/PATCH /api/admin/messages/:id -> 404 (strictly tidak ada endpoint edit pesan)', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const resPut = await request(app)
      .put('/api/admin/messages/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Edit coba' });
    expect(resPut.status).toBe(404);

    const resPatch = await request(app)
      .patch('/api/admin/messages/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Patch coba' });
    expect(resPatch.status).toBe(404);
  });

  it('ADG-06: 401 tanpa token, 403 untuk user biasa', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const userToken = await loginAs('user@wargahalim.id', 'UserPass123!');

    const resNoToken = await request(app).get('/api/admin/messages');
    expect(resNoToken.status).toBe(401);

    const resForbidden = await request(app)
      .get('/api/admin/messages')
      .set('Authorization', `Bearer ${userToken}`);
    expect(resForbidden.status).toBe(403);
  });
});
