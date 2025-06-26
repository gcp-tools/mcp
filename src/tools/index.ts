import type { Tool } from '../types.js';

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
    name: 'scaffold_project',
    description: 'Create new project structure based on gcp-tools-cdktf patterns',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        description: { type: 'string' },
        template: { type: 'string', enum: ['basic', 'full', 'microservices'] },
        languages: { type: 'array', items: { type: 'string', enum: ['typescript', 'rust', 'python'] } },
        services: { type: 'array', items: { type: 'object' } },
      },
      required: ['projectName', 'description', 'template'],
    },
  },
  {
    name: 'create_github_repository',
    description: 'Create new GitHub repository for the application',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        isPrivate: { type: 'boolean' },
        orgName: { type: 'string' },
        autoInit: { type: 'boolean' },
      },
      required: ['name', 'description', 'isPrivate', 'autoInit'],
    },
  },
  {
    name: 'setup_github_secrets',
    description: 'Configure GitHub secrets and environment variables',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        secrets: { type: 'object' },
        environmentVariables: { type: 'object' },
        environments: { type: 'array', items: { type: 'string' } },
      },
      required: ['repository', 'secrets', 'environmentVariables', 'environments'],
    },
  },
  {
    name: 'push_to_github',
    description: 'Push scaffolded project to GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        branch: { type: 'string' },
        files: { type: 'array', items: { type: 'object' } },
        commitMessage: { type: 'string' },
      },
      required: ['repository', 'branch', 'files', 'commitMessage'],
    },
  },
  {
    name: 'create_service',
    description: 'Create new service in the services directory',
    inputSchema: {
      type: 'object',
      properties: {
        serviceName: { type: 'string' },
        language: { type: 'string', enum: ['typescript', 'rust', 'python'] },
        type: { type: 'string', enum: ['api', 'worker', 'function'] },
        requirements: { type: 'object' },
      },
      required: ['serviceName', 'language', 'type', 'requirements'],
    },
  },
  {
    name: 'configure_infrastructure',
    description: 'Configure infrastructure for services',
    inputSchema: {
      type: 'object',
      properties: {
        serviceName: { type: 'string' },
        infrastructureType: { type: 'string', enum: ['app', 'ingress'] },
        config: { type: 'object' },
      },
      required: ['serviceName', 'infrastructureType', 'config'],
    },
  },
  {
    name: 'deploy_services',
    description: 'Deploy services by pushing to GitHub',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        services: { type: 'array', items: { type: 'string' } },
        environment: { type: 'string', enum: ['dev', 'test', 'sbx', 'prod'] },
        commitMessage: { type: 'string' },
      },
      required: ['repository', 'services', 'environment', 'commitMessage'],
    },
  },
  {
    name: 'monitor_deployment',
    description: 'Monitor deployment status and logs',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        workflowRunId: { type: 'string' },
        deploymentId: { type: 'string' },
      },
      required: ['repository', 'workflowRunId'],
    },
  },
  {
    name: 'fix_deployment_issues',
    description: 'Fix deployment issues and redeploy',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } },
      },
      required: ['repository', 'issues'],
    },
  },
];

export const toolRegistry = new Map<string, Tool>();
tools.forEach(tool => {
  toolRegistry.set(tool.name, tool);
});
