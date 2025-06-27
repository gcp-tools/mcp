# GCP Tools MCP Server

A Model Context Protocol (MCP) server that provides tools and resources for working with Google Cloud Platform (GCP) infrastructure using the gcp-tools-cdktf library.

## What This Does

This MCP server gives you and your LLM (like in Cursor) the ability to:
- **Check and install prerequisites** (terraform, cdktf, gcloud, etc.)
- **Set up GCP foundation projects** with all necessary infrastructure
- **Access documentation** about GCP tools and patterns

## Quick Start

### 1. Install and Build
```bash
git clone <your-repo>
cd gcp-tools-mcp
npm install
npm run build
```

### 2. Configure Cursor
Add this to your Cursor MCP configuration (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "gcp-tools-mcp": {
      "args": ["/path/to/gcp-tools-mcp/dist/index.mjs"],
      "command": "node",
      "name": "gcp-tools-mcp",
    }
  }
}
```

### 3. Restart Cursor
Restart Cursor to pick up the new MCP server configuration.

## Usage Examples

### Example 1: Check Your Prerequisites

**You ask in Cursor:**
> "Check if I have all the required tools installed for GCP development"

**The MCP server will:**
- Check for terraform, cdktf, cdktf-cli, gcloud
- Tell you what's missing
- Optionally install missing tools

**Example response:**
```json
{
  "summary": [
    {"name": "terraform", "present": true},
    {"name": "cdktf", "present": false},
    {"name": "gcloud", "present": true}
  ],
  "message": "Dependency check complete."
}
```

### Example 2: Install Missing Dependencies

**You ask in Cursor:**
> "Install any missing dependencies for GCP development"

**The MCP server will:**
- Check what's missing
- Install missing tools automatically
- Report success/failure for each

### Example 3: Set Up a New GCP Project

**You ask in Cursor:**
> "Create a new GCP foundation project for my app called 'my-app'"

**The MCP server will:**
- Create a new GCP project with ID like `my-app-fdn-1234567890`
- Set up service accounts and IAM permissions
- Configure Workload Identity for GitHub Actions
- Return project details

**Example response:**
```json
{
  "projectId": "my-app-fdn-1234567890",
  "serviceAccount": "my-app-sa@my-app-fdn-1234567890.iam.gserviceaccount.com",
  "workloadIdentityPool": "projects/123456789/locations/global/workloadIdentityPools/my-app-pool",
  "status": "success",
  "message": "Foundation project setup completed successfully"
}
```

## Available Tools

### `install_prerequisites`
Checks for and optionally installs required dependencies.

**Parameters:**
- `checkOnly` (boolean): If true, only check (don't install)
- `includeOptional` (boolean): If true, include python and rust

**Example usage:**
```json
{
  "name": "install_prerequisites",
  "arguments": {
    "checkOnly": false,
    "includeOptional": true
  }
}
```

### `setup_foundation_project`
Creates a new GCP foundation project with all infrastructure.

**Parameters:**
- `projectName` (string): Name for your project
- `orgId` (string): Your GCP organization ID
- `billingAccount` (string): Your GCP billing account
- `region` (string): Default region (e.g., "us-central1")
- `githubIdentity` (string): Your GitHub org/username
- `developerIdentity` (string): Your developer domain

**Example usage:**
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

## Available Resources

- `gcp-tools-cdktf:library` - Library documentation and structure
- `gcp-tools-cdktf:example-app` - Example application patterns
- `gcp:projects` - GCP project configuration info

## Development

```bash
# Build the server
npm run build

# Test the server
node test-mcp.js

# Run in development
npm run dev
```

## What You Get

✅ **Self-contained** - No need for sibling repos  
✅ **Easy setup** - Just clone and configure  
✅ **LLM-friendly** - Works great with Cursor and other AI tools  
✅ **Production-ready** - Creates real GCP infrastructure  

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- GCP account with appropriate permissions
- GitHub account (for Workload Identity)

That's it! The MCP server handles installing everything else.

## Features

- **Foundation Project Setup**: Create new GCP foundation projects with all necessary infrastructure
- **Resource Access**: Access to gcp-tools-cdktf library documentation and examples
- **GCP Integration**: Direct integration with GCP services and APIs

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

Once this is up and running we will generate an example project from it - with a single example
of all the different constructs in gcp-tools-cdktf

## Prerequisites

Before getting started, ensure you have the following tools installed on your system. It is recommended to use a version manager like `nvm` for Node.js and `rustup` for Rust to easily switch between versions.

| Tool | Recommended Version | Installation |
| :--- | :--- | :--- |
| **Node.js** | `v22.x` | `nvm install 22` or [official installer](https://nodejs.org/) |
| **Terraform** | `~> 1.9.0` | [Official installer](https://www.terraform.io/downloads.html) |
| **CDKTF CLI** | `~> 0.21.0` | `npm i -g cdktf-cli@0.21.0` |
| **Rust** | `latest stable` | `rustup` (from [rust-lang.org](https://www.rust-lang.org/tools/install)) |
| **Google Cloud SDK** | `latest` | [Official installer](https://cloud.google.com/sdk/docs/install) |
| **Python** | `3.9+` | [Official installer](https://www.python.org/downloads/) |
