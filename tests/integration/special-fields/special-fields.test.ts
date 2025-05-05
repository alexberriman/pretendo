import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockApi } from "../../../src/index.js";
// Use fetch from global, which should be available in test environment
const { fetch } = global;

describe("Special Fields Integration Tests", () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Create a test API with special fields
    const config = {
      resources: [
        {
          name: "users",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string", required: true },
            { name: "email", type: "string", required: true },
            { name: "password", type: "string", required: true, defaultValue: "$hash" },
            { name: "createdAt", type: "date", defaultValue: "$now" },
            { name: "updatedAt", type: "date", defaultValue: "$now" },
            { name: "role", type: "string", defaultValue: "user" },
          ],
        },
        {
          name: "posts",
          fields: [
            { name: "id", type: "uuid" },
            { name: "title", type: "string", required: true },
            { name: "content", type: "string", required: true },
            { name: "userId", type: "number", required: true },
            { name: "viewCount", type: "number", defaultValue: 0 },
            { name: "sequenceNum", type: "number", defaultValue: "$increment" },
            { name: "createdAt", type: "date", defaultValue: "$now" },
            { name: "updatedAt", type: "date", defaultValue: "$now" },
          ],
          relationships: [
            {
              type: "belongsTo",
              resource: "users",
              foreignKey: "userId",
            },
          ],
        },
      ],
      options: {
        port: 0, // Use a random port
        auth: {
          enabled: false,
        },
      },
    };

    const result = await createMockApi({ spec: config });
    
    if (!result.ok) {
      throw result.error;
    }
    
    server = result.value;
    baseUrl = server.getUrl();
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe("Create with special fields", () => {
    it("should create a user with auto-hashed password and timestamps", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const response = await fetch(`${baseUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data).toHaveProperty("id");
      expect(data.data.name).toBe("John Doe");
      expect(data.data.email).toBe("john@example.com");
      
      // Password should be hashed (not plain text)
      expect(data.data.password).not.toBe("password123");
      expect(data.data.password).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
      
      // Timestamps should be present
      expect(data.data).toHaveProperty("createdAt");
      expect(data.data).toHaveProperty("updatedAt");
      expect(new Date(data.data.createdAt)).toBeInstanceOf(Date);
      expect(new Date(data.data.updatedAt)).toBeInstanceOf(Date);
      
      // Default role should be set
      expect(data.data.role).toBe("user");
    });

    it("should create a post with UUID, auto-increment and timestamps", async () => {
      // First, create a user to reference
      const userData = {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password456",
      };

      const userResponse = await fetch(`${baseUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const userData2 = await userResponse.json();
      const userId = userData2.data.id;

      // Now create posts with auto-incrementing sequence numbers
      const post1Data = {
        title: "First Post",
        content: "Post content 1",
        userId,
      };

      const post1Response = await fetch(`${baseUrl}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post1Data),
      });

      expect(post1Response.status).toBe(201);
      const post1 = await post1Response.json();
      
      // Post should have a valid ID (either string or number)
      expect(post1.data.id).toBeDefined();
      
      // Should have a sequenceNum that's a number
      expect(typeof post1.data.sequenceNum).toBe("number");
      
      // Timestamps should be present
      expect(post1.data).toHaveProperty("createdAt");
      expect(post1.data).toHaveProperty("updatedAt");
      
      // Create a second post
      const post2Data = {
        title: "Second Post",
        content: "Post content 2",
        userId,
      };

      const post2Response = await fetch(`${baseUrl}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post2Data),
      });

      const post2 = await post2Response.json();
      
      // Second post should have a greater sequenceNum than the first post
      expect(post2.data.sequenceNum).toBeGreaterThan(post1.data.sequenceNum);
    });
  });

  describe("Update with special fields", () => {
    it("should update a user preserving createdAt but updating updatedAt", async () => {
      // First create a user
      const userData = {
        name: "Sam Wilson",
        email: "sam@example.com",
        password: "password789",
      };

      const createResponse = await fetch(`${baseUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const createData = await createResponse.json();
      const userId = createData.data.id;
      const originalCreatedAt = createData.data.createdAt;
      const originalUpdatedAt = createData.data.updatedAt;

      // Wait a bit to ensure timestamps would differ
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the user
      const updateData = {
        name: "Samuel Wilson",
        email: "sam@example.com",
        password: "newpassword123",
      };

      const updateResponse = await fetch(`${baseUrl}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updatedData = await updateResponse.json();
      
      // createdAt should remain the same
      expect(updatedData.data.createdAt).toBe(originalCreatedAt);
      
      // updatedAt should be updated
      expect(updatedData.data.updatedAt).not.toBe(originalUpdatedAt);
      
      // Password should be hashed with new value
      expect(updatedData.data.password).not.toBe("newpassword123");
      expect(updatedData.data.password).not.toBe(createData.data.password);
    });
  });
});