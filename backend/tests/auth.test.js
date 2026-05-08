const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

const buildRegisterPayload = () => ({
  name: 'Test User',
  email: `test-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
  password: 'secret123',
  role: 'patient',
});

describe('Auth routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_EXPIRE = '1d';
    jest.resetModules();
    app = require('../server');
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('registers a new user and returns token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload());
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('rejects duplicate email registration', async () => {
    const payload = buildRegisterPayload();
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res.statusCode).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const payload = buildRegisterPayload();
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/login').send({
      email: payload.email,
      password: payload.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const payload = buildRegisterPayload();
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/login').send({
      email: payload.email,
      password: 'wrongpass',
    });
    expect(res.statusCode).toBe(401);
  });

  it('blocks /me without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns user with valid token', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload());
    const token = registerRes.body.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user).toBeDefined();
  });
});
