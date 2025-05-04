import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMockApi } from '../../../src/index.js';
import { ApiConfig } from '../../../src/types/index.js';
import supertest from 'supertest';
import { CustomRoute } from '../../../src/types/index.js';

// Register routes directly to the app
describe('Direct App Custom Routes Test', () => {
  let server: any;
  let request: any;
  
  beforeAll(async () => {
    const config: ApiConfig = {
      resources: [
        {
          name: 'users',
          fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
          ],
        },
      ],
      options: {
        port: Math.floor(Math.random() * 40000) + 10000, // Random port
        auth: {
          enabled: false, // Disable auth for simpler testing
        },
        latency: {
          enabled: false,
        },
        errorSimulation: {
          enabled: false,
        },
      },
    };
    
    // Add custom routes directly
    const routes: CustomRoute[] = [
      {
        path: '/hello',
        method: 'get',
        type: 'json',
        response: { message: 'Hello, world!' },
      },
      {
        path: '/users/:id',
        method: 'get',
        type: 'json',
        response: {
          user: {
            id: '{id}',
            name: 'User {id}',
          },
        },
      },
      {
        path: '/files/{*filePath}',
        method: 'get',
        type: 'javascript',
        code: `
          response.body = {
            message: 'hello world',
            params: request.params,
            query: request.query,
            path: request.path
          };
        `,
      },
    ];
    
    // Explicitly set routes in config
    config.routes = routes;
    
    // Output the config for debugging - removed console.log for linting
    
    const result = await createMockApi(config);
    if (!result.ok) {
      throw new Error(`Failed to create test server: ${result.error.message}`);
    }
    
    server = result.value;
    request = supertest(server.getUrl());
  });
  
  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });
  
  describe('API Routes', () => {
    it('should serve the root route', async () => {
      const response = await request.get('/');
      // Root response
      expect(response.status).toBe(200);
    });
    
    it('should serve the regular resource route', async () => {
      const response = await request.get('/users');
      // Users response
      expect(response.status).toBe(200);
    });
    
    it('should handle the custom /hello route', async () => {
      const response = await request.get('/hello');
      // Hello response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Hello, world!',
      });
    });
    
    it('should handle the custom parameterized /users/:id route', async () => {
      const userId = 42;
      const response = await request.get(`/users/${userId}`);
      // User response
      expect(response.status).toBe(200);
    });
    
    it('should handle wildcard routes with named pattern parameters', async () => {
      const response = await request.get('/files/path/to/some/nested/file.txt');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'hello world');
      expect(response.body).toHaveProperty('params');
      expect(response.body.params).toHaveProperty('filePath', 'path/to/some/nested/file.txt');
    });
  });
});