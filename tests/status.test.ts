import request from 'supertest';
import app from '../src/app';

describe('GET /status', () => {
  it('should return 200 and a success message', async () => {
    const response = await request(app).get('/status');

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({
      message: 'le serveur fonctionne',
    });
  });
});
