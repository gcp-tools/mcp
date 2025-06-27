# GCP Tools MCP Server

## Overview

The GCP Tools MCP server automates Google Cloud Platform infrastructure setup and GitHub repository configuration for modern cloud-native projects. It provides tools to:
- Install all required prerequisites (terraform, cdktf, gcloud, gh)
- Create and configure a new GitHub repository
- Set up a GCP foundation project with service accounts, IAM, and Workload Identity
- Automatically create all required GitHub secrets and variables for CI/CD, including environment-specific values for dev, test, sbx, and prod

## Environment-Specific Secrets and Variables

When you run the complete setup workflow, the MCP server will create the following in your GitHub repository for **each environment** (`dev`, `test`, `sbx`, `prod`):

### Per-Environment (dev, test, sbx, prod)
- **Secret:** `GCP_TOOLS_WORKLOAD_IDENTITY_PROVIDER` — The Workload Identity Provider resource path for that environment
- **Variable:** `GCP_TOOLS_ENVIRONMENT` — The environment name (e.g., `dev`)

### Global Secrets
- `GCP_TOOLS_BILLING_ACCOUNT` — Your GCP billing account
- `GCP_TOOLS_FOUNDATION_PROJECT_ID` — The GCP project ID
- `GCP_TOOLS_ORG_ID` — Your GCP organization ID
- `GCP_TOOLS_SERVICE_ACCOUNT_EMAIL` — The service account email
- `GCP_TOOLS_FOUNDATION_PROJECT_NUMBER` — The GCP project number (extracted automatically)
- `GCP_TOOLS_TERRAFORM_REMOTE_STATE_BUCKET_ID` — The Terraform state bucket name (e.g., `${projectId}-terraform-state`)

### Global Variables
- `GCP_TOOLS_DEVELOPER_IDENTITY_SPECIFIER` — (manual input)
- `GCP_TOOLS_GITHUB_IDENTITY_SPECIFIER` — (manual input)
- `GCP_TOOLS_PROJECT_NAME` — The project/repo name
- `GCP_TOOLS_OWNER_EMAILS` — (manual input)
- `GCP_TOOLS_REGIONS` — (manual input)

### Region as Both Secret and Variable
- `GCP_TOOLS_REGIONS` is set as both a secret and a variable for compatibility

## Mapping to deploy.yml

The MCP server will ensure all secrets and variables required by your `.github/workflows/deploy.yml` are present, including the environment-specific ones. You only need to provide `ownerEmails` and `regions` as manual input if you want them set.

## Example: Complete Setup Workflow

**You ask in Cursor:**
> "Set up everything I need for a new GCP project called 'my-app'"

**The MCP server will:**
1. Check and install prerequisites (terraform, cdktf, gcloud, gh)
2. Create a new GitHub repository for your code
3. Create a new GCP foundation project
4. Configure all GitHub secrets and variables, including per-environment values
5. Return all the details you need to get started

**Example response:**
```json
{
  "status": "success",
  "message": "Complete project setup finished successfully!",
  "results": {
    "step1": { "status": "success", "message": "Prerequisites installed successfully" },
    "step2": { "status": "success", "message": "GitHub repository created successfully" },
    "step3": { "status": "success", "message": "GCP foundation project setup completed" },
    "step4": { "status": "success", "message": "GitHub secrets configured successfully" }
  },
  "summary": {
    "githubRepo": "https://github.com/yourusername/my-app",
    "gcpProject": "my-app-fdn-1234567890",
    "serviceAccount": "my-app-sa@my-app-fdn-1234567890.iam.gserviceaccount.com",
    "secretsCreated": 4,
    "variablesCreated": 2,
    "workflowCreated": 1
  }
}
```

## Manual Inputs
- `ownerEmails` and `regions` must be provided by you if you want them set as variables/secrets.

## Security
- All sensitive values are stored as GitHub secrets (encrypted)
- Environment-specific secrets ensure least-privilege and separation between dev, test, sbx, and prod
- Workload Identity is used for secure, keyless authentication from GitHub Actions to GCP

