# 🔐 Authentication & Authorization

Pretendo provides flexible authentication and authorization options to simulate real-world API security behaviors.

**← [Configuration](./configuration.md) | [Table of Contents](./README.md)**

## Authentication Overview

The authentication system provides:

1. **JWT-based authentication**: Industry-standard token-based authentication
2. **User management**: Create, manage, and authenticate users
3. **Role-based access control**: Control access to resources based on user roles
4. **Endpoint protection**: Secure specific endpoints or entire resources

## Enabling Authentication

Enable authentication in your configuration:

```yaml
# api-config.yml
options:
  auth:
    enabled: true
    jwt:
      secret: "your-secret-key"
      expiresIn: "1h"
```

## Authentication Endpoints

When authentication is enabled, the following endpoints are available:

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/auth/register` | POST | Register a new user | `{ username, password, ...otherFields }` | User object with token |
| `/auth/login` | POST | Authenticate a user | `{ username, password }` | User object with token |
| `/auth/refresh` | POST | Refresh an auth token | `{ refreshToken }` | New access token |
| `/auth/me` | GET | Get current user profile | None (Authorization header required) | User object |

## Configuring Users

You can pre-configure users in your API schema:

```yaml
options:
  auth:
    enabled: true
    users:
      - username: admin
        password: password
        role: admin
      
      - username: user
        password: password
        role: user
```

## Authentication Flow

### Registration

```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "securepassword",
  "email": "user@example.com",
  "role": "user"
}
```

Response:

```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "newuser",
  "password": "securepassword"
}
```

Response:

```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Accessing Protected Resources

Use the JWT token in the Authorization header:

```http
GET /posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Role-Based Access Control (RBAC)

Pretendo offers a comprehensive Role-Based Access Control system that allows you to:

1. Define roles with specific permissions
2. Control access to resources based on user roles
3. Enforce ownership-based permissions
4. Implement fine-grained access control for each operation type

You can configure access control for resources in your API schema by defining allowed roles for different operations:

```yaml
resources:
  - name: users
    access:
      list: ["admin"]            # Only admins can list users
      get: ["admin", "owner"]    # Admins and the owner can get individual users
      create: ["admin"]          # Only admins can create users
      update: ["owner"]          # Only the owner can update their own profile
      delete: ["admin"]          # Only admins can delete users
  
  - name: posts
    ownedBy: authorId            # This field links to the owner's user ID
    access:
      list: ["*"]                # Any authenticated user can list posts
      get: ["*"]                 # Any authenticated user can view individual posts
      create: ["editor", "admin"] # Only editors and admins can create posts 
      update: ["admin", "owner"] # Only admins or the owner can update posts
      delete: ["admin", "owner"] # Only admins or the post owner can delete posts
```

For full details on RBAC features, see the dedicated [Role-Based Access Control](./role-based-access-control.md) documentation.

## User-Owned Resources and Ownership-Based Permissions

A key part of Pretendo's RBAC system is the ability to define resources that are owned by users and enforce ownership-based permissions:

```yaml
resources:
  - name: posts
    ownedBy: authorId            # Field that stores the owner's user ID
    access:
      update: ["admin", "owner"] # Only admins or the owner can update
      delete: ["admin", "owner"] # Only admins or the owner can delete
    # ... other resource configuration
```

### How Ownership Works

With the `ownedBy` configuration:

1. **Automatic ID Assignment**: When creating a resource, the specified field (e.g., `authorId`) is automatically set to the authenticated user's ID
2. **Ownership Verification**: For operations that support the `"owner"` role, the system verifies that the requesting user's ID matches the value in the ownership field
3. **Strict Owner Checking**: When only the `"owner"` role is specified (no other roles), the system enforces strict ownership checks that cannot be bypassed

### Example: Automatic Owner Assignment

When a user creates a resource with `ownedBy` configured:

```http
POST /posts
Authorization: Bearer eyJhbGciOiJ...
Content-Type: application/json

{
  "title": "My First Post",
  "content": "Hello World!"
}
```

The server automatically assigns the owner, even if not provided in the request:

```json
{
  "data": {
    "id": 1,
    "title": "My First Post",
    "content": "Hello World!",
    "authorId": 5  // Automatically set to the current user's ID
  }
}
```

### Mixed Permission Models

You can combine role-based and ownership-based permissions:

```yaml
resources:
  - name: comments
    ownedBy: userId
    access:
      list: ["*"]                      # Anyone can list comments
      get: ["*"]                       # Anyone can view a comment
      create: ["*"]                    # Anyone can create a comment
      update: ["moderator", "admin", "owner"] # Moderators, admins or owner can edit
      delete: ["moderator", "admin", "owner"] # Moderators, admins or owner can delete
