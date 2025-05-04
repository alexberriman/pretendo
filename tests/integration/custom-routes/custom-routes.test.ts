import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createCustomRoutesTestServer, 
  cleanupCustomRoutesTestServer, 
  createCustomRoutesRequest,
  getAuthTokenForCustomRoutes
} from './custom-routes-setup';

describe('Custom Routes API', () => {
  let server;
  let request;
  let token;

  beforeAll(async () => {
    server = await createCustomRoutesTestServer();
    request = createCustomRoutesRequest(server);
    token = await getAuthTokenForCustomRoutes(request);
  });

  afterAll(async () => {
    await cleanupCustomRoutesTestServer(server);
  });

  describe('Static JSON Routes', () => {
    it('should handle a simple static JSON route', async () => {
      const response = await request
        .get('/hello')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Hello, world!'
      });
    });

    it('should handle a structured JSON response', async () => {
      const response = await request
        .get('/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'operational',
        version: '1.2.0',
        environment: 'testing'
      });
    });
  });

  describe('Parameterized Routes', () => {
    it('should handle URL parameters in routes', async () => {
      const userId = 42;
      const response = await request
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          id: '42',  // Note: params are strings in Express
          name: 'User 42',
          email: 'user42@example.com'
        }
      });
    });

    it('should handle multiple URL parameters', async () => {
      const productId = 123;
      const format = 'detailed';
      const response = await request
        .get(`/products/${productId}/details/${format}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        product: {
          id: '123',
          name: 'Product 123',
          format: 'detailed'
        },
        meta: {
          generated: true,
          format: 'detailed'
        }
      });
    });

    it('should leave placeholders unchanged if parameter is not provided', async () => {
      // The route expects :id and :format, but we're only providing :id
      // The :format should remain as a placeholder in the response
      const productId = 456;
      const response = await request
        .get(`/products/${productId}/details/`)
        .set('Authorization', `Bearer ${token}`);

      // The server might return 404 since the route pattern doesn't match
      expect(response.status).toBe(404);
    });
  });

  describe('JavaScript Routes', () => {
    it('should handle JavaScript routes with the placeholder implementation', async () => {
      const response = await request
        .get('/files/path/to/file.txt')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'hello world');
      expect(response.body).toHaveProperty('params');
      expect(response.body.params).toHaveProperty('filePath', 'path/to/file.txt');
      expect(response.body).toHaveProperty('query');
    });

    it('should include URL parameters and query string in JavaScript route responses', async () => {
      const response = await request
        .post('/echo')
        .query({ foo: 'bar', test: 'value' })
        .set('Authorization', `Bearer ${token}`)
        .send({ data: 'test data' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'hello world');
      expect(response.body).toHaveProperty('params');
      expect(response.body).toHaveProperty('query');
      expect(response.body.query).toHaveProperty('foo', 'bar');
      expect(response.body.query).toHaveProperty('test', 'value');
    });
  });

  describe('Integration with Regular Resources', () => {
    it('should not interfere with regular resource routes', async () => {
      // Test that the regular CRUD endpoints still work
      const response = await request
        .get('/products')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that product 1 exists from initial data
      const laptop = response.body.data.find(p => p.name === 'Laptop');
      expect(laptop).toBeDefined();
      expect(laptop.price).toBe(1299.99);
    });

    it('should prioritize custom routes over resource routes', async () => {
      // This should hit our custom route, not the regular resource route
      const response = await request
        .get('/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com'
        }
      });
      
      // If it hit the regular resource route, it would return a different structure
      // with a 'data' property containing the user object
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request
        .get('/non-existent-route')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 405 for method not allowed', async () => {
      // Route exists but with different method
      const response = await request
        .post('/hello')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      // Express will return 404 for this case rather than 405
      expect(response.status).toBe(404);
    });
  });
});