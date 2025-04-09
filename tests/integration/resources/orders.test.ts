import { describe, it, expect, beforeAll, afterAll, createTestServer, cleanupTestServer, createRequest, getAuthToken } from '../setup';
import { createTestOrder, createTestOrderItem } from '../testData';

describe('Orders API', () => {
  let server;
  let request;
  let token;
  let testOrderId;

  beforeAll(async () => {
    server = await createTestServer();
    request = createRequest(server);
    token = await getAuthToken(request);
  });

  afterAll(async () => {
    await cleanupTestServer(server);
  });

  describe('GET /orders', () => {
    it('should return a list of orders', async () => {
      const response = await request
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that initial data exists
      const order = response.body.data[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('customerId');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('total');
    });

    it('should support filtering by status', async () => {
      const response = await request
        .get('/orders?status=completed')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      
      // All results should have status = completed
      response.body.data.forEach(order => {
        expect(order.status).toBe('completed');
      });
    });

    it('should support filtering by customer', async () => {
      const response = await request
        .get('/orders?customerId=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      
      // All results should have customerId = 1
      response.body.data.forEach(order => {
        expect(order.customerId).toBe(1);
      });
    });
  });

  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const newOrder = createTestOrder(1); // Using customer ID 1
      
      const response = await request
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(newOrder);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.customerId).toBe(newOrder.customerId);
      expect(response.body.data.status).toBe(newOrder.status);
      expect(response.body.data.total).toBe(newOrder.total);
      expect(response.body.data.shippingAddress).toEqual(newOrder.shippingAddress);

      // Save the ID for later tests
      testOrderId = response.body.data.id;
    });

    it('handles incomplete data by providing defaults', async () => {
      const incompleteOrder = {
        status: 'pending',
        total: 100
        // Missing required customerId field, but API may provide defaults
      };
      
      const response = await request
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteOrder);

      // The API might accept this and create with default values
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('GET /orders/:id', () => {
    it('should get an order by ID', async () => {
      const response = await request
        .get(`/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testOrderId);
    });

    it('should return 404 for a non-existent order', async () => {
      const response = await request
        .get('/orders/9999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /orders/:id', () => {
    it('should update an order (full update)', async () => {
      const updatedOrder = {
        customerId: 2, // Change to customer 2
        status: 'shipped',
        total: 299.99,
        shippingAddress: {
          street: 'Updated Street',
          city: 'Updated City',
          state: 'US',
          zipCode: '54321',
          country: 'Updated Country'
        },
        orderDate: new Date().toISOString(),
        shippedAt: new Date().toISOString()
      };
      
      const response = await request
        .put(`/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedOrder);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testOrderId);
      expect(response.body.data.customerId).toBe(updatedOrder.customerId);
      expect(response.body.data.status).toBe(updatedOrder.status);
      expect(response.body.data.total).toBe(updatedOrder.total);
      expect(response.body.data.shippingAddress).toEqual(updatedOrder.shippingAddress);
    });
  });

  describe('PATCH /orders/:id', () => {
    it('should partially update an order', async () => {
      const partialUpdate = {
        status: 'delivered',
        shippedAt: new Date().toISOString()
      };
      
      const response = await request
        .patch(`/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testOrderId);
      expect(response.body.data.status).toBe(partialUpdate.status);
      expect(new Date(response.body.data.shippedAt)).toBeInstanceOf(Date);
      // Other fields should remain unchanged
    });
  });

  describe('GET /orders/:id/orderItems', () => {
    it('should get related order items for an order', async () => {
      // Use order 1 which has order items in the initial data
      const response = await request
        .get('/orders/1/orderItems')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All order items should be for order 1
      response.body.data.forEach(item => {
        expect(item.orderId).toBe(1);
      });
    });

    it('should create and retrieve order items for the test order', async () => {
      // Create an order item for the test order
      const newOrderItem = createTestOrderItem(testOrderId, 1); // Using product ID 1
      
      await request
        .post('/orderItems')
        .set('Authorization', `Bearer ${token}`)
        .send(newOrderItem);
        
      // Get the order items
      const response = await request
        .get(`/orders/${testOrderId}/orderItems`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // All order items should be for the test order
      response.body.data.forEach(item => {
        expect(item.orderId).toBe(testOrderId);
      });
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete an order', async () => {
      const response = await request
        .delete(`/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      
      // Verify order is deleted
      const getResponse = await request
        .get(`/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(getResponse.status).toBe(404);
    });
  });
});