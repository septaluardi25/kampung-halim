import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';

describe('Health & Global Routes', () => {
  it('PUB-01: GET /api/health -> 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('PUB-08: Rute tidak dikenal -> 404 Endpoint tidak ditemukan', async () => {
    const res = await request(app).get('/api/non-existent-route-404');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Endpoint tidak ditemukan');
  });
});
