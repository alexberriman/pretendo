# 🔌 Custom Routes

Custom routes allow you to extend Pretendo with your own endpoints, either returning static JSON or executing dynamic JavaScript code.

**← [API Schema](./schema.md) | [Table of Contents](./README.md)**

## Types of Custom Routes

Pretendo supports two types of custom routes:

1. **JSON Routes**: Return a static JSON response, optionally with parameter substitution
2. **JavaScript Routes**: Execute custom JavaScript code to generate dynamic responses

## Defining Custom Routes

Custom routes are defined in the `routes` section of your API schema:

```yaml
routes:
  - path: "/status"
    method: "get"
    type: "json"
    response: 
      status: "healthy"
      version: "1.0.0"
      uptime: "3d 4h 12m"
  
  - path: "/calculate"
    method: "post"
    type: "javascript"
    code: |
      const { a, b, operation } = request.body;
      
      let result;
      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            response.status = 400;
            response.body = { error: "Cannot divide by zero" };
            return;
          }
          result = a / b;
          break;
        default:
          response.status = 400;
          response.body = { error: "Invalid operation" };
          return;
      }
      
      response.body = { result };
```

Each custom route has the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | **Required**. Route path (with or without leading slash) |
| `method` | string | **Required**. HTTP method: "get", "post", "put", "patch", or "delete" |
| `type` | string | **Required**. Route type: "json" or "javascript" |
| `response` | any | For "json" type routes, the static response to return |
| `code` | string | For "javascript" type routes, the code to execute |
| `description` | string | Optional description for documentation purposes |
| `auth` | object | Optional route-level authentication configuration |
| `auth.enabled` | boolean | Whether authentication is required for this route (overrides global setting) |
| `auth.roles` | string[] | Allowed roles for this route (e.g., ["admin", "editor"]) |

## JSON Routes

JSON routes return a static JSON response that you define in the configuration:

```yaml
- path: "/status"
  method: "get"
  type: "json"
  response: 
    status: "healthy"
    version: "1.0.0"
    uptime: "3d 4h 12m"
```

### Parameter Substitution

For JSON routes, you can include parameter placeholders in string values:

```yaml
- path: "/greet/:name"
  method: "get"
  type: "json"
  response:
    message: "Hello, {name}!"
    id: "{id}"  # Parameters not present in the URL will be left as-is
```

The placeholders will be replaced with the actual parameter values when the response is sent. Both `{paramName}` and `{:paramName}` formats are supported.

## JavaScript Routes

JavaScript routes allow you to define custom logic to handle requests and generate responses. This gives you full control to implement any custom behavior not provided by the standard CRUD operations.

```yaml
- path: "/echo"
  method: "post"
  type: "javascript"
  code: |
    const { body } = request;
    response.body = { 
      message: "You sent:", 
      data: body,
      timestamp: new Date().toISOString()
    };
```

### Important Security Notice

⚠️ **IMPORTANT**: By default, JavaScript routes execute code directly in the Node.js process with no sandboxing or isolation. This means the code has full access to the Node.js environment and can potentially interact with the file system, network, or any other system resources. You should only use JavaScript routes with code that you trust completely.

**Security Recommendations:**
1. Never run untrusted JavaScript code from external sources
2. Carefully review all JavaScript code before adding it to your routes
3. Only use the default execution engine for development and testing, never in production with untrusted code
4. For production environments with untrusted code, use the **executeJs hook** (described below) to run code in a secure, isolated environment

### The executeJs Hook

If you need to execute untrusted JavaScript in a production environment, Pretendo provides an **executeJs hook** that lets you override the default execution engine with your own implementation. This allows you to redirect JavaScript execution to an isolated environment like a container, serverless function, or other secure execution system.

To use this feature, provide an `executeJs` function in your Pretendo configuration:

```javascript
import { createMockApi } from "pretendo";

const server = await createMockApi({
  resources: [...],
  options: {
    // Other options...
    
    executeJs: async (context) => {
      // context contains: code, request, db, log
      
      // Example: Send code to an isolated execution service
      const result = await isolatedExecutionService.execute(
        context.code, 
        {
          request: context.request,
          // Pass any other context needed by the code
        }
      );
      
      // Return the result with proper status, headers and body
      return {
        status: result.status || 200,
        headers: result.headers || {},
        body: result.data
      };
    }
  }
});
```

#### Hook Context Object

The `executeJs` hook receives a context object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `code` | string | The JavaScript code string to execute |
| `request` | object | The HTTP request object (same as in JavaScript routes) |
| `request.params` | object | URL parameters from path parameters like /:id |
| `request.query` | object | Query parameters from URL like ?foo=bar |
| `request.body` | any | Request body from JSON or form data |
| `request.headers` | object | HTTP headers from the request |
| `request.method` | string | HTTP method (GET, POST, etc.) |
| `request.path` | string | Request path |
| `request.user` | object | Authenticated user (if available) |
| `db` | object | Database operations interface |
| `log` | function | Logging function |

