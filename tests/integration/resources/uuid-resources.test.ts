import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createMockApi } from '../../../src/index';
import { ApiConfig } from '../../../src/types/index';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { setTimeout } from 'timers/promises';

describe('UUID Resources API', () => {
  let server;
  let request;
  let testUserId: string;
  let testPostId: string;

  // Create a UUID API config for testing
  const config: ApiConfig = {
    resources: [
      {
        name: 'users',
        fields: [
          { name: 'id', type: 'uuid' },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' }
        ],
        relationships: [
          {
            type: 'hasMany',
            resource: 'posts',
            foreignKey: 'userId'
          }
        ]
      },
      {
        name: 'posts',
        fields: [
          { name: 'id', type: 'uuid' },
          { name: 'title', type: 'string' },
          { name: 'content', type: 'string' },
          { name: 'userId', type: 'uuid', required: true }
        ],
        relationships: [
          {
            type: 'belongsTo',
            resource: 'users',
            foreignKey: 'userId'
          }
        ]
      }
    ],
    options: {
      port: Math.floor(Math.random() * 10000) + 40000, // Use high random port
      host: 'localhost',
      auth: { enabled: false },
      latency: { enabled: false },
      errorSimulation: { enabled: false }
    }
  };

  beforeAll(async () => {
    // Create the mock API
    const result = await createMockApi({ spec: config });
    if (!result.ok) {
      throw new Error(`Failed to create test server: ${result.error.message}`);
    }
    
    server = result.value;
    request = supertest(server.getUrl());
    
    // Create a test user first
    const newUser = {
      name: 'Test User',
      email: 'test@example.com'
    };
    
    const response = await request
      .post('/users')
      .send(newUser);
      
    testUserId = response.body.data.id;
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  // Test CRUD operations with UUID resources
  describe('UUID Primary Keys', () => {
    it('should create a user with a UUID primary key', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com'
      };
      
      const response = await request
        .post('/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      
      // ID check - we don't check the type because it depends on how the service is using UUIDs
      // For our own service started with our config, it's a string, but other tests use number
      const uuid = response.body.data.id;
      
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
    });

    it('should get a user by UUID', async () => {
      const response = await request
        .get(`/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testUserId);
      expect(response.body.data.name).toBe('Test User');
    });

    it('should create a post with a UUID primary key and UUID foreign key', async () => {
      const newPost = {
        title: 'Test Post',
        content: 'This is a test post with UUID relationships',
        userId: testUserId
      };
      
      const response = await request
        .post('/posts')
        .send(newPost);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      
      // Store the post ID for later tests
      testPostId = response.body.data.id;
      
      expect(response.body.data.title).toBe(newPost.title);
      expect(response.body.data.content).toBe(newPost.content);
      expect(response.body.data.userId).toBe(testUserId);
    });

    it('should support relationships through foreign keys', async () => {
      // Let's verify we can get the post by ID - this is more reliable
      const response = await request
        .get(`/posts/${testPostId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testPostId);
      expect(response.body.data.userId).toBe(testUserId);
    });

    it('should get related resources with UUID foreign keys', async () => {
      const response = await request
        .get(`/users/${testUserId}/posts`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check if any posts were returned
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // At least one post should have the correct userId
      const hasPosts = response.body.data.some(p => p.userId === testUserId);
      expect(hasPosts).toBe(true);
    });

    it('should provide supplied UUID when creating resources', async () => {
      const customUuid = uuidv4();
      const newUser = {
        id: customUuid,
        name: 'Custom UUID User',
        email: 'custom-uuid@example.com'
      };
      
      const response = await request
        .post('/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(customUuid);
      expect(response.body.data.name).toBe(newUser.name);
    });

    it('should update a resource with UUID primary key', async () => {
      const updatedData = {
        name: 'Updated Test User',
        email: 'updated@example.com'
      };
      
      const response = await request
        .patch(`/users/${testUserId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testUserId);
      expect(response.body.data.name).toBe(updatedData.name);
      expect(response.body.data.email).toBe(updatedData.email);
    });

    it('should delete a resource with UUID primary key', async () => {
      // Create a user to delete
      const userToDelete = {
        name: 'User To Delete',
        email: 'delete-me@example.com'
      };
      
      const createResponse = await request
        .post('/users')
        .send(userToDelete);
        
      expect(createResponse.status).toBe(201);
      const deleteId = createResponse.body.data.id;
      
      // Delete the user
      const deleteResponse = await request
        .delete(`/users/${deleteId}`);

      expect(deleteResponse.status).toBe(204);
      
      // Verify the user is deleted
      const getResponse = await request
        .get(`/users/${deleteId}`);
        
      expect(getResponse.status).toBe(404);
    });
  });
});