import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createMockApi } from '../../../src/index';
import { ApiConfig } from '../../../src/types/index';

describe('Role-Based Access Control', () => {
  let serverUrl: string;
  let stopServer: () => Promise<any>;
  let request: ReturnType<typeof supertest>;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Create server with inline config
    const config: ApiConfig = {
      resources: [
        {
          name: "secure_resource",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string", required: true },
            { name: "description", type: "string" }
          ],
          access: {
            list: ["admin"],     // Only admin can list
            get: ["admin"],      // Only admin can get
            create: ["admin"],   // Only admin can create
            update: ["admin"],   // Only admin can update
            delete: ["admin"]    // Only admin can delete
          }
        },
        {
          name: "shared_resource",
          fields: [
            { name: "id", type: "number" },
            { name: "title", type: "string", required: true },
            { name: "content", type: "string" },
            { name: "authorId", type: "number" }
          ],
          access: {
            list: ["*"],                    // Any authenticated user can list
            get: ["*"],                     // Any authenticated user can view
            create: ["admin", "editor"],    // Only admin and editor can create
            update: ["admin", "owner"],     // Admin or owner can update
            delete: ["admin"]               // Only admin can delete
          },
          ownedBy: "authorId"               // Resource ownership field
        }
      ],
      options: {
        port: Math.floor(Math.random() * 55000) + 10000,
        auth: {
          enabled: true,
          users: [
            { username: "admin", password: "password", role: "admin" },
            { username: "editor", password: "password", role: "editor" },
            { username: "user", password: "password", role: "user" }
          ]
        }
      }
    };

    // Create the server
    const result = await createMockApi({ spec: config });
    if (!result.ok) {
      throw new Error(`Failed to create test server: ${result.error.message}`);
    }

    serverUrl = result.value.getUrl();
    stopServer = async () => {
      await result.value.stop();
    };
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

    // Add some test data using admin credentials
    await request
      .post('/secure_resource')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Only Resource',
        description: 'This resource can only be accessed by admins'
      });

    await request
      .post('/shared_resource')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Shared Resource by Admin',
        content: 'This is created by admin but visible to all',
        authorId: 1 // Admin user ID
      });
  });

  afterAll(async () => {
    await stopServer();
  });

  // Test admin-only resource access
  describe('Admin-only resource security', () => {
    it('should allow admin to access secure_resource', async () => {
      const response = await request
        .get('/secure_resource')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should block user from accessing secure_resource', async () => {
      const response = await request
        .get('/secure_resource')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403); // Forbidden
    });
  });

  // Test shared resource with role-based access
  describe('Shared resource with mixed permissions', () => {
    it('should allow both admin and user to list shared_resource', async () => {
      // Admin access
      const adminResponse = await request
        .get('/shared_resource')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(adminResponse.status).toBe(200);
      
      // User access
      const userResponse = await request
        .get('/shared_resource')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(userResponse.status).toBe(200);
    });

    it('should allow admin to create but block user from creating', async () => {
      // Admin can create
      const adminResponse = await request
        .post('/shared_resource')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Another Admin Resource',
          content: 'Created during test',
          authorId: 1
        });
      
      expect(adminResponse.status).toBe(201);
      
      // User cannot create
      const userResponse = await request
        .post('/shared_resource')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'User Resource Attempt',
          content: 'This should be blocked',
          authorId: 3
        });
      
      expect(userResponse.status).toBe(403);
    });
  });
});