## Questions?
If you need to customize the secrets/variables further, just ask in Cursor!

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

### Example 4: Create a GitHub Repository

**You ask in Cursor:**
> "Create a new GitHub repository for my GCP project"

**The MCP server will:**
- Check if GitHub CLI is installed and authenticated
- Create a new private repository with README and .gitignore
- Add relevant topics/tags
- Return the repository URL

**Example response:**
```json
{
  "status": "success",
  "message": "GitHub repository created successfully",
  "repoName": "my-app",
  "repoUrl": "https://github.com/yourusername/my-app",
  "isPrivate": true,
  "topics": []
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

### `create_github_repo`
Creates a new GitHub repository with proper configuration.

**Parameters:**
- `repoName` (string): Name for the repository
- `description` (string): Repository description
- `isPrivate` (boolean): Whether repository should be private (default: true)
- `addReadme` (boolean): Add README file (default: true)
- `addGitignore` (boolean): Add .gitignore for Node.js/TypeScript (default: true)
- `addLicense` (string): License type (e.g., "MIT", "Apache-2.0", "none")
- `topics` (array): Repository topics/tags

**Example usage:**
```json
{
  "name": "create_github_repo",
  "arguments": {
    "repoName": "my-app",
    "description": "My GCP application infrastructure",
    "isPrivate": true,
    "addReadme": true,
    "addGitignore": true,
    "addLicense": "MIT",
    "topics": ["gcp", "cdktf", "terraform", "infrastructure"]
  }
}
```

### `setup_github_secrets`
Creates GitHub repository secrets and environment variables based on GCP foundation project setup.

**Parameters:**
- `repoName` (string): Name of the GitHub repository
- `projectId` (string): GCP Project ID from foundation setup
- `serviceAccount` (string): GCP Service Account email from foundation setup
- `workloadIdentityPool` (string): Workload Identity Pool from foundation setup
- `region` (string): GCP region (e.g., us-central1)
- `orgId` (string): GCP Organization ID (optional)
- `billingAccount` (string): GCP Billing Account (optional)

**Example usage:**
```json
{
  "name": "setup_github_secrets",
  "arguments": {
    "repoName": "my-app",
    "projectId": "my-app-fdn-1234567890",
    "serviceAccount": "my-app-sa@my-app-fdn-1234567890.iam.gserviceaccount.com",
    "workloadIdentityPool": "projects/123456789/locations/global/workloadIdentityPools/my-app-pool",
    "region": "us-central1",
    "orgId": "123456789",
    "billingAccount": "XXXXXX-XXXXXX-XXXXXX"
  }
}
```

### `complete_project_setup`
Complete end-to-end setup: install prerequisites, create GitHub repo, setup GCP foundation project, and configure GitHub secrets.

**Parameters:**
- `projectName` (string): Name for your project (used for both GCP project and GitHub repo)
- `orgId` (string): Your GCP organization ID
- `billingAccount` (string): Your GCP billing account
- `region` (string): Default region (e.g., "us-central1")
- `githubIdentity` (string): Your GitHub org/username
- `developerIdentity` (string): Your developer domain
- `repoDescription` (string): GitHub repository description (optional)
- `isPrivate` (boolean): Whether GitHub repository should be private (default: true)
- `addLicense` (string): License type for GitHub repo (optional)
- `topics` (array): GitHub repository topics/tags (optional)
- `includeOptionalDeps` (boolean): Include optional dependencies (python, rust) (optional)

**Example usage:**
```json
{
  "name": "complete_project_setup",
  "arguments": {
    "projectName": "my-app",
    "orgId": "123456789",
    "billingAccount": "XXXXXX-XXXXXX-XXXXXX",
    "region": "us-central1",
    "githubIdentity": "my-org",
    "developerIdentity": "mycompany.com",
    "repoDescription": "My GCP application infrastructure",
    "isPrivate": true,
    "addLicense": "MIT",
    "topics": ["gcp", "cdktf", "terraform", "infrastructure"],
    "includeOptionalDeps": false
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
