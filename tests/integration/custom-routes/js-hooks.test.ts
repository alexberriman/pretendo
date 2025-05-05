import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import supertest from 'supertest';
import { ApiConfig, ExecuteJsContext, ExecuteJsResult } from '../../../src/types/index.js';
import { createMockApi } from '../../../src/index.js';

// Define server type
interface JsHookTestServer {
  getUrl: () => string;
  stop: () => Promise<void>;
}

// Get a random port number between 10000 and 50000
function getRandomPort() {
  return Math.floor(Math.random() * 40000) + 10000;
}

// Track execution history for assertions
const hookExecutions: ExecuteJsContext[] = [];
const hookResults: ExecuteJsResult[] = [];

// Custom executeJs hook for testing
async function testExecuteJs(context: ExecuteJsContext): Promise<ExecuteJsResult> {
  // Record the context for testing
  hookExecutions.push({ ...context });
  
  // Return a simple response
  const result: ExecuteJsResult = {
    status: 200,
    headers: { 'x-executed-by': 'custom-hook' },
    body: { 
      message: 'Executed by custom hook',
      received: {
        code: context.code.length > 50 ? `${context.code.substring(0, 50)}...` : context.code,
        requestInfo: {
          method: context.request.method,
          path: context.request.path,
          hasUser: !!context.request.user,
          hasDb: !!context.db
        }
      }
    }
  };
  
  // For test routes that need to return specific values
  if (context.request.path === '/hook/echo') {
    result.body = {
      message: 'Echo from hook',
      data: context.request.body
    };
  } else if (context.request.path === '/hook/error') {
    throw new Error('Intentional error from executeJs hook');
  } else if (context.request.path === '/hook/status') {
    result.status = 418; // I'm a teapot
    result.body = { message: 'Custom status from hook' };
  }
  
  // Record the result for testing
  hookResults.push({ ...result });
  
  return result;
}

// Create a test server with the custom executeJs hook
async function createJsHookTestServer(): Promise<JsHookTestServer> {
  const configPath = path.join(
    process.cwd(),
    'tests/integration/custom-routes/js-routes-config.yml'
  );
  const configContent = await fs.readFile(configPath, 'utf-8');
  
  // Parse YAML content
  const config = yaml.load(configContent) as ApiConfig;
  
  // Create a unique test database path to avoid conflicts
  const timestamp = Date.now();
  const testDbPath = path.join(process.cwd(), `.tmp-js-hooks-test-db-${timestamp}.json`);

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
  
  // Get a unique port
  const port = getRandomPort();
  
  // Configure the test server
  config.options.port = port;
  config.options.dbPath = testDbPath;
  config.options.latency = { enabled: false };
  config.options.errorSimulation = { enabled: false };
  
  // Add our custom executeJs hook
  config.options.executeJs = testExecuteJs;
  
  // Add test routes specifically for hook testing
  if (!config.routes) {
    config.routes = [];
  }
  
  // Add test routes for hook testing
  config.routes.push(
    {
      path: '/hook/basic',
      method: 'get',
      type: 'javascript',
      code: 'response.body = { message: "This should be replaced by hook" };'
    },
    {
      path: '/hook/echo',
      method: 'post',
      type: 'javascript',
      code: 'response.body = { message: "This should be replaced by hook" };'
    },
    {
      path: '/hook/status',
      method: 'get',
      type: 'javascript',
      code: 'response.body = { message: "This should be replaced by hook" };'
    },
    {
      path: '/hook/error',
      method: 'get',
      type: 'javascript',
      code: 'response.body = { message: "This should be replaced by hook" };'
    }
  );

  // Create the test server
  const result = await createMockApi(config);

  if (!result.ok) {
    throw new Error(`Failed to create JS hook test server: ${result.error.message}`);
  }

  return result.value as unknown as JsHookTestServer;
}

