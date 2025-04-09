// Sample test data factory functions

interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  [key: string]: any;
}

interface ProductData {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  sku: string;
  inStock: boolean;
  [key: string]: any;
}

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  [key: string]: any;
}

interface OrderData {
  customerId: number;
  status: string;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  [key: string]: any;
}

interface OrderItemData {
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  [key: string]: any;
}

interface ReviewData {
  productId: number;
  customerId: number;
  rating: number;
  title: string;
  content: string;
  [key: string]: any;
}

interface CustomerAddressData {
  customerId: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  [key: string]: any;
}

// Create a test customer
export function createTestCustomer(overrides: Partial<CustomerData> = {}): CustomerData {
  return {
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    phone: '555-1234',
    ...overrides
  };
}

// Create a test product
export function createTestProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    name: `Test Product ${Date.now()}`,
    description: 'A test product for integration tests',
    price: 99.99,
    categoryId: 1,
    sku: `TEST-${Date.now()}`,
    inStock: true,
    ...overrides
  };
}

// Create a test category
export function createTestCategory(overrides: Partial<CategoryData> = {}): CategoryData {
  const timestamp = Date.now();
  return {
    name: `Test Category ${timestamp}`,
    slug: `test-category-${timestamp}`,
    description: 'A test category for integration tests',
    ...overrides
  };
}

// Create a test order
export function createTestOrder(customerId: number, overrides: Partial<OrderData> = {}): OrderData {
  return {
    customerId,
    status: 'pending',
    total: 199.99,
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    ...overrides
  };
}

// Create a test order item
export function createTestOrderItem(orderId: number, productId: number, overrides: Partial<OrderItemData> = {}): OrderItemData {
  return {
    orderId,
    productId,
    quantity: 1,
    price: 99.99,
    ...overrides
  };
}

// Create a test review
export function createTestReview(productId: number, customerId: number, overrides: Partial<ReviewData> = {}): ReviewData {
  return {
    productId,
    customerId,
    rating: 5,
    title: 'Test Review',
    content: 'This is a test review for integration tests',
    ...overrides
  };
}

// Create a test customer address
export function createTestCustomerAddress(customerId: number, overrides: Partial<CustomerAddressData> = {}): CustomerAddressData {
  return {
    customerId,
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country',
    isDefault: true,
    ...overrides
  };
}