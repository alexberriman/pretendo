# 🪄 Special Fields Reference

Pretendo supports special field values that are computed dynamically at runtime. These special fields help you create more realistic and functional APIs with minimal effort.

**← [Table of Contents](./README.md) | [Next: API Design Principles →](./api-design.md)**

## Supported Special Fields

Special fields are defined in your resource configuration using the `defaultValue` property with special marker values. When a record is created or updated, the system processes these markers and replaces them with computed values.

### Available Special Field Values

| Special Value | Description | Example Use Case |
|---------------|-------------|-----------------|
| `$now` | Current date/time | Timestamps like `createdAt` and `updatedAt` |
| `$uuid` | Random UUID (v4) | Generate unique identifiers |
| `$increment` | Auto-incrementing number | Sequence numbers, order numbers |
| `$userId` | Current user's ID | Record ownership tracking |
| `$hash` | Hash for sensitive data | Password storage |

## Usage Examples

### Timestamps with `$now`

```yaml
resources:
  - name: posts
    fields:
      - name: id
        type: number
      - name: title
        type: string
      - name: content
        type: string
      - name: createdAt
        type: date
        defaultValue: $now  # Set to current timestamp on creation
      - name: updatedAt
        type: date
        defaultValue: $now  # Updated automatically on creation and updates
```

The `createdAt` field will be automatically set when a record is created. The `updatedAt` field will be updated both on creation and whenever the record is updated.

### UUIDs with `$uuid`

```yaml
resources:
  - name: orders
    fields:
      - name: id
        type: uuid         # Use UUID type for the primary key
      - name: orderNumber
        type: string
        defaultValue: $uuid # Generate UUID for order number
      - name: customerName
        type: string
```

### Auto-increment with `$increment`

```yaml
resources:
  - name: invoices
    fields:
      - name: id
        type: number
      - name: invoiceNumber
        type: number
        defaultValue: $increment  # Auto-increments based on existing values
      - name: customerName
        type: string
```

The `invoiceNumber` will automatically increment based on the highest existing value in that field.

### User ID with `$userId`

```yaml
resources:
  - name: posts
    fields:
      - name: id
        type: number
      - name: title
        type: string
      - name: authorId
        type: number
        defaultValue: $userId  # Automatically set to current user's ID
    ownedBy: authorId  # For RBAC with "owner" role
```

This is particularly useful when combined with role-based access control (RBAC) and the `ownedBy` property.

### Password Hashing with `$hash`

```yaml
resources:
  - name: users
    fields:
      - name: id
        type: number
      - name: username
        type: string
      - name: password
        type: string
        defaultValue: $hash  # Will hash the password value on create/update
```

The password value will be automatically hashed using SHA-256 when creating or updating a user.

## Behavior Details

Special fields behave differently depending on the operation context:

- **On Create**: All special fields are processed if the field value is not explicitly provided
- **On Update/Patch**:
  - `$now` fields are updated only if they represent `updatedAt` timestamps
  - Password fields marked with `$hash` are rehashed if a new value is provided
  - Other special fields generally don't recompute on updates unless specifically needed

## Advanced Configuration Example

Here's a more comprehensive example showing multiple special fields in use:

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
        defaultValue: $hash  # Auto-hash passwords
      - name: createdAt
        type: date
        defaultValue: $now
      - name: updatedAt
        type: date
        defaultValue: $now
      - name: lastLoginAt
        type: date

  - name: posts
    fields:
      - name: id
        type: uuid         # UUID primary key
      - name: title
        type: string
        required: true
      - name: content
        type: string
        required: true
      - name: authorId
        type: number
        defaultValue: $userId
      - name: sequenceNumber
        type: number
        defaultValue: $increment
      - name: createdAt
        type: date
        defaultValue: $now
      - name: updatedAt
        type: date
        defaultValue: $now
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: authorId
    ownedBy: authorId
```

## Implementation Notes

- Password hashing currently uses SHA-256, which is sufficient for demonstration purposes but not recommended for production systems. In a real application, you would use a stronger algorithm like bcrypt or Argon2.
- Special fields add computed functionality without requiring custom code in your API definition.
- If you explicitly provide a value for a field with a special field marker, your value takes precedence (except for `updatedAt` fields which always update on record changes).

---

**← [Table of Contents](./README.md) | [Next: API Design Principles →](./api-design.md)**