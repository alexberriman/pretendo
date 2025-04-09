// Main integration test suite that imports all other test suites
import { describe, it } from './setup';

// Import all test suites
import './auth/auth.test';
import './resources/customers.test';
import './resources/products.test';
import './resources/orders.test';
import './resources/categories.test';
import './resources/reviews.test';
import './admin/admin.test';

describe('Pretendo API Integration Tests', () => {
  // This is just a container for organizing all the tests
  // The actual tests are in the imported files
  it('includes all test suites', () => {
    // This is an empty test to prevent the "No test found" error
  });
});