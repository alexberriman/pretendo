# 📋 API Schema Reference

The heart of JSON REST Mock API is the schema definition. This document outlines how to structure your API specification to create resources, define relationships, and configure server behavior.

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
    enabled: true
    users:
      - username: admin
        password: password
        role: admin
  latency:
    enabled: true
    min: 50
    max: 200

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

Now that you understand how to define your API schema, learn about the API design principles JSON REST Mock API follows in the next section.

**← [Table of Contents](./README.md) | [Next: API Design Principles →](./api-design.md)**