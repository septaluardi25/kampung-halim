import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db/pool';
import { loginAs, seedAdmin, seedEmployee, seedUser } from './setup';

describe('Admin Employees API (/api/admin/employees)', () => {
  it('ADE-01: POST valid -> 201; hobby: "" -> null; nickname kosong -> kata pertama nama', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const res = await request(app)
      .post('/api/admin/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        full_name: 'Budi Santoso',
        nickname: '',
        hometown: 'Surabaya',
        hobby: '',
        status: 'draft',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.full_name).toBe('Budi Santoso');
    expect(res.body.data.nickname).toBe('Budi');
    expect(res.body.data.hobby).toBeNull();
    expect(res.body.data.status).toBe('draft');
  });

  it('ADE-02: POST full_name kosong / >150 / status invalid -> 400', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const resEmptyName = await request(app)
      .post('/api/admin/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: '  ', status: 'draft' });
    expect(resEmptyName.status).toBe(400);

    const resLongName = await request(app)
      .post('/api/admin/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: 'a'.repeat(151), status: 'draft' });
    expect(resLongName.status).toBe(400);

    const resBadStatus = await request(app)
      .post('/api/admin/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: 'Valid Name', status: 'invalid_status' });
    expect(resBadStatus.status).toBe(400);
  });

  it('ADE-03: GET list memuat draft + published; ?search= bekerja; kosong -> []', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const draftId = await seedEmployee('Budi Draft', 'Budi', 'draft');
    await seedEmployee('Andi Published', 'Andi', 'published');

    const resAll = await request(app)
      .get('/api/admin/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(resAll.status).toBe(200);
    expect(resAll.body.data.length).toBe(2);

    const resSearch = await request(app)
      .get('/api/admin/employees?search=Budi')
      .set('Authorization', `Bearer ${token}`);
    expect(resSearch.status).toBe(200);
    expect(resSearch.body.data.length).toBe(1);
    expect(resSearch.body.data[0].id).toBe(draftId);

    const resNone = await request(app)
      .get('/api/admin/employees?search=ZzzNotExistent')
      .set('Authorization', `Bearer ${token}`);
    expect(resNone.status).toBe(200);
    expect(resNone.body.data).toEqual([]);
  });

  it('ADE-04: GET :id ada -> 200; tak ada -> 404; abc -> 400', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Karyawan Detail', 'Detail', 'draft');

    const resOk = await request(app)
      .get(`/api/admin/employees/${empId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resOk.status).toBe(200);
    expect(resOk.body.data.id).toBe(empId);

    const res404 = await request(app)
      .get('/api/admin/employees/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res404.status).toBe(404);

    const res400 = await request(app)
      .get('/api/admin/employees/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res400.status).toBe(400);
  });

  it('ADE-05: PUT valid (draft -> published) -> 200 & muncul di public API; tak ada -> 404', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const empId = await seedEmployee('Karyawan Draft', 'Draft', 'draft');

    const resUpdate = await request(app)
      .put(`/api/admin/employees/${empId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        full_name: 'Karyawan Jadi Published',
        nickname: 'KJP',
        status: 'published',
      });
    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.data.status).toBe('published');

    // Verify in public employees
    const resPub = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(resPub.body.data.some((e: any) => e.id === empId)).toBe(true);

    const res404 = await request(app)
      .put('/api/admin/employees/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: 'Test', status: 'published' });
    expect(res404.status).toBe(404);
  });

  it('ADE-06: DELETE -> 200; cascade messages & tags, user employee_id=NULL; tak ada -> 404', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const emp1 = await seedEmployee('Emp Target');
    const emp2 = await seedEmployee('Emp Partner');

    const [mem] = await pool.query<ResultSetHeader>(
      `INSERT INTO memories (title, event_date, story, status) VALUES ('Liburan', '2022-01-01', 'Cerita', 'published')`
    );
    await pool.query('INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?)', [mem.insertId, emp1]);
    await pool.query('INSERT INTO messages (sender_employee_id, recipient_employee_id, message) VALUES (?, ?, "Halo")', [emp1, emp2]);
    const userId = await seedUser('Linked User', 'linked@wargahalim.id', 'UserPass123!', emp1);

    const resDel = await request(app)
      .delete(`/api/admin/employees/${emp1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDel.status).toBe(200);

    // Verify cascade
    const [msgCheck] = await pool.query<any[]>('SELECT id FROM messages WHERE sender_employee_id = ?', [emp1]);
    expect(msgCheck.length).toBe(0);

    const [tagCheck] = await pool.query<any[]>('SELECT * FROM memory_employees WHERE employee_id = ?', [emp1]);
    expect(tagCheck.length).toBe(0);

    const [userCheck] = await pool.query<any[]>('SELECT employee_id FROM users WHERE id = ?', [userId]);
    expect(userCheck[0].employee_id).toBeNull();

    const res404 = await request(app)
      .delete('/api/admin/employees/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res404.status).toBe(404);
  });

  it('ADE-07: Tanpa token -> 401; token user biasa -> 403', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const userToken = await loginAs('user@wargahalim.id', 'UserPass123!');

    const resNoToken = await request(app).get('/api/admin/employees');
    expect(resNoToken.status).toBe(401);

    const resForbidden = await request(app)
      .get('/api/admin/employees')
      .set('Authorization', `Bearer ${userToken}`);
    expect(resForbidden.status).toBe(403);
  });
});
