const request = require('supertest');
const app = require('../server');

describe('Patient routes', () => {
  it('status route is available', async () => {
    const res = await request(app).get('/api/v1/status');
    expect(res.statusCode).toBe(200);
  });
});
