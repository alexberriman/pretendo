# 💾 Data Persistence

Pretendo provides several ways to persist and manage your mock data across server restarts and between different environments. The pluggable database adapter system enables connecting to different storage backends.

**← [Network Simulation](./network-simulation.md) | [Table of Contents](./README.md) | [Next: Database Adapters →](./database-adapters.md)**

## Persistence Options

The API supports multiple persistence strategies:

1. **In-memory**: Data exists only during server runtime (fast but not persisted)
2. **File-based**: Data is saved to a JSON file (default)
3. **Custom adapters**: Connect to any storage system like PostgreSQL, MongoDB, DynamoDB

## Database Adapter System

Pretendo uses a flexible adapter pattern to connect to different storage backends:

### Built-in Adapters

- **JSON File Adapter**: Stores data in a local JSON file
- **Memory Adapter**: Keeps data in memory only (non-persistent)

### Configuring Adapters

Configure your database adapter in your API configuration:

```yaml
options:
  database:
    adapter: "json-file"       # Built-in adapter type: "json-file" or "memory"
    dbPath: "./data/db.json"   # Path for file storage
    autoSave: true             # Auto-save on changes
    saveInterval: 5000         # Save every 5 seconds
```

For in-memory storage (useful for tests):

```yaml
options:
  database:
    adapter: "memory"
```

## File-Based Persistence

### Basic Configuration

Enable file-based persistence in your API configuration:

```yaml
options:
  database:
    adapter: "json-file"
    dbPath: "./data/db.json"
    autoSave: true
    saveInterval: 5000
```

### Manual Persistence Control

Control when data is saved/loaded through the admin API:

```http
# Save current state
POST /admin/save

# Load from file
POST /admin/load

# Reset to initial state (from your schema)
POST /admin/reset
```

## Initial Data

You can provide initial data in your API specification, which is used when the server starts for the first time or after a reset:

```yaml
# In your API specification
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
      createdAt: "2023-04-15T10:30:00Z"
```

## Data Snapshots

Create and restore data snapshots for testing different scenarios:

```yaml
options:
  database:
    adapter: "json-file"
    dbPath: "./data/db.json"
    snapshots:
      enabled: true
      directory: "./data/snapshots"
```

### Managing Snapshots

```http
# Create a snapshot
POST /admin/snapshots
Content-Type: application/json

{
  "name": "test-scenario-1",
  "description": "Initial setup with 2 users and 5 posts"
}

# List available snapshots
GET /admin/snapshots

# Restore a snapshot
POST /admin/snapshots/restore
Content-Type: application/json

{
  "name": "test-scenario-1"
}
```

## Auto-Generate Data

Configure automatic data generation for development and testing:

```yaml
options:
  generateData:
    enabled: true
    counts:
      users: 50
      posts: 200
      comments: 500
```

Each resource can have specific generation rules:

```yaml
resources:
  - name: users
    fields:
      - name: id
        type: number
      - name: username
        type: string
        generate:
          type: "username"
      - name: email
        type: string
        generate:
          type: "email"
          options:
            domain: "example.com"
      - name: role
        type: string
        generate:
          type: "pickOne"
          options:
            values: ["admin", "editor", "user"]
            weights: [1, 4, 15]
```

## Data Seeding

For more complex scenarios, you can use JavaScript functions to generate seed data:

```javascript
// seed.js
module.exports = {
  generate: (faker) => {
    const users = [];
    const posts = [];
    
    // Create 10 users
    for (let i = 0; i < 10; i++) {
      users.push({
        id: i + 1,
        username: faker.internet.userName(),
        email: faker.internet.email(),
        role: i === 0 ? 'admin' : 'user'
      });
    }
    
    // Create 50 posts
    for (let i = 0; i < 50; i++) {
      const userId = Math.floor(Math.random() * 10) + 1;
      posts.push({
        id: i + 1,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        userId: userId,
        createdAt: faker.date.past(2).toISOString()
      });
    }
    
    return { users, posts };
  }
};
```

Use the seed file with the API:

```bash
pretendo start api.yml --seed ./seed.js
```

## Data Constraints and Relationships

The persistence layer enforces data constraints and relationships:

