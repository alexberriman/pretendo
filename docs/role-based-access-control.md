# 🛡️ Role-Based Access Control (RBAC)

Pretendo provides a powerful Role-Based Access Control (RBAC) system to create realistic authorization patterns in your mock API.

**← [Authentication & Authorization](./authentication.md) | [Table of Contents](./README.md)**

## What is RBAC?

Role-Based Access Control is a security model that restricts system access based on the roles that users hold within an organization. In Pretendo's implementation, RBAC allows you to:

1. Define different user roles (admin, editor, user, etc.)
2. Specify which operations each role can perform on each resource
3. Implement ownership-based permissions where users can manage their own resources
4. Create realistic authorization patterns for testing UI flows

## Configuring RBAC

### Basic Role Configuration

Start by defining user roles and the operations they can perform:

```yaml
resources:
  - name: articles
    access:
      list: ["admin", "editor", "user"]  # All roles can list articles
      get: ["admin", "editor", "user"]   # All roles can view articles
      create: ["admin", "editor"]        # Only admins and editors can create
      update: ["admin", "editor"]        # Only admins and editors can update
      delete: ["admin"]                  # Only admins can delete
```

### Resource Ownership

For resources owned by users, add the `ownedBy` field and include the special "owner" role:

```yaml
resources:
  - name: comments
    ownedBy: userId                     # Field that links to the owner
    access:
      list: ["*"]                        # Anyone can list comments
      get: ["*"]                         # Anyone can view a comment
      create: ["*"]                      # Anyone can create a comment
      update: ["admin", "moderator", "owner"] # Admin, moderator or owner can edit
      delete: ["admin", "moderator", "owner"] # Admin, moderator or owner can delete
```

## Special Access Roles

Pretendo supports several special access roles:

- `"*"` (wildcard): Any authenticated user, regardless of their specific role
- `"owner"`: The user who created/owns the resource (requires `ownedBy` field)

## How Ownership Works

When a resource has an `ownedBy` field:

1. When a user creates a new resource, the system automatically sets the ownership field to the user's ID
2. For operations that include the `"owner"` role, the system checks if the authenticated user's ID matches the resource's ownership field
3. If the IDs match, access is granted; otherwise, access is denied

### Ownership Example

```yaml
resources:
  - name: posts
    ownedBy: authorId
    access:
      update: ["admin", "owner"]
      delete: ["admin", "owner"]
```

With this configuration:
- When a user creates a post, `authorId` is automatically set to their user ID
- When they try to update that post later, the system checks if their ID matches the `authorId` field
- If it matches, they're granted access; if not, they receive a 403 Forbidden error

## Strict Ownership Mode

For particularly sensitive resources or operations, you can enforce strict ownership by making "owner" the only allowed role:

```yaml
resources:
  - name: privateMessages
    ownedBy: recipientId
    access:
      list: ["owner"]    # Only the recipient can list their messages
      get: ["owner"]     # Only the recipient can view a message
      update: ["owner"]  # Only the recipient can update a message
      delete: ["owner"]  # Only the recipient can delete a message
```

In strict ownership mode:
1. The system performs additional ownership validation
2. There's no way to bypass the ownership requirement (unlike when both "admin" and "owner" are allowed)
3. If the user is not the owner, access is immediately denied

## ID Type Handling

The ownership check mechanism is robust and handles:
- String IDs vs. numeric IDs
- Type conversions when comparing IDs
- Equality checks in both string and numeric formats

## Testing RBAC in Your API

### Example: Testing Access Control

```javascript
// Test that an owner can update their own post
async function testOwnerUpdate() {
  // Log in as user1
  const user1Login = await request.post('/auth/login')
    .send({ username: 'user1', password: 'password' });
  
  // Create a post as user1
  const postResponse = await request.post('/posts')
    .set('Authorization', `Bearer ${user1Login.body.token}`)
    .send({ title: 'My Post', content: 'Test content' });
  
  const postId = postResponse.body.data.id;
  
  // Log in as user2
  const user2Login = await request.post('/auth/login')
    .send({ username: 'user2', password: 'password' });
  
  // Attempt to update the post as user2 (should fail)
  const updateResponse = await request.patch(`/posts/${postId}`)
    .set('Authorization', `Bearer ${user2Login.body.token}`)
    .send({ title: 'Modified title' });
  
  // Should return 403 Forbidden
  expect(updateResponse.status).toBe(403);
}
```

## Best Practices

1. **Define Clear Role Hierarchies**: Be consistent with role permissions across resources.
2. **Use the Ownership Model**: For user-generated content, the ownership model provides realistic security patterns.
3. **Test All Permission Combinations**: Test both allowed and denied access paths in your UI.
4. **Combine Roles and Ownership**: Use both roles and ownership together for the most flexible authorization model.
5. **Use Strict Ownership**: For sensitive operations where only the owner should have access.

## Next Steps

- Learn about [Authentication](./authentication.md) to set up users and tokens
- Explore [Testing with Mock API](./testing.md) for testing your application with RBAC

**← [Authentication & Authorization](./authentication.md) | [Table of Contents](./README.md)**