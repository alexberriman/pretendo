# 📚 OpenAPI Documentation

Pretendo automatically generates OpenAPI documentation for your API, making it easier to explore and integrate with your mock API.

**← [Custom Routes](./custom-routes.md) | [Table of Contents](./README.md) | [Next: Authentication →](./authentication.md)**

## OpenAPI Documentation Endpoint

Pretendo provides a special admin endpoint at `/__docs` that returns the OpenAPI specification for your API. This documentation is dynamically generated based on your API configuration and includes all resources, fields, relationships, and routes.

### Accessing the Documentation

You can access the OpenAPI documentation at:

```
GET /__docs
```

By default, this endpoint is enabled in development mode and does not require authentication. In production, it requires admin authentication for security reasons.

### Format Options

You can request the OpenAPI specification in different formats:

- **JSON** (default): `/__docs` or `/__docs?format=json`
- **YAML**: `/__docs?format=yaml`

Example:
```bash
# Get OpenAPI spec in JSON format
curl http://localhost:3000/__docs

# Get OpenAPI spec in YAML format
curl http://localhost:3000/__docs?format=yaml
```

## Configuration

You can configure the OpenAPI documentation endpoint in your API configuration:

```yaml
options:
  docs:
    enabled: true      # Enable or disable the docs endpoint
    requireAuth: false # Whether authentication is required
```

The default values are:
- `enabled`: `true` in development, `false` in production
- `requireAuth`: `false` in development, `true` in production

## Using the OpenAPI Specification

The generated OpenAPI specification can be used with various tools:

1. **Swagger UI**: Import the JSON into [Swagger UI](https://swagger.io/tools/swagger-ui/) for interactive API documentation
2. **Postman**: Import the spec into Postman to create a collection of API requests
3. **Code Generation**: Use tools like [OpenAPI Generator](https://openapi-generator.tech/) to generate client libraries
4. **Documentation**: Generate static documentation sites

## Programmatic Access

You can also access the OpenAPI conversion function programmatically:

```typescript
import { convertToOpenApi } from 'pretendo';

// Your API config
const apiConfig = {
  resources: [
    // ...resource definitions
  ],
  options: {
    // ...configuration options
  }
};

// Convert to OpenAPI format
const openApiSpec = convertToOpenApi(apiConfig);
```

## What's Included

The OpenAPI specification includes:

- **Info**: Basic information about the API
- **Servers**: API server URLs
- **Paths**: All API endpoints including:
  - Resource CRUD operations
  - Relationship endpoints
  - Custom routes
  - Authentication endpoints
  - Admin endpoints
- **Components**:
  - **Schemas**: Data models for all resources
  - **Security Schemes**: Authentication methods

## Security Considerations

In production environments, it's recommended to either:

1. Disable the documentation endpoint:
   ```yaml
   options:
     docs:
       enabled: false
   ```

2. Or require authentication:
   ```yaml
   options:
     docs:
       requireAuth: true
   ```

When `requireAuth` is true, only users with the `admin` role can access the documentation.

## Next Steps

Learn about [Authentication](./authentication.md) in the next section.

**← [Custom Routes](./custom-routes.md) | [Table of Contents](./README.md) | [Next: Authentication →](./authentication.md)**