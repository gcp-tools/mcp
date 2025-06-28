export async function getGcpToolsLibraryContent(): Promise<string> {
  return JSON.stringify(
    {
      name: 'gcp-tools-cdktf',
      version: '1.0.0',
      description: 'Google Cloud Platform tools for CDKTF',
      structure: {
        src: {
          constructs: 'Reusable infrastructure components',
          stacks: {
            infrastructure: 'Core infrastructure stacks',
            projects: 'Project management stacks',
          },
          utils: 'Shared utilities',
        },
        templates: 'Project templates and scaffolding',
        scripts: 'Setup and utility scripts',
      },
      availableConstructs: [
        'CloudRunServiceConstruct',
        'ApiGatewayConstruct',
        'FirestoreConstruct',
        'SqlConstruct',
      ],
      availableStacks: [
        'NetworkInfraStack',
        'IamInfraStack',
        'FirestoreInfraStack',
        'HostProjectStack',
        'DataProjectStack',
        'AppProjectStack',
      ],
      documentation: {
        patterns: 'Multi-project GCP architecture (host/data/app)',
        security: 'Workload Identity, IAM best practices',
        deployment: 'GitHub Actions CI/CD',
      },
    },
    null,
    2,
  )
}
