# 💾 Data Persistence

Pretendo provides several ways to persist and manage your mock data across server restarts and between different environments.

**← [Network Simulation](./network-simulation.md) | [Table of Contents](./README.md) | [Next: Programmatic API →](./programmatic-api.md)**

## Persistence Options

The API supports multiple persistence strategies:

1. **In-memory**: Data exists only during server runtime (default)
2. **File-based**: Data is saved to a JSON file
3. **Local storage**: Data is stored in the browser's localStorage (when used in browser environments)
4. **Custom storage**: Implement your own storage solution

## File-Based Persistence

### Basic Configuration

Enable file-based persistence in your API configuration:

```yaml
options:
  persistence:
    enabled: true
    type: "file"
    file: "./data/db.json"  # Path to data file
    autoSave: true          # Auto-save on changes
    autoSaveInterval: 5000  # Save every 5 seconds
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
  persistence:
    enabled: true
    type: "file"
    file: "./data/db.json"
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
  persistence:
    enabled: true
    type: "file"
    file: "./data/db.json"
    optimizations:
      indexedFields: ["userId", "category", "createdAt"]
      cacheSize: 1000
      lazyLoading: true
```

## Sharing Data Between Team Members

To share the same mock API state across a team:

1. **Version control**: Commit your data file to your repository
2. **Snapshots**: Create and share named snapshots
3. **Seed scripts**: Use deterministic seed scripts

## Custom Persistence Adapters

You can implement custom persistence adapters for special needs:

```javascript
// MongoDB persistence adapter example
const { createMockApi, createAdapter } = require('pretendo');

const mongoAdapter = createAdapter({
  async load() {
    // Load data from MongoDB
  },
  
  async save(data) {
    // Save data to MongoDB
  },
  
  async reset() {
    // Reset to initial state
  }
});

createMockApi({
  // ... your API configuration
  options: {
    persistence: {
      adapter: mongoAdapter
    }
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
pretendo start api.yml --no-persistence
```

## Next Steps

Now that you understand data persistence, learn about the [Programmatic API](./programmatic-api.md) to integrate Pretendo into your applications.

**← [Network Simulation](./network-simulation.md) | [Table of Contents](./README.md) | [Next: Programmatic API →](./programmatic-api.md)**