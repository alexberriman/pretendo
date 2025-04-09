# 🔐 Authentication

Pretendo provides flexible authentication options to simulate real-world API security behaviors.

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

## Role-Based Access Control

You can configure access control for resources:

```yaml
resources:
  - name: users
    access:
      list: ["admin"]
      get: ["admin", "user"]
      create: ["admin"]
      update: ["admin"]
      delete: ["admin"]
  
  - name: posts
    access:
      list: ["admin", "user"]
      get: ["admin", "user"]
      create: ["admin", "user"]
      update: ["admin", "user", "owner"]
      delete: ["admin", "owner"]
```

### Special Access Roles

- `"*"`: Any authenticated user
- `"owner"`: The user who created the resource

## User-Owned Resources

You can configure resources to be owned by users:

```yaml
resources:
  - name: posts
    ownedBy: userId
    # ... other resource configuration
```

With this configuration:
- The `userId` field is automatically set to the authenticated user's ID when creating a resource
- The "owner" access role will work based on this field

## Advanced Authentication Configuration

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

### Custom User Model

You can specify which resource to use for users:

```yaml
options:
  auth:
    enabled: true
    userResource: "accounts"  # Custom resource name
    usernameField: "email"    # Field to use as username
    passwordField: "hash"     # Field to store password
```

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

The authentication system in Pretendo is designed for **testing and development purposes**. While it implements industry-standard authentication patterns, it has some important limitations to be aware of:

- The default JWT secret is not secure for production use
- Token refresh mechanisms are simplified
- Password hashing is simulated but not as robust as production systems
- No protection against brute force attacks

For production systems, you should implement proper authentication with appropriate security measures.

## Next Steps

Return to the [Table of Contents](./README.md) to explore more documentation topics.

**← [Configuration](./configuration.md) | [Table of Contents](./README.md)**