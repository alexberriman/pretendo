import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createJSRoutesTestServer, 
  cleanupJSRoutesTestServer, 
  createJSRoutesRequest,
  getAuthTokenForJSRoutes
} from './js-routes-setup';

describe('JavaScript Custom Routes', () => {
  let server;
  let request;
  let token;

  beforeAll(async () => {
    server = await createJSRoutesTestServer();
    request = createJSRoutesRequest(server);
    token = await getAuthTokenForJSRoutes(request);
  });

  afterAll(async () => {
    await cleanupJSRoutesTestServer(server);
  });

  describe('Basic functionality', () => {
    it('should handle a simple JSON route for comparison', async () => {
      const response = await request
        .get('/hello')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Hello, world!'
      });
    });

    it('should handle a basic echo JavaScript route', async () => {
      const testData = { 
        name: 'Test User', 
        data: { age: 30, interests: ['coding', 'testing'] }
      };
      
      const response = await request
        .post('/echo')
        .set('Authorization', `Bearer ${token}`)
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'You sent:',
        data: testData
      });
    });

    it('should set custom headers and status', async () => {
      const response = await request
        .get('/custom-headers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);
      expect(response.get('x-custom-header')).toBe('test-value');
      expect(response.body).toHaveProperty('message', 'Custom headers set');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Database operations', () => {
    it('should fetch users from the database', async () => {
      const response = await request
        .get('/db/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(2);
      
      // Check that admin user exists
      const adminUser = response.body.users.find(u => u.username === 'admin');
      expect(adminUser).toBeDefined();
      expect(adminUser.role).toBe('admin');
      
      // Check that password is not included
      expect(adminUser).not.toHaveProperty('password');
    });

    it('should fetch a specific user by ID', async () => {
      const response = await request
        .get('/db/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('username', 'admin');
      expect(response.body).toHaveProperty('role', 'admin');
      
      // Password should be sanitized
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request
        .get('/db/users/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should create a new post in the database', async () => {
      const newPost = {
        title: 'Test Post',
        content: 'This is a test post created by the JavaScript route',
        userId: 1
      };
      
      const response = await request
        .post('/db/posts/create')
        .set('Authorization', `Bearer ${token}`)
        .send(newPost);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', newPost.title);
      expect(response.body).toHaveProperty('content', newPost.content);
      expect(response.body).toHaveProperty('userId', newPost.userId);
      expect(response.body).toHaveProperty('published', true);

      // Verify the post was actually created
      const allPostsResponse = await request
        .get('/posts')
        .set('Authorization', `Bearer ${token}`);
        
      expect(allPostsResponse.status).toBe(200);
      const createdPost = allPostsResponse.body.data.find(p => p.title === newPost.title);
      expect(createdPost).toBeDefined();
    });

    it('should validate input when creating a post', async () => {
      const invalidPost = {
        // Missing required fields
        title: 'Test Post'
      };
      
      const response = await request
        .post('/db/posts/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidPost);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('Error handling', () => {
    it('should handle JavaScript errors with try/catch', async () => {
      const response = await request
        .get('/error/try-catch')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Caught error in route handler');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('nonExistentProperty');
    });

    it('should timeout for infinite loops', async () => {
      const response = await request
        .get('/error/timeout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'SCRIPT_TIMEOUT');
      expect(response.body.message).toContain('timeout');
    }, 5000); // Increase timeout for this test

    it('should handle memory limit exceeded', async () => {
      const response = await request
        .get('/error/memory-limit')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      // Could be either timeout or memory error depending on which happens first
      expect(response.body).toHaveProperty('code');
      expect(['SCRIPT_TIMEOUT', 'SCRIPT_EXECUTION_ERROR'].includes(response.body.code)).toBe(true);
    }, 5000); // Increase timeout for this test
  });

  describe('Authentication context', () => {
    it('should have access to authenticated user', async () => {
      const response = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', 'admin');
      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    it('should return 401 when not authenticated', async () => {
      // No auth token provided
      const response = await request
        .get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });

  describe('Complex data processing', () => {
    it('should perform addition', async () => {
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 5,
          b: 3,
          operation: 'add'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result', 8);
      expect(response.body).toHaveProperty('a', 5);
      expect(response.body).toHaveProperty('b', 3);
      expect(response.body).toHaveProperty('operation', 'add');
    });

    it('should perform subtraction', async () => {
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 10,
          b: 4,
          operation: 'subtract'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result', 6);
    });

    it('should perform multiplication', async () => {
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 7,
          b: 6,
          operation: 'multiply'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result', 42);
    });

    it('should perform division', async () => {
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 20,
          b: 5,
          operation: 'divide'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result', 4);
    });

    it('should handle division by zero', async () => {
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 10,
          b: 0,
          operation: 'divide'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot divide by zero');
    });

    it('should validate numeric inputs', async () => {
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 'not a number',
          b: 5,
          operation: 'add'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "Parameters 'a' and 'b' must be numbers");
    });

    it('should validate operation type', async () => {
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 10,
          b: 5,
          operation: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid operation');
    });
  });

  describe('Integration with regular resources', () => {
    it('should not interfere with regular resource routes', async () => {
      // Test that the regular CRUD endpoints still work
      const response = await request
        .get('/posts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that post 1 exists from initial data
      const firstPost = response.body.data.find(p => p.id === 1);
      expect(firstPost).toBeDefined();
      expect(firstPost.title).toBe('First Post');
    });
  });
});