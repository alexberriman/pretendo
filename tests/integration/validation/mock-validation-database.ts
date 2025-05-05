import { ApiConfig } from "../../../src/types/index.js";
import { createMockApi } from "../../../src/index.js";

// API with validation rules
export const createValidationConfig = (): ApiConfig => {
  return {
    resources: [
      {
        name: "users",
        fields: [
          { name: "id", type: "number" },
          { 
            name: "username", 
            type: "string", 
            required: true,
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$" 
          },
          { 
            name: "email", 
            type: "string", 
            required: true,
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            unique: true
          },
          { 
            name: "age", 
            type: "number", 
            min: 13, 
            max: 120 
          },
          { 
            name: "role", 
            type: "string", 
            enum: ["user", "admin", "editor"],
            defaultValue: "user" 
          },
        ],
      },
    ],
    options: {
      port: 0, // Random port
    },
  };
};

// Create a new validation test server with a completely clean database
export const createValidationTestServer = async () => {
  // Set environment variable to indicate we're running validation tests
  process.env.VALIDATION_TEST = "true";
  
  const config = createValidationConfig();
  const result = await createMockApi(config);
  
  if (!result.ok) {
    throw new Error(`Failed to create mock API: ${result.error.message}`);
  }
  
  return result.value;
};