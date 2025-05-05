import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createMockApi } from '../../../src/index';
import { ApiConfig } from '../../../src/types/index';

describe('Minimal Test for RBAC', () => {
  let serverUrl: string;
  let stopServer: () => Promise<any>;
  let request: ReturnType<typeof supertest>;
  
  // Create a very simple config for testing
  const config: ApiConfig = {
    resources: [
      {
        name: "items",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" }
        ]
      }
    ],
    options: {
      port: Math.floor(Math.random() * 55000) + 10000,
      auth: {
        enabled: false  // Disable auth for this basic test
      }
    },
    data: {
      items: [
        { id: 1, name: "Test Item" }
      ]
    }
  };

  beforeAll(async () => {
    // Create server
    const result = await createMockApi({ spec: config });
    if (!result.ok) {
      console.error("Server creation error:", result.error);
      throw new Error(`Failed to create test server: ${result.error.message}`);
    }
    
    serverUrl = result.value.getUrl();
    stopServer = async () => await result.value.stop();
    request = supertest(serverUrl);
  });

  afterAll(async () => {
    await stopServer();
  });

  it('should be able to access a basic resource', async () => {
    const response = await request.get('/items');
    console.log('Basic test response:', response.status, response.body);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});