import { createMockApi } from '../../../src/index';
import { ApiConfig } from '../../../src/types/index';

/**
 * This file contains a test using the programmatic API directly
 * to verify that our custom routes implementation works correctly.
 */
export async function testCustomRoutes() {
  const config: ApiConfig = {
    resources: [
      {
        name: 'users',
        fields: [
          { name: 'id', type: 'number' },
          { name: 'name', type: 'string' },
        ],
      },
    ],
    routes: [
      {
        path: '/hello',
        method: 'get',
        type: 'json',
        response: { message: 'Hello, world!' },
      },
      {
        path: '/users/:id',
        method: 'get',
        type: 'json',
        response: {
          user: {
            id: '{id}',
            name: 'User {id}',
          },
        },
      },
    ],
    options: {
      port: 3456,
    },
  };

  const result = await createMockApi(config);
  
  if (!result.ok) {
    console.error('Failed to create mock API:', result.error);
  } else {
    console.log('Successfully created mock API with custom routes');
    await result.value.stop();
  }
}