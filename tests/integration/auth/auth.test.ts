import { describe, it, expect, beforeAll, afterAll, createTestServer, cleanupTestServer, createRequest, TestServer, Request } from '../setup';

describe('Authentication API', () => {
  let server: TestServer;
  let request: Request;

  beforeAll(async () => {
    server = await createTestServer();
    request = createRequest(server);
  });

  afterAll(async () => {
    await cleanupTestServer(server);
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return a token', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'admin');
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should login with user credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          username: 'user',
          password: 'password'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'user');
      expect(response.body.user).toHaveProperty('role', 'user');
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with missing credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          username: 'admin'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First login to get a token
      const loginResponse = await request
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password'
        });

      const token = loginResponse.body.token;

      // Then logout with the token
      const response = await request
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204); // No content response for successful logout
      expect(response.body).toEqual({}); // Empty body
    });

    it('should return 401 when logging out without a token', async () => {
      const response = await request
        .post('/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when using an invalid token', async () => {
      const response = await request
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authentication middleware', () => {
    it('should reject requests to protected routes without a token', async () => {
      const response = await request.get('/customers');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should allow access to protected routes with a valid token', async () => {
      // First login to get a token
      const loginResponse = await request
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password'
        });

      const token = loginResponse.body.token;

      // Access a protected route with the token
      const response = await request
        .get('/customers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });
});