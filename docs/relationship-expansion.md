# 🔗 Relationship Expansion

Relationship expansion allows you to include related resources in your API responses, reducing the need for multiple requests.

**← [Field Selection](./field-selection.md) | [Table of Contents](./README.md) | [Next: Configuration →](./configuration.md)**

## Basic Relationship Expansion

To include related resources in your API response, use the `expand` query parameter:

```
GET /posts?expand=author
```

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with Pretendo",
    "content": "This is a beginner's guide...",
    "userId": 1,
    "createdAt": "2023-04-15T10:30:00Z",
    "author": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "admin",
      "createdAt": "2023-04-10T08:15:00Z"
    }
  }
]
```

## Multiple Relationship Expansion

You can expand multiple relationships by providing a comma-separated list:

```
GET /posts?expand=author,comments
```

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with Pretendo",
    "content": "This is a beginner's guide...",
    "userId": 1,
    "createdAt": "2023-04-15T10:30:00Z",
    "author": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "comments": [
      {
        "id": 1,
        "content": "Great post!",
        "userId": 2,
        "postId": 1,
        "createdAt": "2023-04-15T11:00:00Z"
      },
      {
        "id": 2,
        "content": "Thanks for sharing!",
        "userId": 3,
        "postId": 1,
        "createdAt": "2023-04-15T12:30:00Z"
      }
    ]
  }
]
```

## Nested Relationship Expansion

You can expand nested relationships using dot notation:

```
GET /posts?expand=author.profile,comments.user
```

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with Pretendo",
    "content": "This is a beginner's guide...",
    "userId": 1,
    "createdAt": "2023-04-15T10:30:00Z",
    "author": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "profile": {
        "id": 1,
        "userId": 1,
        "bio": "Full-stack developer",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    },
    "comments": [
      {
        "id": 1,
        "content": "Great post!",
        "userId": 2,
        "postId": 1,
        "createdAt": "2023-04-15T11:00:00Z",
        "user": {
          "id": 2,
          "username": "janedoe",
          "email": "jane@example.com"
        }
      }
    ]
  }
]
```

## Selective Field Expansion

You can specify which fields to include in expanded relationships using parentheses:

```
GET /posts?expand=author(id,username),comments(id,content,createdAt)
```

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with Pretendo",
    "content": "This is a beginner's guide...",
    "userId": 1,
    "createdAt": "2023-04-15T10:30:00Z",
    "author": {
      "id": 1,
      "username": "johndoe"
    },
    "comments": [
      {
        "id": 1,
        "content": "Great post!",
        "createdAt": "2023-04-15T11:00:00Z"
      },
      {
        "id": 2,
        "content": "Thanks for sharing!",
        "createdAt": "2023-04-15T12:30:00Z"
      }
    ]
  }
]
```

## Combining with Filtering and Sorting

You can combine relationship expansion with filtering and sorting of the expanded resources:

```
GET /posts?expand=comments{sort=-createdAt&limit=5}
```

This expands comments for each post, sorts them by creation date in descending order, and limits to 5 comments per post.

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with Pretendo",
    "content": "This is a beginner's guide...",
    "userId": 1,
    "createdAt": "2023-04-15T10:30:00Z",
    "comments": [
      {
        "id": 5,
        "content": "Just tried this, works great!",
        "userId": 4,
        "postId": 1,
        "createdAt": "2023-04-18T14:20:00Z"
      },
      // ... more comments, sorted by createdAt desc, limited to 5
    ]
  }
]
```

## Handling Many-to-Many Relationships

Many-to-many relationships can be expanded in both directions:

```
GET /posts?expand=tags
```

```
GET /tags?expand=posts
```

## Circular Expansion

Pretendo automatically handles circular expansion to prevent infinite recursion:

```
GET /users?expand=posts.author
```

In this case, when expanding posts and then author, the API won't recursively expand the author's posts again.

## Relationship Count Without Expansion

If you only need the count of related resources, use the `_count` keyword:

```
GET /posts?expand=_count.comments
```

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with Pretendo",
    "content": "This is a beginner's guide...",
    "userId": 1,
    "createdAt": "2023-04-15T10:30:00Z",
    "_count": {
      "comments": 8
    }
  }
]
```

## Performance Considerations

Relationship expansion can significantly increase response size and database load. Consider these best practices:

1. **Limit expansion depth**: Avoid deep nesting of relationships (> 3 levels)
2. **Use selective expansion**: Only expand relationships you need
3. **Combine with field selection**: Use field selection to limit the fields included in expanded relationships
4. **Paginate expanded collections**: For resources with many related items
5. **Use counts when possible**: If you only need to know how many related items exist

## Use Cases

### Article Page

Retrieve a post with its author and recent comments:

```
GET /posts/123?expand=author,comments{sort=-createdAt&limit=10}
```

### User Profile

Retrieve a user with their profile information and recent posts:

```
GET /users/456?expand=profile,posts{sort=-createdAt&limit=5}
```

### Product Detail

Retrieve a product with its category, tags, and related products:

```
GET /products/789?expand=category,tags,relatedProducts
```

## Next Steps

Now that you understand relationship expansion, learn about [Configuration](./configuration.md) options for your API.

**← [Field Selection](./field-selection.md) | [Table of Contents](./README.md) | [Next: Configuration →](./configuration.md)**