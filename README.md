# GCP Tools MCP Server

## Overview

The GCP Tools MCP server automates Google Cloud Platform infrastructure setup and GitHub repository configuration for modern cloud-native projects. It provides tools to:
- Install all required prerequisites (terraform, cdktf, gcloud, gh)
- Create and configure a new GitHub repository
- Set up a GCP foundation project with service accounts, IAM, and Workload Identity
- Automatically create all required GitHub secrets and variables for CI/CD, including environment-specific values for dev, test, sbx, and prod
- Supports multi-region deployments and explicit owner email configuration

## 🚀 One-Command Complete Setup Example

If you want to set up everything for a new GCP project and GitHub repository in one go, just ask in Cursor:

> "Set up everything I need for a new GCP project called 'my-app' in us-central1,us-west1 with owners alice@example.com,bob@example.com"

**Required arguments:**
- `projectName` (string)
- `orgId` (string)
- `billingAccount` (string)
- `regions` (comma-separated string, e.g. `"us-central1,us-west1"`)
- `githubIdentity` (string)
- `developerIdentity` (string)
- `ownerEmails` (comma-separated string, e.g. `"alice@example.com,bob@example.com"`)

**Optional:**
- `repoDescription`, `isPrivate`, `addLicense`, `topics`, `includeOptionalDeps`

**Before running the complete setup:**
- Authenticate with GitHub CLI: `gh auth login`
- Authenticate with Google Cloud SDK: `gcloud auth login` and `gcloud auth application-default login`

**The MCP server will:**
1. Check and install prerequisites (terraform, cdktf, gcloud, gh)
2. Create a new GitHub repository for your code
3. Create a new GCP foundation project (using the first region as default, but supporting all regions)
4. Configure all GitHub secrets and variables, including per-environment values and owner emails
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

## Step-by-Step Usage

You can perform each part of the setup individually. Just ask Cursor for each step:

1. **Check prerequisites**
   > "Check if I have all the required tools installed for GCP development"
2. **Install missing dependencies**
   > "Install any missing dependencies for GCP development"
3. **Authenticate with GitHub CLI**
   > Run: `gh auth login`
4. **Authenticate with Google Cloud SDK**
   > Run: `gcloud auth login` and `gcloud auth application-default login`
5. **Create a GitHub repository**
   > "Create a new GitHub repository for my GCP project"
6. **Set up a GCP foundation project**
   > "Create a new GCP foundation project for my app called 'my-app' in us-central1,us-west1 with owners alice@example.com,bob@example.com"
7. **Configure GitHub secrets and variables**
   > "Configure all required GitHub secrets and variables for my repo"

You can run any of these steps independently, in any order, and repeat as needed.

---

## Tool Reference

### `install_prerequisites`
Checks for and optionally installs required dependencies.
- **Parameters:**
  - `checkOnly` (boolean): If true, only check (don't install)
  - `includeOptional` (boolean): If true, include python and rust

### `create_github_repo`
Creates a new GitHub repository with proper configuration.
- **Parameters:**
  - `repoName` (string): Name for the repository
  - `description` (string): Repository description
  - `isPrivate` (boolean): Whether repository should be private (default: true)
  - `addReadme` (boolean): Add README file (default: true)
  - `addGitignore` (boolean): Add .gitignore for Node.js/TypeScript (default: true)
  - `addLicense` (string): License type (e.g., "MIT", "Apache-2.0", "none")
  - `topics` (array): Repository topics/tags

### `setup_foundation_project`
Creates a new GCP foundation project with all infrastructure.
- **Parameters:**
  - `projectName` (string)
  - `orgId` (string)
  - `billingAccount` (string)
  - `regions` (comma-separated string, min 1)
  - `githubIdentity` (string)
  - `developerIdentity` (string)
  - `ownerEmails` (comma-separated string)

### `setup_github_secrets`
Creates GitHub repository secrets and environment variables based on GCP foundation project setup.
- **Parameters:**
  - `repoName` (string)
  - `projectId` (string)
  - `serviceAccount` (string)
  - `workloadIdentityPool` (string)
  - `region` (string)
  - `orgId` (string, optional)
  - `billingAccount` (string, optional)
  - `ownerEmails` (comma-separated string)
  - `regions` (comma-separated string)

### `complete_project_setup`
Complete end-to-end setup: install prerequisites, create GitHub repo, setup GCP foundation project, and configure GitHub secrets.
- **Parameters:**
  - `projectName` (string)
  - `orgId` (string)
  - `billingAccount` (string)
  - `regions` (comma-separated string, min 1)
  - `githubIdentity` (string)
  - `developerIdentity` (string)
  - `ownerEmails` (comma-separated string)
  - `repoDescription` (string, optional)
  - `isPrivate` (boolean, optional)
  - `addLicense` (string, optional)
  - `topics` (array, optional)
  - `includeOptionalDeps` (boolean, optional)

---

## Prerequisites

- Node.js (v22.x recommended)
- Terraform (~> 1.9.0)
- CDKTF CLI (~> 0.21.0)
- Rust (latest stable)
- Google Cloud SDK (latest)
- Python (3.9+)
- GCP account with appropriate permissions
- GitHub account (for Workload Identity)

---

## Quick Start

```bash
git clone <your-repo>
cd gcp-tools-mcp
npm install
npm run build
```

---

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

---

## Development & Testing

```bash
# Build the server
npm run build

# Test the server
node test-mcp.js

# Test with real GCP setup (creates actual projects)
node test-real-setup.js
```

---

## Architecture

- **Server**: Main MCP server implementation
- **Tools**: Tool definitions and registries
- **Resources**: Resource definitions and handlers
- **Handlers**: Implementation of tool and resource handlers
- **Lib**: Shared logic for foundation setup and other utilities

---

## License

MIT