// Clean up test resources
async function cleanupJsHookTestServer(server: JsHookTestServer): Promise<void> {
  if (server) {
    // Stop the server
    await server.stop();
    
    try {
      // Find all temporary test database files and delete them
      const files = await fs.readdir(process.cwd());
      const testDbFiles = files.filter(file => 
        file.startsWith('.tmp-js-hooks-test-db-') && file.endsWith('.json')
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
async function getAuthToken(
  request: any, 
  username = 'admin', 
  password = 'password'
): Promise<string> {
  const response = await request
    .post('/auth/login')
    .send({ username, password });
  
  return response.body.token;
}

describe('JavaScript execution hooks', () => {
  let server: JsHookTestServer;
  let request: any;
  let token: string;

  beforeAll(async () => {
    // Reset execution tracking
    hookExecutions.length = 0;
    hookResults.length = 0;
    
    // Create server with custom hook
    server = await createJsHookTestServer();
    request = supertest(server.getUrl());
    token = await getAuthToken(request);
  });

  afterAll(async () => {
    await cleanupJsHookTestServer(server);
  });

  describe('Basic hook functionality', () => {
    it('should use the custom executeJs hook instead of internal execution', async () => {
      const response = await request
        .get('/hook/basic')
        .set('Authorization', `Bearer ${token}`);

      // Check response comes from our hook
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Executed by custom hook');
      expect(response.get('x-executed-by')).toBe('custom-hook');
      
      // Check hook was called with expected context
      expect(hookExecutions.length).toBeGreaterThan(0);
      const lastExecution = hookExecutions[hookExecutions.length - 1];
      
      // Check context properties
      expect(lastExecution).toHaveProperty('code');
      expect(lastExecution).toHaveProperty('request');
      expect(lastExecution).toHaveProperty('db');
      expect(lastExecution).toHaveProperty('log');
      
      // Check request details
      expect(lastExecution.request).toHaveProperty('method', 'GET');
      expect(lastExecution.request).toHaveProperty('path', '/hook/basic');
    });

    it('should pass request body to hook', async () => {
      const testData = { name: 'Test', value: 42 };
      
      const response = await request
        .post('/hook/echo')
        .set('Authorization', `Bearer ${token}`)
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Echo from hook');
      expect(response.body).toHaveProperty('data', testData);
      
      // Verify hook received the body
      const lastExecution = hookExecutions[hookExecutions.length - 1];
      expect(lastExecution.request).toHaveProperty('body', testData);
    });

    it('should honor custom status codes from hook', async () => {
      const response = await request
        .get('/hook/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(418); // I'm a teapot
      expect(response.body).toHaveProperty('message', 'Custom status from hook');
    });
  });

  describe('Authentication with hooks', () => {
    it('should provide auth user info to the hook', async () => {
      const response = await request
        .get('/hook/basic')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      
      // Verify hook received user info
      const lastExecution = hookExecutions[hookExecutions.length - 1];
      expect(lastExecution.request).toHaveProperty('user');
      expect(lastExecution.request.user).toHaveProperty('username', 'admin');
      expect(lastExecution.request.user).toHaveProperty('role', 'admin');
    });

    it('should not provide user info when not authenticated', async () => {
      // Reset hook executions to ensure clean state
      hookExecutions.length = 0;
      
      const response = await request
        .get('/hook/basic');
        // No auth token

      // The route itself might return 401 depending on auth config
      // but we're more interested in what the hook received
      
      // Check the last execution
      if (hookExecutions.length > 0) {
        const lastExecution = hookExecutions[hookExecutions.length - 1];
        // Verify user info is not provided or is undefined
        expect(lastExecution.request.user).toBeUndefined();
      } else {
        // If route was rejected before hook execution (due to auth), this is also acceptable
        expect(response.status).toBeGreaterThanOrEqual(401);
      }
    });
  });

  describe('Database access with hooks', () => {
    it('should provide database access to the hook', async () => {
      const response = await request
        .get('/hook/basic')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      
      // Verify hook received database context
      const lastExecution = hookExecutions[hookExecutions.length - 1];
      expect(lastExecution).toHaveProperty('db');
      expect(lastExecution.db).toHaveProperty('getResourceById');
      expect(lastExecution.db).toHaveProperty('getResources');
      expect(lastExecution.db).toHaveProperty('createResource');
      expect(lastExecution.db).toHaveProperty('updateResource');
      expect(lastExecution.db).toHaveProperty('deleteResource');
    });
  });

  describe('Error handling with hooks', () => {
    it('should handle errors from the hook', async () => {
      const response = await request
        .get('/hook/error')
        .set('Authorization', `Bearer ${token}`);

      // We expect a 500 error with a message about the hook failing
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error in custom JavaScript execution hook');
      expect(response.body).toHaveProperty('message', 'Intentional error from executeJs hook');
    });
  });

  describe('Integration with regular routes', () => {
    it('should also use the hook for regular JavaScript routes', async () => {
      // Try a regular route from js-routes-config.yml
      const response = await request
        .post('/echo')  // echo is a POST route in the config
        .set('Authorization', `Bearer ${token}`)
        .send({ test: 'data' });

      // This should be handled by our hook instead of the default implementation
      expect(response.get('x-executed-by')).toBe('custom-hook');
      expect(response.body).toHaveProperty('message', 'Executed by custom hook');
    });

    it('should not affect JSON routes', async () => {
      // JSON routes should work normally
      const response = await request
        .get('/hello')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Hello, world!'
      });
    });
  });
});