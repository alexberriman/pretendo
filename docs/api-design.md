# 🏗️ API Design Principles

This document outlines the REST API design principles that JSON REST Mock API adheres to. These conventions ensure a consistent, predictable, and user-friendly API experience.

**← [API Schema](./schema.md) | [Table of Contents](./README.md) | [Next: Filtering →](./filtering.md)**

## Core Principles

The API design is based on the guidelines from [GitHub: alexberriman/rest-api-design](https://github.com/alexberriman/rest-api-design) and follows RESTful best practices.

### Resource Naming

- **Use plural nouns** for resource collections
  - ✅ `/users`, `/posts`, `/comments`
  - ❌ `/user`, `/post`, `/comment`

- **Use camelCase** for field and property names
  - ✅ `firstName`, `createdAt`, `postId`
  - ❌ `first_name`, `created_at`, `post_id`

- **Use American English spelling**
  - ✅ `color`, `authorization`, `favorite`
  - ❌ `colour`, `authorisation`, `favourite`

### URL Structure

- **Base pattern**: `/{resource}/{id}`
  - `GET /posts` - List all posts
  - `GET /posts/123` - Get a specific post

- **Nested resources**: `/{resource}/{id}/{relation}`
  - `GET /posts/123/comments` - Get comments for post 123
  - `GET /users/456/posts` - Get posts by user 456

- **Use singular for 1:1 relations**, plural for 1:many
  - `GET /users/123/profile` - Get the user's profile (1:1)
  - `GET /posts/123/comments` - Get post comments (1:many)

## HTTP Methods

| Method | Purpose | Example | Response |
|--------|---------|---------|----------|
| `GET` | Retrieve resources | `GET /posts` | 200 OK with resources |
| `POST` | Create new resource | `POST /posts` | 201 Created with new resource |
| `PUT` | Replace entire resource | `PUT /posts/123` | 200 OK with updated resource |
| `PATCH` | Partially update resource | `PATCH /posts/123` | 200 OK with updated resource |
| `DELETE` | Remove resource | `DELETE /posts/123` | 204 No Content |

## Response Status Codes

| Code | Purpose | Example |
|------|---------|---------|
| `200` | Successful operation | GET, PUT, PATCH requests |
| `201` | Resource created | POST requests |
| `204` | Success with no content | DELETE requests |
| `400` | Bad request (validation error) | Invalid input data |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Authenticated but insufficient permissions |
| `404` | Resource not found | Resource ID doesn't exist |
| `422` | Unprocessable entity | Business rule validation errors |
| `500` | Server error | Internal server error |

## Error Handling

Error responses follow a consistent format:

```json
[
  {
    "code": "VALIDATION_ERROR",
    "message": "Username is required",
    "property": "username"
  }
]
```

Error response objects include:
- `code`: Machine-readable error code
- `message`: Human-readable error description
- `property`: Optional field that caused the error

## Filtering and Querying

- Use query parameters for filtering collections
  - `GET /posts?published=true&category=technology`
  - `GET /users?role=admin&createdAfter=2023-01-01`

- Filter operators are available for complex queries
  - `?field=value` - Equality
  - `?field_gt=value` - Greater than
  - `?field_gte=value` - Greater than or equal
  - `?field_lt=value` - Less than
  - `?field_lte=value` - Less than or equal
  - `?field_ne=value` - Not equal
  - `?field_like=value` - Contains substring
  - `?field_in=value1,value2` - In list of values

## Sorting

- Use the `sort` query parameter
  - `?sort=firstName` - Sort by firstName ascending
  - `?sort=-createdAt` - Sort by createdAt descending
  - `?sort=lastName,firstName` - Sort by multiple fields

## Pagination

Two pagination methods are supported:

1. **Page-based pagination**
   - `?page=2&limit=10`
   - Returns metadata in response headers
   - `X-Total-Count`, `X-Total-Pages`, `X-Page`, `X-Limit`

2. **Cursor-based pagination**
   - `?after=xyz&limit=10`
   - Better for large datasets
   - Returns `X-Next-Cursor` header for next page

## Selection and Expansion

- **Field selection** to request only specific fields
  - `?fields=id,title,author`

- **Relationship expansion** to include related resources
  - `?expand=author,comments`
  - `?expand=author,comments.user`

## Date Handling

- All dates use ISO 8601 format
  - `2023-04-20T14:30:00Z` (UTC)
  - `2023-04-20T10:30:00-04:00` (with timezone)

- Date filtering supported with specialized operators
  - `?createdAt_after=2023-01-01`
  - `?createdAt_between=2023-01-01,2023-01-31`

## Best Practices

- **Avoid data envelopes**: Return arrays directly for collections
- **Consistent responses**: Always use the same structure for the same resources
- **Return modified resources**: Send back the modified object after updates
- **Use HTTP headers** for metadata rather than in the response body
- **Limit nesting depth** for relationship expansions (max 3 levels recommended)
- **Use semantic error codes** that describe the specific problem

## Next Steps

Now that you understand the API design principles, learn about the [Filtering](./filtering.md) capabilities in the next section.

**← [API Schema](./schema.md) | [Table of Contents](./README.md) | [Next: Filtering →](./filtering.md)**