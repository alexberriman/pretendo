# ⬇️ Installation

This guide covers how to install and set up Pretendo for your projects.

**← [Introduction](./introduction.md) | [Table of Contents](./README.md) | [Next: Quick Start →](./quick-start.md)**

## Requirements

Before you install Pretendo, make sure you have the following prerequisites:

- **Node.js**: Version 14.x or higher
- **npm** or **yarn**: For package installation

## Installation Methods

### Global Installation (Recommended for CLI Usage)

To use Pretendo as a command-line tool, install it globally:

```bash
# Using npm
npm install -g pretendo

# Using yarn
yarn global add pretendo
```

After installation, the `pretendo` command will be available in your terminal.

### Local Project Installation

For integration with your project or for use in testing, install it as a project dependency:

```bash
# Using npm (development dependency)
npm install --save-dev pretendo

# Using yarn (development dependency)
yarn add --dev pretendo
```

### Installation from Source

If you want to use the latest development version or contribute to the project, you can install from the source:

```bash
# Clone the repository
git clone https://github.com/username/pretendo.git

# Navigate to the project directory
cd pretendo

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
pretendo --version

# For local installation
npx pretendo --version
```

You should see the version number of the installed package.

## Configuration Files

Pretendo uses two types of files:

1. **API Specification File**: A YAML or JSON file that defines your API resources, fields, and relationships
   - Can be a local file path or a remote URL (including GitHub URLs)
   - GitHub URLs are automatically downloaded without prompting
   - Other URLs will prompt for confirmation unless `--no-prompt` is used
2. **Data File** (optional): A JSON file that stores your persistent data

You'll learn how to create these files in the [Quick Start](./quick-start.md) guide.

## Integration with Package Scripts (Optional)

For local installations, you might want to add convenient npm scripts to your `package.json`:

```json
{
  "scripts": {
    "mock-api": "pretendo start ./api-spec.yml",
    "mock-api:reset": "pretendo start ./api-spec.yml --reset",
    "test:api": "pretendo start ./test-api.yml --port 3001"
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

# Install pretendo globally
RUN npm install -g pretendo

# Create app directory
WORKDIR /app

# Copy API specification
COPY ./api-spec.yml .

# Expose port
EXPOSE 3000

# Start the server
CMD ["pretendo", "start", "api-spec.yml"]
```

Build and run the Docker container:

```bash
docker build -t pretendo .
docker run -p 3000:3000 pretendo
```

## Troubleshooting

### Common Installation Issues

- **Permission errors**: If you encounter permission errors during global installation, try adding `sudo` before the command or refer to npm's documentation on fixing permissions.
- **Dependency conflicts**: If you encounter dependency conflicts, try using a package manager that supports dependency resolution, like yarn or npm@7+.
- **Path issues**: If the global command is not found, ensure your npm global bin directory is in your PATH.

### Getting Help

If you encounter any issues during installation:

- Check the [GitHub repository](https://github.com/username/pretendo) for known issues
- Join our [community discussion](https://github.com/username/pretendo/discussions) for help

## Next Steps

Now that you've installed Pretendo, proceed to the [Quick Start Guide](./quick-start.md) to create your first API.

**← [Introduction](./introduction.md) | [Table of Contents](./README.md) | [Next: Quick Start →](./quick-start.md)**