1. **Primary keys**: Ensuring uniqueness
2. **Foreign keys**: Maintaining referential integrity
3. **Required fields**: Validating required data
4. **Cascading deletes**: Removing related data

### Configuring Constraints

```yaml
resources:
  - name: posts
    fields:
      - name: id
        type: number
      - name: userId
        type: number
        required: true
        references:
          resource: users
          field: id
          onDelete: cascade  # Options: cascade, restrict, nullify
```

## Working with Large Datasets

For large datasets, you can optimize performance:

```yaml
options:
  database:
    adapter: "json-file"
    dbPath: "./data/db.json"
    optimizations:
      indexedFields: ["userId", "category", "createdAt"]
      cacheSize: 1000
      lazyLoading: true
```

## Creating Custom Database Adapters

You can create custom database adapters to connect to different backend systems like PostgreSQL, MongoDB, etc.

### Database Adapter Interface

All database adapters must implement this interface:

```typescript
interface DatabaseAdapter {
  // Initialize the adapter
  initialize(): Promise<Result<void, Error>>;
  
  // Resource operations
  getResources(resource: string, query?: QueryOptions): Promise<Result<DbRecord[], Error>>;
  getResource(resource: string, id: string | number): Promise<Result<DbRecord | null, Error>>;
  createResource(resource: string, data: DbRecord): Promise<Result<DbRecord, Error>>;
  updateResource(resource: string, id: string | number, data: DbRecord): Promise<Result<DbRecord | null, Error>>;
  patchResource(resource: string, id: string | number, data: Partial<DbRecord>): Promise<Result<DbRecord | null, Error>>;
  deleteResource(resource: string, id: string | number): Promise<Result<boolean, Error>>;
  findRelated(resource: string, id: string | number, relationship: string, query?: QueryOptions): Promise<Result<DbRecord[], Error>>;
  
  // Database management
  backup(backupPath?: string): Promise<Result<string, Error>>;
  restore(backupPath: string): Promise<Result<void, Error>>;
  reset(): Promise<Result<void, Error>>;
  getStats(): Record<string, { count: number; lastModified: number }>;
}
```

### Example Custom Adapter

Here's an example adapter for PostgreSQL:

```javascript
// PostgreSQL adapter example
import { Pool } from 'pg';
import { DatabaseAdapter } from 'pretendo';

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;
  
  constructor(options) {
    this.pool = new Pool({
      host: options.host || 'localhost',
      port: options.port || 5432,
      database: options.database || 'pretendo',
      user: options.user || 'postgres',
      password: options.password || '',
    });
  }
  
  async initialize() {
    // Set up tables if they don't exist
    // ...
  }
  
  async getResources(resource, query) {
    // Implement query with filters, sorting, pagination
    // ...
  }
  
  async getResource(resource, id) {
    // Get a single resource by ID
    // ...
  }
  
  // ... implement other required methods
}
```

### Using a Custom Adapter

You can use your custom adapter in two ways:

1. **Class instantiation**:

```javascript
import { createMockApi } from 'pretendo';
import { PostgresAdapter } from './postgres-adapter.js';

const api = createMockApi({
  spec: {
    // Your API definition (resources, options, etc.)
  },
  database: new PostgresAdapter({
    host: 'localhost',
    port: 5432,
    database: 'my_api',
    user: 'user',
    password: 'password'
  })
});
```

2. **Configuration string** (for built-in adapters):

```javascript
const api = createMockApi({
  spec: {
    // Your API definition (resources, options, etc.)
  },
  database: {
    adapter: 'json-file',  // or 'memory'
    dbPath: './data/db.json'
  }
});
```

## Using in CI/CD Environments

For continuous integration and automated testing:

```bash
# Start with fresh data each time
pretendo start api.yml --reset

# Use a specific snapshot for tests
pretendo start api.yml --snapshot test-scenario-1

# Use in-memory mode for faster tests
pretendo start api.yml --database.adapter=memory
```

## Next Steps

Now that you understand data persistence, learn about the [Programmatic API](./programmatic-api.md) to integrate Pretendo into your applications.

**← [Network Simulation](./network-simulation.md) | [Table of Contents](./README.md) | [Next: Database Adapters →](./database-adapters.md)**