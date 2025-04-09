# 🔍 Filtering

JSON REST Mock API provides powerful filtering capabilities to help you retrieve exactly the data you need.

**← [API Design](./api-design.md) | [Table of Contents](./README.md) | [Next: Sorting →](./sorting.md)**

## Basic Filtering

The simplest way to filter resources is by using query parameters that match field names:

```
GET /users?role=admin
GET /posts?published=true
GET /comments?postId=123
```

Multiple filters can be combined to create an AND condition:

```
GET /users?role=admin&status=active
```

## Operator-Based Filtering

For more advanced filtering, you can use operators by appending them to field names:

| Operator | Description | Example |
|----------|-------------|---------|
| `_eq` | Equal (default) | `?name_eq=John` |
| `_ne` | Not equal | `?status_ne=inactive` |
| `_gt` | Greater than | `?price_gt=100` |
| `_gte` | Greater than or equal | `?age_gte=18` |
| `_lt` | Less than | `?price_lt=50` |
| `_lte` | Less than or equal | `?date_lte=2023-12-31` |
| `_like` | Contains substring | `?title_like=react` |
| `_in` | In array of values | `?status_in=pending,approved` |
| `_nin` | Not in array | `?category_nin=archived,deleted` |
| `_null` | Is null or not null | `?description_null=true` |

Examples:

```
GET /products?price_gte=100&price_lte=200
GET /posts?title_like=javascript
GET /orders?status_in=pending,processing
```

## Date Filtering

Date fields have special operators for convenient filtering:

| Operator | Description | Example |
|----------|-------------|---------|
| `_before` | Before date | `?createdAt_before=2023-12-31` |
| `_after` | After date | `?createdAt_after=2023-01-01` |
| `_between` | Between dates | `?createdAt_between=2023-01-01,2023-12-31` |
| `_on` | On exact date | `?createdAt_on=2023-06-15` |

Date values should be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ).

## String Filtering

String fields support pattern matching:

| Operator | Description | Example |
|----------|-------------|---------|
| `_startsWith` | Starts with prefix | `?name_startsWith=Jo` |
| `_endsWith` | Ends with suffix | `?email_endsWith=gmail.com` |
| `_contains` | Contains substring (alias for _like) | `?bio_contains=developer` |
| `_ilike` | Case-insensitive contains | `?title_ilike=javascript` |

## Array Filtering

For array fields, you can filter by array contents:

| Operator | Description | Example |
|----------|-------------|---------|
| `_hasAll` | Contains all values | `?tags_hasAll=javascript,react` |
| `_hasAny` | Contains any values | `?categories_hasAny=tutorial,guide` |
| `_length` | Array length | `?tags_length=3` |

## Logical Operators

You can create complex queries using logical operators:

### AND Operator (Default)

Multiple filters are combined with AND logic by default:

```
GET /products?category=electronics&price_lt=500&inStock=true
```

This retrieves electronics products with price less than 500 that are in stock.

### OR Operator

Use arrays for OR conditions:

```
GET /products?or[0][category]=electronics&or[0][price_lt]=100&or[1][featured]=true
```

This retrieves products that are either (electronics with price < 100) OR featured products.

### NOT Operator

Use the `_not` prefix for negation:

```
GET /posts?_not[category]=archived&_not[status]=deleted
```

This retrieves posts that are neither in the archived category nor deleted.

## Nested Filtering

You can filter based on related resources by using dot notation:

```
GET /posts?author.role=admin
GET /orders?customer.country=Canada&items.product.category=electronics
```

## Full Example

Here's a complex filtering example:

```
GET /products?
  category_in=electronics,computers&
  price_gte=100&
  price_lte=500&
  manufacturer.country=Japan&
  or[0][featured]=true&
  or[1][discount_gt]=20&
  _not[status]=discontinued&
  sort=-rating,price&
  page=1&
  limit=20
```

This query:
1. Finds products in electronics or computers categories
2. With price between 100 and 500
3. From Japanese manufacturers
4. That are either featured OR have a discount greater than 20%
5. Not discontinued
6. Sorted by rating (descending) then price (ascending)
7. Returns the first page with 20 items per page

## Next Steps

Now that you understand filtering, learn about [Sorting](./sorting.md) resources in the next section.

**← [API Design](./api-design.md) | [Table of Contents](./README.md) | [Next: Sorting →](./sorting.md)**