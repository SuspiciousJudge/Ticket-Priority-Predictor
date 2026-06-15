jest.mock('../middleware/auth', () => (req, res, next) => { req.user = { _id: 'test-user', role: 'admin' }; return next(); });
jest.mock('../middleware/authorize', () => () => (req, res, next) => next());

const request = require('supertest');

describe('AI routes', () => {
  let app;
  beforeAll(() => {
    // Fresh import after mocks
    jest.resetModules();
    app = require('../server');
  });

  test('POST /api/ai/explain returns explanation payload', async () => {
    const res = await request(app)
      .post('/api/ai/explain')
      .send({ title: 'Service crash for all users', description: 'Production service down and impacting all users' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    const d = res.body.data;
    expect(d).toHaveProperty('input');
    expect(d).toHaveProperty('heuristic');
    expect(d.heuristic).toHaveProperty('priority');
  });
});