```

This creates a flexible permission model where:
- General operations are open to all users
- Sensitive operations require specific roles OR ownership
- Administrative roles can override ownership restrictions

## Advanced Authentication and Authorization Configuration

### Strict Ownership Enforcement

When you need to ensure that only the owner of a resource can perform certain operations, use the `owner` role as the only allowed role:

```yaml
resources:
  - name: users
    ownedBy: id
    access:
      update: ["owner"]    # Only the owner can update themselves
      delete: ["admin"]    # Only admins can delete users
```

With this configuration, the system performs strict ownership checking that:
1. Verifies the user's ID matches the resource's ownership field
2. Prevents non-owners from accessing the resource regardless of other roles
3. Provides clear error messages when ownership checks fail

### Owner ID Type Handling

The ownership checking system is robust against different ID formats:
- Handles both string and numeric ID comparisons
- Performs type conversion when needed
- Supports exact string matching and numeric equality checking

### JWT Options

```yaml
options:
  auth:
    enabled: true
    jwt:
      secret: "your-secret-key"
      expiresIn: "1h"
      refreshExpiresIn: "7d"
      algorithm: "HS256"
```

### Custom User Resource

When authentication is enabled, you must specify which resource to use for users, along with the field mappings:

```yaml
resources:
  - name: accounts              # Define a custom user resource
    fields:
      - name: id
        type: number
      - name: email             # Will be used as username field
        type: string
        required: true
      - name: hash              # Will be used as password field
        type: string
        required: true
      - name: userType          # Will be used as role field
        type: string
        defaultValue: "basic"
    # ... other resource configuration

options:
  auth:
    enabled: true
    userResource: "accounts"    # Resource to use for users
    usernameField: "email"      # Field to use as username (default: "username")
    passwordField: "hash"       # Field to use as password (default: "password")
    emailField: "email"         # Field to use as email (default: "email")
    roleField: "userType"       # Field to use as role (default: "role")
```

With this configuration:
- The "accounts" resource will be used for user authentication
- The "email" field will be used as the username
- The "hash" field will be used to store and verify passwords
- The "userType" field will be used for role-based authorization

### Password Hashing

Passwords are automatically hashed before storage:

```yaml
options:
  auth:
    enabled: true
    passwordHashing:
      algorithm: "bcrypt"
      rounds: 10
```

## Implementing Custom Authentication Logic

When using the programmatic API, you can customize the authentication logic:

```typescript
import { createServer } from 'pretendo';

const server = createServer({
  // ... resources and options
  
  customHandlers: {
    // Custom authentication handler
    authenticate: async (username, password, context) => {
      // Custom logic to verify credentials
      // Return null for failed authentication
      // Return user object for successful authentication
    },
    
    // Generate custom tokens
    generateToken: (user, secret, options) => {
      // Custom token generation logic
      return {
        token: "custom-token",
        expiresAt: new Date()
      };
    }
  }
});
```

## Disabling Authentication for Specific Routes

You can disable authentication for specific routes or methods:

```yaml
resources:
  - name: products
    access:
      list: ["*"]  # Allow unauthenticated listing
      get: ["*"]   # Allow unauthenticated access to individual products
      create: ["admin", "user"]  # Require authentication for creation
      update: ["admin", "owner"] # Require admin or ownership for updates
      delete: ["admin"]          # Only admins can delete
```

## Client Integration Examples

### JavaScript/Fetch Example

```javascript
// Login and store token
async function login(username, password) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
}

// Access protected resource
async function getPosts() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/posts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

### Testing with Authentication

When writing tests, you can authenticate and use the token:

```javascript
// Example using Jest and Supertest
const request = require('supertest');
const app = 'http://localhost:3000';

let authToken;

beforeAll(async () => {
  const response = await request(app)
    .post('/auth/login')
    .send({
      username: 'admin',
      password: 'password'
    });
  
  authToken = response.body.token;
});

test('can create a post when authenticated', async () => {
  const response = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'Test Post',
      content: 'This is a test'
    });
  
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

## Security Considerations

The authentication and authorization system in Pretendo is designed for **testing and development purposes**. While it implements industry-standard security patterns, there are some important considerations:

### Authentication Considerations
- The default JWT secret is not secure for production use
- Token refresh mechanisms are simplified
- Password hashing is simulated but not as robust as production systems
- No protection against brute force attacks

### Authorization Considerations
- The RBAC implementation is optimized for development and testing
- Fine-grained permissions at the field level are not supported
- Complex role hierarchies are not directly supported
- Ownership checks work on a single field, not complex relationships

For production systems, you should implement proper authentication and authorization with appropriate security measures and more comprehensive access control.

## Next Steps

Return to the [Table of Contents](./README.md) to explore more documentation topics.

**← [Configuration](./configuration.md) | [Table of Contents](./README.md)**