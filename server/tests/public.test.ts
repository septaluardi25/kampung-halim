import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db/pool';
import { loginAs, seedEmployee, seedUser } from './setup';

describe('Public APIs (Employees, Memories, Messages)', () => {
  it('PUB-02: GET /api/employees tanpa token -> 401; token valid -> 200 hanya published', async () => {
    await seedEmployee('Budi Draft', 'Budi', 'draft');
    await seedEmployee('Andi Published', 'Andi', 'published');
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');

    const resNoToken = await request(app).get('/api/employees');
    expect(resNoToken.status).toBe(401);

    const token = await loginAs('user@wargahalim.id', 'UserPass123!');
    const resAuth = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);

    expect(resAuth.status).toBe(200);
    expect(resAuth.body.data.length).toBe(1);
    expect(resAuth.body.data[0].full_name).toBe('Andi Published');
  });

  it('PUB-03: GET /api/employees?search= terfilter, >100 karakter -> 400, tak cocok -> []', async () => {
    await seedEmployee('Citra Kirana', 'Ciki', 'published');
    await seedEmployee('Dewi Sartika', 'Dewi', 'published');
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const token = await loginAs('user@wargahalim.id', 'UserPass123!');

    const resMatch = await request(app)
      .get('/api/employees?search=Ciki')
      .set('Authorization', `Bearer ${token}`);
    expect(resMatch.status).toBe(200);
    expect(resMatch.body.data.length).toBe(1);
    expect(resMatch.body.data[0].nickname).toBe('Ciki');

    const longStr = 'a'.repeat(101);
    const resLong = await request(app)
      .get(`/api/employees?search=${longStr}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resLong.status).toBe(400);

    const resEmpty = await request(app)
      .get('/api/employees?search=TidakAdaYangCocok')
      .set('Authorization', `Bearer ${token}`);
    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.data).toEqual([]);
  });

  it('PUB-04: GET /api/memories hanya published, urut event_date DESC', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const token = await loginAs('user@wargahalim.id', 'UserPass123!');

    await pool.query(
      `INSERT INTO memories (title, event_date, story, status) VALUES
       ('Memori 2020', '2020-01-01', 'Cerita 2020', 'published'),
       ('Memori Draft', '2023-01-01', 'Cerita Draft', 'draft'),
       ('Memori 2022', '2022-01-01', 'Cerita 2022', 'published')`
    );

    const res = await request(app)
      .get('/api/memories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].title).toBe('Memori 2022');
    expect(res.body.data[1].title).toBe('Memori 2020');
  });

  it('PUB-05: GET /api/memories/:id published -> 200; draft -> 404; invalid -> 400; tak ada -> 404', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const token = await loginAs('user@wargahalim.id', 'UserPass123!');

    const empPub = await seedEmployee('Karyawan Published', 'KP', 'published');
    const empDraft = await seedEmployee('Karyawan Draft', 'KD', 'draft');

    const [pubRes] = await pool.query<ResultSetHeader>(
      `INSERT INTO memories (title, event_date, story, status) VALUES ('Memori Pub', '2022-01-01', 'Cerita', 'published')`
    );
    const pubId = pubRes.insertId;
    await pool.query(
      `INSERT INTO memory_employees (memory_id, employee_id) VALUES (?, ?), (?, ?)`,
      [pubId, empPub, pubId, empDraft]
    );

    const [draftRes] = await pool.query<ResultSetHeader>(
      `INSERT INTO memories (title, event_date, story, status) VALUES ('Memori Draft', '2022-01-01', 'Cerita', 'draft')`
    );
    const draftId = draftRes.insertId;

    // Published memory: returns only published tagged employees
    const resPub = await request(app)
      .get(`/api/memories/${pubId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resPub.status).toBe(200);
    expect(resPub.body.data.employees.length).toBe(1);
    expect(resPub.body.data.employees[0].id).toBe(empPub);

    // Draft memory -> 404
    const resDraft = await request(app)
      .get(`/api/memories/${draftId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDraft.status).toBe(404);

    // Invalid id -> 400
    const resInvalid1 = await request(app)
      .get('/api/memories/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(resInvalid1.status).toBe(400);

    const resInvalid2 = await request(app)
      .get('/api/memories/0')
      .set('Authorization', `Bearer ${token}`);
    expect(resInvalid2.status).toBe(400);

    // Non-existent id -> 404
    const resNotFound = await request(app)
      .get('/api/memories/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(resNotFound.status).toBe(404);
  });

  it('PUB-06: GET /api/messages hanya jika pengirim & penerima published; tanpa token -> 401', async () => {
    const e1 = await seedEmployee('Emp 1', 'E1', 'published');
    const e2 = await seedEmployee('Emp 2', 'E2', 'published');
    const eDraft = await seedEmployee('Emp Draft', 'ED', 'draft');

    await pool.query(
      `INSERT INTO messages (sender_employee_id, recipient_employee_id, message) VALUES
       (?, ?, 'Pesan Valid'),
       (?, ?, 'Pesan dengan Draft')`,
      [e1, e2, e1, eDraft]
    );

    const resNoToken = await request(app).get('/api/messages');
    expect(resNoToken.status).toBe(401);

    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const token = await loginAs('user@wargahalim.id', 'UserPass123!');

    const res = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].message).toBe('Pesan Valid');
  });

  it('PUB-07: POST/PUT/PATCH/DELETE /api/messages -> 404 (tidak ada endpoint tulis user)', async () => {
    await seedUser('User', 'user@wargahalim.id', 'UserPass123!');
    const token = await loginAs('user@wargahalim.id', 'UserPass123!');

    const postRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Tes' });
    expect(postRes.status).toBe(404);

    const putRes = await request(app)
      .put('/api/messages/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Tes' });
    expect(putRes.status).toBe(404);

    const patchRes = await request(app)
      .patch('/api/messages/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Tes' });
    expect(patchRes.status).toBe(404);

    const delRes = await request(app)
      .delete('/api/messages/1')
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(404);
  });
});