#### Hook Return Value

The hook must return a `Promise` that resolves to an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `status` | number | HTTP status code (default: 200) |
| `headers` | object | HTTP headers to include in the response |
| `body` | any | Response body (will be automatically converted to JSON) |

### Example: Secure Execution in Kubernetes

Here's a more complete example of using the `executeJs` hook to securely execute JavaScript in isolated Kubernetes pods:

```javascript
import { createMockApi } from "pretendo";
import { KubernetesExecutor } from "./my-k8s-executor";

// Configure an executor that runs code in isolated pods
const executor = new KubernetesExecutor({
  namespace: "js-execution",
  timeoutSeconds: 10,
  memoryLimit: "128Mi",
  cpuLimit: "100m"
});

const server = await createMockApi({
  resources: [...],
  options: {
    port: 3000,
    
    // Override JavaScript execution with secure K8s executor
    executeJs: async (context) => {
      try {
        const { code, request, log } = context;
        
        // Log that we're executing code in a secure container
        log("Executing code in isolated container");
        
        // Serialize only what's needed from the DB context
        // This allows safely passing the database functions to the isolated environment
        const serializedDbContext = {
          collections: Object.keys(await context.db.getResources("*")),
          // Add any other safe-to-serialize DB metadata
        };
        
        // Execute in isolated pod
        const result = await executor.execute(code, {
          request,
          db: serializedDbContext,
          // Don't pass full DB operations - implement safe proxies in the container
        });
        
        return {
          status: result.status,
          headers: result.headers,
          body: result.body
        };
      } catch (error) {
        // Handle execution errors
        log("Execution error:", error);
        return {
          status: 500,
          headers: {},
          body: {
            error: "Secure execution failed",
            message: error.message
          }
        };
      }
    }
  }
});
```

#### Security Benefits

Using the `executeJs` hook provides several security advantages:

1. **Process Isolation**: Code execution is isolated from your main application
2. **Resource Limits**: Apply memory and CPU limits to prevent DoS attacks
3. **Network Control**: Restrict network access in the execution environment
4. **Timeouts**: Enforce strict execution time limits
5. **Statelessness**: Each execution is completely independent
6. **Scalability**: Execute code in distributed environments
7. **Monitoring**: Add centralized logging and instrumentation

### JavaScript Context

Your JavaScript code has access to the following global objects:

#### `request` Object

Contains information about the incoming HTTP request:

```javascript
// Request object structure
request = {
  // URL parameters from path parameters like /:id
  params: { id: "123", ... },
  
  // Query parameters from URL like ?foo=bar
  query: { page: "1", sort: "name", ... },
  
  // Request body from JSON or form data
  body: { ... },
  
  // HTTP headers from the request
  headers: { "content-type": "application/json", ... },
  
  // HTTP method (GET, POST, etc.)
  method: "POST",
  
  // Request path
  path: "/api/calculate",
  
  // Authenticated user (if available)
  user: { id: 1, username: "admin", role: "admin" }
}
```

#### `response` Object

Use this object to control the HTTP response:

```javascript
// Response object structure - modify this to change the response
response = {
  // HTTP status code (default: 200)
  status: 200,
  
  // HTTP headers to include in the response
  headers: {
    "x-custom-header": "custom-value"
  },
  
  // Response body (will be automatically converted to JSON)
  body: {
    result: 42,
    message: "Success"
  }
}
```

#### `log` Function

Use the provided log function to add debugging information:

```javascript
log("Processing request data:", request.body);
log("User authenticated:", request.user?.username);
log("Database result:", dbResult);
```

Logs will appear in the server logs at the debug level.

#### `db` Object

Access the database with these asynchronous methods:

```javascript
// Get a resource by ID or all resources of a type
const user = await db.getResource("users", 123); // specific resource
const allUsers = await db.getResource("users");  // all users

// Create a new resource
const newPost = await db.createResource("posts", {
  title: "New Post",
  content: "Post content",
  userId: 123
});

// Update a resource
const updatedUser = await db.updateResource("users", 123, {
  email: "new@example.com"
});

// Delete a resource
const deleted = await db.deleteResource("posts", 456);
```

### Execution Constraints

JavaScript routes execute with the following constraints:

1. **Execution Time**: A 1-second timeout is applied to prevent infinite loops
2. **Error Handling**: Unhandled errors will return a 500 response to the client
3. **Async/Await Support**: You can use `async/await` with database operations
4. **No Sandboxing**: Code is executed directly in the Node.js process without any sandbox isolation

### Error Handling

