import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import { ApiConfig } from '../../../src/types/index.js';
import { createMockApi } from '../../../src/index.js';
import supertest from 'supertest';

// Define server type
export interface JSRouteTestServer {
  getUrl: () => string;
  stop: () => Promise<void>;
}

// Get a random port number between 10000 and 50000
function getRandomPort() {
  return Math.floor(Math.random() * 40000) + 10000;
}

// Track used ports to avoid conflicts
const usedPorts = new Set<number>();

// Create a test server using the JS routes API schema
export async function createJSRoutesTestServer(): Promise<JSRouteTestServer> {
  const configPath = path.join(
    process.cwd(),
    'tests/integration/custom-routes/js-routes-config.yml'
  );
  const configContent = await fs.readFile(configPath, 'utf-8');
  
  // Parse YAML content
  const config = yaml.load(configContent) as ApiConfig;
  
  // Create a unique test database path to avoid conflicts
  const timestamp = Date.now();
  const testDbPath = path.join(process.cwd(), `.tmp-js-routes-test-db-${timestamp}.json`);

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
  
  config.options.port = port;
  config.options.dbPath = testDbPath;
  config.options.latency = { enabled: false };
  config.options.errorSimulation = { enabled: false };

  // Create the test server
  const result = await createMockApi({ spec: config });

  if (!result.ok) {
    throw new Error(`Failed to create JS routes test server: ${result.error.message}`);
  }

  return result.value as unknown as JSRouteTestServer;
}

// Utility function to clean up test resources
export async function cleanupJSRoutesTestServer(server: JSRouteTestServer): Promise<void> {
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
    
    try {
      // Find all temporary test database files and delete them
      const files = await fs.readdir(process.cwd());
      const testDbFiles = files.filter(file => 
        file.startsWith('.tmp-js-routes-test-db-') && file.endsWith('.json')
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

// Helper function to get an auth token for tests
export async function getAuthTokenForJSRoutes(
  request: any, 
  username = 'admin', 
  password = 'password'
): Promise<string> {
  const response = await request
    .post('/auth/login')
    .send({ username, password });
  
  return response.body.token;
}

// Create a request instance for a given server
export function createJSRoutesRequest(server: JSRouteTestServer): any {
  return supertest(server.getUrl());
}