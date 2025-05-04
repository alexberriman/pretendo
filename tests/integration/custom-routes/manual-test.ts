// This file is for manual testing of custom routes
// Run with: npx ts-node-esm tests/integration/custom-routes/manual-test.ts

import { createMockApi } from '../../../src/index.js';
import { ApiConfig } from '../../../src/types/index.js';
import fetch from 'node-fetch';

async function main() {
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
      auth: {
        enabled: false,
      },
    },
  };

  console.log('Starting custom routes test server...');
  const result = await createMockApi(config);
  
  if (!result.ok) {
    console.error('Failed to create mock API:', result.error);
    process.exit(1);
  }
  
  console.log('Successfully created mock API with custom routes');
  console.log(`Server running at: ${result.value.getUrl()}`);
  
  try {
    // Test the custom routes
    console.log('\nTesting routes:');
    
    // Test hello route
    console.log(`- Testing GET ${result.value.getUrl()}/hello`);
    const helloResponse = await fetch(`${result.value.getUrl()}/hello`);
    console.log(`  Status: ${helloResponse.status}`);
    if (helloResponse.ok) {
      console.log('  Response:', await helloResponse.json());
    } else {
      console.log('  Error:', await helloResponse.text());
    }
    
    // Test user route with parameter
    console.log(`- Testing GET ${result.value.getUrl()}/users/42`);
    const userResponse = await fetch(`${result.value.getUrl()}/users/42`);
    console.log(`  Status: ${userResponse.status}`);
    if (userResponse.ok) {
      console.log('  Response:', await userResponse.json());
    } else {
      console.log('  Error:', await userResponse.text());
    }
    
    // Test normal resource route
    console.log(`- Testing GET ${result.value.getUrl()}/users`);
    const usersResponse = await fetch(`${result.value.getUrl()}/users`);
    console.log(`  Status: ${usersResponse.status}`);
    if (usersResponse.ok) {
      console.log('  Response:', await usersResponse.json());
    } else {
      console.log('  Error:', await usersResponse.text());
    }
  } catch (error) {
    console.error('Error testing routes:', error);
  } finally {
    // Cleanup
    console.log('\nStopping server...');
    await result.value.stop();
    console.log('Server stopped');
    process.exit(0);
  }
}

// Run the main function
main();