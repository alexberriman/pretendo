# ⚙️ Configuration

JSON REST Mock API offers extensive configuration options to customize its behavior to match your specific needs.

**← [Relationships](./relationships.md) | [Table of Contents](./README.md) | [Next: Authentication →](./authentication.md)**

## Configuration Methods

You can configure the mock API in several ways:

1. **Config file**: Using a YAML or JSON configuration file
2. **CLI options**: Passing options via command-line arguments
3. **Programmatic API**: Setting options when using the API programmatically

## Basic Configuration

The basic configuration includes server settings, file paths, and general behavior options.

### Simple Example

```yaml
# api-config.yml
resources:
  - name: users
    # ... resource definition
  - name: posts
    # ... resource definition

options:
  port: 3000
  host: localhost
  delay: 200
  readOnly: false
```

## Configuration Options

### Server Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | `3000` | Server port |
| `host` | string | `'localhost'` | Server host |
| `baseUrl` | string | `'/'` | Base URL path for the API |
| `https` | boolean | `false` | Use HTTPS (requires cert and key) |
| `certPath` | string | `null` | Path to SSL certificate |
| `keyPath` | string | `null` | Path to SSL private key |

### Data and Storage

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataFile` | string | `null` | Path to data file for persistence |
| `snapshot` | boolean | `false` | Take snapshots of data changes |
| `snapshotDir` | string | `'./snapshots'` | Directory for snapshots |
| `readOnly` | boolean | `false` | Make the API read-only |
| `reset` | boolean | `false` | Reset data to initial state on startup |

### Middleware and Features

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `corsEnabled` | boolean | `true` | Enable CORS middleware |
| `corsOptions` | object | `{}` | CORS middleware options |
| `bodyLimit` | string | `'10mb'` | Request body size limit |
| `compression` | boolean | `true` | Enable response compression |
| `logging` | boolean \| object | `true` | Enable request logging |
| `errorHandler` | boolean | `true` | Enable built-in error handler |

### Latency Simulation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delay` | number | `0` | Fixed delay in milliseconds |
| `latency.enabled` | boolean | `false` | Enable random latency |
| `latency.min` | number | `20` | Minimum latency in milliseconds |
| `latency.max` | number | `500` | Maximum latency in milliseconds |
| `latency.distribution` | string | `'uniform'` | Distribution type ('uniform', 'normal', 'exponential') |

### Authentication

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auth.enabled` | boolean | `false` | Enable authentication |
| `auth.jwt.secret` | string | `'secret'` | JWT secret key |
| `auth.jwt.expiresIn` | string | `'1h'` | JWT expiration time |
| `auth.users` | array | `[]` | Predefined users |
| `auth.endpoints` | boolean | `true` | Enable auth endpoints |

### Routes and Endpoints

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `routes.crud` | boolean | `true` | Enable CRUD endpoints |
| `routes.relationships` | boolean | `true` | Enable relationship endpoints |
| `routes.admin` | boolean | `true` | Enable admin endpoints |
| `routes.custom` | array | `[]` | Custom route definitions |

### Validation and Rules

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validation.enabled` | boolean | `true` | Enable request validation |
| `validation.strict` | boolean | `false` | Fail on unknown properties |
| `rules.allowNullValues` | boolean | `true` | Allow null values in fields |
| `rules.autoGenerateIds` | boolean | `true` | Auto-generate IDs for new resources |
| `rules.defaultPrimaryKey` | string | `'id'` | Default primary key field name |

## Full Configuration Example

```yaml
# full-config.yml
resources:
  - name: users
    # ... resource definition
  
  - name: posts
    # ... resource definition

options:
  # Server settings
  port: 3000
  host: 'localhost'
  baseUrl: '/api/v1'
  https: false
  
  # Data persistence
  dataFile: './data/db.json'
  snapshot: true
  snapshotDir: './data/snapshots'
  readOnly: false
  reset: false
  
  # Middleware and features
  corsEnabled: true
  corsOptions:
    origin: '*'
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  bodyLimit: '10mb'
  compression: true
  logging: {
    level: 'info',
    format: 'combined'
  }
  errorHandler: true
  
  # Latency simulation
  latency:
    enabled: true
    min: 50
    max: 200
    distribution: 'normal'
  
  # Authentication
  auth:
    enabled: true
    jwt:
      secret: 'my-secure-jwt-secret-key'
      expiresIn: '1d'
    users:
      - username: 'admin'
        password: 'password'
        role: 'admin'
      - username: 'user'
        password: 'password'
        role: 'user'
    endpoints: true
  
  # Routes and endpoints
  routes:
    crud: true
    relationships: true
    admin: true
    custom: [
      {
        path: '/health',
        method: 'get',
        handler: 'healthCheck'
      }
    ]
  
  # Validation and rules
  validation:
    enabled: true
    strict: false
  rules:
    allowNullValues: true
    autoGenerateIds: true
    defaultPrimaryKey: 'id'
```

## CLI Configuration

You can set configuration options via command-line arguments:

```bash
# Basic server options
json-rest-mock-api --config api-config.yml --port 3001 --data-file ./data.json

# Feature toggles
json-rest-mock-api --auth --cors --latency --read-only

# Latency options
json-rest-mock-api --latency --latency-min 100 --latency-max 300
```

## Environment Variables

Configuration can also be set through environment variables with the `JSON_REST_MOCK_API_` prefix:

```bash
# Set port and enable authentication
export JSON_REST_MOCK_API_PORT=4000
export JSON_REST_MOCK_API_AUTH_ENABLED=true

# Start the server
json-rest-mock-api
```

## Programmatic Configuration

When using the API programmatically, you can pass configuration options:

```typescript
import { createServer } from 'json-rest-mock-api';

const server = createServer({
  resources: [
    // Resource definitions
  ],
  options: {
    port: 3000,
    auth: {
      enabled: true,
      jwt: {
        secret: process.env.JWT_SECRET
      }
    },
    // Other options
  }
});

server.listen().then(() => {
  console.log('Server running on port 3000');
});
```

## Configuration Loading Priority

When multiple configuration methods are used, they are applied in the following order (later overrides earlier):

1. Default configuration
2. Configuration file
3. Environment variables
4. Command-line arguments
5. Programmatic options

## Next Steps

Now that you understand configuration options, learn about [Authentication](./authentication.md) in the next section.

**← [Relationships](./relationships.md) | [Table of Contents](./README.md) | [Next: Authentication →](./authentication.md)**