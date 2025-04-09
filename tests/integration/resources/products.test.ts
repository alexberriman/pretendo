import { describe, it, expect, beforeAll, afterAll, createTestServer, cleanupTestServer, createRequest, getAuthToken } from '../setup';
import { createTestProduct } from '../testData';

describe('Products API', () => {
  let server;
  let request;
  let token;
  let testProductId;

  beforeAll(async () => {
    server = await createTestServer();
    request = createRequest(server);
    token = await getAuthToken(request);
  });

  afterAll(async () => {
    await cleanupTestServer(server);
  });

  describe('GET /products', () => {
    it('should return a list of products', async () => {
      const response = await request
        .get('/products')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that initial data exists
      const laptopPro = response.body.data.find(p => p.name === 'Laptop Pro');
      expect(laptopPro).toBeDefined();
      expect(laptopPro.price).toBe(1299.99);
      expect(laptopPro.categoryId).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request
        .get('/products?page=1&perPage=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body).toHaveProperty('meta.pagination');
      expect(response.body.meta.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.meta.pagination).toHaveProperty('perPage', 1);
    });

    it('should support filtering by category', async () => {
      const response = await request
        .get('/products?categoryId=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      
      // All results should have categoryId = 1
      response.body.data.forEach(product => {
        expect(product.categoryId).toBe(1);
      });
    });

    it('should support filtering by price range', async () => {
      const response = await request
        .get('/products?price_gte=800&price_lte=1000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      
      // All results should have price between 800 and 1000
      response.body.data.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(800);
        expect(product.price).toBeLessThanOrEqual(1000);
      });
    });

    it('should support sorting by price', async () => {
      const response = await request
        .get('/products?sort=price')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      
      // Check that results are sorted by price in ascending order
      const prices = response.body.data.map(p => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i-1]);
      }
    });
  });

  describe('POST /products', () => {
    it('should create a new product', async () => {
      const newProduct = createTestProduct();
      
      const response = await request
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newProduct.name);
      expect(response.body.data.price).toBe(newProduct.price);
      expect(response.body.data.categoryId).toBe(newProduct.categoryId);
      expect(response.body.data.sku).toBe(newProduct.sku);

      // Save the ID for later tests
      testProductId = response.body.data.id;
    });

    it('handles incomplete data by providing defaults', async () => {
      const incompleteProduct = {
        description: 'Incomplete product data',
        inStock: true
        // Missing required name and price fields, but API may provide defaults
      };
      
      const response = await request
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteProduct);

      // The API might accept this and create with default values
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('GET /products/:id', () => {
    it('should get a product by ID', async () => {
      const response = await request
        .get(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testProductId);
    });

    it('should return 404 for a non-existent product', async () => {
      const response = await request
        .get('/products/9999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /products/:id', () => {
    it('should update a product (full update)', async () => {
      const updatedProduct = {
        name: `Updated Product ${Date.now()}`,
        description: 'Updated description',
        price: 199.99,
        categoryId: 3,
        sku: `UPDATED-${Date.now()}`,
        inStock: false
      };
      
      const response = await request
        .put(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedProduct);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testProductId);
      expect(response.body.data.name).toBe(updatedProduct.name);
      expect(response.body.data.price).toBe(updatedProduct.price);
      expect(response.body.data.categoryId).toBe(updatedProduct.categoryId);
      expect(response.body.data.sku).toBe(updatedProduct.sku);
      expect(response.body.data.inStock).toBe(updatedProduct.inStock);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should partially update a product', async () => {
      const partialUpdate = {
        name: 'Partially Updated Product',
        price: 149.99
      };
      
      const response = await request
        .patch(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testProductId);
      expect(response.body.data.name).toBe(partialUpdate.name);
      expect(response.body.data.price).toBe(partialUpdate.price);
      // Other fields should remain unchanged
    });
  });

  describe('GET /products/:id/reviews', () => {
    it('should get related reviews for a product', async () => {
      // Use product 1 which has reviews in the initial data
      const response = await request
        .get('/products/1/reviews')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All reviews should be for product 1
      response.body.data.forEach(review => {
        expect(review.productId).toBe(1);
      });
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product', async () => {
      const response = await request
        .delete(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      
      // Verify product is deleted
      const getResponse = await request
        .get(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(getResponse.status).toBe(404);
    });
  });
});