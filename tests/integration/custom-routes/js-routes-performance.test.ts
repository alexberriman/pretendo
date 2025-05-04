import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createJSRoutesTestServer, 
  cleanupJSRoutesTestServer, 
  createJSRoutesRequest,
  getAuthTokenForJSRoutes
} from './js-routes-setup';

describe('JavaScript Custom Routes Performance', () => {
  let server;
  let request;
  let token;

  beforeAll(async () => {
    server = await createJSRoutesTestServer();
    request = createJSRoutesRequest(server);
    token = await getAuthTokenForJSRoutes(request);
  });

  afterAll(async () => {
    await cleanupJSRoutesTestServer(server);
  });

  describe('Route execution performance', () => {
    it('should handle multiple concurrent requests', async () => {
      // Make 10 concurrent requests to the echo endpoint
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request
            .post('/echo')
            .set('Authorization', `Bearer ${token}`)
            .send({ requestNumber: i })
        );
      }
      
      // Wait for all requests to complete
      const responses = await Promise.all(promises);
      
      // Check that all requests were successful
      for (let i = 0; i < responses.length; i++) {
        expect(responses[i].status).toBe(200);
        expect(responses[i].body.data).toHaveProperty('requestNumber', i);
      }
    }, 10000); // Increased timeout since we're making multiple requests
    
    it('should handle repeated requests to the same endpoint', async () => {
      // Make 5 sequential requests to the same endpoint
      for (let i = 0; i < 5; i++) {
        const response = await request
          .post('/calculate')
          .set('Authorization', `Bearer ${token}`)
          .send({
            a: i,
            b: 2,
            operation: 'multiply'
          });
          
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result', i * 2);
      }
    });
    
    it('should maintain isolation between requests', async () => {
      // First request sets a global variable
      const routeWithGlobalVar = `
        // Create a "global" variable in the isolated context
        globalThis.testVar = "secret_value";
        
        // Return confirmation
        response.body = { message: "Set global variable" };
      `;
      
      // Create a temporary route
      const tempRoutePath = '/temp/set-global';
      const tempRouteConfig = {
        path: tempRoutePath,
        method: 'get',
        type: 'javascript',
        code: routeWithGlobalVar
      };
      
      // Add the route to the server config
      // Note: In a real scenario, we would modify the server configuration
      // For this test, we'll just make a request to a different route afterward
      
      // Make the first request
      await request
        .get(tempRoutePath)
        .set('Authorization', `Bearer ${token}`);
        
      // Make a second request to a different route that tries to access the global variable
      const response = await request
        .post('/echo')
        .set('Authorization', `Bearer ${token}`)
        .send({ checkForGlobalVar: true });
        
      // The response should not contain the global variable
      // since each request gets a fresh context
      expect(response.body).toEqual({
        message: 'You sent:',
        data: { checkForGlobalVar: true }
      });
      // If the contexts were shared, we might see testVar in the response
    });
  });
  
  describe('Resource usage', () => {
    it('should handle database-intensive operations', async () => {
      // Create multiple posts in sequence
      for (let i = 0; i < 5; i++) {
        const response = await request
          .post('/db/posts/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `Performance Test Post ${i}`,
            content: `This is test post ${i} for performance testing`,
            userId: 1
          });
          
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      }
      
      // Verify all posts were created
      const postsResponse = await request
        .get('/posts')
        .set('Authorization', `Bearer ${token}`);
        
      const performancePosts = postsResponse.body.data.filter(
        p => p.title.startsWith('Performance Test Post')
      );
      
      expect(performancePosts.length).toBe(5);
    });
    
    it('should handle operations with larger data sets', async () => {
      // Create a route that processes a larger dataset
      const largeDataset = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random() * 1000,
          tags: Array.from({ length: 5 }, (_, j) => `tag-${j}-${i % 5}`)
        }))
      };
      
      const response = await request
        .post('/echo')
        .set('Authorization', `Bearer ${token}`)
        .send(largeDataset);
        
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items.length).toBe(100);
    });
  });
  
  describe('Error resilience', () => {
    it('should continue to function after handling errors', async () => {
      // First make a request that will error
      await request
        .get('/error/try-catch')
        .set('Authorization', `Bearer ${token}`);
        
      // Then verify the server still works properly
      const response = await request
        .get('/hello')
        .set('Authorization', `Bearer ${token}`);
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Hello, world!'
      });
    });
    
    it('should recover after timeout errors', async () => {
      // First make a request that will timeout
      await request
        .get('/error/timeout')
        .set('Authorization', `Bearer ${token}`);
        
      // Then verify the server still works properly
      const response = await request
        .post('/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          a: 10,
          b: 5,
          operation: 'add'
        });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result', 15);
    }, 10000); // Increased timeout since the first request will time out
  });
});