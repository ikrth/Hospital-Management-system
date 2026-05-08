const request = require('supertest');
const app = require('../server');

describe('Doctor routes', () => {
  it('status route works', async () => {
    const res = await request(app).get('/api/v1/status');
    expect(res.statusCode).toBe(200);
  });
});
