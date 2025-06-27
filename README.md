# GCP Tools MCP Server

A Model Context Protocol (MCP) server that provides tools and resources for working with Google Cloud Platform (GCP) infrastructure using the gcp-tools-cdktf library.

## Features

- **Foundation Project Setup**: Create new GCP foundation projects with all necessary infrastructure
- **Resource Access**: Access to gcp-tools-cdktf library documentation and examples
- **GCP Integration**: Direct integration with GCP services and APIs

## Installation

```bash
npm install
npm run build
```

## Development

```bash
# Development mode (using tsx)
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Configuration

### Cursor Integration

Add this to your Cursor MCP configuration (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "gcp-tools-mcp": {
      "args": ["/path/to/gcp-tools-mcp/dist/index.mjs"],
      "command": "node",
      "name": "gcp-tools-mcp"
    }
  }
}
```

## Available Tools

### setup_foundation_project

Creates a new GCP foundation project with all necessary infrastructure components.

**Parameters:**
- `projectName` (string): The name for the new project
- `orgId` (string): Your GCP organization ID
- `billingAccount` (string): Your GCP billing account ID
- `region` (string): The default region for the project (e.g., "us-central1")
- `githubIdentity` (string): Your GitHub organization or username
- `developerIdentity` (string): Your developer domain (e.g., "yourdomain.com")

**What it does:**
- Creates a new GCP project with ID format: `{projectName}-fdn-{timestamp}`
- Sets up service accounts and IAM permissions
- Configures Workload Identity for GitHub Actions
- Enables necessary APIs
- Returns project details including project ID, service account, and workload identity pool

**Example:**
```json
{
  "name": "setup_foundation_project",
  "arguments": {
    "projectName": "my-app",
    "orgId": "123456789",
    "billingAccount": "XXXXXX-XXXXXX-XXXXXX",
    "region": "us-central1",
    "githubIdentity": "my-org",
    "developerIdentity": "mycompany.com"
  }
}
```

**Notes:**
- Project IDs are generated in format: `{projectName}-fdn-{timestamp}` (e.g., "my-app-fdn-1750963314")
- The tool has a 5-minute timeout to handle longer-running operations
- Requires appropriate GCP permissions and billing quota

## Available Resources

- `gcp-tools-cdktf:library`: GCP Tools CDKTF Library documentation
- `gcp-tools-cdktf:example-app`: Example application structure
- `gcp:projects`: GCP project information

## Testing

```bash
# Test basic functionality
node test-mcp.js

# Test with real GCP setup (creates actual projects)
node test-real-setup.js
```

## Architecture

The MCP server is built with TypeScript and follows the Model Context Protocol specification:

- **Server**: Main MCP server implementation
- **Tools**: Tool definitions and registries
- **Resources**: Resource definitions and handlers
- **Handlers**: Implementation of tool and resource handlers

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- `typescript`: TypeScript compilation
- `tsx`: TypeScript execution for development

## License

MIT
