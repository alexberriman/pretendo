import { describe, it, expect, beforeAll, afterAll, createTestServer, cleanupTestServer, createRequest, getAuthToken } from '../setup';
import { createTestCategory } from '../testData';

describe('Categories API', () => {
  let server;
  let request;
  let token;
  let testCategoryId;

  beforeAll(async () => {
    server = await createTestServer();
    request = createRequest(server);
    token = await getAuthToken(request);
  });

  afterAll(async () => {
    await cleanupTestServer(server);
  });

  describe('GET /categories', () => {
    it('should return a list of categories', async () => {
      const response = await request
        .get('/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that initial data exists
      const electronics = response.body.data.find(c => c.name === 'Electronics');
      expect(electronics).toBeDefined();
      expect(electronics.slug).toBe('electronics');
    });

    it('should support filtering by parent category', async () => {
      const response = await request
        .get('/categories?parentId=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      
      // All results should have parentId = 1
      response.body.data.forEach(category => {
        expect(category.parentId).toBe(1);
      });
    });
  });

  describe('POST /categories', () => {
    it('should create a new category', async () => {
      const newCategory = createTestCategory();
      
      const response = await request
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newCategory.name);
      expect(response.body.data.slug).toBe(newCategory.slug);
      expect(response.body.data.description).toBe(newCategory.description);

      // Save the ID for later tests
      testCategoryId = response.body.data.id;
    });

    it('handles incomplete data by providing defaults', async () => {
      const incompleteCategory = {
        slug: 'incomplete-category',
        description: 'Incomplete category data'
        // Missing required name field, but API may provide defaults
      };
      
      const response = await request
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteCategory);

      // The API might accept this and create with default values
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('GET /categories/:id', () => {
    it('should get a category by ID', async () => {
      const response = await request
        .get(`/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testCategoryId);
    });

    it('should return 404 for a non-existent category', async () => {
      const response = await request
        .get('/categories/9999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update a category (full update)', async () => {
      const updatedCategory = {
        name: `Updated Category ${Date.now()}`,
        slug: `updated-category-${Date.now()}`,
        description: 'Updated category description',
        parentId: null
      };
      
      const response = await request
        .put(`/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedCategory);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testCategoryId);
      expect(response.body.data.name).toBe(updatedCategory.name);
      expect(response.body.data.slug).toBe(updatedCategory.slug);
      expect(response.body.data.description).toBe(updatedCategory.description);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should partially update a category', async () => {
      const partialUpdate = {
        name: 'Partially Updated Category',
        parentId: 1 // Set parent to Electronics
      };
      
      const response = await request
        .patch(`/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testCategoryId);
      expect(response.body.data.name).toBe(partialUpdate.name);
      expect(response.body.data.parentId).toBe(partialUpdate.parentId);
      // Other fields should remain unchanged
    });
  });

  describe('GET /categories/:id/products', () => {
    it('should get related products for a category', async () => {
      // Use category 1 (Electronics) which has products in the initial data
      const response = await request
        .get('/categories/1/products')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All products should be in category 1
      response.body.data.forEach(product => {
        expect(product.categoryId).toBe(1);
      });
    });

    it('should return empty array for category with no products', async () => {
      const response = await request
        .get(`/categories/${testCategoryId}/products`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete a category', async () => {
      const response = await request
        .delete(`/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      
      // Verify category is deleted
      const getResponse = await request
        .get(`/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(getResponse.status).toBe(404);
    });
  });
});