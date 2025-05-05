import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockApi } from '../../../src/index.js';
import supertest from 'supertest';

describe('Programmatic API Extensions', () => {
  let server: any;
  let request: any;
  
  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Custom Router Configuration', () => {
    let healthRequests = 0;
    let errorRequests = 0;

    beforeEach(() => {
      healthRequests = 0;
      errorRequests = 0;
    });

    it.skip('should support registering custom routes via the routes option - TEMPORARILY SKIPPED, WILL FIX IN FUTURE PR', async () => {
      // Create server with custom routes via the routes option
      const result = await createMockApi({
        spec: {
          resources: [
            {
              name: 'users',
              fields: [
                { name: 'id', type: 'number' },
                { name: 'name', type: 'string' },
              ],
            },
          ],
          options: {
            port: Math.floor(Math.random() * 40000) + 10000, // Random port
            corsEnabled: true,
            auth: {
              enabled: false,
            },
          },
        },
        routes: (router) => {
          // Register custom routes using Express Router
          router.get('/health', (req, res) => {
            healthRequests++;
            res.json({ status: 'ok', version: '1.0.0' });
          });

          router.get('/error', (req, res) => {
            errorRequests++;
            res.status(500).json({ error: 'This is a test error' });
          });

          router.post('/echo', (req, res) => {
            res.json({ 
              method: 'POST',
              body: req.body,
              message: 'Echo endpoint' 
            });
          });
        }
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(`Failed to create test server: ${result.error.message}`);
      
      server = result.value;
      request = supertest(server.getUrl());

      // Test custom health route
      const healthResponse = await request.get('/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toEqual({ status: 'ok', version: '1.0.0' });
      expect(healthRequests).toBe(1);

      // Test custom error route
      const errorResponse = await request.get('/error');
      expect(errorResponse.status).toBe(500);
      expect(errorResponse.body).toEqual({ error: 'This is a test error' });
      expect(errorRequests).toBe(1);

      // Test custom echo route
      const echoResponse = await request.post('/echo')
        .send({ test: 'data', number: 123 });
      expect(echoResponse.status).toBe(200);
      expect(echoResponse.body).toHaveProperty('method', 'POST');
      expect(echoResponse.body).toHaveProperty('body');
      expect(echoResponse.body.body).toEqual({ test: 'data', number: 123 });

      // Check that standard API routes still work
      const usersResponse = await request.get('/users');
      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body).toHaveProperty('data');
    });
  });

  describe('Lifecycle Hooks', () => {
    it.skip('should support lifecycle hooks via the hooks option - TEMPORARILY SKIPPED, WILL FIX IN FUTURE PR', async () => {
      let requestHookCalls = 0;
      let beforeRouteHookCalls = 0;
      
      // Store response headers to check later
      let testHeaders: Record<string, string> = {};
      
      const result = await createMockApi({
        spec: {
          resources: [
            {
              name: 'users',
              fields: [
                { name: 'id', type: 'number' },
                { name: 'name', type: 'string' },
              ],
            },
          ],
          options: {
            port: Math.floor(Math.random() * 40000) + 10000, // Random port
            corsEnabled: true,
            auth: {
              enabled: false,
            },
          },
        },
        hooks: {
          // Add a request hook to count calls and add a request header
          onRequest: (req, res, next) => {
            requestHookCalls++;
            req.hookProcessed = true;
            next();
          },
          
          // Add a before route hook to add custom headers
          beforeRoute: (req, res, next) => {
            beforeRouteHookCalls++;
            res.setHeader('X-Hook-Processed', 'true');
            res.setHeader('X-Hook-Count', beforeRouteHookCalls.toString());
            next();
          },
          
          // Add an after route hook to modify responses
          afterRoute: (req, res, next) => {
            res.setHeader('X-After-Route', 'processed');
            next();
          }
        },
        // Also add a custom route to test hooks with
        routes: (router) => {
          router.get('/hooks-test', (req, res) => {
            res.json({ 
              message: 'Hooks test',
              hookProcessed: (req as any).hookProcessed === true
            });
          });
        }
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(`Failed to create test server: ${result.error.message}`);
      
      server = result.value;
      request = supertest(server.getUrl());

      // Test custom route with hooks
      const response = await request.get('/hooks-test');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Hooks test');
      expect(response.body).toHaveProperty('hookProcessed', true);
      
      // Get response headers
      testHeaders = response.headers;
      
      // Verify hooks were called
      expect(requestHookCalls).toBe(1);
      expect(beforeRouteHookCalls).toBe(1);
      
      // Check headers set by hooks
      expect(testHeaders).toHaveProperty('x-hook-processed', 'true');
      expect(testHeaders).toHaveProperty('x-hook-count', '1');
      expect(testHeaders).toHaveProperty('x-after-route', 'processed');
      
      // Make a second request to verify hook counts increment
      const response2 = await request.get('/hooks-test');
      expect(response2.status).toBe(200);
      expect(requestHookCalls).toBe(2);
      expect(beforeRouteHookCalls).toBe(2);
      expect(response2.headers['x-hook-count']).toBe('2');
    });
  });

  describe('Custom JavaScript Execution', () => {
    it('should support custom JS execution via the executeJs option', async () => {
      let executeJsCalls = 0;
      
      const result = await createMockApi({
        spec: {
          resources: [
            {
              name: 'users',
              fields: [
                { name: 'id', type: 'number' },
                { name: 'name', type: 'string' },
              ],
            },
          ],
          // Include a JavaScript route in the configuration
          routes: [
            {
              path: '/js-test',
              method: 'get',
              type: 'javascript',
              code: `
                // This code would not be executed directly
                // because we've provided a custom executeJs function
                console.log('This should not execute');
                response.body = {
                  message: 'Direct execution',
                  time: new Date().toISOString()
                };
              `
            }
          ],
          options: {
            port: Math.floor(Math.random() * 40000) + 10000, // Random port
            corsEnabled: true,
            auth: {
              enabled: false,
            },
          },
        },
        // Provide a custom executeJs function
        executeJs: async (context) => {
          executeJsCalls++;
          
          // Custom implementation that doesn't actually run the code
          return {
            status: 200,
            headers: {
              'x-custom-executor': 'Used',
              'x-code-length': context.code.length.toString()
            },
            body: {
              message: 'Custom secure execution',
              executed: false,
              receivedCode: context.code.substring(0, 30) + '...',
              receivedRequest: !!context.request
            }
          };
        }
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(`Failed to create test server: ${result.error.message}`);
      
      server = result.value;
      request = supertest(server.getUrl());

      // Test the JavaScript route
      const response = await request.get('/js-test');
      expect(response.status).toBe(200);
      
      // Verify our custom executor was used
      expect(response.headers).toHaveProperty('x-custom-executor', 'Used');
      expect(response.body).toHaveProperty('message', 'Custom secure execution');
      expect(response.body).toHaveProperty('executed', false);
      expect(response.body).toHaveProperty('receivedRequest', true);
      
      // Verify the executeJs function was called
      expect(executeJsCalls).toBe(1);
    });
  });
});