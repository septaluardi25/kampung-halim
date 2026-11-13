import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db/pool';
import { loginAs, seedAdmin, seedEmployee, seedUser } from './setup';

describe('Admin Users API (/api/admin/users)', () => {
  it('ADU-01: POST valid -> 201; role locked "user", employee_id=null, hash bcrypt, no password_hash in response, can login (H1)', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Citra Dewi',
        email: 'citra@wargahalim.id',
        password: 'password123',
        role: 'admin',
        employee_id: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.employee_id).toBeNull();
    expect(res.body.data.password_hash).toBeUndefined();

    // Verify bcrypt in database
    const [rows] = await pool.query<any[]>('SELECT password_hash FROM users WHERE id = ?', [res.body.data.id]);
    expect(rows[0].password_hash.startsWith('$2')).toBe(true);

    // Verify user can login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citra@wargahalim.id', password: 'password123' });
    expect(loginRes.status).toBe(200);
  });

  it('ADU-02: Email duplikat (case-insensitive) -> 409; name < 5, email invalid, password < 6 -> 400', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    await seedUser('User Ada', 'ada@wargahalim.id');

    // Duplicate email
    const resDup = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'User Baru',
        email: 'ADA@wargahalim.id',
        password: 'password123',
      });
    expect(resDup.status).toBe(409);

    // Short name (< 5)
    const resShortName = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Andi', email: 'andi@wargahalim.id', password: 'password123' });
    expect(resShortName.status).toBe(400);

    // Invalid email
    const resBadEmail = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Andi Budi', email: 'bukan-email', password: 'password123' });
    expect(resBadEmail.status).toBe(400);

    // Short password (< 6)
    const resShortPass = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Andi Budi', email: 'andi@wargahalim.id', password: '123' });
    expect(resShortPass.status).toBe(400);
  });

  it('ADU-03: PUT tautkan employee_id -> 200; karyawan tak ada -> 400; sudah dipakai -> 409; null melepas', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const e1 = await seedEmployee('Karyawan 1');
    const u1 = await seedUser('User Satu', 'u1@wargahalim.id', 'Pass123!', e1);
    const u2 = await seedUser('User Dua', 'u2@wargahalim.id', 'Pass123!', null);

    // Link already linked employee -> 409
    const resConflict = await request(app)
      .put(`/api/admin/users/${u2}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employee_id: e1 });
    expect(resConflict.status).toBe(409);

    // Link non-existent employee -> 400
    const resNotFound = await request(app)
      .put(`/api/admin/users/${u2}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employee_id: 99999 });
    expect(resNotFound.status).toBe(400);

    // Unlink employee_id (null) -> 200
    const resUnlink = await request(app)
      .put(`/api/admin/users/${u1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employee_id: null });
    expect(resUnlink.status).toBe(200);
    expect(resUnlink.body.data.employee_id).toBeNull();

    // Now e1 can be linked to u2 -> 200
    const resLinkU2 = await request(app)
      .put(`/api/admin/users/${u2}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employee_id: e1 });
    expect(resLinkU2.status).toBe(200);
    expect(resLinkU2.body.data.employee_id).toBe(e1);
  });

  it('ADU-04: PUT ganti email ke akun lain -> 409; ganti password -> login password lama gagal, baru berhasil', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const u1 = await seedUser('User Satu', 'u1@wargahalim.id', 'OldPass123!');
    const u2 = await seedUser('User Dua', 'u2@wargahalim.id', 'OldPass123!');

    // Duplicate email
    const resDupEmail = await request(app)
      .put(`/api/admin/users/${u2}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'u1@wargahalim.id' });
    expect(resDupEmail.status).toBe(409);

    // Change password
    const resChangePass = await request(app)
      .put(`/api/admin/users/${u1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NewPass123!' });
    expect(resChangePass.status).toBe(200);

    // Old pass fails
    const resOldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u1@wargahalim.id', password: 'OldPass123!' });
    expect(resOldLogin.status).toBe(401);

    // New pass succeeds
    const resNewLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u1@wargahalim.id', password: 'NewPass123!' });
    expect(resNewLogin.status).toBe(200);
  });

  it('ADU-05: PUT is_active: false -> 200, user tak bisa login (403); admin nonaktifkan diri sendiri -> 400', async () => {
    const adminId = await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const u1 = await seedUser('User Target', 'target@wargahalim.id', 'Pass123!');

    // Deactivate user
    const resDeact = await request(app)
      .put(`/api/admin/users/${u1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_active: false });
    expect(resDeact.status).toBe(200);
    expect(resDeact.body.data.is_active).toBe(false);

    // User login fails with 403
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'target@wargahalim.id', password: 'Pass123!' });
    expect(resLogin.status).toBe(403);

    // Admin self deactivation fails with 400
    const resSelfDeact = await request(app)
      .put(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_active: false });
    expect(resSelfDeact.status).toBe(400);
  });

  it('ADU-06: PUT role berbeda dari role saat ini -> 400; role invalid -> 400; tak ada -> 404', async () => {
    const adminId = await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const u1 = await seedUser('User Target', 'target@wargahalim.id', 'Pass123!');

    // Admin role change attempt
    const resRoleAdmin = await request(app)
      .put(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' });
    expect(resRoleAdmin.status).toBe(400);

    // User role change attempt
    const resRoleUser = await request(app)
      .put(`/api/admin/users/${u1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' });
    expect(resRoleUser.status).toBe(400);

    // Invalid role enum (H1)
    const resInvalidRole = await request(app)
      .put(`/api/admin/users/${u1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'superadmin' });
    expect(resInvalidRole.status).toBe(400);

    // User not found
    const res404 = await request(app)
      .put('/api/admin/users/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nama Valid Pengganti' });
    expect(res404.status).toBe(404);
  });

  it('ADU-07: DELETE user lain -> 200; diri sendiri -> 400; tak ada -> 404', async () => {
    const adminId = await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    const u1 = await seedUser('User Hapus', 'hapus@wargahalim.id');

    // Self delete -> 400
    const resSelfDel = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resSelfDel.status).toBe(400);

    // Delete user -> 200
    const resDel = await request(app)
      .delete(`/api/admin/users/${u1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDel.status).toBe(200);

    const [check] = await pool.query<any[]>('SELECT id FROM users WHERE id = ?', [u1]);
    expect(check.length).toBe(0);

    // Non-existent user -> 404
    const res404 = await request(app)
      .delete('/api/admin/users/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res404.status).toBe(404);
  });

  it('ADU-08: GET list tidak memuat password_hash; 401 / 403', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');
    await seedUser('User List', 'list@wargahalim.id');

    const resList = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(resList.status).toBe(200);
    expect(resList.body.data.length).toBe(2);
    for (const u of resList.body.data) {
      expect(u.password_hash).toBeUndefined();
    }

    const resNoToken = await request(app).get('/api/admin/users');
    expect(resNoToken.status).toBe(401);

    const userToken = await loginAs('list@wargahalim.id', 'UserPass123!');
    const resForbidden = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(resForbidden.status).toBe(403);
  });
});
