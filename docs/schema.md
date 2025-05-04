# 📋 API Schema Reference

The heart of Pretendo is the schema definition. This document outlines how to structure your API specification to create resources, define relationships, and configure server behavior.

**← [Table of Contents](./README.md) | [Next: API Design Principles →](./api-design.md)**

## Schema Structure

Your API specification is defined in a YAML or JSON file with the following top-level structure:

```yaml
resources:   # Array of resource definitions
  - name: users
    # ... resource fields and configuration

  - name: posts
    # ... resource fields and configuration

options:     # Global API configuration 
  port: 3000
  # ... other options

routes:      # Custom API routes (optional)
  - path: "/hello"
    method: "get"
    type: "json"
    response: { "message": "Hello, world!" }
  
  - path: "/calculate"
    method: "post"
    type: "javascript"
    code: "// JavaScript code to run (placeholder for now)"

data:        # Optional initial data
  users:
    - id: 1
      name: "John Doe"
  posts:
    - id: 1
      title: "Hello World"
```

## Resource Definition

Each resource represents an entity in your API and will generate a full set of CRUD endpoints.

```yaml
- name: users                 # Resource name (plural recommended)
  primaryKey: id              # Primary key field (defaults to 'id')
  fields:                     # Fields definition
    - name: id                # Field name
      type: number            # Field type
    - name: username
      type: string
      required: true          # Required field
    - name: email
      type: string
      required: true
    - name: role
      type: string
      defaultValue: user      # Default value if not provided
    - name: createdAt
      type: date
      defaultValue: $now      # Special value for current timestamp
  relationships:              # Related resources
    - type: hasMany           # Relationship type
      resource: posts         # Related resource
      foreignKey: userId      # Foreign key field
  access:                     # Role-based access control
    list: ["admin"]           # Roles that can list users
    get: ["admin", "user"]    # Roles that can get individual users
    create: ["admin"]         # Roles that can create users
    update: ["admin"]         # Roles that can update users
    delete: ["admin"]         # Roles that can delete users
  ownedBy: userId             # Field linking to the owner (enables "owner" role)
```

### Field Types

The following field types are supported:

| Type | Description | Example Values |
|------|-------------|----------------|
| `string` | Text values | `"John Doe"`, `"user123"` |
| `number` | Numeric values | `42`, `3.14`, `-10` |
| `boolean` | Boolean values | `true`, `false` |
| `date` | Date/time values | ISO 8601 strings or `$now` |
| `object` | Nested objects | `{ street: "123 Main St", city: "New York" }` |
| `array` | Arrays of values | `["admin", "editor"]`, `[1, 2, 3]` |

### Field Properties

Each field can have the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | **Required**. Field name (in camelCase) |
| `type` | string | **Required**. Field data type |
| `required` | boolean | Whether the field is required for creation |
| `defaultValue` | any | Default value when not provided |
| `description` | string | Documentation for the field |
| `enum` | array | List of allowed values |
| `min` | number | Minimum value (for numbers) |
| `max` | number | Maximum value (for numbers) |
| `minLength` | number | Minimum length (for strings) |
| `maxLength` | number | Maximum length (for strings) |
| `pattern` | string | Regex pattern for validation (for strings) |

## Custom Routes

You can define custom API routes at the top level of your configuration:

```yaml
routes:
  - path: "/hello"
    method: "get"
    type: "json"
    response: { "message": "Hello, world!" }
  
  - path: "/calculate"
    method: "post"
    type: "javascript"
    code: "// JavaScript code to run"
    description: "A calculator endpoint"
```

Each custom route has the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | **Required**. Route path (with or without leading slash) |
| `method` | string | **Required**. HTTP method: "get", "post", "put", "patch", or "delete" |
| `type` | string | **Required**. Route type: "json" or "javascript" |
| `response` | any | For "json" type routes, the static response to return |
| `code` | string | For "javascript" type routes, the code to execute (placeholder for now) |
| `description` | string | Optional description for documentation purposes |

**Important**: Custom routes are registered before resource routes, which means they take precedence over resource routes with the same path pattern. For example, if you define a custom route `/users/:id` and also have a resource named `users`, the custom route will be used for requests to `/users/123` instead of the default resource endpoint.

### Route Types

#### JSON Routes

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

#### JavaScript Routes

JavaScript routes allow you to define custom logic. Currently, these routes act as placeholders that return "hello world" along with any request parameters and query parameters:

```yaml
- path: "/echo"
  method: "post"
  type: "javascript"
  code: "// In the future, this will execute custom JavaScript code"
```

When called, a JavaScript route returns a response like:

```json
{
  "message": "hello world",
  "params": {
    "id": "123",
    "filePath": "path/to/file.txt"
  },
  "query": {
    "sort": "name",
    "filter": "active"
  }
}
```

This is useful for debugging and testing your front-end while the actual custom logic implementation is in development.

### URL Parameters and Wildcards

Routes can include URL parameters and wildcards, following Express.js path patterns:

```yaml
# URL Parameters with :paramName syntax
- path: "/users/:id"
  method: "get"
  type: "json"
  response:
    user:
      id: "{id}"  # The {id} will be replaced with the actual parameter value
      name: "User {id}"

# Wildcards using Express 5 format with {*paramName}
- path: "/files/{*filePath}"
  method: "get"
  type: "json"
  response:
    message: "File handler"
    filePath: "{filePath}"
```

