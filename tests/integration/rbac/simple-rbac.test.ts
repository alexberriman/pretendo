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

describe('Simple RBAC Test', () => {
  let serverUrl: string;
  let request: ReturnType<typeof supertest>;
  let adminToken: string;
  let userToken: string;

  // Create a simple configuration for testing
  const config: ApiConfig = {
    resources: [
      {
        name: 'users',
        fields: [
          { name: 'id', type: 'number' },
          { name: 'username', type: 'string', required: true },
          { name: 'password', type: 'string', required: true },
          { name: 'role', type: 'string' }
        ]
      },
      {
        name: 'admin_resource',
        fields: [
          { name: 'id', type: 'number' },
          { name: 'name', type: 'string', required: true }
        ],
        access: {
          list: ['admin'],
          get: ['admin'],
          create: ['admin'],
          update: ['admin'],
          delete: ['admin']
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
      admin_resource: [
        { id: 1, name: 'Admin Only Resource' }
      ]
    }
  };

  beforeAll(async () => {
    // Create server
    const result = await createMockApi(config);
    if (!result.ok) {
      throw new Error(`Failed to create test server: ${result.error.message}`);
    }

    serverUrl = result.value.getUrl();
    request = supertest(serverUrl);

    // Get admin token
    const adminLogin = await request
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' });
    
    adminToken = adminLogin.body.token;

    // Get user token
    const userLogin = await request
      .post('/auth/login')
      .send({ username: 'user', password: 'password' });
    
    userToken = userLogin.body.token;
  });

  it('should allow admin to access admin_resource', async () => {
    const response = await request
      .get('/admin_resource')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it('should deny user access to admin_resource', async () => {
    const response = await request
      .get('/admin_resource')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});