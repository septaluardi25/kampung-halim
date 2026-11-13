import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { loginAs, seedAdmin } from './setup';

describe('Hardening & Edge Cases (H3, HRD-01 to HRD-04)', () => {
  it('HRD-01: Body JSON rusak -> 400 Format JSON tidak valid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken json');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Format JSON tidak valid');
  });

  it('HRD-02: Body > 1 MB -> 413 Ukuran request terlalu besar', async () => {
    const hugePayload = JSON.stringify({
      data: 'x'.repeat(1.5 * 1024 * 1024),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(hugePayload);

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Ukuran request terlalu besar');
  });

  it('HRD-03: ER_DUP_ENTRY -> 409 Data sudah digunakan (tidak 500)', async () => {
    await seedAdmin();
    const token = await loginAs('admin@wargahalim.id', 'AdminPass123!');

    // Test duplicate email on POST
    const res1 = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'User Pertama',
        email: 'user.dup@wargahalim.id',
        password: 'password123',
      });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'User Kedua',
        email: 'user.dup@wargahalim.id',
        password: 'password123',
      });
    expect(res2.status).toBe(409);
    expect(res2.body.message).toBe('Email sudah terdaftar');
  });

  it('HRD-04: Response error tidak pernah membocorkan SQL, ER_, atau stack trace', async () => {
    const resBadParam = await request(app).get('/api/memories/abc');
    expect(resBadParam.body.message).not.toContain('SQL');
    expect(resBadParam.body.message).not.toContain('ER_');
    expect(resBadParam.body.stack).toBeUndefined();

    const resNotFound = await request(app).get('/api/non-existent-404');
    expect(resNotFound.body.message).not.toContain('SQL');
    expect(resNotFound.body.stack).toBeUndefined();
  });
});
