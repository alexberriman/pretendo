import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import supertest from 'supertest';

describe('Direct Custom Routes Test', () => {
  let app: express.Express;
  let server: any;
  let request: any;
  
  beforeAll(() => {
    // Create a simple Express app to test custom route registration
    app = express();
    
    // Register a custom route directly to Express
    app.get('/hello', (req, res) => {
      res.json({ message: 'Hello, world!' });
    });
    
    // Register a parameterized route
    app.get('/users/:id', (req, res) => {
      res.json({
        user: {
          id: req.params.id,
          name: `User ${req.params.id}`,
        },
      });
    });
    
    // Start the server
    server = app.listen(0); // Random port
    
    // Create a request client
    request = supertest(server);
  });
  
  afterAll(() => {
    // Close the server
    if (server) {
      server.close();
    }
  });
  
  describe('Basic Routes', () => {
    it('should handle a simple route', async () => {
      const response = await request.get('/hello');
      
      console.log('Hello response:', response.status, response.body);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Hello, world!',
      });
    });
    
    it('should handle a parameterized route', async () => {
      const userId = 42;
      const response = await request.get(`/users/${userId}`);
      
      console.log(`User ${userId} response:`, response.status, response.body);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          id: '42',
          name: 'User 42',
        },
      });
    });
  });
});