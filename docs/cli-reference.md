# 🧑‍💻 CLI Reference

Pretendo provides a powerful command-line interface (CLI) that lets you start and interact with your mock API server. This document covers all CLI features and commands available.

## Starting the Server

Start the Pretendo server with a configuration file or URL:

```bash
pretendo start <file|url> [options]
```

### File Sources

Pretendo supports multiple ways to specify your API configuration:

- **Local file**: `pretendo start ./api.yml`
- **Remote URL**: `pretendo start https://example.com/api.yml`
- **GitHub URL**: `pretendo start https://raw.githubusercontent.com/user/repo/branch/path/to/file.yml`
- **Repository URL**: `pretendo start repo://simple-api.yml` (shorthand for examples in the Pretendo repository)

### Command Line Options

| Option | Description |
|--------|-------------|
| `-p, --port <number>` | Port to run the server on (default: 3000) |
| `-h, --host <string>` | Host to bind to (default: localhost) |
| `--no-cors` | Disable CORS support |
| `-d, --db <path>` | Path to database file for persistence |
| `--delay <ms>` | Add fixed delay to all responses |
| `--error-rate <rate>` | Add random errors (0-1 probability) |
| `--reset` | Reset database before starting |
| `--no-interactive` | Disable interactive CLI mode |
| `--no-prompt` | Skip download confirmation for URLs |

## Interactive Mode

When the server starts in interactive mode (default), you have access to a set of commands to interact with the running server:

```
Available commands:
  help                    Show help information
  routes                  List all API routes
  request <method> <url>  Make a request to the API
  config                  Show current configuration
  examples                List available example specifications
  logs [options]          View server request logs
  stats                   Show server statistics
  clear                   Clear the console
  exit                    Exit the application
```

### Command: `help`

Display help information about available commands:

```
help [command]
```

If a specific command is provided, detailed help for that command will be shown.

### Command: `routes`

List all available API routes:

```
routes
```

Example output:
```
📋 Available API Routes:

GET     /users                  # List all users
GET     /users/:id              # Get user by ID
POST    /users                  # Create a new user
PUT     /users/:id              # Update user (full replace)
PATCH   /users/:id              # Update user (partial)
DELETE  /users/:id              # Delete user
```

### Command: `request`

Make a request to the API:

```
request <method> <url> [body]
```

Examples:
```
# Get all users
request GET /users

# Get a specific user
request GET /users/1

# Create a new user
request POST /users {"name":"John","email":"john@example.com"}

# Update a user
request PATCH /users/1 {"name":"Updated Name"}

# Delete a user
request DELETE /users/1
```

### Command: `config`

Display the current server configuration:

```
config
```

This shows all settings including resources, relationships, auth settings, and server options.

### Command: `examples`

List all available example specifications from the Pretendo repository:

```
examples
```

Example output:
```
📋 Available Example Specifications:

simple-api.yml       # Basic API with users and posts
blog-api.yml         # Complete blog API with comments
e-commerce-api.yml   # E-commerce API with products and orders

Use with: pretendo start repo://example-name.yml
```

### Command: `logs`

View and filter server request logs:

```
logs [options]
```

Options:
- `--method <method>` - Filter by HTTP method (GET, POST, etc.)
- `--status <code>` - Filter by status code (200, 404, etc.)
- `--path <pattern>` - Filter by URL path
- `--from <timestamp>` - Show logs from timestamp
- `--to <timestamp>` - Show logs until timestamp
- `--limit <number>` - Limit number of logs shown
- `--clear` - Clear all logs
- `--json` - Output in JSON format

Examples:
```
# View all logs
logs

# Filter logs by method
logs --method GET

# View only error responses
logs --status 4xx

# Filter by path
logs --path /users

# Combine filters
logs --method POST --path /users --status 201
```

### Command: `stats`

Display server statistics:

```
stats
```

Shows information about:
- Server uptime
- Total requests processed
- Request counts by method and status
- Average response time
- Most accessed endpoints

### Command: `clear`

Clear the console:

```
clear
```

### Command: `exit`

Exit the application and stop the server:

```
exit
```

## Repository URL Scheme

Pretendo supports a special `repo://` URL scheme for quickly loading example configurations:

```bash
pretendo start repo://simple-api.yml
```

This is equivalent to:
```bash
pretendo start https://raw.githubusercontent.com/alexberriman/pretendo/refs/heads/main/examples/simple-api.yml
```

Available examples can be listed with the `examples` command in interactive mode.

## Environment Variables

You can configure Pretendo using environment variables:

| Variable | Description |
|----------|-------------|
| `PRETENDO_PORT` | Default port for the server |
| `PRETENDO_HOST` | Default host for the server |
| `PRETENDO_DB_PATH` | Default path for database file |
| `PRETENDO_NO_INTERACTIVE` | Disable interactive mode if set to "true" |
| `PRETENDO_JWT_SECRET` | Secret key for JWT authentication |

## Programmatic Control

When using Pretendo in your code, you can access the CLI programmatically:

```typescript
import { CLI } from "pretendo/cli";

// Create a CLI instance
const cli = new CLI();

// Start the server
await cli.start("./api.yml", {
  port: 3000,
  interactive: true
});

// Execute CLI commands programmatically
await cli.executeCommand("routes");
await cli.executeCommand("request", ["GET", "/users"]);

// Stop the server
await cli.stop();
```

This is useful for testing scenarios where you need programmatic control over the CLI.