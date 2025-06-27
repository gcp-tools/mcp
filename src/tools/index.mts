import type { Tool } from '../types.mjs';

export const tools: Tool[] = [
  {
    name: 'setup_foundation_project',
    description: 'Execute the setup_foundation_project.sh script in GCP',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        orgId: { type: 'string' },
        billingAccount: { type: 'string' },
        region: { type: 'string' },
        githubIdentity: { type: 'string' },
        developerIdentity: { type: 'string' },
      },
      required: ['projectName', 'orgId', 'billingAccount', 'region', 'githubIdentity', 'developerIdentity'],
    },
  },
  {
    name: 'install_prerequisites',
    description: 'Check for and optionally install required (terraform, cdktf, cdktf-cli, gcloud, gh) and optional (python, rust) dependencies.',
    inputSchema: {
      type: 'object',
      properties: {
        checkOnly: { type: 'boolean', description: 'If true, only check for dependencies, do not install.' },
        includeOptional: { type: 'boolean', description: 'If true, also check/install optional dependencies (python, rust).' },
      },
      required: [],
    },
  },
  {
    name: 'create_github_repo',
    description: 'Create a new GitHub repository with proper structure and configuration for GCP/CDKTF projects.',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name for the new repository' },
        description: { type: 'string', description: 'Repository description' },
        isPrivate: { type: 'boolean', description: 'Whether the repository should be private (default: true)' },
        addReadme: { type: 'boolean', description: 'Whether to add a README file (default: true)' },
        addGitignore: { type: 'boolean', description: 'Whether to add .gitignore for Node.js/TypeScript (default: true)' },
        addLicense: { type: 'string', description: 'License type (e.g., "MIT", "Apache-2.0", "none")' },
        topics: { type: 'array', items: { type: 'string' }, description: 'Repository topics/tags' },
      },
      required: ['repoName'],
    },
  },
  {
    name: 'setup_github_secrets',
    description: 'Create GitHub repository secrets and environment variables based on GCP foundation project setup.',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the GitHub repository' },
        projectId: { type: 'string', description: 'GCP Project ID from foundation setup' },
        serviceAccount: { type: 'string', description: 'GCP Service Account email from foundation setup' },
        workloadIdentityPool: { type: 'string', description: 'Workload Identity Pool from foundation setup' },
        region: { type: 'string', description: 'GCP region (e.g., us-central1)' },
        orgId: { type: 'string', description: 'GCP Organization ID' },
        billingAccount: { type: 'string', description: 'GCP Billing Account' },
      },
      required: ['repoName', 'projectId', 'serviceAccount', 'workloadIdentityPool', 'region'],
    },
  },
  {
    name: 'complete_project_setup',
    description: 'Complete end-to-end setup: install prerequisites, create GitHub repo, setup GCP foundation project, and configure GitHub secrets.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Name for your project (used for both GCP project and GitHub repo)' },
        orgId: { type: 'string', description: 'Your GCP organization ID' },
        billingAccount: { type: 'string', description: 'Your GCP billing account' },
        region: { type: 'string', description: 'Default region (e.g., "us-central1")' },
        githubIdentity: { type: 'string', description: 'Your GitHub org/username' },
        developerIdentity: { type: 'string', description: 'Your developer domain' },
        repoDescription: { type: 'string', description: 'GitHub repository description' },
        isPrivate: { type: 'boolean', description: 'Whether GitHub repository should be private (default: true)' },
        addLicense: { type: 'string', description: 'License type for GitHub repo (e.g., "MIT", "Apache-2.0", "none")' },
        topics: { type: 'array', items: { type: 'string' }, description: 'GitHub repository topics/tags' },
        includeOptionalDeps: { type: 'boolean', description: 'Include optional dependencies (python, rust) in prerequisites check' },
      },
      required: ['projectName', 'orgId', 'billingAccount', 'region', 'githubIdentity', 'developerIdentity'],
    },
  },
];

export const toolRegistry = new Map<string, Tool>();
tools.forEach(tool => {
  toolRegistry.set(tool.name, tool);
});
