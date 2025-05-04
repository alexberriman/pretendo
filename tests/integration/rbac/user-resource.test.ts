import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  createRbacTestServer,
  cleanupRbacTestServer,
  createRequest,
  TestServer,
  Request,
} from './rbac-setup';
import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import { ApiConfig } from '../../../src/types/index';
import { createMockApi } from '../../../src/index';

describe('Custom User Resource Configuration', () => {
  let server: TestServer;
  let request: Request;

  beforeAll(async () => {
    // Create test server with RBAC configuration
    server = await createRbacTestServer();
    request = createRequest(server);
  });

  afterAll(async () => {
    await cleanupRbacTestServer(server);
  });

  it('should use the configured user resource for authentication', async () => {
    // Test authentication against the users resource
    const response = await request
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'password',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('username', 'admin');
    expect(response.body.user).toHaveProperty('role', 'admin');
  });

  it('should authenticate and access the user profile data', async () => {
    // Login to get a token
    const loginResponse = await request
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'password',
      });

    const token = loginResponse.body.token;

    // Access user data
    const response = await request
      .get('/users/1') // Admin user has ID 1
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('username', 'admin');
    expect(response.body.data).toHaveProperty('email', 'admin@example.com');
    expect(response.body.data).toHaveProperty('role', 'admin');
  });
});

describe('Custom Field Mappings', () => {
  let customServer: TestServer;
  let customRequest: Request;

  // Create a custom configuration with different field names
  const createCustomUserResourceServer = async (): Promise<TestServer> => {
    // Read the base configuration
    const configPath = path.join(
      process.cwd(),
      'tests/integration/rbac/rbac-test-config.yml'
    );
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(configContent) as ApiConfig;
    
    // Use a unique test database path
    const timestamp = Date.now();
    const testDbPath = path.join(process.cwd(), `.tmp-custom-user-test-${timestamp}.json`);
    
    // Modify the configuration for custom field names
    if (!config.options) {
      config.options = {};
    }
    
    // Update the resources - rename the users resource and change field names
    if (!config.resources) {
      config.resources = [];
    }
    
    // Extract the users definition to modify it
    const usersResource = config.resources.find(r => r.name === 'users');
    
    // Create the accounts resource (renamed users)
    const accountsResource = {
      name: 'accounts', // Rename the resource
      fields: [
        { name: 'id', type: 'number' },
        { name: 'login', type: 'string', required: true }, // Different username field
        { name: 'hash', type: 'string', required: true },  // Different password field
        { name: 'emailAddress', type: 'string', required: true }, // Different email field
        { name: 'userType', type: 'string', defaultValue: 'user' }, // Different role field
        { name: 'createdAt', type: 'date', defaultValue: '$now' }
      ],
      access: usersResource?.access || {
        list: ["admin"],
        get: ["admin", "owner"],
        create: ["admin"],
        update: ["admin", "owner"],
        delete: ["admin"]
      },
      ownedBy: 'id'
    };
    
    // Update articles to reference accounts instead of users
    const articlesResource = config.resources.find(r => r.name === 'articles');
    if (articlesResource && articlesResource.relationships) {
      articlesResource.relationships = articlesResource.relationships.map(rel => {
        if (rel.resource === 'users') {
          return { ...rel, resource: 'accounts' };
        }
        return rel;
      });
    }
    
    // Update comments to reference accounts instead of users
    const commentsResource = config.resources.find(r => r.name === 'comments');
    if (commentsResource && commentsResource.relationships) {
      commentsResource.relationships = commentsResource.relationships.map(rel => {
        if (rel.resource === 'users') {
          return { ...rel, resource: 'accounts' };
        }
        return rel;
      });
    }
    
    // Filter out the users resource and add the accounts resource
    config.resources = config.resources.filter(r => r.name !== 'users').concat([accountsResource]);
    
    // Update the authentication configuration
    if (config.options.auth) {
      config.options.auth.userResource = 'accounts';
      config.options.auth.usernameField = 'login';
      config.options.auth.passwordField = 'hash';
      config.options.auth.emailField = 'emailAddress';
      config.options.auth.roleField = 'userType';
    }
    
    // Update the initial data
    if (config.data && config.data.users) {
      config.data.accounts = config.data.users.map(user => ({
        id: user.id,
        login: user.username,
        hash: user.password,
        emailAddress: user.email,
        userType: user.role,
        createdAt: user.createdAt
      }));
      
      // Remove the old users data
      delete config.data.users;
    }
    
    // Update other settings
    const port = Math.floor(Math.random() * 55000) + 10000;
    config.options.port = port;
    config.options.dbPath = testDbPath;
    
    // Create the server
    const result = await createMockApi(config);
    
    if (!result.ok) {
      throw new Error(`Failed to create custom user server: ${result.error.message}`);
    }
    
    return result.value;
  };

  beforeAll(async () => {
    // Create custom server with different field mappings
    customServer = await createCustomUserResourceServer();
    customRequest = createRequest(customServer);
  });

  afterAll(async () => {
    if (customServer) {
      await customServer.stop();
      
      // Clean up test database files
      try {
        const files = await fs.readdir(process.cwd());
        const testDbFiles = files.filter(
          file => file.startsWith('.tmp-custom-user-test-') && file.endsWith('.json')
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
  });

  it('should authenticate with custom field mappings', async () => {
    // Test authentication with custom fields
    const response = await customRequest
      .post('/auth/login')
      .send({
        username: 'admin', // Still use username in the request
        password: 'password',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('username', 'admin');
    expect(response.body.user).toHaveProperty('role', 'admin');
  });

  it('should access data with custom resource name', async () => {
    // Login to get a token
    const loginResponse = await customRequest
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'password',
      });

    const token = loginResponse.body.token;

    // Access account data (instead of users)
    const response = await customRequest
      .get('/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty('login'); // Custom field name
    expect(response.body.data[0]).toHaveProperty('userType'); // Custom field name
  });
});