# ⬇️ Installation

This guide covers how to install and set up JSON REST Mock API for your projects.

**← [Introduction](./introduction.md) | [Table of Contents](./README.md) | [Next: Quick Start →](./quick-start.md)**

## Requirements

Before you install JSON REST Mock API, make sure you have the following prerequisites:

- **Node.js**: Version 14.x or higher
- **npm** or **yarn**: For package installation

## Installation Methods

### Global Installation (Recommended for CLI Usage)

To use JSON REST Mock API as a command-line tool, install it globally:

```bash
# Using npm
npm install -g json-rest-mock-api

# Using yarn
yarn global add json-rest-mock-api
```

After installation, the `json-rest-mock-api` command will be available in your terminal.

### Local Project Installation

For integration with your project or for use in testing, install it as a project dependency:

```bash
# Using npm (development dependency)
npm install --save-dev json-rest-mock-api

# Using yarn (development dependency)
yarn add --dev json-rest-mock-api
```

### Installation from Source

If you want to use the latest development version or contribute to the project, you can install from the source:

```bash
# Clone the repository
git clone https://github.com/username/json-rest-mock-api.git

# Navigate to the project directory
cd json-rest-mock-api

# Install dependencies
npm install

# Build the project
npm run build

# Link the package (optional, for global usage)
npm link
```

## Verifying Installation

To verify that the installation was successful, run:

```bash
# For global installation
json-rest-mock-api --version

# For local installation
npx json-rest-mock-api --version
```

You should see the version number of the installed package.

## Configuration Files

JSON REST Mock API uses two types of files:

1. **API Specification File**: A YAML or JSON file that defines your API resources, fields, and relationships
2. **Data File** (optional): A JSON file that stores your persistent data

You'll learn how to create these files in the [Quick Start](./quick-start.md) guide.

## Integration with Package Scripts (Optional)

For local installations, you might want to add convenient npm scripts to your `package.json`:

```json
{
  "scripts": {
    "mock-api": "json-rest-mock-api start ./api-spec.yml",
    "mock-api:reset": "json-rest-mock-api start ./api-spec.yml --reset",
    "test:api": "json-rest-mock-api start ./test-api.yml --port 3001"
  }
}
```

Then you can run:

```bash
npm run mock-api
```

## Docker Installation (Optional)

If you prefer to use Docker, you can use the following Dockerfile:

```dockerfile
FROM node:16-alpine

# Install json-rest-mock-api globally
RUN npm install -g json-rest-mock-api

# Create app directory
WORKDIR /app

# Copy API specification
COPY ./api-spec.yml .

# Expose port
EXPOSE 3000

# Start the server
CMD ["json-rest-mock-api", "start", "api-spec.yml"]
```

Build and run the Docker container:

```bash
docker build -t json-rest-mock-api .
docker run -p 3000:3000 json-rest-mock-api
```

## Troubleshooting

### Common Installation Issues

- **Permission errors**: If you encounter permission errors during global installation, try adding `sudo` before the command or refer to npm's documentation on fixing permissions.
- **Dependency conflicts**: If you encounter dependency conflicts, try using a package manager that supports dependency resolution, like yarn or npm@7+.
- **Path issues**: If the global command is not found, ensure your npm global bin directory is in your PATH.

### Getting Help

If you encounter any issues during installation:

- Check the [GitHub repository](https://github.com/username/json-rest-mock-api) for known issues
- Join our [community discussion](https://github.com/username/json-rest-mock-api/discussions) for help

## Next Steps

Now that you've installed JSON REST Mock API, proceed to the [Quick Start Guide](./quick-start.md) to create your first API.

**← [Introduction](./introduction.md) | [Table of Contents](./README.md) | [Next: Quick Start →](./quick-start.md)**