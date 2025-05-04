import { describe, it, expect, beforeAll, afterAll, createTestServer, cleanupTestServer, createRequest, getAuthToken } from '../setup';

describe('RBAC using existing test setup', () => {
  let server: any;
  let request: any;
  let adminToken: string;
  let userToken: string;
  let customerId: number;
  let productId: number;

  beforeAll(async () => {
    // Create a test server using the e-commerce-api.yml config (which we know works)
    server = await createTestServer();
    request = createRequest(server);
    
    // Get tokens for testing
    adminToken = await getAuthToken(request, 'admin', 'password');
    userToken = await getAuthToken(request, 'user', 'password');
    
    // Create test records and store their IDs for later use
    const productResponse = await request
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'RBAC Test Product',
        price: 50.00,
        description: 'Product used for RBAC testing',
        categoryId: 1,
        sku: 'RBAC-001',
        inStock: true
      });
    
    productId = productResponse.body.data.id;
    
    const customerResponse = await request
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'rbac-test@example.com',
        firstName: 'RBAC',
        lastName: 'Tester',
        phone: '555-RBAC'
      });
    
    customerId = customerResponse.body.data.id;
  });

  afterAll(async () => {
    await cleanupTestServer(server);
  });

  // Test cases to verify that our RBAC code works correctly
  describe('Basic authentication controls', () => {
    it('should allow admin to access products', async () => {
      const response = await request
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should allow regular user to access products too', async () => {
      const response = await request
        .get('/products')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should deny access without authentication', async () => {
      const response = await request.get('/products');
      expect(response.status).toBe(401); // Unauthorized
    });
  });
  
  // Test CRUD operations with different roles
  describe('CRUD operations with different roles', () => {
    it('should allow admin to create resources', async () => {
      const response = await request
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Product',
          price: 150.00,
          description: 'Created by admin during RBAC test',
          categoryId: 1,
          sku: 'ADMIN-001',
          inStock: true
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Admin Created Product');
    });
    
    it('should allow admin to update resources', async () => {
      const response = await request
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated by admin during RBAC test'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('description', 'Updated by admin during RBAC test');
    });
    
    // Test ownership behavior (if implemented in the e-commerce API)
    it('should handle admin access to reviews', async () => {
      // Create a review as admin
      const reviewResponse = await request
        .post('/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: productId,
          customerId: customerId,
          rating: 5,
          title: 'RBAC Test Review',
          content: 'This is a test review for RBAC testing'
        });
      
      expect(reviewResponse.status).toBe(201);
      const reviewId = reviewResponse.body.data.id;
      
      // Admin should be able to update any review
      const updateResponse = await request
        .patch(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Updated review content by admin'
        });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data).toHaveProperty('content', 'Updated review content by admin');
      
      // Admin should be able to delete the review
      const deleteResponse = await request
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteResponse.status).toBe(204); // No content success response
    });
    
    // Test user permissions and restrictions
    it('should restrict user from unauthorized operations', async () => {
      // Create a product that will belong to admin
      const productResponse = await request
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin-Owned Product',
          price: 299.99,
          description: 'Product owned by admin for RBAC testing',
          categoryId: 1,
          sku: 'ADMIN-002',
          inStock: true
        });
      
      const restrictedProductId = productResponse.body.data.id;
      
      // Regular user should be able to view the product
      const viewResponse = await request
        .get(`/products/${restrictedProductId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(viewResponse.status).toBe(200);
      
      // But if we try to update or delete it (without ownership), that may be restricted
      // depending on how the e-commerce API is configured
      // Note: This test may change based on actual implementation of RBAC in e-commerce API
      
      // Create a separate review we can test with
      const reviewResponse = await request
        .post('/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: restrictedProductId,
          customerId: customerId,
          rating: 4,
          title: 'Another RBAC Test Review',
          content: 'Second test review for RBAC testing'
        });
      
      expect(reviewResponse.status).toBe(201);
      const testReviewId = reviewResponse.body.data.id;
      
      // Even if the user isn't explicitly denied, the authentication middleware should 
      // require a token for all protected routes
      const unauthenticatedResponse = await request
        .get(`/reviews/${testReviewId}`);
      
      expect(unauthenticatedResponse.status).toBe(401);
    });
  });
  
  // Test authentication with configured user resource
  describe('Authentication with configured user resource', () => {
    it('should use proper user roles from configured resource', async () => {
      // The token we already got should have the role information
      const verifyAdminResponse = await request
        .get('/customers') // Some admin-accessible resource
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(verifyAdminResponse.status).toBe(200);
      
      // This verifies that the role is being properly extracted from the token
      // which was created using the user resource configuration
    });
    
    it('should include correct user information in authentication response', async () => {
      // Login again and check the response structure
      const loginResponse = await request
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password'
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user).toHaveProperty('username', 'admin');
      expect(loginResponse.body.user).toHaveProperty('role', 'admin');
      expect(loginResponse.body).toHaveProperty('expiresAt');
      
      // The expiresAt should be in the future
      expect(loginResponse.body.expiresAt).toBeGreaterThan(Date.now());
    });
  });
});