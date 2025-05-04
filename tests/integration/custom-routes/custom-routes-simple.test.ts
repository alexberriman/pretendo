import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMockApi } from '../../../src/index';
import { ApiConfig } from '../../../src/types/index';
import supertest from 'supertest';

describe('Custom Routes API (Simple)', () => {
  let server: any;
  let request: any;
  let serverUrl: string;

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
      routes: [
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
          path: '/echo',
          method: 'post',
          type: 'javascript',
          code: `
            response.body = {
              message: 'hello world',
              params: request.params,
              query: request.query,
              body: request.body
            };
          `,
        },
      ],
      options: {
        port: 0, // Random port
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

    // Test configuration
    const result = await createMockApi(config);
    if (!result.ok) {
      throw new Error(`Failed to create test server: ${result.error.message}`);
    }

    server = result.value;
    serverUrl = server.getUrl();
    request = supertest(serverUrl);
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Static JSON Routes', () => {
    it('should handle a simple static JSON route', async () => {
      const response = await request.get('/hello');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Hello, world!',
      });
    });
  });

  describe('Parameterized Routes', () => {
    it('should handle URL parameters in routes', async () => {
      const userId = 42;
      const response = await request.get(`/users/${userId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          id: '42',  // Note: params are strings in Express
          name: 'User 42',
        },
      });
    });
  });

  describe('JavaScript Routes', () => {
    it('should handle JavaScript routes with the placeholder implementation', async () => {
      const response = await request.post('/echo').send({ test: 'data' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'hello world');
      expect(response.body).toHaveProperty('params');
      expect(response.body).toHaveProperty('query');
    });
  });

  describe('Integration with Regular Resources', () => {
    it('should not interfere with regular resource routes', async () => {
      // Test that the regular CRUD endpoints still work
      const response = await request.get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});