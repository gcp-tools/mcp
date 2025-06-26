# GCP Tools MCP Server

A Model Context Protocol (MCP) server that provides Cursor with standardized access to gcp-tools-cdktf resources and tools for building and deploying Google Cloud Platform applications.

## Overview

This MCP server enables Cursor to:

- Access gcp-tools-cdktf library documentation and examples
- Scaffold new GCP projects with proper infrastructure
- Create and deploy services using gcp-tools-cdktf patterns
- Manage GitHub repositories and CI/CD workflows
- Monitor deployments and fix issues

## Features

### Resources
- **gcp-tools-cdktf:library** - Access to library structure and documentation
- **gcp-tools-cdktf:example-app** - Complete example application patterns
- **gcp-tools-cdktf:templates** - Project templates and scaffolding patterns
- **gcp:projects** - GCP project information and configuration
- **gcp:deployments** - Deployment status and logs
- **github:gcp-tools** - Access to gcp-tools-cdktf GitHub repository
- **github:user-repo** - User's application repository

### Tools
- **setup_foundation_project** - Execute foundation project setup script
- **scaffold_project** - Create new project structure
- **create_github_repository** - Create GitHub repository
- **setup_github_secrets** - Configure GitHub secrets and environment variables
- **push_to_github** - Push project to GitHub
- **create_service** - Create new service
- **configure_infrastructure** - Configure infrastructure for services
- **deploy_services** - Deploy services via GitHub
- **monitor_deployment** - Monitor deployment status
- **fix_deployment_issues** - Fix deployment issues

## Installation

### Prerequisites
- Node.js 20+
- Google Cloud SDK
- GitHub CLI (optional, for repository management)

### Install Dependencies
```bash
npm install
```

### Build the Server
```bash
npm run build
```

## Usage

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Global Installation
```bash
npm install -g .
gcp-tools-mcp-server
```

## Configuration

### Environment Variables
```bash
export GCP_PROJECT_ID="your-project-id"
export GITHUB_TOKEN="your-github-token"
export GCP_REGION="us-central1"
export GCP_ORG_ID="your-org-id"
export GCP_BILLING_ACCOUNT="your-billing-account"
```

### Cursor Integration

#### Global Configuration
```json
// ~/.cursor/settings.json
{
  "mcpServers": {
    "gcp-tools": {
      "enabled": true,
      "command": "gcp-tools-mcp-server",
      "args": [],
      "env": {
        "GCP_PROJECT_ID": "your-project-id",
        "GITHUB_TOKEN": "your-github-token",
        "GCP_REGION": "us-central1"
      }
    }
  }
}
```

#### Project-Specific Configuration
```json
// .cursorrules
{
  "mcpServers": {
    "gcp-tools": {
      "command": "npx",
      "args": ["@gcp-tools/mcp-server"],
      "env": {
        "GCP_PROJECT_ID": "your-project-id",
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GCP_REGION": "us-central1"
      }
    }
  }
}
```

## Example Usage

### 1. Setup Foundation Project
```typescript
// Cursor calls the MCP server
const result = await cursor.callTool('setup_foundation_project', {
  projectName: 'my-awesome-app',
  orgId: '123456789',
  billingAccount: 'XXXXXX-XXXXXX-XXXXXX',
  region: 'us-central1',
  githubIdentity: 'my-org',
  developerIdentity: 'developer@mycompany.com',
});
```

### 2. Scaffold Project
```typescript
const result = await cursor.callTool('scaffold_project', {
  projectName: 'my-awesome-app',
  description: 'A modern web application with microservices',
  template: 'microservices',
  languages: ['typescript', 'rust'],
  services: [
    { name: 'user-api', type: 'api', language: 'typescript' },
    { name: 'auth-service', type: 'api', language: 'typescript' },
    { name: 'data-processor', type: 'worker', language: 'rust' },
  ],
});
```

### 3. Create GitHub Repository and Deploy
```typescript
// Create GitHub repository
const repoResult = await cursor.callTool('create_github_repository', {
  name: 'my-awesome-app',
  description: 'A modern web application with microservices',
  isPrivate: true,
  orgName: 'my-org',
  autoInit: false,
});

// Setup secrets
const secretsResult = await cursor.callTool('setup_github_secrets', {
  repository: 'my-org/my-awesome-app',
  secrets: {
    GCP_PROJECT_ID: 'my-awesome-app-foundation-1234567890',
    GCP_SERVICE_ACCOUNT: 'deployer@my-awesome-app-foundation-1234567890.iam.gserviceaccount.com',
  },
  environmentVariables: {
    GCP_REGION: 'us-central1',
    NODE_ENV: 'production',
  },
  environments: ['dev', 'test', 'prod'],
});

// Push project to GitHub
const pushResult = await cursor.callTool('push_to_github', {
  repository: 'my-org/my-awesome-app',
  branch: 'main',
  files: result.projectStructure.files,
  commitMessage: 'feat: initial project setup',
});
```

## Architecture

The MCP server follows the [Model Context Protocol specification](https://modelcontextprotocol.io/introduction) and provides:

1. **Resource Access** - JSON-formatted content for gcp-tools-cdktf resources
2. **Tool Execution** - Standardized tools for project management
3. **Error Handling** - Comprehensive error handling and logging
4. **Type Safety** - Full TypeScript support with Zod validation

## Development

### Project Structure
```
src/
├── index.ts              # Main entry point
├── server.ts             # MCP server implementation
├── types.ts              # TypeScript type definitions
├── tools/
│   └── index.ts          # Tool registry
├── resources/
│   └── index.ts          # Resource registry
└── handlers/
    ├── tool-handlers.ts  # Tool implementation
    └── resource-handlers.ts # Resource content
```

### Adding New Tools
1. Define the tool schema in `src/tools/index.ts`
2. Implement the tool handler in `src/handlers/tool-handlers.ts`
3. Add the tool to the execution switch in `src/server.ts`

### Adding New Resources
1. Define the resource in `src/resources/index.ts`
2. Implement the content handler in `src/handlers/resource-handlers.ts`
3. Add the resource to the content switch in `ResourceHandlers.getResourceContent()`

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the example usage 
