process.env.NODE_ENV = 'production';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ticketpro-test';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';

jest.mock('../middleware/auth', () => (req, res, next) => next());
jest.mock('../middleware/dbReady', () => (req, res, next) => next());
jest.mock('../middleware/audit', () => (req, res, next) => next());

const request = require('supertest');
const app = require('../app').app;

describe('production upload policy', () => {
  test('rejects uploads when persistent storage is not configured', async () => {
    const res = await request(app).post('/api/upload');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      success: false,
      message: 'File uploads require configured persistent storage in production',
    });
  });
});
