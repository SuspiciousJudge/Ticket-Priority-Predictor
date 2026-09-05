jest.mock('../middleware/audit', () => (req, res, next) => next());

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app').app;

describe('health endpoint', () => {
  afterEach(() => {
    mongoose.connection.readyState = 0;
  });

  test('reports degraded when MongoDB is unavailable', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ success: false, ready: false, database: { connected: false } });
  });

  test('reports ready when MongoDB is connected', async () => {
    mongoose.connection.readyState = 1;
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, ready: true, database: { connected: true } });
  });
});
