# 🔗 Relationships

Pretendo provides robust support for resource relationships, allowing you to model complex data structures and efficiently retrieve related data.

**← [Pagination](./pagination.md) | [Table of Contents](./README.md) | [Next: Configuration →](./configuration.md)**

## Relationship Types

The following relationship types are supported:

| Type | Description | Example |
|------|-------------|---------|
| `hasOne` | One-to-one relationship | A user has one profile |
| `hasMany` | One-to-many relationship | A post has many comments |
| `belongsTo` | Many-to-one/inverse relationship | A comment belongs to a post |
| `manyToMany` | Many-to-many relationship | Users can have many roles, roles can have many users |

## Defining Relationships

Relationships are defined in your API schema within each resource definition:

```yaml
resources:
  - name: users
    # ... fields definition
    relationships:
      - type: hasMany
        resource: posts
        foreignKey: userId
      
      - type: hasOne
        resource: profile
        foreignKey: userId
```

### Relationship Properties

| Property | Description | Required | Example |
|----------|-------------|----------|---------|
| `type` | Relationship type | Yes | `hasMany` |
| `resource` | Related resource name | Yes | `posts` |
| `foreignKey` | Foreign key field name | Yes | `userId` |
| `targetKey` | Target key (for manyToMany) | Only for manyToMany | `tagId` |
| `through` | Join table (for manyToMany) | Only for manyToMany | `user_roles` |

## Accessing Related Resources

### Direct Access via Relationship Endpoints

You can access related resources directly through relationship endpoints:

```
GET /posts/123/comments      # Get all comments for post 123
GET /users/456/posts         # Get all posts by user 456
GET /posts/123/author        # Get the author of post 123
```

### Including Related Resources with Expansion

You can include related resources in the response using the `expand` query parameter:

```
GET /posts/123?expand=author            # Include the post author
GET /posts/123?expand=comments          # Include all comments
GET /posts?expand=author,comments       # Include author and comments for all posts
GET /users/456?expand=posts.comments    # Include posts and their comments
```

#### Nested Expansion

You can expand nested relationships using dot notation:

```
GET /posts?expand=author.profile        # Include author and their profile
GET /users?expand=posts.comments.user   # Include posts, their comments, and comment authors
```

#### Selective Expansion

You can selectively include specific fields from expanded relationships:

```
GET /posts?expand=author(id,username)   # Include only id and username from author
GET /posts?expand=comments(id,content)  # Include only id and content from comments
```

## Relationship Filtering

You can filter resources based on related data:

```
GET /posts?author.role=admin            # Posts by admin users
GET /comments?post.published=true       # Comments on published posts
```

## Creating Related Resources

### Creating Resources with Relationships

You can create resources with relationships in a single request:

```http
POST /posts
Content-Type: application/json

{
  "title": "New Post",
  "content": "Content here...",
  "userId": 456,
  "comments": [
    { "content": "Great post!", "userId": 789 },
    { "content": "Thanks for sharing", "userId": 101 }
  ],
  "tags": [1, 2, 3]
}
```

### Creating Child Resources

You can create child resources directly on the relationship endpoint:

```http
POST /posts/123/comments
Content-Type: application/json

{
  "content": "New comment",
  "userId": 456
}
```

## Updating Relationships

### Replacing Relationships

To replace all related items (for hasMany or manyToMany):

```http
PUT /posts/123/tags
Content-Type: application/json

[1, 2, 3]  // Replace with tag IDs 1, 2, and 3
```

### Adding to Relationships

To add items to a relationship:

```http
POST /posts/123/tags
Content-Type: application/json

[4, 5]  // Add tag IDs 4 and 5
```

### Removing from Relationships

To remove items from a relationship:

```http
DELETE /posts/123/tags/4  // Remove tag 4
```

Or remove multiple items:

```http
DELETE /posts/123/tags
Content-Type: application/json

[4, 5]  // Remove tag IDs 4 and 5
```

## Many-to-Many Relationships

Many-to-many relationships require a join table:

```yaml
- name: users
  relationships:
    - type: manyToMany
      resource: roles
      through: user_roles
      foreignKey: userId
      targetKey: roleId

- name: roles
  relationships:
    - type: manyToMany
      resource: users
      through: user_roles
      foreignKey: roleId
      targetKey: userId

- name: user_roles
  fields:
    - name: id
      type: number
    - name: userId
      type: number
      required: true
    - name: roleId
      type: number
      required: true
```

## Circular References

The API automatically handles circular references to prevent infinite recursion:

```
GET /users/1?expand=posts.author
```

In this example, the API will not expand the author of posts infinitely.

## Performance Considerations

- **Use selective expansion** to limit the amount of related data fetched
- **Limit expansion depth** to 2-3 levels to avoid performance issues
- **Use pagination** when fetching large collections of related items

## Examples

### Blog API Example

```yaml
resources:
  - name: users
    relationships:
      - type: hasMany
        resource: posts
        foreignKey: userId
      - type: hasMany
        resource: comments
        foreignKey: userId
      - type: hasOne
        resource: profile
        foreignKey: userId

  - name: posts
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: userId
      - type: hasMany
        resource: comments
        foreignKey: postId
      - type: manyToMany
        resource: tags
        through: post_tags
        foreignKey: postId
        targetKey: tagId

  - name: comments
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: userId
      - type: belongsTo
        resource: posts
        foreignKey: postId

  - name: profile
    relationships:
      - type: belongsTo
        resource: users
        foreignKey: userId

  - name: tags
    relationships:
      - type: manyToMany
        resource: posts
        through: post_tags
        foreignKey: tagId
        targetKey: postId

  - name: post_tags
    fields:
      - name: id
        type: number
      - name: postId
        type: number
        required: true
      - name: tagId
        type: number
        required: true
```

## Next Steps

Now that you understand relationships, learn about [Configuration](./configuration.md) options in the next section.

**← [Pagination](./pagination.md) | [Table of Contents](./README.md) | [Next: Configuration →](./configuration.md)**