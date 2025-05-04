import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from 'vitest';
import supertest from 'supertest';
import { createMockApi } from '../../../src/index';
import { ApiConfig } from '../../../src/types/index';
import fs from 'fs/promises';
import path from 'path';

describe('Debug RBAC Implementation', () => {
  let serverUrl: string;
  let request: ReturnType<typeof supertest>;
  let stopServer: () => Promise<any>;

  beforeAll(async () => {
    // Create simple config with debug logging
    const config: ApiConfig = {
      resources: [
        {
          name: 'protected_resource',
          fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' }
          ],
          access: {
            list: ['admin'],    // Only admin can list
            get: ['admin'],     // Only admin can get
            create: ['admin'],  // Only admin can create
            update: ['admin'],  // Only admin can update
            delete: ['admin']   // Only admin can delete
          }
        }
      ],
      options: {
        port: Math.floor(Math.random() * 55000) + 10000,
        auth: {
          enabled: true,
          users: [
            { username: 'admin', password: 'password', role: 'admin' },
            { username: 'user', password: 'password', role: 'user' }
          ]
        }
      },
      data: {
        protected_resource: [
          { id: 1, name: 'Protected Item' }
        ]
      }
    };

    // Create the server with debug logging
    const result = await createMockApi(config);
    if (!result.ok) {
      throw new Error(`Failed to create test server: ${result.error.message}`);
    }

    serverUrl = result.value.getUrl();
    request = supertest(serverUrl);
    stopServer = async () => {
      await result.value.stop();
    };

    // Output config for debugging
    console.log('Debug server running with RBAC config:');
    console.log(JSON.stringify({
      resources: config.resources,
      auth: config.options?.auth
    }, null, 2));
  });

  afterAll(async () => {
    await stopServer();
  });

  it('should properly authenticate admin user', async () => {
    const loginResponse = await request
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body.user).toHaveProperty('role', 'admin');

    // Save token for next test
    const adminToken = loginResponse.body.token;

    // Try accessing protected resource with admin token
    const protectedResponse = await request
      .get('/protected_resource')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(protectedResponse.status).toBe(200);
  });

  it('should deny access to user without admin role', async () => {
    const loginResponse = await request
      .post('/auth/login')
      .send({ username: 'user', password: 'password' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body.user).toHaveProperty('role', 'user');

    // Save token for next test
    const userToken = loginResponse.body.token;

    // Try accessing protected resource with user token
    const protectedResponse = await request
      .get('/protected_resource')
      .set('Authorization', `Bearer ${userToken}`);

    console.log('User role access result:', {
      status: protectedResponse.status,
      body: protectedResponse.body
    });

    // This should fail with 403 Forbidden
    expect(protectedResponse.status).toBe(403);
  });
});