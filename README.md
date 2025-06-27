# GCP Tools MCP Server

## Overview

The GCP Tools MCP server automates Google Cloud Platform infrastructure setup and GitHub repository configuration for modern cloud-native projects. It provides tools to:
- Install all required prerequisites (terraform, cdktf, gcloud, gh)
- Create and configure a new GitHub repository
- Set up a GCP foundation project with service accounts, IAM, and Workload Identity
- Automatically create all required GitHub secrets and variables for CI/CD, including environment-specific values for dev, test, sbx, and prod

## 🚀 One-Command Complete Setup Example

If you want to set up everything for a new GCP project and GitHub repository in one go, just ask in Cursor:

> "Set up everything I need for a new GCP project called 'my-app'"

The MCP server will:
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

---

## Or Do It Step by Step

If you prefer, you can perform each part of the setup individually. Just ask Cursor for each step:

1. **Check prerequisites**
   > "Check if I have all the required tools installed for GCP development"
   - Checks for terraform, cdktf, gcloud, etc.

2. **Install missing dependencies**
   > "Install any missing dependencies for GCP development"
   - Installs any missing tools automatically.

3. **Create a GitHub repository**
   > "Create a new GitHub repository for my GCP project"
   - Creates a new private repo, README, .gitignore, etc.

4. **Set up a GCP foundation project**
   > "Create a new GCP foundation project for my app called 'my-app'"
   - Creates the GCP project, service accounts, IAM, Workload Identity, etc.

5. **Configure GitHub secrets and variables**
   > "Configure all required GitHub secrets and variables for my repo"
   - Sets up all secrets/variables for CI/CD and environment separation.

You can run any of these steps independently, in any order, and repeat as needed.

## Features

- **Self-contained**: No need for sibling repos
- **Easy setup**: Just clone and configure
- **LLM-friendly**: Works great with Cursor and other AI tools
- **Production-ready**: Creates real GCP infrastructure
- **Foundation Project Setup**: Create new GCP foundation projects with all necessary infrastructure
- **Resource Access**: Access to gcp-tools-cdktf library documentation and examples
- **GCP Integration**: Direct integration with GCP services and APIs
- **Environment-Specific Secrets and Variables**: Automatically creates all required GitHub secrets and variables for each environment (`dev`, `test`, `sbx`, `prod`), as well as global secrets and variables.
- **Security**: All sensitive values are stored as GitHub secrets (encrypted). Environment-specific secrets ensure least-privilege and separation between environments. Workload Identity is used for secure, keyless authentication from GitHub Actions to GCP.

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

- GCP account with appropriate permissions
- GitHub account (for Workload Identity)

## Quick Start

```bash
git clone <your-repo>
cd gcp-tools-mcp
npm install
npm run build
```

## Configuration

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

### `setup_foundation_project`
Creates a new GCP foundation project with all infrastructure.

**Parameters:**
- `projectName` (string): Name for your project
- `orgId` (string): Your GCP organization ID
- `billingAccount` (string): Your GCP billing account
- `region` (string): Default region (e.g., "us-central1")
- `githubIdentity` (string): Your GitHub org/username
- `developerIdentity` (string): Your developer domain

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

## Development

```bash
# Build the server
npm run build

# Test the server
node test-mcp.js

# Run in development
npm run dev
```

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

## License

MIT

Once this is up and running we will generate an example project from it - with a single example
of all the different constructs in gcp-tools-cdktf
