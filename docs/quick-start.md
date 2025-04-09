# 🚀 Quick Start

Get up and running with JSON REST Mock API in minutes.

**← [Installation](./installation.md) | [Table of Contents](./README.md) | [Next: API Schema →](./schema.md)**

## Creating Your First API

This guide will walk you through creating a simple blog API with users, posts, and comments.

### Step 1: Create an API Specification File

Create a file named `blog-api.yml` with the following content:

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

options:
  port: 3000
  latency:
    enabled: true
    min: 50
    max: 200
```

This specification defines three resources with their fields and relationships:
- `users` have many `posts` and `comments`
- `posts` belong to a `user` and have many `comments`
- `comments` belong to both a `user` and a `post`

### Step 2: Start the Server

Run the following command to start your API server:

```bash
# If installed globally
json-rest-mock-api start blog-api.yml

# If installed locally
npx json-rest-mock-api start blog-api.yml
```

You should see output indicating that the server is running:

```
🚀 JSON REST Mock API server is running on http://localhost:3000
```

### Step 3: Test Your API

Let's create some data and test our API endpoints:

#### Creating a User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com"
  }'
```

Response:

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```

#### Creating a Post

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "userId": 1
  }'
```

Response:

```json
{
  "id": 1,
  "title": "My First Post",
  "content": "This is the content of my first post.",
  "userId": 1,
  "createdAt": "2023-04-20T14:30:00Z"
}
```

#### Adding a Comment

```bash
curl -X POST http://localhost:3000/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great post!",
    "userId": 1,
    "postId": 1
  }'
```

#### Retrieving Posts with Author and Comments

```bash
curl "http://localhost:3000/posts?expand=user,comments.user"
```

Response:

```json
[
  {
    "id": 1,
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "userId": 1,
    "createdAt": "2023-04-20T14:30:00Z",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "comments": [
      {
        "id": 1,
        "content": "Great post!",
        "userId": 1,
        "postId": 1,
        "createdAt": "2023-04-20T14:35:00Z",
        "user": {
          "id": 1,
          "username": "johndoe",
          "email": "john@example.com"
        }
      }
    ]
  }
]
```

### Step 4: Try Advanced Features

#### Filtering

```bash
# Get posts with title containing "First"
curl "http://localhost:3000/posts?title_like=First"

# Get comments created after a specific date
curl "http://localhost:3000/comments?createdAt_after=2023-04-20"
```

#### Sorting

```bash
# Sort posts by creation date (newest first)
curl "http://localhost:3000/posts?sort=-createdAt"

# Sort users by username
curl "http://localhost:3000/users?sort=username"
```

#### Pagination

```bash
# Get the first page of posts with 5 items per page
curl "http://localhost:3000/posts?page=1&limit=5"
```

## Using JSON REST Mock API Programmatically

You can also use JSON REST Mock API in your JavaScript/TypeScript applications:

```typescript
import { createMockApi } from "json-rest-mock-api";

const config = {
  resources: [
    // Your resources definition here (same as in YAML)
  ],
  options: {
    port: 3000,
    // Other options
  }
};

async function startServer() {
  const result = await createMockApi(config);

  if (result.ok) {
    console.log(`Server running at: ${result.value.getUrl()}`);
    
    // When you're done:
    // await result.value.stop();
  } else {
    console.error("Failed to start server:", result.error);
  }
}

startServer();
```

## Adding Initial Data

You can provide initial data in your API specification:

```yaml
# Add this to your blog-api.yml
data:
  users:
    - id: 1
      username: "admin"
      email: "admin@example.com"
    
    - id: 2
      username: "user1"
      email: "user1@example.com"
  
  posts:
    - id: 1
      title: "Getting Started with JSON REST Mock API"
      content: "This is a beginner's guide to using JSON REST Mock API..."
      userId: 1
      createdAt: "2023-04-15T10:30:00Z"
```

## Next Steps

Now that you have a basic API running, you can:

1. Explore the [API Schema](./schema.md) documentation to define more complex resources
2. Learn about the [API Design Principles](./api-design.md) used in JSON REST Mock API
3. Discover advanced [Filtering](./filtering.md) and [Sorting](./sorting.md) options
4. Implement [Authentication](./authentication.md) for your API

**← [Installation](./installation.md) | [Table of Contents](./README.md) | [Next: API Schema →](./schema.md)**