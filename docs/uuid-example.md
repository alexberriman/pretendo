# Using UUIDs in Pretendo

This guide explains how to use UUIDs (Universally Unique Identifiers) as primary keys in your Pretendo API.

**← [Table of Contents](./README.md) | [Schema Reference](./schema.md)**

## Why Use UUIDs?

UUIDs offer several benefits over sequential numeric IDs:

1. **Globally unique** - UUIDs are guaranteed to be unique across systems, eliminating conflicts when merging data
2. **Security** - UUIDs don't expose information about record counts or creation order
3. **Distributed systems** - UUIDs can be generated without a central coordinator
4. **No collisions** - UUIDs virtually eliminate the risk of ID collisions during batch imports or distributed operations

## Defining UUID Fields

To use UUIDs as primary keys, set the field type to `uuid` in your schema:

```yaml
resources:
  - name: users
    fields:
      - name: id
        type: uuid
      - name: name
        type: string
      # other fields...
```

## UUID Relationships

When using UUID primary keys, your foreign keys should also be UUID type:

```yaml
resources:
  - name: posts
    fields:
      - name: id
        type: uuid
      - name: title
        type: string
      - name: userId
        type: uuid
        required: true
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: userId
```

## Initial Data with UUIDs

You can specify UUIDs directly in your initial data:

```yaml
data:
  users:
    - id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
      name: John Doe
      email: john@example.com
    - id: "550e8400-e29b-41d4-a716-446655440000"
      name: Jane Smith
      email: jane@example.com
```

If no ID is provided when creating new records, Pretendo will automatically generate UUID v4 values for fields with the `uuid` type.

## Example API Schema

Here's a complete example of a blog API using UUIDs as primary keys:

```yaml
resources:
  # Users resource with UUID primary key
  - name: users
    fields:
      - name: id
        type: uuid
      - name: name
        type: string
      - name: email
        type: string
    relationships:
      - type: hasMany
        resource: posts
        foreignKey: userId

  # Posts resource with UUID primary key
  - name: posts
    fields:
      - name: id
        type: uuid
      - name: title
        type: string
      - name: content
        type: string
      - name: userId
        type: uuid
        required: true
      - name: createdAt
        type: date
        defaultValue: $now
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: userId
```

## Running the Example

You can try the UUID example API included with Pretendo:

```bash
npx pretendo start repo://uuid-api.yml
```

Or if you've installed Pretendo locally:

```bash
npm run dev:uuid
```

This will start a server with resources using UUID primary keys.

## Notes on UUID Implementation

- Pretendo uses UUID v4 for automatic ID generation
- The system automatically detects if a resource uses UUID keys by examining existing records
- UUIDs are stored as strings in the database
- For resources with mixed ID types, Pretendo will preserve the original type (numeric or UUID)

**← [Table of Contents](./README.md) | [Schema Reference](./schema.md)**