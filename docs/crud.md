# 🔄 CRUD Operations

Pretendo automatically generates a complete set of CRUD (Create, Read, Update, Delete) endpoints for each resource you define in your schema.

**← [Resources](./resources.md) | [Table of Contents](./README.md) | [Next: Filtering →](./filtering.md)**

## Understanding CRUD Operations

Each resource in your API supports the following standard REST operations:

| Operation | HTTP Method | Endpoint | Description |
|-----------|-------------|----------|-------------|
| Create | POST | `/{resource}` | Create a new resource |
| Read (List) | GET | `/{resource}` | List resources (with pagination, filtering, sorting) |
| Read (Single) | GET | `/{resource}/{id}` | Get a specific resource by ID |
| Update (Full) | PUT | `/{resource}/{id}` | Replace an entire resource |
| Update (Partial) | PATCH | `/{resource}/{id}` | Update part of a resource |
| Delete | DELETE | `/{resource}/{id}` | Delete a resource |

## Creating Resources

To create a new resource, send a POST request to the resource endpoint:

```http
POST /users
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user"
}
```

### Response

On successful creation, the server responds with:
- **Status Code**: `201 Created`
- **Headers**: 
  - `Location: /users/1` (URL of the created resource)
  - `Content-Type: application/json`
- **Body**: The created resource with an assigned ID

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2023-04-20T14:30:00Z"
}
```

### Validation

If the request doesn't meet the schema requirements:
- **Status Code**: `400 Bad Request`
- **Body**: Validation errors

```json
[
  {
    "code": "REQUIRED_FIELD",
    "message": "Field 'username' is required",
    "property": "username"
  },
  {
    "code": "INVALID_FORMAT",
    "message": "Invalid email format",
    "property": "email"
  }
]
```

## Reading Resources

### Listing Resources

To retrieve a list of resources, send a GET request to the resource endpoint:

```http
GET /users
```

#### Response

```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-04-20T14:30:00Z"
  },
  {
    "id": 2,
    "username": "janedoe",
    "email": "jane@example.com",
    "role": "admin",
    "createdAt": "2023-04-21T10:15:00Z"
  }
]
```

#### Response Headers for Pagination

When retrieving a collection, pagination headers are included:

```
X-Total-Count: 42
X-Total-Pages: 5
X-Page: 1
X-Limit: 10
Link: <http://localhost:3000/users?page=1&limit=10>; rel="first", <http://localhost:3000/users?page=2&limit=10>; rel="next", <http://localhost:3000/users?page=5&limit=10>; rel="last"
```

See [Pagination](./pagination.md) for more details.

### Getting a Single Resource

To retrieve a specific resource, send a GET request with the resource ID:

```http
GET /users/1
```

#### Response

If the resource exists:
- **Status Code**: `200 OK`
- **Body**: The requested resource

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2023-04-20T14:30:00Z"
}
```

If the resource doesn't exist:
- **Status Code**: `404 Not Found`
- **Body**: Error message

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "User with id 1 not found"
}
```

## Updating Resources

### Full Update (PUT)

To completely replace a resource, send a PUT request:

```http
PUT /users/1
Content-Type: application/json

{
  "username": "johnsmith",
  "email": "john.smith@example.com",
  "role": "editor"
}
```

#### Response

On successful update:
- **Status Code**: `200 OK`
- **Body**: The updated resource

```json
{
  "id": 1,
  "username": "johnsmith",
  "email": "john.smith@example.com",
  "role": "editor",
  "createdAt": "2023-04-20T14:30:00Z",
  "updatedAt": "2023-04-22T09:45:00Z"
}
```

### Partial Update (PATCH)

To update only specific fields, send a PATCH request:

```http
PATCH /users/1
Content-Type: application/json

{
  "role": "admin"
}
```

#### Response

On successful update:
- **Status Code**: `200 OK`
- **Body**: The updated resource

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "admin",
  "createdAt": "2023-04-20T14:30:00Z",
  "updatedAt": "2023-04-22T09:45:00Z"
}
```

## Deleting Resources

To delete a resource, send a DELETE request:

```http
DELETE /users/1
```

### Response

On successful deletion:
- **Status Code**: `204 No Content`
- **Body**: Empty

If the resource doesn't exist:
- **Status Code**: `404 Not Found`
- **Body**: Error message

## Bulk Operations

Pretendo also supports bulk operations for creating, updating, and deleting multiple resources at once.

### Bulk Create

```http
POST /users/bulk
Content-Type: application/json

[
  {
    "username": "user1",
    "email": "user1@example.com"
  },
  {
    "username": "user2",
    "email": "user2@example.com"
  }
]
```

### Bulk Update

```http
PATCH /users/bulk
Content-Type: application/json

[
  {
    "id": 1,
    "role": "editor"
  },
  {
    "id": 2,
    "role": "editor"
  }
]
```

### Bulk Delete

```http
DELETE /users/bulk
Content-Type: application/json

[1, 2, 3]
```

## Special Considerations

### Automatic Fields

Some fields are automatically handled:

- `id`: Auto-generated if not provided
- `createdAt`: Set on creation if not provided
- `updatedAt`: Updated on each modification

### Soft Delete

If your resource has a `deleted` or `deletedAt` field, the DELETE operation will perform a soft delete by default (setting that field rather than removing the record).

To permanently delete a soft-deleted resource:

```http
DELETE /users/1?permanent=true
```

## Error Handling

All CRUD operations return appropriate error responses:

| Status Code | Scenario |
|-------------|----------|
| `400` | Invalid request (validation error) |
| `401` | Unauthorized (authentication required) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `409` | Conflict (e.g., unique constraint violation) |
| `422` | Unprocessable entity (business rule violation) |
| `500` | Server error |

## Next Steps

Now that you understand CRUD operations, learn about [Filtering](./filtering.md) to retrieve specific subsets of your data.

**← [Resources](./resources.md) | [Table of Contents](./README.md) | [Next: Filtering →](./filtering.md)**