#### Parameter Substitution in JSON Responses

For JSON route types, you can include parameter placeholders in string values:

```yaml
- path: "/greet/:name"
  method: "get"
  type: "json"
  response:
    message: "Hello, {name}!"
    id: "{id}"  # Parameters not present in the URL will be left as-is
```

These placeholders will be replaced with the actual parameter values when the response is sent. Both `{paramName}` and `{:paramName}` formats are supported.

## Relationship Types

You can define how resources relate to each other using relationships:

```yaml
relationships:
  - type: hasMany
    resource: comments
    foreignKey: postId
```

The following relationship types are supported:

| Type | Description | Example |
|------|-------------|---------|
| `hasOne` | One-to-one relationship | A user has one profile |
| `hasMany` | One-to-many relationship | A post has many comments |
| `belongsTo` | Many-to-one/inverse relationship | A comment belongs to a post |
| `manyToMany` | Many-to-many relationship | Users can have many roles, roles can have many users |

For `manyToMany` relationships, you need to specify a join table:

```yaml
- type: manyToMany
  resource: tags
  foreignKey: postId
  targetKey: tagId
  through: post_tags
```

## Initial Data

You can provide initial data for your resources:

```yaml
data:
  users:
    - id: 1
      username: "admin"
      email: "admin@example.com"
      role: "admin"
    
    - id: 2
      username: "user1"
      email: "user1@example.com"
      role: "user"
  
  posts:
    - id: 1
      title: "Getting Started"
      content: "This is my first post!"
      userId: 1
```

## Full Example

Here's a complete example of an API schema for a blog application:

```yaml
resources:
  - name: users
    fields:
      - name: id
        type: number
      - name: username
        type: string
        required: true
      - name: email
        type: string
        required: true
      - name: password
        type: string
        required: true
      - name: role
        type: string
        defaultValue: user
      - name: createdAt
        type: date
        defaultValue: $now
    relationships:
      - type: hasMany
        resource: posts
        foreignKey: userId
      - type: hasMany
        resource: comments
        foreignKey: userId

  - name: posts
    fields:
      - name: id
        type: number
      - name: title
        type: string
        required: true
      - name: content
        type: string
        required: true
      - name: userId
        type: number
        required: true
      - name: published
        type: boolean
        defaultValue: false
      - name: createdAt
        type: date
        defaultValue: $now
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: userId
      - type: hasMany
        resource: comments
        foreignKey: postId
      - type: manyToMany
        resource: tags
        through: post_tags
        foreignKey: postId
        targetKey: tagId
    ownedBy: userId           # This field links to the owner's user ID
    access:                   # Role-based access control
      list: ["*"]             # Anyone authenticated can list posts
      get: ["*"]              # Anyone authenticated can view posts
      create: ["admin", "user"] # Admins and users can create posts
      update: ["admin", "owner"] # Only admin or post owner can update
      delete: ["admin", "owner"] # Only admin or post owner can delete

  - name: comments
    fields:
      - name: id
        type: number
      - name: content
        type: string
        required: true
      - name: userId
        type: number
        required: true
      - name: postId
        type: number
        required: true
      - name: createdAt
        type: date
        defaultValue: $now
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: userId
      - type: belongsTo
        resource: posts
        foreignKey: postId

  - name: tags
    fields:
      - name: id
        type: number
      - name: name
        type: string
        required: true
      - name: slug
        type: string
        required: true
    relationships:
      - type: manyToMany
        resource: posts
        through: post_tags
        foreignKey: tagId
        targetKey: postId

  - name: post_tags
    fields:
      - name: id
        type: number
      - name: postId
        type: number
        required: true
      - name: tagId
        type: number
        required: true

options:
  port: 3000
  corsEnabled: true
  auth:
    enabled: true     # Authentication must be enabled for role-based access
    users:
      - username: admin
        password: password
        role: admin   # This user has admin role
      - username: user1
        password: password
        role: user    # This user has regular user role
  latency:
    enabled: true
    min: 50
    max: 200

routes:
  - path: "/status"
    method: "get"
    type: "json"
    response:
      status: "online"
      version: "1.0.0"
      uptime: "3d 4h 12m"
    description: "API status endpoint"
  
  - path: "/metrics"
    method: "get"
    type: "json"
    response:
      users: 153
      posts: 864
      comments: 2145
    description: "API metrics endpoint"
  
  - path: "/webhook"
    method: "post"
    type: "javascript"
    code: "// Process incoming webhook data"
    description: "Webhook processor"

data:
  users:
    - id: 1
      username: admin
      email: admin@example.com
      password: password
      role: admin
    
    - id: 2
      username: user1
      email: user1@example.com
      password: password
      role: user
  
  tags:
    - id: 1
      name: TypeScript
      slug: typescript
    - id: 2
      name: JavaScript
      slug: javascript
    - id: 3
      name: API
      slug: api
```

## Next Steps

Now that you understand how to define your API schema, learn about the API design principles Pretendo follows in the next section.

**← [Table of Contents](./README.md) | [Next: API Design Principles →](./api-design.md)**