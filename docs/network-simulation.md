# 🌐 Network Simulation

JSON REST Mock API provides powerful capabilities to simulate real-world network conditions, helping you build more resilient applications.

**← [Authentication](./authentication.md) | [Table of Contents](./README.md) | [Next: Data Persistence →](./persistence.md)**

## Why Simulate Network Conditions?

Real-world APIs often experience:

- Variable latency (slow responses)
- Intermittent failures
- Rate limiting
- Server errors

By simulating these conditions during development and testing, you can:

1. Test how your application handles delays
2. Ensure proper error handling
3. Implement retry mechanisms
4. Create loading states and indicators
5. Build more resilient applications

## Latency Simulation

Latency simulation adds realistic delays to API responses.

### Configuration

Configure latency in your API specification:

```yaml
options:
  latency:
    enabled: true          # Enable latency simulation
    min: 50                # Minimum latency in milliseconds
    max: 500               # Maximum latency in milliseconds
    distribution: "normal" # Distribution type (uniform, normal, exponential)
```

### Distribution Types

- **Uniform**: Random delays between min and max (default)
- **Normal**: Bell curve distribution centered between min and max
- **Exponential**: Most responses are closer to min, with occasional higher delays

### Per-Resource Latency

You can configure different latency for specific resources:

```yaml
resources:
  - name: users
    # ... resource definition
    latency:
      min: 20
      max: 100
  
  - name: largeData
    # ... resource definition
    latency:
      min: 500
      max: 2000
```

### Per-Method Latency

Different HTTP methods can have different latency profiles:

```yaml
options:
  latency:
    enabled: true
    methods:
      GET:
        min: 50
        max: 200
      POST:
        min: 200
        max: 800
      PUT:
        min: 200
        max: 800
      DELETE:
        min: 100
        max: 300
```

## Error Simulation

Error simulation randomly generates HTTP errors to test your application's error handling.

### Configuration

Configure error simulation in your API specification:

```yaml
options:
  errorSimulation:
    enabled: true
    rate: 0.05             # 5% of requests will fail
    statusCodes: [500, 502, 503, 504]
    methods: ["GET", "POST", "PUT", "DELETE"]
```

### Custom Error Responses

You can define custom error responses:

```yaml
options:
  errorSimulation:
    enabled: true
    rate: 0.05
    customErrors:
      - statusCode: 429
        rate: 0.03
        body: {
          "code": "RATE_LIMIT_EXCEEDED",
          "message": "Too many requests, please try again later",
          "retryAfter": 30
        }
        headers:
          Retry-After: "30"
      
      - statusCode: 503
        rate: 0.02
        body: {
          "code": "SERVICE_UNAVAILABLE",
          "message": "Service is temporarily unavailable"
        }
```

### Per-Resource Error Rates

Different resources can have different error probabilities:

```yaml
resources:
  - name: stable
    # ... resource definition
    errorSimulation:
      rate: 0.01  # Very stable, 1% error rate
  
  - name: unstable
    # ... resource definition
    errorSimulation:
      rate: 0.2   # Unstable, 20% error rate
```

## Throttling and Rate Limiting

Simulate API rate limits to test how your application handles throttling.

### Configuration

```yaml
options:
  rateLimit:
    enabled: true
    limit: 100             # Requests per time window
    windowMs: 60000        # Time window in milliseconds (1 minute)
    message: "Rate limit exceeded, please try again later"
    statusCode: 429
    headers:
      enabled: true        # Include rate limit headers
```

### Rate Limit Headers

When rate limiting is enabled, the API includes the following headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1619712000
```

## Streaming and Chunked Responses

Simulate streaming APIs and chunked transfer encoding:

```yaml
resources:
  - name: stream
    # ... resource definition
    streaming:
      enabled: true
      chunkSize: 1024      # Size of each chunk in bytes
      chunkDelay: 200      # Delay between chunks in milliseconds
```

## Network Bandwidth Limitation

Simulate limited bandwidth environments:

```yaml
options:
  bandwidth:
    enabled: true
    limit: 128             # Bandwidth limit in KB/s
```

## Connection Drops

Simulate sudden connection drops:

```yaml
options:
  connectionDrops:
    enabled: true
    rate: 0.01             # 1% of requests will drop
```

## Controlling Simulation at Runtime

You can control network simulation at runtime through special admin endpoints:

```http
# Enable/disable latency
POST /admin/latency
Content-Type: application/json

{
  "enabled": true,
  "min": 100,
  "max": 300
}

# Enable/disable errors
POST /admin/errors
Content-Type: application/json

{
  "enabled": true,
  "rate": 0.1
}
```

## Using with CLI

You can also control network simulation via CLI flags:

```bash
# Start the server with latency simulation
json-rest-mock-api start api.yml --latency --latency-min 50 --latency-max 500

# Start the server with error simulation
json-rest-mock-api start api.yml --errors --error-rate 0.05

# Combine multiple simulations
json-rest-mock-api start api.yml --latency --errors --rate-limit
```

## Testing Patterns

### Progressive Enhancement Tests

Test your application with increasingly degraded network conditions:

1. **Ideal conditions**: No latency, no errors
2. **Slow network**: Increasing latency (100ms, 500ms, 1000ms)
3. **Unreliable network**: Adding random errors (1%, 5%, 10%)
4. **Severe degradation**: High latency + high error rate

### Chaos Testing

Randomly vary network conditions during extended test runs to discover edge cases:

```bash
json-rest-mock-api start api.yml --chaos
```

The `--chaos` flag automatically varies latency and error rates over time.

## Use Cases

### Mobile App Testing

Test how your mobile app performs on different network connections:

```yaml
profiles:
  - name: wifi
    latency:
      min: 20
      max: 100
    errorRate: 0.01
  
  - name: 4g
    latency:
      min: 100
      max: 500
    errorRate: 0.03
  
  - name: 3g
    latency:
      min: 300
      max: 1500
    errorRate: 0.05
  
  - name: flaky
    latency:
      min: 200
      max: 2000
    errorRate: 0.1
```

Start with a specific profile:

```bash
json-rest-mock-api start api.yml --profile 3g
```

## Next Steps

Now that you understand network simulation, learn about [Data Persistence](./persistence.md) to maintain state in your mock API.

**← [Authentication](./authentication.md) | [Table of Contents](./README.md) | [Next: Data Persistence →](./persistence.md)**