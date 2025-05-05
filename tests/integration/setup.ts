import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createMockApi } from '../../src/index';
import { ok, ApiConfig, ApiOptions } from '../../src/types/index';
import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';

// Export test utilities
export { describe, it, expect, beforeAll, afterAll };

// Get a random port number between 10000 and 50000
function getRandomPort() {
  return Math.floor(Math.random() * 40000) + 10000;
}

// Track used ports to avoid conflicts
const usedPorts = new Set<number>();

// Extended ApiOptions type for our test environment
interface ExtendedApiOptions extends ApiOptions {
  strictValidation?: boolean;
  adminEndpoints?: {
    reset?: boolean;
    backup?: boolean;
    restore?: boolean;
  };
}

// Define server type
export interface TestServer {
  getUrl: () => string;
  stop: () => Promise<void>;
}

// Define request type - using any for now to avoid complex typings
// The supertest typing is complex and causes typing issues
export type Request = any;

// Utility function to create a test server using the e-commerce API schema
export async function createTestServer(): Promise<TestServer> {
  const configPath = path.join(process.cwd(), 'examples/e-commerce-api.yml');
  const configContent = await fs.readFile(configPath, 'utf-8');
  
  // Parse YAML content
  const config = yaml.load(configContent) as ApiConfig;
  
  // Create a unique test database path to avoid conflicts
  const timestamp = Date.now();
  const testDbPath = path.join(process.cwd(), `.tmp-test-db-${timestamp}.json`);

  try {
    // Clean up test database from previous runs if it exists
    await fs.unlink(testDbPath);
  } catch (error) {
    // Ignore if file doesn't exist
  }

  // Update config options
  if (!config.options) {
    config.options = {};
  }
  
  // Find an unused port
  let port: number;
  do {
    port = getRandomPort();
  } while (usedPorts.has(port));
  
  usedPorts.add(port);
  
  // Configure options for stricter validation
  const extendedOptions = config.options as ExtendedApiOptions;
  
  extendedOptions.port = port; // Use a random port for tests
  
  // Configure database options
  extendedOptions.database = {
    adapter: "json-file",
    dbPath: testDbPath, // Use a separate test database
    autoSave: true,
    saveInterval: 1000,
  };
  
  // Keep legacy path for backward compatibility
  extendedOptions.dbPath = testDbPath;
  
  extendedOptions.latency = { enabled: false }; // Disable latency for faster tests
  extendedOptions.errorSimulation = { enabled: false }; // Disable error simulation for consistent tests
  extendedOptions.strictValidation = true; // Enable strict validation for required fields
  
  // Add admin endpoints
  extendedOptions.adminEndpoints = {
    reset: true,
    backup: true,
    restore: true
  };

  // Create the test server
  const result = await createMockApi({ spec: config });

  if (!result.ok) {
    throw new Error(`Failed to create test server: ${result.error.message}`);
  }

  return result.value as unknown as TestServer;
}

// Utility function to clean up test resources
export async function cleanupTestServer(server: TestServer): Promise<void> {
  if (server) {
    // Get the server URL to extract the port
    const serverUrl = server.getUrl();
    const url = new URL(serverUrl);
    const port = parseInt(url.port, 10);
    
    // Remove port from used ports set
    if (!isNaN(port)) {
      usedPorts.delete(port);
    }
    
    // Stop the server
    await server.stop();
    
    // Try to get the database path from the URL, fallback to pattern matching
    try {
      // Find all temporary test database files and delete them
      const files = await fs.readdir(process.cwd());
      const testDbFiles = files.filter(file => file.startsWith('.tmp-test-db-') && file.endsWith('.json'));
      
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

// Helper function to get an auth token for tests
export async function getAuthToken(
  request: Request, 
  username = 'admin', 
  password = 'password'
): Promise<string> {
  const response = await request
    .post('/auth/login')
    .send({ username, password });
  
  return response.body.token;
}

// Type to make it easier to create test data
export interface TestData {
  [key: string]: any;
}

// Create a request instance for a given server
export function createRequest(server: TestServer): Request {
  return supertest(server.getUrl()) as Request;
}

// Create a test context for a resource
export interface CommonTestContext {
  server: TestServer;
  request: Request;
  token: string;
}