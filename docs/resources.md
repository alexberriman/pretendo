# 📦 Resources

Resources are the core building blocks of your API. This document explains how to define, configure, and work with resources in Pretendo.

**← [API Design](./api-design.md) | [Table of Contents](./README.md) | [Next: Relationships →](./relationships.md)**

## What is a Resource?

In REST API terminology, a resource is a specific type of object or entity that your API exposes. Examples of resources include users, products, orders, posts, comments, etc. Each resource typically corresponds to a database table in a real backend.

In Pretendo, resources:
- Have a defined schema with fields and types
- Support full CRUD (Create, Read, Update, Delete) operations
- Can have relationships with other resources
- Can be filtered, sorted, and paginated

## Defining Resources

Resources are defined in your API specification file under the `resources` array:

```yaml
resources:
  - name: products
    primaryKey: id
    fields:
      - name: id
        type: number
      - name: name
        type: string
        required: true
      - name: price
        type: number
        required: true
      # ... more fields
    relationships:
      # ... relationships definition
```

### Resource Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | string | **Required**. The name of the resource (plural recommended) | - |
| `primaryKey` | string | The field to use as the primary key | `"id"` |
| `fields` | array | **Required**. Array of field definitions | - |
| `relationships` | array | Array of relationship definitions | `[]` |
| `endpoints` | object | Configuration for specific endpoints | All enabled |
| `access` | object | Access control configuration | No restrictions |

## Field Definitions

Each resource must have at least one field, and fields are defined as an array of objects:

```yaml
fields:
  - name: id
    type: number
  - name: username
    type: string
    required: true
    minLength: 3
    maxLength: 50
  - name: email
    type: string
    required: true
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
```

### Field Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | string | **Required**. Field name (in camelCase) | - |
| `type` | string | **Required**. Field data type | - |
| `required` | boolean | Whether the field is required for creation | `false` |
| `defaultValue` | any | Default value when not provided | `null` |
| `description` | string | Documentation for the field | - |
| `enum` | array | List of allowed values | - |
| `min` | number | Minimum value (for numbers) | - |
| `max` | number | Maximum value (for numbers) | - |
| `minLength` | number | Minimum length (for strings) | - |
| `maxLength` | number | Maximum length (for strings) | - |
| `pattern` | string | Regex pattern for validation (for strings) | - |
| `unique` | boolean | Whether the field must be unique across records | `false` |

### Supported Field Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `string` | Text values | `"John Doe"`, `"user123"` |
| `number` | Numeric values | `42`, `3.14`, `-10` |
| `boolean` | Boolean values | `true`, `false` |
| `date` | Date/time values | ISO 8601 strings or `$now` |
| `object` | Nested objects | `{ street: "123 Main St", city: "New York" }` |
| `array` | Arrays of values | `["admin", "editor"]`, `[1, 2, 3]` |
| `uuid` | UUID values | `"550e8400-e29b-41d4-a716-446655440000"` |

### Special Field Values

You can use special field values that are computed dynamically at runtime by using them as `defaultValue`. These help you create more realistic and functional APIs with minimal configuration:

| Special Value | Description | Use Case |
|---------------|-------------|----------|
| `$now` | Current date/time | Timestamps like `createdAt` and `updatedAt` |
| `$uuid` | Random UUID (v4) | Generate unique identifiers |
| `$increment` | Auto-incrementing number | Sequence numbers, order numbers |
| `$userId` | Current user's ID | Record ownership tracking |
| `$hash` | Hash for sensitive data | Password storage |

#### Behavior Details

Special fields behave differently depending on the operation context:

- **On Create**: All special fields are processed if the field value is not explicitly provided
- **On Update/Patch**:
  - `$now` fields are updated only if they represent `updatedAt` timestamps
  - Password fields marked with `$hash` are rehashed if a new value is provided
  - Other special fields generally don't recompute on updates unless specifically needed

#### Examples

```yaml
fields:
  - name: id
    type: uuid  # UUID primary key
  - name: title
    type: string
    required: true
  - name: createdAt
    type: date
    defaultValue: $now  # Set to current timestamp on creation
  - name: updatedAt
    type: date
    defaultValue: $now  # Updated automatically on creation and updates
  - name: password
    type: string 
    defaultValue: $hash  # Automatically hashed for security
  - name: authorId
    type: number
    defaultValue: $userId  # Set to current user's ID
  - name: sequenceNumber
    type: number
    defaultValue: $increment  # Auto-increments based on existing values
```

## Resource Endpoints

For each resource, Pretendo automatically generates these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{resource}` | GET | List all resources (paginated) |
| `/{resource}/{id}` | GET | Get a specific resource by ID |
| `/{resource}` | POST | Create a new resource |
| `/{resource}/{id}` | PUT | Replace an entire resource |
| `/{resource}/{id}` | PATCH | Update part of a resource |
| `/{resource}/{id}` | DELETE | Delete a resource |

### Customizing Endpoints

You can enable or disable specific endpoints for a resource:

```yaml
- name: users
  endpoints:
    list: true
    get: true
    create: true
    update: true
    delete: false  # Disable deletion of users
```

## Polymorphic Resources

Pretendo supports polymorphic resources (where one resource can be of different types):

```yaml
- name: notifications
  fields:
    - name: id
      type: number
    - name: type
      type: string
      enum: ["email", "sms", "push"]
    - name: recipient
      type: string
    - name: content
      type: object
      polymorphic: true
      typeField: "type"
      schemas:
        email:
          subject: string
          body: string
        sms:
          message: string
        push:
          title: string
          body: string
          deepLink: string
```

## Example Resource Definitions

### User Resource

```yaml
- name: users
  fields:
    - name: id
      type: number
    - name: username
      type: string
      required: true
      minLength: 3
    - name: email
      type: string
      required: true
    - name: role
      type: string
      enum: ["user", "admin", "editor"]
      defaultValue: "user"
    - name: createdAt
      type: date
      defaultValue: $now
  relationships:
    - type: hasMany
      resource: posts
      foreignKey: userId
```

### Product Resource

```yaml
- name: products
  fields:
    - name: id
      type: number
    - name: name
      type: string
      required: true
    - name: description
      type: string
    - name: price
      type: number
      required: true
      min: 0
    - name: category
      type: string
      required: true
    - name: tags
      type: array
    - name: inStock
      type: boolean
      defaultValue: true
    - name: attributes
      type: object
  relationships:
    - type: belongsTo
      resource: categories
      foreignKey: categoryId
```

## Next Steps

Now that you understand how to define resources, learn about [Relationships](./relationships.md) between resources in the next section.

**← [API Design](./api-design.md) | [Table of Contents](./README.md) | [Next: Relationships →](./relationships.md)**