You can handle errors in your JavaScript route by using try/catch blocks:

```javascript
try {
  // Your code that might throw an error
  const result = performOperation();
  response.body = { result };
} catch (error) {
  console.error("Operation failed:", error);
  response.status = 500;
  response.body = { 
    error: error.message,
    status: 500
  };
}
```

If your code throws an unhandled exception or times out, the server will automatically return a 500 error response.

## Examples

### JSON Route with Parameter Substitution

```yaml
- path: "/users/:id/profile"
  method: "get"
  type: "json"
  response:
    user:
      id: "{id}"
      profile:
        bio: "Profile for user {id}"
        avatar: "https://example.com/avatars/{id}.jpg"
```

### JavaScript Route for Authentication

```yaml
- path: "/auth/token"
  method: "post"
  type: "javascript"
  code: |
    const { username, password } = request.body;
    
    // Get user from database
    const user = await db.getResources("users", {
      filters: [
        { field: "username", operator: "eq", value: username }
      ]
    });
    
    if (user.length === 0 || user[0].password !== password) {
      response.status = 401;
      response.body = { error: "Invalid credentials" };
      return;
    }
    
    // In a real app, you'd generate a JWT here
    response.body = {
      token: "sample-token-" + Date.now(),
      user: {
        id: user[0].id,
        username: user[0].username,
        role: user[0].role
      }
    };
```

### JavaScript Route for Data Processing

```yaml
- path: "/stats/summary"
  method: "get"
  type: "javascript"
  code: |
    // Get data from multiple resources
    const users = await db.getResource("users");
    const posts = await db.getResource("posts");
    const comments = await db.getResource("comments");
    
    // Calculate statistics
    const stats = {
      userCount: users.length,
      postCount: posts.length,
      commentCount: comments.length,
      averageCommentsPerPost: posts.length ? comments.length / posts.length : 0,
      topContributors: users
        .map(user => {
          const userPosts = posts.filter(post => post.userId === user.id);
          return {
            id: user.id,
            username: user.username,
            postCount: userPosts.length
          };
        })
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 5)
    };
    
    response.body = { stats };
```

### JavaScript Route with Error Handling

```yaml
- path: "/safe-divide"
  method: "post"
  type: "javascript"
  code: |
    try {
      const { numerator, denominator } = request.body;
      
      if (typeof numerator !== 'number' || typeof denominator !== 'number') {
        response.status = 400;
        response.body = { error: "Both numerator and denominator must be numbers" };
        return;
      }
      
      if (denominator === 0) {
        throw new Error("Division by zero is not allowed");
      }
      
      const result = numerator / denominator;
      response.body = { result };
    } catch (error) {
      response.status = 400;
      response.body = { 
        error: error.message
      };
    }
```

## Route-Level Authentication

You can configure authentication requirements for each custom route, independent of the global authentication settings. This allows you to:

1. Make specific routes public even when global authentication is enabled
2. Restrict routes to specific user roles
3. Apply authentication only to selected routes

### Disabling Authentication for a Specific Route

To make a route public even when global authentication is enabled:

```yaml
- path: "/status"
  method: "get"
  type: "json"
  response:
    status: "operational"
    version: "1.0.0"
  auth:
    enabled: false
```

### Requiring Authentication for a Route

To require authentication for a route (any authenticated user can access):

```yaml
- path: "/user-stats"
  method: "get"
  type: "json"
  response:
    stats:
      users: 1250
      active: 742
  auth:
    enabled: true
```

### Restricting a Route to Specific Roles

To allow only users with specific roles to access a route:

```yaml
- path: "/admin/dashboard"
  method: "get"
  type: "javascript"
  code: |
    // Admin-only dashboard code
    const stats = await db.getResource("stats");
    const users = await db.getResource("users");
    
    response.body = {
      systemStats: stats,
      userCount: users.length
    };
  auth:
    roles: ["admin"]
```

### Allowing Multiple Roles

You can specify multiple allowed roles:

```yaml
- path: "/content/manage"
  method: "post"
  type: "javascript"
  code: |
    // Content management code
    response.body = {
      message: "Content updated successfully"
    };
  auth:
    roles: ["admin", "editor", "content-manager"]
```

### Using the Wildcard Role

The special `*` wildcard role allows any authenticated user:

```yaml
- path: "/user-data"
  method: "get"
  type: "javascript"
  code: |
    // Return data for the authenticated user
    const userId = request.user.id;
    const userData = await db.getResource("users", userId);
    response.body = { userData };
  auth:
    roles: ["*"]
```

## Next Steps

Learn about [OpenAPI Documentation](./openapi-docs.md) in the next section.

**← [API Schema](./schema.md) | [Table of Contents](./README.md) | [Next: OpenAPI Documentation →](./openapi-docs.md)**