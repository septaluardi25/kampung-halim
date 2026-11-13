import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db/pool';
import { loginAs, seedAdmin, seedEmployee, seedUser } from './setup';

describe('Admin Memories API (/api/admin/memories)', () => {
  it('ADM-01: POST + employee_ids:[1,2] -> 201, tags tersimpan', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');
    const e2 = await seedEmployee('Emp 2');

    const res = await request(app)
      .post('/api/admin/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Outing Bersama',
        event_date: '2022-08-17',
        story: 'Seru sekali!',
        status: 'published',
        employee_ids: [e1, e2],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.employee_ids).toEqual([e1, e2]);
    expect(res.body.data.employees.length).toBe(2);
  });

  it('ADM-02: employee_ids berisi id tidak valid -> 400 & rollback atomik (0 baris tersimpan)', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');

    const res = await request(app)
      .post('/api/admin/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Outing Gagal',
        event_date: '2022-08-17',
        story: 'Gagal',
        status: 'published',
        employee_ids: [e1, 99999],
      });

    expect(res.status).toBe(400);

    const [memRows] = await pool.query<any[]>('SELECT id FROM memories WHERE title = ?', ['Outing Gagal']);
    expect(memRows.length).toBe(0);
  });

  it('ADM-03: employee_ids duplikat [1, 1] -> disimpan 1 kali secara unik', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');

    const res = await request(app)
      .post('/api/admin/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Outing Duplikat Tag',
        event_date: '2022-08-17',
        story: 'Cerita',
        status: 'published',
        employee_ids: [e1, e1],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.employee_ids).toEqual([e1]);
  });

  it('ADM-04: Judul kosong, story kosong, tanggal 2022-13-45 / 22-1-1 -> 400 (M2 validasi tanggal nyata)', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const resBadDate = await request(app)
      .post('/api/admin/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Judul',
        event_date: '2022-13-45',
        story: 'Story',
        status: 'published',
      });
    expect(resBadDate.status).toBe(400);

    const resBadFormat = await request(app)
      .post('/api/admin/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Judul',
        event_date: '22-1-1',
        story: 'Story',
        status: 'published',
      });
    expect(resBadFormat.status).toBe(400);

    const resEmptyTitle = await request(app)
      .post('/api/admin/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '   ',
        event_date: '2022-05-01',
        story: 'Story',
        status: 'published',
      });
    expect(resEmptyTitle.status).toBe(400);
  });

  it('ADM-05: PUT mengganti tag [1] -> [2] atomik; PUT error tidak mengubah tag lama', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');
    const e2 = await seedEmployee('Emp 2');

    const [memRes] = await pool.query<ResultSetHeader>(
      `INSERT INTO memories (title, event_date, story, status) VALUES ('Judul Lama', '2022-01-01', 'Story', 'published')`
    );
    const memId = memRes.insertId;
    await pool.query('INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?)', [memId, e1]);

    // Success update
    const resUpdate = await request(app)
      .put(`/api/admin/memories/${memId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Judul Baru',
        event_date: '2022-01-01',
        story: 'Story Baru',
        status: 'draft',
        employee_ids: [e2],
      });
    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.data.employee_ids).toEqual([e2]);

    // Failed update with non-existent employee
    const resFail = await request(app)
      .put(`/api/admin/memories/${memId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Judul Gagal',
        event_date: '2022-01-01',
        story: 'Story Gagal',
        status: 'draft',
        employee_ids: [99999],
      });
    expect(resFail.status).toBe(400);

    // Old tag [e2] remains intact
    const [tags] = await pool.query<any[]>('SELECT employee_id FROM memory_employees WHERE memory_id = ?', [memId]);
    expect(tags.length).toBe(1);
    expect(tags[0].employee_id).toBe(e2);
  });

  it('ADM-06: DELETE -> 200, tag terhapus, employee utuh; tak ada -> 404', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');

    const [memRes] = await pool.query<ResultSetHeader>(
      `INSERT INTO memories (title, event_date, story, status) VALUES ('Hapus', '2022-01-01', 'Story', 'published')`
    );
    const memId = memRes.insertId;
    await pool.query('INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?)', [memId, e1]);

    const resDel = await request(app)
      .delete(`/api/admin/memories/${memId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDel.status).toBe(200);

    const [memCheck] = await pool.query<any[]>('SELECT id FROM memories WHERE id = ?', [memId]);
    expect(memCheck.length).toBe(0);

    const [tagCheck] = await pool.query<any[]>('SELECT * FROM memory_employees WHERE memory_id = ?', [memId]);
    expect(tagCheck.length).toBe(0);

    const [empCheck] = await pool.query<any[]>('SELECT id FROM employees WHERE id = ?', [e1]);
    expect(empCheck.length).toBe(1);

    const res404 = await request(app)
      .delete('/api/admin/memories/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res404.status).toBe(404);
  });

  it('ADM-07: GET list/detail memuat draft; employees terisi; 404 bila tidak ada', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Emp 1');

    const [memRes] = await pool.query<ResultSetHeader>(
      `INSERT INTO memories (title, event_date, story, status) VALUES ('Memori Draft', '2022-01-01', 'Story', 'draft')`
    );
    const memId = memRes.insertId;
    await pool.query('INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?)', [memId, e1]);

    const resList = await request(app)
      .get('/api/admin/memories')
      .set('Authorization', `Bearer ${token}`);
    expect(resList.status).toBe(200);
    expect(resList.body.data.length).toBe(1);
    expect(resList.body.data[0].status).toBe('draft');

    const resDetail = await request(app)
      .get(`/api/admin/memories/${memId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDetail.status).toBe(200);
    expect(resDetail.body.data.employees.length).toBe(1);

    const res404 = await request(app)
      .get('/api/admin/memories/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res404.status).toBe(404);
  });

  it('ADM-08: Tanpa token -> 401, token user biasa -> 403', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const userToken = await loginAs('user@wargahalim.id', 'UserPass123!');

    const resNoToken = await request(app).get('/api/admin/memories');
    expect(resNoToken.status).toBe(401);

    const resForbidden = await request(app)
      .get('/api/admin/memories')
      .set('Authorization', `Bearer ${userToken}`);
    expect(resForbidden.status).toBe(403);
  });
});
