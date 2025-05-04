import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createMockApi } from '../../../src/index';
import { ApiConfig, ok } from '../../../src/types/index';
import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';

// Re-export test utilities
export { describe, it, expect, beforeAll, afterAll };

// Define server type
export interface TestServer {
  getUrl: () => string;
  stop: () => Promise<void>;
}

// Define request type using any for supertest
export type Request = ReturnType<typeof supertest>;

// Define user types for testing different roles
export interface TestUsers {
  admin: { token: string; id: number };
  editor: { token: string; id: number };
  moderator: { token: string; id: number };
  user1: { token: string; id: number };
  user2: { token: string; id: number };
}

// Function to create a test server using the RBAC test configuration
export async function createRbacTestServer(): Promise<TestServer> {
  const configPath = path.join(
    process.cwd(),
    'tests/integration/rbac/rbac-test-config.yml'
  );
  const configContent = await fs.readFile(configPath, 'utf-8');
  
  // Parse YAML content
  const config = yaml.load(configContent) as ApiConfig;
  
  // Use a unique test database path
  const timestamp = Date.now();
  const testDbPath = path.join(process.cwd(), `.tmp-rbac-test-db-${timestamp}.json`);

  // Update config options
  if (!config.options) {
    config.options = {};
  }
  
  // Use a random port for tests (between 10000 and 65000)
  const port = Math.floor(Math.random() * 55000) + 10000;
  config.options.port = port;
  config.options.dbPath = testDbPath;
  
  // Make sure auth is explicitly enabled and debug logging is enabled
  if (config.options.auth) {
    config.options.auth.enabled = true;
  }
  
  // Log the RBAC configuration being used
  console.log("RBAC Test Configuration:");
  for (const resource of config.resources) {
    if (resource.access) {
      console.log(`Resource '${resource.name}' access controls:`, resource.access);
    }
  }
  
  // Create the test server
  console.log("Creating RBAC test server...");
  const result = await createMockApi(config);

  if (!result.ok) {
    throw new Error(`Failed to create RBAC test server: ${result.error.message}`);
  }

  console.log(`RBAC test server created on port ${port}`);
  return result.value;
}

// Utility function to clean up the test server
export async function cleanupRbacTestServer(server: TestServer): Promise<void> {
  if (server) {
    // Stop the server
    await server.stop();
    
    // Clean up test database files
    try {
      const files = await fs.readdir(process.cwd());
      const testDbFiles = files.filter(
        file => file.startsWith('.tmp-rbac-test-db-') && file.endsWith('.json')
      );
      
      for (const file of testDbFiles) {
        try {
          await fs.unlink(path.join(process.cwd(), file));
        } catch (error) {
          // Ignore errors
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
}

// Create a request instance for a given server
export function createRequest(server: TestServer): Request {
  return supertest(server.getUrl());
}

// Helper function to authenticate and get tokens for all user types
export async function authenticateAllUsers(request: Request): Promise<TestUsers> {
  const users = {
    admin: { token: '', id: 1 },
    editor: { token: '', id: 2 },
    moderator: { token: '', id: 3 },
    user1: { token: '', id: 4 },
    user2: { token: '', id: 5 },
  };

  // Authenticate each user
  for (const [username, userData] of Object.entries(users)) {
    const response = await request
      .post('/auth/login')
      .send({
        username,
        password: 'password',
      });

    if (response.status !== 200) {
      throw new Error(`Failed to authenticate ${username}`);
    }

    userData.token = response.body.token;
  }

  return users;
}