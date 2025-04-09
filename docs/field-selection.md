# 🔍 Field Selection

Field selection allows you to request only the specific data you need from your API, optimizing response size and improving performance.

**← [Pagination](./pagination.md) | [Table of Contents](./README.md) | [Next: Relationship Expansion →](./relationship-expansion.md)**

## Basic Field Selection

To select specific fields for your API response, use the `fields` query parameter with a comma-separated list of field names:

```
GET /users?fields=id,username,email
```

This returns only the specified fields for each user:

```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  {
    "id": 2,
    "username": "janedoe",
    "email": "jane@example.com"
  }
]
```

## Field Selection with Related Resources

You can select fields from expanded related resources by using dot notation:

```
GET /posts?expand=author&fields=id,title,author.username
```

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with JSON REST Mock API",
    "author": {
      "username": "johndoe"
    }
  },
  {
    "id": 2,
    "title": "Advanced Features",
    "author": {
      "username": "janedoe"
    }
  }
]
```

## Selective Expansion

You can also directly specify which fields to include in an expanded relationship using parentheses:

```
GET /posts?expand=author(id,username),comments(id,content)
```

Response:

```json
[
  {
    "id": 1,
    "title": "Getting Started with JSON REST Mock API",
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
        "content": "Great post!"
      },
      {
        "id": 2,
        "content": "Thanks for sharing!"
      }
    ]
  }
]
```

## Nested Field Selection

For fields of type `object`, you can select specific nested properties:

```
GET /products?fields=id,name,attributes.color,attributes.size
```

Response:

```json
[
  {
    "id": 1,
    "name": "T-Shirt",
    "attributes": {
      "color": "blue",
      "size": "M"
    }
  }
]
```

## Excluding Fields

You can exclude specific fields by prefixing them with a minus sign:

```
GET /users?fields=-password,-securityQuestions
```

This returns all fields except the excluded ones.

## Combining with Other Query Parameters

Field selection works alongside other query parameters:

```
GET /users?role=admin&sort=username&fields=id,username,email&page=1&limit=10
```

This retrieves the first page of admin users, sorted by username, with only id, username, and email fields.

## Performance Benefits

Field selection offers several performance advantages:

1. **Reduced payload size**: Smaller responses mean faster data transfer
2. **Decreased serialization time**: Less data to process on the server
3. **Minimized client-side processing**: Only handle the data you need
4. **Reduced bandwidth usage**: Important for mobile applications

## Use Cases

### Mobile Applications

Mobile apps often need to minimize data transfer:

```
GET /posts?fields=id,title,summary,imageUrl
```

### Dashboard Widgets

Different widgets need different data subsets:

```
GET /users?fields=id,username,lastLoginDate
GET /users?fields=id,username,activePosts
```

### Performance Optimization

For lists that show minimal information:

```
GET /products?fields=id,name,price,thumbnailUrl
```

## Implementation Details

The field selection works by:

1. Parsing the `fields` parameter into a list of requested fields
2. Applying field selection to each resource in the response
3. Recursively handling nested selection for expanded relationships
4. Removing any fields not specified in the selection

## Best Practices

- **Request only what you need**: Always specify the fields your application actually uses
- **Balance requests**: Sometimes one request with multiple fields is better than multiple smaller requests
- **Document field usage**: Keep track of which fields each part of your application uses
- **Consider defaults**: For common use cases, consider setting default field selections in your API config

## Next Steps

Now that you understand field selection, learn about [Relationship Expansion](./relationship-expansion.md) to include related resources in your responses.

**← [Pagination](./pagination.md) | [Table of Contents](./README.md) | [Next: Relationship Expansion →](./relationship-expansion.md)**