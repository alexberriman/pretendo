# 🔌 Database Adapters

Pretendo uses a pluggable adapter system to support different database backends while maintaining a consistent API. This design allows you to use the right storage solution for your specific needs - from simple file-based storage for development to more robust database systems for production.

**← [Persistence](./persistence.md) | [Table of Contents](./README.md)**

## Overview

The database adapter system provides:

1. **Pluggable Storage Backends**: Switch between storage implementations without changing your API code
2. **Consistent API**: All adapters implement the same interface, ensuring consistent behavior
3. **Simple Configuration**: Easily specify your preferred adapter through configuration
4. **Error Handling**: Consistent error handling with Result types
5. **Built-in Adapters**: Ready-to-use implementations for common scenarios

## Available Adapters

Pretendo includes the following built-in adapters:

| Adapter | Description | Best for |
|---------|-------------|----------|
| `json-file` | Stores data in a JSON file | Development, small datasets, persistence between restarts |
| `memory` | Stores data in memory only | Testing, ephemeral data, highest performance |

## Configuration

To configure the database adapter, use the `database` property in your API options:

```yaml
options:
  database:
    adapter: "json-file"  # or "memory"
    dbPath: "./my-database.json"  # Path for json-file adapter (optional)
    autoSave: true  # Whether to automatically save (optional)
    saveInterval: 5000  # Milliseconds between auto-saves (optional)
```

Or in JavaScript:

```javascript
const api = await createMockApi({
  spec: {
    resources: [ /* ... */ ],
    options: {
      // Other options...
    }
  },
  database: {
    adapter: "json-file",
    dbPath: "./my-database.json",
    autoSave: true,
    saveInterval: 5000
  },
  port: 3000
});
```

## Adapter Configuration Options

### JSON File Adapter (`json-file`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dbPath` | string | `"./db.json"` | File path where data will be stored |
| `autoSave` | boolean | `true` | Whether to automatically save changes |
| `saveInterval` | number | `5000` | Milliseconds between auto-saves |

### Memory Adapter (`memory`)

The memory adapter doesn't require any configuration options, but it accepts the same options as the JSON file adapter for compatibility.

## Creating Custom Adapters

You can implement custom adapters for additional storage backends like PostgreSQL, MongoDB, or DynamoDB by implementing the `DatabaseAdapter` interface.

### Implementing a Custom Adapter

1. Create a class that implements the `DatabaseAdapter` interface
2. Implement all required methods to interact with your storage backend
3. Register your adapter with Pretendo

Here's a skeleton example of a custom adapter:

```typescript
import { DatabaseAdapter, DbRecord, QueryOptions, Result, ok, err } from 'pretendo';

export class MyCustomAdapter implements DatabaseAdapter {
  constructor(options) {
    // Initialize your database connection
  }

  async initialize(initialData?: Record<string, DbRecord[]>): Promise<Result<void, Error>> {
    try {
      // Set up your database with initial data if provided
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(`Failed to initialize: ${error}`));
    }
  }

  async getResources(resource: string, query?: QueryOptions): Promise<Result<DbRecord[], Error>> {
    try {
      // Retrieve resources from your database
      // Apply filters, sorting, pagination from query
      return ok([]);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(`Failed to get resources: ${error}`));
    }
  }

  // Implement other required methods...
}
```

### Using a Custom Adapter

To use your custom adapter:

```javascript
import { createMockApi } from 'pretendo';
import { MyCustomAdapter } from './my-custom-adapter';

const api = await createMockApi({
  resources: [ /* ... */ ],
  options: {
    database: {
      adapter: new MyCustomAdapter({
        // Adapter-specific options
        connectionString: "postgres://username:password@localhost:5432/dbname"
      })
    }
  }
});
```

## Database Operations

All adapters provide a consistent set of database operations:

### Resource Operations

| Method | Description |
|--------|-------------|
| `getResources` | Retrieve a collection of resources with filtering, sorting, and pagination |
| `getResource` | Retrieve a single resource by ID |
| `createResource` | Create a new resource |
| `updateResource` | Replace an existing resource (full update) |
| `patchResource` | Partially update an existing resource |
| `deleteResource` | Delete a resource by ID |
| `findRelated` | Find resources related to another resource (relationships) |

### Database Management

| Method | Description |
|--------|-------------|
| `initialize` | Set up the database with optional initial data |
| `backup` | Create a backup of the current database state |
| `restore` | Restore the database from a backup |
| `reset` | Clear all data from the database |
| `getStats` | Get statistics about the database (record counts, etc.) |

## Error Handling

All database operations return a `Result` type that indicates success or failure:

```typescript
const result = await dbAdapter.getResource("users", 123);

if (result.ok) {
  // Success - use result.value
  const user = result.value;
  console.log(user);
} else {
  // Error - handle result.error
  console.error(`Error retrieving user: ${result.error.message}`);
}
```

## Database Transactions

Currently, the adapter interface doesn't include explicit transaction support. Operations are atomic at the individual resource level.

If you're implementing a custom adapter for a database system that supports transactions, you could extend the interface to provide transaction capabilities for your specific implementation.

## Performance Considerations

1. The `memory` adapter offers the fastest performance but doesn't persist data
2. The `json-file` adapter is suitable for development but may not handle large datasets efficiently
3. For production use cases with large datasets, consider implementing a custom adapter for a proper database system

## Next Steps

Now that you understand database adapters, learn about the [Programmatic API](./programmatic-api.md) to integrate Pretendo into your applications.

**← [Persistence](./persistence.md) | [Table of Contents](./README.md) | [Next: Programmatic API →](./programmatic-api.md)**