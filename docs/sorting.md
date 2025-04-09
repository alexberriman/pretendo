# 🔄 Sorting

JSON REST Mock API provides flexible sorting capabilities to order your resource collections according to various criteria.

**← [Filtering](./filtering.md) | [Table of Contents](./README.md) | [Next: Pagination →](./pagination.md)**

## Basic Sorting

To sort resources, use the `sort` query parameter:

```
GET /users?sort=lastName
```

This returns users sorted by last name in ascending order (A-Z).

## Sort Direction

By default, sorting is done in ascending order. To sort in descending order, prefix the field name with a minus sign (`-`):

```
GET /posts?sort=-createdAt
```

This returns posts sorted by creation date in descending order (newest first).

## Multiple Sort Fields

You can sort by multiple fields by providing a comma-separated list:

```
GET /users?sort=lastName,firstName
```

This sorts users by last name, and then by first name for users with the same last name.

You can mix ascending and descending sorts:

```
GET /products?sort=-category,price
```

This sorts products by category in descending order, and then by price in ascending order within each category.

## Sorting by Nested Fields

You can sort by nested object fields using dot notation:

```
GET /orders?sort=customer.lastName
```

This sorts orders by the customer's last name.

## Sorting by Related Resource Fields

For related resources defined in your schema, you can sort by fields from related entities:

```
GET /posts?sort=author.username
```

This sorts posts by the username of the author.

## Sort by Calculated Values

Some special sort values are also available:

```
GET /posts?sort=_random    # Random order
GET /users?sort=_count.posts  # Sort by related posts count
```

## Sorting Arrays and Objects

For array and object fields, specialized sorting is available:

```
GET /products?sort=ratings._avg   # Average of array values
GET /users?sort=address.country   # Sort by nested property
```

## Sort Stability

The sorting is stable, which means that when records have the same values in the sort fields, they maintain their relative order from the original dataset.

## Performance Considerations

- Sorting by indexed fields (like `id`) is faster than non-indexed fields
- Complex sorting using related resources may be slower for large datasets
- Consider using pagination along with sorting for large collections

## Examples

### Sort users by registration date (newest first)

```
GET /users?sort=-createdAt
```

### Sort products by price (lowest first) and then by name

```
GET /products?sort=price,name
```

### Sort posts by popularity (comments count, descending) and then by date (newest first)

```
GET /posts?sort=-_count.comments,-createdAt
```

### Sort orders by customer country and then by total amount (highest first)

```
GET /orders?sort=customer.country,-totalAmount
```

### Advanced sorting with filtering

```
GET /products?category=electronics&price_gte=100&sort=-rating,price
```

This gets electronics products with price ≥ 100, sorted by rating (descending) and then by price (ascending).

## Next Steps

Now that you understand sorting, learn about [Pagination](./pagination.md) in the next section.

**← [Filtering](./filtering.md) | [Table of Contents](./README.md) | [Next: Pagination →](./pagination.md)**